const SERVER_STATES = require('../client/server_states');
const SERVER_VERSION = require('../../package.json').version;
const Shuffle = require('../client/shuffle');
const randombytes = require('randombytes');
const sha256 = require('js-sha256');

let consoleLog = {
  info: (...msg) => console.log('SERVER: ', ...msg),
  warn: (...msg) => console.log('SERVER: ', ...msg),
  error: (...msg) => console.log('SERVER ERROR: ', ...msg),
  log: (...msg) => console.log('SERVER: ', ...msg),
};

class Coordinator {
  constructor({
    bitcoinUtils,
    CONFIG,
    DEBUG_TEST_MODE = true,
    PUNISH_BAN_LIMIT = 2,
  }) {
    this.consoleLog = consoleLog;
    this.bitcoinUtils = bitcoinUtils;
    this.DEBUG_TEST_MODE = DEBUG_TEST_MODE;
    this.CONFIG = CONFIG;
    this.PUNISH_BAN_LIMIT = PUNISH_BAN_LIMIT;
    this.connections = {};
    this.punishedUsers = {};
    this.alices = {};
    this.loopStart();
  }
  disconnected(uuid) {
    delete this.connections[uuid];
  }
  connected(params) {
    this.connections[params.uuid] = params;
  }
  exit() {
    clearTimeout(this.tstart);
  }
  getAlices() {
    return Object.keys(this.alices).map(key => this.alices[key]);
  }
  getConnections() {
    return Object.keys(this.connections).map(key => this.connections[key]);
  }
  async broadcastError(error) {
    return await this.asyncSend(this.getConnections(), async connection => {
      if (typeof connection.roundError === 'function') {
        await connection.roundError({ error });
      }
    });
  }
  async balance({ address }) {
    if (this.DEBUG_TEST_MODE) {
      const utxos = this.bitcoinUtils.getFakeUtxos({
        address,
        txid: randombytes(32).toString('hex'),
        vout: 0,
        satoshis: 124000000,
      });
      const balance = this.bitcoinUtils.getUtxosBalance(utxos, address);
      const { denomination, fees } = this.roundParams;
      const needed = denomination + (utxos.length || 1) * fees;
      return { address, balance, utxos, needed };
    } else if (!this.bitcoinUtils.isInvalid(address)) {
      try {
        const utxos = await this.bitcoinUtils.getUtxos(address);
        const balance = this.bitcoinUtils.getUtxosBalance(utxos, address);
        const denomination = this.roundParams
          ? this.roundParams.denomination
          : this.CONFIG.OUTPUT_SAT;
        const fees = this.roundParams
          ? this.roundParams.fees
          : this.CONFIG.FEE_PER_INPUT;
        const needed = denomination + (utxos.length || 1) * fees;
        return { address, balance, needed, utxos };
      } catch (err) {
        return {
          error: `Something went wrong checking balance: ${err.message}`,
        };
      }
    } else {
      return { error: 'Invalid address' };
    }
  }
  async asyncSend(array, callback) {
    return await Promise.all(
      array.map(obj => {
        return new Promise(async resolve => {
          try {
            await callback(obj);
            resolve();
          } catch (err) {
            console.log('ERROR', err);
            resolve();
          }
        });
      })
    );
  }
  async loopStart() {
    clearTimeout(this.tstart);
    try {
      if (this.DEBUG_TEST_MODE) {
        await this.start({});
      } else {
        let progress = false;
        try {
          const res = await this.bitcoinUtils.getInfo();
          progress = Math.floor(res.chain.progress * 100);
        } catch (err) {
          this.consoleLog.error(err.message);
          this.broadcastError(`Error: Could not connect to blockchain`);
        }
        if (progress === 100) {
          await this.start({});
        } else if (progress !== false) {
          const msg = `Syncing with blockchain. ${progress}%`;
          this.consoleLog.info(msg);
          this.broadcastError(msg);
        }
      }
    } catch (err) {
      this.consoleLog.error('LOOPSTART ERROR: ', err);
    }
    this.tstart = setTimeout(() => {
      this.loopStart();
    }, this.CONFIG.DELAY_BETWEEN_ROUNDS ? this.CONFIG.DELAY_BETWEEN_ROUNDS * 1000 : 10000); // Check to start every 10 seconds
  }
  async start({ skipJoins = false }) {
    const connections = this.getConnections();
    if (!this.roundParams || !skipJoins) {
      this.roundState = SERVER_STATES.join;
      this.alices = {};
      const round_id = randombytes(32).toString('base64');
      this.roundParams = {
        round_id,
        fees: this.CONFIG.FEE_PER_INPUT,
        min_pool: this.CONFIG.MIN_POOL,
        max_pool: this.CONFIG.MAX_POOL,
        denomination: this.CONFIG.OUTPUT_SAT,
        chain: this.CONFIG.CHAIN,
        version: SERVER_VERSION,
        joined: this.roundParams ? this.roundParams.joined : 0,
      };
      await this.asyncSend(connections, async connection => {
        const res = await connection.join(this.roundParams);
        const obj = await this.join({ ...res, connection, round_id });
        if (obj) {
          console.log('ERROR', obj);
          if (typeof connection.roundError === 'function') {
            connection.roundError(obj);
          }
        }
      });
    }
    const alices = this.getAlices();
    const numAlices = alices.length;
    this.roundParams.joined = numAlices;
    const { fees, denomination, min_pool } = this.roundParams;
    const actualAlices = alices.reduce((previous, alice) => {
      return previous + (alice.min_pool <= numAlices ? 1 : 0);
    }, 0);
    if (actualAlices < min_pool) {
      // this.consoleLog.info(
      console.log(
        `Not enough alices to start: ${actualAlices} of ${min_pool} needed. ${numAlices} total. ${
          connections.length
        } connections`
      );
      this.roundState = SERVER_STATES.join;
      return;
    }
    this.roundState = SERVER_STATES.shuffling;
    this.consoleLog.info('Starting round');
    const publicKeys = alices.map(alice => ({
      address: alice.fromAddress,
      verify: alice.verify,
      key: alice.publicKey,
    }));
    let onions = [];
    try {
      for (let i = 0; i < alices.length; i++) {
        const response = await alices[i].connection.shuffle({
          // publicKeys: publicKeys.slice(i + 1),
          publicKeys,
          onions,
          // index: i + 1,
        });
        if (response.onions && response.onions.length === i + 1) {
          onions = response.onions;
          alices[i].onions = response.onions; // Save for blame game
        } else {
          alices[i].onions = true;
          throw new Error(
            `Invalid shuffle response: ${JSON.stringify(response)}`
          );
        }
        this.consoleLog.info(`${alices[i].fromAddress} Shuffled`);
      }
    } catch (err) {
      await this.blameGame(alices);
      // await this.roundError(`Failed at shuffling: ${err.message}`);
      return;
    }
    const bobs = [];
    for (const onion of onions) {
      const toAddress = Shuffle.hex2a(onion);
      if (this.bitcoinUtils.isInvalid(toAddress)) {
        await this.blameGame(alices);
        // await this.roundError('Failed at shuffling 2');
        return;
      }
      bobs.push({ toAddress });
    }
    const txInfo = {
      alices: alices.map(alice => ({
        fromAddress: alice.fromAddress,
        changeAddress: alice.changeAddress,
      })),
      bobs,
      utxos: alices.reduce(
        (previous, alice) => previous.concat(alice.utxos),
        []
      ),
    };
    // console.log(txInfo);
    let tx;
    try {
      tx = this.bitcoinUtils.createTransaction({
        alices: txInfo.alices,
        bobs,
        utxos: txInfo.utxos,
        fees,
        denomination,
        min_pool,
      }).tx;
    } catch (err) {
      this.consoleLog.error('ERROR: ', err);
      await this.blameGame(alices);
      // await this.roundError(`Failed at creating tx: ${err.message}`);
      return;
    }

    let signedTxs;
    try {
      signedTxs = await Promise.all(
        alices.map(alice => {
          return new Promise(async (resolve, reject) => {
            try {
              const res = await alice.connection.sign(txInfo);
              if (!res || !res.tx) {
                throw new Error(
                  `Invalid signed tx response: ${JSON.stringify(res)}`
                );
              }
              alice.signedTx = res.tx;
              resolve(res.tx);
              this.consoleLog.info(`${alice.fromAddress} Signed TX`);
            } catch (err) {
              reject(err);
            }
          });
        })
      );
    } catch (err) {
      this.consoleLog.error('ERROR: ', err);
      await this.blameGame(alices);
      // await this.roundError(`Failed at signing: ${err.message}`);
      return;
    }

    try {
      const { serialized, txid } = this.bitcoinUtils.combineTxs({
        tx,
        signedTxs,
      });
      this.consoleLog.info('FINAL TX: ', serialized, ', ', txid);
      if (!this.DEBUG_TEST_MODE) {
        await this.bitcoinUtils.broadcastTx(serialized);
        this.consoleLog.info('Broadcasted Tx');
      }
      this.consoleLog.info('Round Success');
      await this.asyncSend(alices, async alice => {
        if (typeof alice.connection.roundSuccess === 'function') {
          await alice.connection.roundSuccess({ txid, serialized });
        }
      });
    } catch (err) {
      this.consoleLog.error('ERROR: ', err);
      await this.blameGame(alices);
      // await this.roundError(
      //   `Failed at combining and broadcasting tx: ${err.message}`
      // );
      return;
    }
    return true;
  }

  async join({
    round_id,
    fromAddress,
    changeAddress,
    publicKey,
    verify,
    verifyJoin,
    connection,
    min_pool,
  }) {
    if (
      this.bitcoinUtils.isInvalid(fromAddress) ||
      this.bitcoinUtils.isInvalid(changeAddress)
    ) {
      return { error: 'Invalid addresses' };
    }
    if (
      this.punishedUsers[fromAddress] &&
      this.punishedUsers[fromAddress] >= this.PUNISH_BAN_LIMIT
    ) {
      return { error: 'You have been banned' };
    }
    if (!publicKey) {
      return { error: 'Missing publicKey' };
    }
    if (!this.bitcoinUtils.verifyMessage(round_id, fromAddress, verifyJoin)) {
      return { error: 'Invalid round_id validation' };
    }
    if (
      !this.bitcoinUtils.verifyMessage(sha256(publicKey), fromAddress, verify)
    ) {
      return { error: 'Invalid key validation' };
    }
    if (this.roundState !== SERVER_STATES.join) {
      return { error: 'Not in join state' };
    }
    if (this.getAlices().length >= this.roundParams.max_pool) {
      return { error: 'Too many Alices' };
    }
    const response = await this.balance({ address: fromAddress });
    const { error, balance, utxos, needed } = response;
    if (error) {
      return response;
    } else if (balance < needed) {
      return { ...response, error: 'Not enough Bitcoin in your Wallet' };
    }
    if (!this.alices[fromAddress]) {
      this.consoleLog.info(`User joined: ${fromAddress}`);
    }
    this.alices[fromAddress] = {
      fromAddress,
      changeAddress,
      publicKey,
      verify,
      utxos,
      connection,
      min_pool,
    };
  }

  async blameGame(alices) {
    // TODO: Filter request/disconnect timeouts first

    // this.consoleLog.error('Starting Blame Game');
    const responses = await this.asyncSend(alices, async alice => {
      return await alice.connection.blame();
    });
    const punish = [];
    for (let i = 0; i < responses.length; i++) {
      const res = responses[i];
      const alice = alices[i];
      if (
        !res ||
        !res.privateKey ||
        !res.toAddress ||
        this.bitcoinUtils.isInvalid(res.toAddress) ||
        !Shuffle.validateKeys(alice.publicKey, res.privateKey)
      ) {
        punish.push(alice.fromAddress);
      }
    }
    if (punish.length === 0) {
      for (let i = 0; i < responses.length; i++) {
        // const res = responses[i];
        const alice = alices[i];
        try {
          // TODO: Unwrap onions to determine user who stopped round
          // for (let j = i; j < responses.length; j++) {
          //
          // }
          //   const toAddress = Shuffle.hex2a(onion);
          //   if (this.bitcoinUtils.isInvalid(toAddress)) {
          // if (alice.onions === true) {
          //   // Alice errored out
          //   break;
          // } else {
          //
          // }
        } catch (err) {
          console.log('ERROR: ', err);
          punish.push(alice.fromAddress);
        }
      }
    }
    for (const address of punish) {
      this.punishedUsers[address] = (this.punishedUsers[address] || 0) + 1;
    }

    const error = `Round failed at state: ${this.roundState}`;
    this.consoleLog.error(
      'ERROR Blame Game: ',
      error,
      '. Punishing users: ',
      punish
    );
    await this.asyncSend(this.getAlices(), async alice => {
      if (typeof alice.connection.roundSuccess === 'function') {
        await alice.connection.roundSuccess({ error });
      }
      if (typeof alice.connection.roundError === 'function') {
        await alice.connection.roundError({ error });
      }
    });
  }
}

module.exports = Coordinator;

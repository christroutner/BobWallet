const SERVER_STATES = require('../client/server_states');
const SERVER_VERSION = require('../../package.json').version;
const Shuffle = require('../client/shuffle');
const path = require('path');
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
    bitcoinUtilsCore,
    bitcoinUtilsCash,
    CONFIG,
    DEBUG_TEST_MODE = true,
    PUNISH_BAN_LIMIT = 3,
    ENFORCE_PUNISHMENT = false,
  }) {
    this.consoleLog = consoleLog;
    if (CONFIG.LOG_TO_FILE) {
      this.consoleLog = require('simple-node-logger').createSimpleLogger({
        logFilePath: path.join(__dirname, '../../logs/coordinator.log'),
        timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      });
    }
    this.bitcoinUtils = {
      tBTC: bitcoinUtilsCore,
      tBCH: bitcoinUtilsCash,
    };
    this.tstart = {};
    this.DEBUG_TEST_MODE = DEBUG_TEST_MODE;
    this.CONFIG = CONFIG;
    this.PUNISH_BAN_LIMIT = PUNISH_BAN_LIMIT;
    this.connections = {};
    this.punishedUsers = {};
    this.ENFORCE_PUNISHMENT = ENFORCE_PUNISHMENT;
    this.alices = {
      tBTC: {},
      tBCH: {},
      // BTC: {},
      // BCH: {},
    };
    this.PUBLIC_KEY_LENGTH = Shuffle.generateKey().getPublicKey().length;
    if (bitcoinUtilsCore) {
      this.loopStart('tBTC');
    }
    if (bitcoinUtilsCash) {
      this.loopStart('tBCH');
    }
  }
  disconnected(uuid) {
    delete this.connections[uuid];
  }
  connected(params) {
    this.connections[params.uuid] = params;
  }
  exit() {
    Object.keys(this.tstart).map(key => clearTimeout(this.tstart[key]));
  }
  getAlices(chain) {
    return Object.keys(this.alices[chain]).map(key => this.alices[chain][key]);
  }
  getConnections() {
    return Object.keys(this.connections).map(key => this.connections[key]);
  }
  async broadcastError(error, chain) {
    // TODO: Send to only users with chain
    return await this.asyncSend(this.getConnections(), async connection => {
      if (typeof connection.roundError === 'function') {
        await connection.roundError({ error, chain });
      }
    });
  }
  async balance({ address, chain }) {
    if (this.DEBUG_TEST_MODE) {
      const utxos = this.bitcoinUtils[chain].getFakeUtxos({
        address,
        txid: randombytes(32).toString('hex'),
        vout: 0,
        satoshis: 124000000,
      });
      const balance = this.bitcoinUtils[chain].getUtxosBalance(utxos, address);
      const { denomination, fees } = this.roundParams;
      const needed = denomination + (utxos.length || 1) * fees;
      return { address, balance, utxos, needed };
    } else if (!this.bitcoinUtils[chain].isInvalid(address)) {
      try {
        const utxos = await this.bitcoinUtils[chain].getUtxos(address);
        const balance = this.bitcoinUtils[chain].getUtxosBalance(
          utxos,
          address
        );
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
          let res;
          try {
            res = await callback(obj);
          } catch (err) {
            console.log('ERROR', err);
          }
          resolve(res);
        });
      })
    );
  }
  async loopStart(chain) {
    clearTimeout(this.tstart[chain]);
    try {
      if (this.DEBUG_TEST_MODE) {
        await this.start({});
      } else {
        let progress = false;
        try {
          const res = await this.bitcoinUtils[chain].getInfo();
          progress = Math.floor(res.chain.progress * 100);
        } catch (err) {
          this.consoleLog.error(err.message);
          this.broadcastError(`Error: Could not connect to blockchain`, chain);
        }
        if (progress === 100) {
          await this.start({ chain });
        } else if (progress !== false) {
          const msg = `Syncing with blockchain. ${progress}%`;
          this.consoleLog.info(msg);
          this.broadcastError(msg, chain);
        }
      }
    } catch (err) {
      this.consoleLog.error('LOOPSTART ERROR: ', err);
    }
    this.tstart[chain] = setTimeout(() => {
      this.loopStart(chain);
    }, this.CONFIG.DELAY_BETWEEN_ROUNDS ? this.CONFIG.DELAY_BETWEEN_ROUNDS * 1000 : 10000); // Check to start every 10 seconds
  }
  async start({ skipJoins = false, chain }) {
    const connections = this.getConnections();
    if (!this.roundParams || !skipJoins) {
      this.roundState = SERVER_STATES.join;
      this.alices[chain] = {};
      const round_id = randombytes(32).toString('base64');
      this.roundParams = {
        round_id,
        fees: this.CONFIG.FEE_PER_INPUT,
        min_pool: this.CONFIG.MIN_POOL,
        max_pool: this.CONFIG.MAX_POOL,
        denomination: this.CONFIG.OUTPUT_SAT,
        chain, // this.CONFIG.CHAIN,
        version: SERVER_VERSION,
        joined: this.roundParams ? this.roundParams.joined : 0,
      };
      await this.asyncSend(connections, async connection => {
        const res = await connection.join(this.roundParams);
        const obj = await this.join({ ...res, connection, round_id, chain });
        if (obj) {
          console.log('ERROR', obj);
          if (typeof connection.roundError === 'function') {
            connection.roundError({ ...obj, chain });
          }
        }
      });
    }
    const alices = this.getAlices(chain);
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
      await this.blameGame(alices, chain);
      // await this.roundError(`Failed at shuffling: ${err.message}`);
      return;
    }
    const bobs = [];
    for (const onion of onions) {
      try {
        const toAddress = this.bitcoinUtils[chain].hexToAddress(onion);
        if (this.bitcoinUtils[chain].isInvalid(toAddress)) {
          throw new Error('Invalid toAddress');
        }
        bobs.push({ toAddress });
      } catch (err) {
        await this.blameGame(alices, chain);
        // await this.roundError('Failed at shuffling 2');
        return;
      }
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
      tx = this.bitcoinUtils[chain].createTransaction({
        alices: txInfo.alices,
        bobs,
        utxos: txInfo.utxos,
        fees,
        denomination,
        min_pool,
      }).tx;
    } catch (err) {
      this.consoleLog.error('ERROR: ', err);
      await this.blameGame(alices, chain);
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
              alice.signedTx = res.tx; // TODO: Validate signed tx
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
      await this.blameGame(alices, chain);
      // await this.roundError(`Failed at signing: ${err.message}`);
      return;
    }

    try {
      const { serialized, txid } = this.bitcoinUtils[chain].combineTxs({
        tx,
        signedTxs,
      });
      this.consoleLog.info('FINAL TX: ', serialized, ', ', txid);
      if (!this.DEBUG_TEST_MODE) {
        await this.bitcoinUtils[chain].broadcastTx(serialized);
        this.consoleLog.info('Broadcasted Tx');
      }
      this.consoleLog.info('Round Success');
      await this.asyncSend(alices, async alice => {
        if (typeof alice.connection.roundSuccess === 'function') {
          await alice.connection.roundSuccess({ txid, serialized, chain });
        }
      });
    } catch (err) {
      this.consoleLog.error('ERROR: ', err);
      await this.blameGame(alices, chain);
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
    version,
    chain,
    error,
  }) {
    if (error) {
      console.log('Client responded with error: ', error);
      return;
    }
    if (version !== SERVER_VERSION) {
      console.log('Client running version', version);
      return { error: `Out of date. Update to version ${SERVER_VERSION}` };
    }
    if (
      this.bitcoinUtils[chain].isInvalid(fromAddress) ||
      this.bitcoinUtils[chain].isInvalid(changeAddress)
    ) {
      return { error: 'Invalid addresses' };
    }
    if (
      this.ENFORCE_PUNISHMENT &&
      this.punishedUsers[fromAddress] &&
      this.punishedUsers[fromAddress] >= this.PUNISH_BAN_LIMIT
    ) {
      return { error: 'You have been banned' };
    }
    if (!publicKey) {
      return { error: 'Missing publicKey' };
    }
    if (publicKey.length !== this.PUBLIC_KEY_LENGTH) {
      return { error: 'Invalid public key length' };
    }
    if (
      !this.bitcoinUtils[chain].verifyMessage(round_id, fromAddress, verifyJoin)
    ) {
      return { error: 'Invalid round_id validation' };
    }
    if (
      !this.bitcoinUtils[chain].verifyMessage(
        sha256(publicKey),
        fromAddress,
        verify
      )
    ) {
      return { error: 'Invalid key validation' };
    }
    if (this.roundState !== SERVER_STATES.join) {
      return { error: 'Not in join state' };
    }
    if (this.getAlices(chain).length >= this.roundParams.max_pool) {
      return { error: 'Too many Alices' };
    }
    const response = await this.balance({ address: fromAddress, chain });
    const { balance, utxos, needed } = response;
    if (response.error) {
      return response;
    } else if (balance < needed) {
      return { ...response, error: 'Not enough Bitcoin in your Wallet' };
    }
    if (!this.alices[chain][fromAddress]) {
      // this.consoleLog.info(`User joined: ${fromAddress}`);
      console.log(`User joined: ${fromAddress}`);
    }
    this.alices[chain][fromAddress] = {
      fromAddress,
      changeAddress,
      publicKey,
      verify,
      utxos,
      connection,
      min_pool,
    };
  }

  async blameGame(alices, chain) {
    // TODO: Filter request/disconnect timeouts first

    // this.consoleLog.error('Starting Blame Game');
    const responses = await this.asyncSend(alices, async alice => {
      try {
        const res = await alice.connection.blame();
        return { ...res, alice };
      } catch (err) {
        return { alice };
      }
    });
    const punish = [];
    for (const res of responses) {
      if (
        !res.privateKey ||
        !res.toAddress ||
        this.bitcoinUtils[chain].isInvalid(res.toAddress) ||
        !Shuffle.validateKeys(res.alice.publicKey, res.privateKey)
      ) {
        punish.push(res.alice.fromAddress);
      }
    }
    if (punish.length === 0) {
      let previousOnions = {};
      for (let i = 0; i < responses.length; i++) {
        const user = responses[i];
        try {
          // TODO: Unwrap onions to determine user who stopped round
          const nextOnions = {};
          // 1. Skim first layer off. Save for next user
          // 2. Remove previous matches from last
          // 3. Peel last onion to final toAddress to verify
          if (!user.alice.onions) {
            // Round never made it this far
            break;
          }
          if (user.alice.onions === true) {
            throw new Error('User didnt send onions');
          }
          if (user.alice.onions.length !== i + 1) {
            throw new Error('Invalid number of onions');
          }
          try {
            for (let onion of user.alice.onions) {
              if (i + 1 < responses.length) {
                const nextPrivKey = responses[i + 1].privateKey;
                onion = Shuffle.decrypt(nextPrivKey, onion);
              }
              nextOnions[onion] = true;
            }
          } catch (err) {
            err.breakForLoop = true;
            throw err;
          }
          if (Object.keys(nextOnions).length !== user.alice.onions.length) {
            const error = new Error('Duplicate onions');
            error.breakForLoop = true;
            throw error;
          }
          let usersOnion;
          // 2. Remove previous onions seen in last user shuffle
          for (let onion of user.alice.onions) {
            if (!previousOnions[onion]) {
              if (usersOnion) {
                throw new Error('Multiple users onions');
              }
              usersOnion = onion;
            }
          }
          if (!usersOnion) {
            throw new Error('Missing users onion');
          }

          try {
            for (let j = i + 1; j < responses.length; j++) {
              const nextPrivKey = responses[j].privateKey;
              usersOnion = Shuffle.decrypt(nextPrivKey, usersOnion);
            }
            const toAddress = this.bitcoinUtils[chain].hexToAddress(usersOnion);
            if (this.bitcoinUtils[chain].isInvalid(toAddress)) {
              throw new Error('Invalid toAddress');
            }
          } catch (err) {
            err.breakForLoop = true;
            throw err;
          }
          previousOnions = nextOnions;
        } catch (err) {
          console.log('ERROR: ', err);
          punish.push(user.alice.fromAddress);
          if (err.breakForLoop) {
            break;
          }
        }
      }
    }
    // Check for signed tx's
    if (punish.length === 0) {
      for (const res of responses) {
        // TODO: Validate signedTx
        if (!res.alice.signedTx) {
          punish.push(res.alice.fromAddress);
        }
      }
    }
    if (punish.length < alices.length) {
      for (const address of punish) {
        this.punishedUsers[address] = (this.punishedUsers[address] || 0) + 1;
      }
    } else {
      this.consoleLog.error(`Will not punish all users`);
    }

    const error = `Round failed at state: ${this.roundState}`;
    this.consoleLog.error(
      'ERROR Blame Game: ',
      error,
      '. Punishing users: ',
      punish
    );
    await this.asyncSend(alices, async alice => {
      if (typeof alice.connection.roundSuccess === 'function') {
        await alice.connection.roundSuccess({ error, chain });
      }
      if (typeof alice.connection.roundError === 'function') {
        await alice.connection.roundError({ error, chain });
      }
    });
  }
}

module.exports = Coordinator;

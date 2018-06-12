const Shuffle = require('./shuffle');
const sha256 = require('js-sha256');
const CLIENT_STATES = require('./client_states');

class Client {
  constructor({
    bitcoinUtils,

    aliceSeed,
    bobSeed,
    aliceIndex = 0,
    bobIndex = 0,
    changeIndex = 1,

    CHAIN = 'testnet',
    min_pool = 2,
    version = 'unknown',

    callbackStateChange,
    callbackError,
    callbackRoundComplete,
    callbackBalance,
  }) {
    this.CHAIN = CHAIN;
    this.version = version;
    this.bitcoinUtils = bitcoinUtils;

    this.callbackStateChange = callbackStateChange;
    this.callbackError = callbackError;
    this.callbackRoundComplete = callbackRoundComplete;
    this.callbackBalance = callbackBalance;

    this.aliceSeed = aliceSeed || this.bitcoinUtils.newMnemonic();
    this.bobSeed = bobSeed || this.aliceSeed;
    this.aliceIndex = aliceIndex;
    this.bobIndex = bobIndex;
    this.changeIndex = changeIndex;

    this.min_pool = min_pool;
    this.roundProgress = 0;
    this.roundError = null;
    this.roundState = CLIENT_STATES.unjoined;
    this.updateKeyIndexes({});
  }
  setState(state) {
    if (state === this.roundState) return; // Ignore
    this.roundState = state;
    this.roundProgress = state / (Object.keys(CLIENT_STATES).length - 1);
    if (this.callbackStateChange) this.callbackStateChange(state);
  }
  getState() {
    const reverse = {};
    Object.keys(CLIENT_STATES).map(key => (reverse[CLIENT_STATES[key]] = key));
    return reverse[this.roundState];
  }
  updateKeyIndexes({
    aliceIndex = this.aliceIndex,
    bobIndex = this.bobIndex,
    changeIndex,
  }) {
    const { aliceSeed, bobSeed } = this;
    this.aliceIndex = aliceIndex === '' ? 0 : aliceIndex;
    this.bobIndex = bobIndex === '' ? 0 : bobIndex;
    this.keys = this.bitcoinUtils.generateAddresses({
      aliceSeed,
      bobSeed,
      aliceIndex: this.aliceIndex,
      bobIndex: this.bobIndex,
      changeIndex: changeIndex === '' ? 0 : changeIndex,
    });
    // this.roundParams = Object.assign({}, this.roundParams, this.keys);
    this.changeIndex = this.keys.changeIndex;
  }
  getAddresses() {
    return this.keys;
  }
  getRoundInfo() {
    const { roundError, roundProgress, roundParams } = this;
    return Object.assign({}, roundParams, {
      roundError,
      progress: roundProgress,
      currentState: this.getState(),
    });
  }
  setRoundError(err) {
    this.roundError = err;
    // this.setState(CLIENT_STATES.unjoined);
    if (this.callbackError) this.callbackError(err);
  }
  roundSuccess(response = {}) {
    if (!response.error) {
      // Success
      // Increment addresses
      this.aliceIndex = this.changeIndex;
      this.bobIndex++;
      this.changeIndex++;
      this.updateKeyIndexes({ changeIndex: this.changeIndex });
    } else if (this.roundParams.blameGame) {
      // TODO: Increment bobIndex if round entered blame game and sent private key
      // this.bobIndex++;
      // this.updateKeyIndexes({ changeIndex: this.changeIndex });
    }
    this.setState(CLIENT_STATES.unjoined);
    const finalParams = this.filterFinalParameters(this.roundParams, response);
    if (this.callbackRoundComplete) this.callbackRoundComplete(finalParams);
  }
  updateBalance(response) {
    if (this.callbackBalance) this.callbackBalance(response);
  }
  filterFinalParameters(
    {
      keys: { toAddress, fromAddress, changeAddress },
      denomination,
      totalChange,
      totalFees,
      bobs,
      blameGame,
    },
    { txid, serialized, error }
  ) {
    return {
      error,
      blame: blameGame,
      to: toAddress,
      from: fromAddress,
      change: changeAddress,
      out: denomination,
      left: totalChange,
      fees: totalFees,
      serialized,
      bobs,
      txid,
      date: new Date().getTime(),
    };
  }

  join(params) {
    // TODO: Decline to join if user declines parameters
    this.roundError = null; // Clear round error
    this.setState(CLIENT_STATES.joining);
    const rsaKey = Shuffle.generateKey();
    this.roundParams = Object.assign({}, params, {
      publicKey: rsaKey.getPublicKey(),
      privateKey: rsaKey.getPrivateKey(),
      keys: this.keys,
      lastUpdated: new Date().getTime(),
    });
    const {
      publicKey,
      round_id,
      keys: { fromAddress, changeAddress, fromPrivate },
    } = this.roundParams;
    return {
      version: this.version,
      fromAddress,
      changeAddress,
      publicKey,
      min_pool: this.min_pool,
      verify: this.bitcoinUtils.signMessage(sha256(publicKey), fromPrivate),
      verifyJoin: this.bitcoinUtils.signMessage(round_id, fromPrivate),
    };
  }

  shuffle({ publicKeys, onions }) {
    try {
      if (publicKeys.length < this.min_pool) {
        return { error: `Must have at least ${this.min_pool} users in round.` };
      }
      // if (this.roundState !== CLIENT_STATES.joining) return;
      this.setState(CLIENT_STATES.shuffling);
      const {
        privateKey,
        keys: { toAddress, fromAddress },
      } = this.roundParams;
      // Validate public keys
      let index = -1;
      this.roundParams.inputAddresses = {};
      this.roundParams.joined = publicKeys.length;
      for (let i = 0; i < publicKeys.length; i++) {
        const key = publicKeys[i];
        if (
          !this.bitcoinUtils.verifyMessage(
            sha256(key.key),
            key.address,
            key.verify
          )
        ) {
          throw new Error(`Public key does not validate: ${key.address}`);
        }
        if (this.roundParams.inputAddresses[key.address]) {
          throw new Error(`Duplicate address: ${key.address}`);
        }
        this.roundParams.inputAddresses[key.address] = true;
        if (key.address === fromAddress) {
          index = i + 1;
        }
      }
      if (index < 0) {
        throw new Error(`Missing my public key`);
      }
      const returnOnions = [];
      for (const layer of onions) {
        const decrypted = Shuffle.decrypt(privateKey, layer);
        returnOnions.push(decrypted);
      }
      let encrypted = this.bitcoinUtils.addressToHex(toAddress);
      for (let i = publicKeys.length - 1; i >= index; i--) {
        encrypted = Shuffle.encrypt(publicKeys[i].key, encrypted);
      }
      returnOnions.push(encrypted);
      for (const onion of returnOnions) {
        if (onion.length !== returnOnions[0].length) {
          console.log(
            `ERROR: Invalid length: ${onion.length}, ${returnOnions[0].length}`
          );
          throw new Error(`Invalid onion lengths`);
        }
      }
      Shuffle.shuffle(returnOnions);
      return { onions: returnOnions };
    } catch (err) {
      console.log('ERROR', err);
      const error = { error: err.message };
      this.setRoundError(error);
      return error;
    }
  }

  sign({ alices, bobs, utxos }) {
    try {
      const {
        blameGame,
        fees,
        denomination,
        inputAddresses,
        keys: { fromAddress, changeAddress, toAddress, fromPrivate },
      } = this.roundParams;
      if (blameGame) {
        throw new Error(`Will not sign. Already entered Blame Game`);
      }
      this.setState(CLIENT_STATES.signing);

      // Verify all input addresses
      if (Object.keys(inputAddresses).length !== alices.length) {
        throw new Error(`Invalid number of inputs`);
      }
      for (const alice of alices) {
        if (!inputAddresses[alice.fromAddress]) {
          throw new Error(`Missing input address: ${alice.fromAddress}`);
        }
      }
      this.bitcoinUtils.verifyTransaction({
        alices,
        bobs,
        fromAddress,
        changeAddress,
        toAddress,
      });
      const {
        tx,
        totalChange,
        totalFees,
      } = this.bitcoinUtils.createTransaction({
        alices,
        bobs,
        utxos,
        fees,
        denomination,
        key: fromPrivate,
        fromAddress,
        min_pool: this.min_pool,
      });
      this.roundParams.totalChange = totalChange;
      this.roundParams.totalFees = totalFees;
      this.roundParams.bobs = bobs.length;
      return { tx };
    } catch (err) {
      console.log('ERROR', err);
      // TODO: Tell server something is wrong
      const error = { error: err.message };
      this.setRoundError(error);
      return error;
    }
  }
  blame() {
    if (
      this.roundParams.blameGame ||
      !this.roundParams ||
      this.roundState === CLIENT_STATES.unjoined
    ) {
      return { error: 'Invalid state for blame game' };
    } else {
      this.roundParams.blameGame = true;
      const {
        keys: { toAddress },
        privateKey,
      } = this.roundParams;
      // TODO: Increment bobIndex if round entered blame game and sent private key
      // this.bobIndex++;
      // this.updateKeyIndexes({ changeIndex: this.changeIndex });
      return { privateKey, toAddress };
    }
  }
  wait(delay) {
    return new Promise(resolve => setTimeout(() => resolve(), delay));
  }
}

// module.exports = Client;
export default Client;
// exports.default = Client;

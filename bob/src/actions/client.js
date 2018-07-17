import store from '../store';
import { observe, action } from 'mobx';
import { VERSION } from '../config';
import { minifyRound, maxifyRound } from '../helpers';

import Client from '../shufflelink/network';
import Bitcoin from '../shufflelink/bitcoin_bcoin';
const bitcoinUtilsCore = new Bitcoin({
  CHAIN: 'tBTC',
  bcoin: window.bcoin,
});
const bitcoinUtilsCash = new Bitcoin({
  CHAIN: 'tBCH',
  bcoin: window.bcash,
});
const bitcoinUtils = {
  tBTC: bitcoinUtilsCore,
  tBCH: bitcoinUtilsCash,
};

class ActionsClient {
  constructor() {
    observe(store, 'loaded', () => this.initAlice({}));
    setInterval(() => this.getRoundInfo(), 1000);
  }
  start(chain, seed) {
    store.settings.chain = chain;
    seed = seed || this.newMnemonic(); // Share seed between public/private wallets
    if (!this.isValidSeed(seed)) {
      throw new Error('Invalid seed');
    }
    store.settings.publicSeed = seed;
    store.settings.privateSeed = seed;
    store.settings.routeTab = 'Public';
    store.settings.created = new Date().getTime();
    store.save();
    this.initAlice({});

    store.route = 'Home';
    this.connect();
  }
  clearAlice() {
    this.disconnect();
    store.bobClient = null;
    store.clear();
  }
  processBalance(data = {}) {
    const { address, balance, needed, fees, rate } = data;
    if (address) {
      store.addressBalances.set(address, balance);
      store.saveBalances();
    }
    if (needed) {
      store.roundAmount = needed;
    }
    if (fees) {
      store.settings.feesPerTx = fees;
      store.save();
    }
    if (rate) {
      store.coinRate = rate;
    }
  }
  initAlice({
    chain = store.settings.chain,
    publicSeed = store.settings.publicSeed,
    privateSeed = store.settings.privateSeed,
    publicIndex = store.settings.publicIndex,
    privateIndex = store.settings.privateIndex,
    serverAddress = store.settings.serverAddress,
  }) {
    if (!publicSeed || !privateSeed) return;

    store.bobClient = new Client({
      chain,
      version: VERSION,
      bitcoinUtils: bitcoinUtils[chain],
      aliceSeed: publicSeed,
      bobSeed: privateSeed,
      aliceIndex: publicIndex,
      bobIndex: privateIndex,
      changeIndex: publicIndex, // Send change back to the same public wallet address
      serverAddress,
      callbackBalance: res => {
        console.log('callbackBalance', res);
        this.processBalance(res);
      },
      callbackStateChange: state => {
        console.log('callbackStateChange', state);
        store.roundError = null;
        this.getRoundInfo();
      },
      callbackError: err => {
        console.log('callbackError', err);
        this.processBalance(err);
        store.roundError = err ? err.error : null;
        this.getRoundInfo();
      },
      callbackRoundComplete: action(tx => {
        store.roundError = null;
        console.log('callbackRoundComplete', tx);
        const {
          bobClient,
          settings: { successfulRounds, failedRounds, totalFees },
        } = store;
        store.settings.publicIndex = bobClient.aliceIndex;
        store.settings.privateIndex = bobClient.bobIndex;
        if (!tx.error) {
          store.settings.successfulRounds = successfulRounds + 1;
          store.settings.totalFees = totalFees + (isNaN(tx.fees) ? 0 : tx.fees);
          // store.lastRawTx = {
          //   tx: serialized,
          //   txid,
          // };
          const {
            error,
            // blame,
            to,
            from,
            // change,
            out,
            bobs,
            index,
            txid,
            bobIndex,
            date,
          } = tx;
          store.completedRounds.unshift(
            minifyRound({
              error: error ? error : undefined,
              address: to,
              amount: out,
              privateIndex: bobIndex,
              from,
              bobs,
              txid,
              index,
              date,
            })
          );
          store.saveRounds();
        } else {
          console.log('TX Error', tx.error);
          store.roundError = tx.error;
          store.settings.failedRounds = failedRounds + 1;
        }
        store.save();
        this.getRoundInfo();
      }),
    });
    // store.settings.publicSeed = store.bobClient.aliceSeed;
    // store.settings.privateSeed = store.bobClient.bobSeed;
    store.settings.publicIndex = store.bobClient.aliceIndex;
    store.settings.privateIndex = store.bobClient.bobIndex;
    store.settings.chain = chain;
    store.save();
    this.getRoundInfo();
    store.route = 'Home';
    this.connect();
  }
  updateServer(address) {
    // store.settings.serverAddress = address.replace(/(http:\/\/.*)\//i, '$1');
    store.settings.serverAddress = address;
    store.save();
    store.bobClient && store.bobClient.setServer(address);
    this.connect();
  }
  isValidSeed(seed) {
    return bitcoinUtils[store.settings.chain].isMnemonicValid(seed);
  }
  isValidXPub(key) {
    return bitcoinUtils[store.settings.chain].isXPubValid(key);
  }
  isInvalid(address) {
    return bitcoinUtils[store.settings.chain].isInvalid(address);
  }
  newMnemonic() {
    return bitcoinUtils[store.settings.chain].newMnemonic();
  }
  updateKeyIndexes({
    publicIndex = store.settings.publicIndex,
    privateIndex = store.settings.privateIndex,
  }) {
    const { bobClient } = store;
    if (!bobClient) return;
    bobClient.updateKeyIndexes({
      aliceIndex: publicIndex,
      bobIndex: privateIndex,
      changeIndex: publicIndex, // Send change back to the same public wallet address
    });
    store.settings.privateIndex = bobClient.bobIndex;
    store.settings.publicIndex = bobClient.aliceIndex;
    store.save();
    this.getRoundInfo();
  }
  disconnect() {
    store.bobClient && store.bobClient.disconnect();
  }
  connect() {
    store.bobClient && store.bobClient.connect();
  }
  getRoundInfo() {
    store.roundInfo = store.bobClient ? store.bobClient.getRoundInfo() : {};
  }
  async sendTransaction({ amount, toAddress, fees, broadcast = true }) {
    const total = amount + fees;
    const {
      roundInfo,
      bobClient,
      completedRounds,
      computedAvailableUtxos,
      settings: { privateSeed, publicSeed, chain },
    } = store;
    if (!roundInfo || !bobClient) {
      throw new Error('Something went wrong');
    }
    // bobClient.disconnect();
    try {
      let roundOrig;
      let round;
      for (const rnd of computedAvailableUtxos.get()) {
        round = maxifyRound(rnd);
        if (!round.error && !round.spent && round.amount >= total) {
          roundOrig = rnd;
          break;
        }
      }
      if (!roundOrig) {
        throw new Error('Could not find an available utxo');
      }

      const fromAddress = round.address;
      const utxo = this.createUtxo(round);
      console.log('Spending utxo', utxo, round);

      // Get spending key
      const { toPrivate } = bitcoinUtils[chain].generateAddresses({
        aliceSeed: publicSeed,
        bobSeed: privateSeed,
        bobIndex: round.privateIndex,
      });

      // TODO: Use address in different address space than the Private Wallet
      const changeAddress = roundInfo.toAddress;
      const privateIndex = roundInfo.bobIndex;

      const txObj = {
        max_fees: bobClient.max_fees,
        alices: [
          {
            fromAddress,
            changeAddress,
          },
        ],
        bobs: [
          {
            toAddress,
          },
        ],
        utxos: [utxo],
        fees,
        denomination: amount,
        key: toPrivate,
        fromAddress,
        toAddress,
        changeAddress,
        min_pool: 1,
      };
      console.log('TX', txObj);

      const { tx, serialized, changeIndex, totalChange } = await bitcoinUtils[
        chain
      ].createTransaction(txObj);
      console.log('CREATED TX');
      let txid = tx.hash;
      // let broadcasted = false;
      if (broadcast) {
        let res;
        try {
          res = await bobClient.broadcastTx(serialized);
          console.log('Boadcast tx response', res);

          if (res.error) {
            throw new Error(res.error);
          }
          if (!txid) {
            throw new Error('Missing txid');
          }
          txid = res.result;
          // broadcasted = true;
        } catch (err) {
          console.log('ERROR broadcasting tx', err);
          if (err.message === 'Failed to fetch') {
            throw new Error('Could not broadcast trasanction');
          }
          throw err;
        }
      }

      let newUtxo;
      if (totalChange > 0) {
        this.updateKeyIndexes({
          privateIndex: store.settings.privateIndex + 1,
        });
        newUtxo = minifyRound({
          address: changeAddress,
          amount: totalChange,
          index: changeIndex,
          privateIndex,
          sentAddress: toAddress,
          sentAmount: amount,
          fromTxid: round.txid,
          txid,
          date: new Date().getTime(),
        });
      } else {
        console.log('No change utxo');
        newUtxo = minifyRound({
          sentAddress: toAddress,
          sentAmount: amount,
          fromTxid: round.txid,
          txid,
          date: new Date().getTime(),
        });
      }

      console.log('New utxo', newUtxo);
      completedRounds.unshift(newUtxo);
      roundOrig.u = true;
      store.saveRounds();
      return serialized;
    } catch (err) {
      bobClient.connect();
      throw err;
    }
    // bobClient.connect();
  }
  dustLimit() {
    return bitcoinUtils[store.settings.chain].DUST_LIMIT;
  }

  createUtxo(round) {
    return {
      version: 1,
      height: -1,
      value: round.amount,
      script: bitcoinUtils[store.settings.chain].getScriptForAddress(
        round.address
      ),
      address: round.address,
      coinbase: false,
      hash: round.txid,
      index: round.index,
    };
  }
}

export default new ActionsClient();

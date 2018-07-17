const bcoin = require('bcoin');
const bcash = require('bcash');
const Bitcoin = require('../dist/shufflelink/client/bitcoin_bcoin').default;

// Default settings
let CONFIG = {
  BCOIN_URI: 'localhost:18332',
  BCOIN_APIKEY: 'changeme',
  BCASH_URI: 'localhost:18332',
  BCASH_APIKEY: 'changeme',
  BCOIN: true,
  BCASH: true,
  SERVE_STATIC_APP: true,
  LOG_TO_FILE: false,
  MIN_POOL: 2,
  MAX_POOL: 1000,
  FEE_PER_INPUT: 10000,
  OUTPUT_SAT: 100000,
  PORT: 8081,
  PRODUCTION: false,
  TIMEOUT: 5,
  FETCH_RATES: true,
};
try {
  CONFIG = require('../../config.json');
  console.log('Using config file config.json');
} catch (err) {
  console.log('Could not find config.json. Using defaults');
}

let bitcoinUtilsCore;
if (CONFIG.BCOIN) {
  bitcoinUtilsCore = new Bitcoin({
    ...CONFIG,
    APIKEY: CONFIG.BCOIN_APIKEY,
    URI: CONFIG.BCOIN_URI,
    bcoin,
  });
}
let bitcoinUtilsCash;
if (CONFIG.BCASH) {
  bitcoinUtilsCash = new Bitcoin({
    ...CONFIG,
    APIKEY: CONFIG.BCASH_APIKEY,
    URI: CONFIG.BCASH_URI,
    bcoin: bcash,
  });
}

const Server = require('./server');
const server = new Server({
  bitcoinUtilsCore,
  bitcoinUtilsCash,
  CONFIG,
  DEBUG_TEST_MODE: false,
  AUTO_START: true,
});

console.log('Running server.', server.CONFIG);

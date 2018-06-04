const bcoin = require('bcoin');
const Bitcoin = require('../dist/shufflelink/client/bitcoin_bcoin').default;

// Default settings
let CONFIG = {
  BCOIN_URI: 'localhost:18332',
  BCOIN_APIKEY: 'changeme',
  SERVE_STATIC_APP: true,
  CHAIN: 'testnet',
  LOG_TO_FILE: false,
  MIN_POOL: 2,
  MAX_POOL: 1000,
  FEE_PER_INPUT: 10000,
  OUTPUT_SAT: 100000,
  PORT: 80,
  PRODUCTION: true,
  TIMEOUT: 5,
};
try {
  CONFIG = require('../../config.json');
  console.log('Using config file config.json');
} catch (err) {
  console.log('Could not find config.json. Using defaults');
}

const bitcoinUtils = new Bitcoin({
  ...CONFIG,
  bcoin,
});

const Server = require('./server');
const server = new Server({ bitcoinUtils, CONFIG, DEBUG_TEST_MODE: false });

console.log('Running server.');

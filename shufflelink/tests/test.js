navigator = typeof navigator === 'undefined' ? {} : navigator;
window = typeof window === 'undefined' ? {} : window;
const test = require('tape');
const Network = require('../dist/shufflelink/client/network').default;
const Servers = require('../server/server');

let CONFIG = {
  // BCOIN_URI: 'localhost:18332',
  // BCOIN_APIKEY: 'changeme',
  SERVE_STATIC_APP: false,
  CHAIN: 'testnet',
  LOG_TO_FILE: false,
  MIN_POOL: 2,
  MAX_POOL: 1000,
  FEE_PER_INPUT: 10000,
  OUTPUT_SAT: 100000,
  PORT: 8089, // Different port for testing
  TIMEOUT: 100,
};

const bcoin = require('bcoin');
const Bitcoin = require('../dist/shufflelink/client/bitcoin_bcoin').default;
const bitcoinUtils = new Bitcoin({
  bcoin,
});

test('1 Test socket.io', async t => {
  const NUM_OF_USERS = 10;
  t.plan(2 + NUM_OF_USERS);

  let server = new Servers({ bitcoinUtils, CONFIG });
  console.log('Creating clients...');
  let Clients = [];
  for (let i = 0; i < NUM_OF_USERS; i++) {
    const client = new Network({
      bitcoinUtils,
      serverAddress: `http://localhost:${CONFIG.PORT}`,
      callbackBalance: response => {
        console.log('callbackBalance', response);
      },
      callbackRoundComplete: response => {
        console.log('callbackRoundComplete', response.error);
        t.false(response.error);
      },
      callbackError: response => {
        console.log('callbackError', response);
        t.throws(new Error(response.error));
      },
      callbackStateChange: response => {
        console.log('callbackStateChange', response);
      },
    });
    await client.connect();
    Clients.push(client);
  }
  console.log('Created clients.');
  const success = await server.start({});
  t.true(success);
  for (const client of Clients) {
    client.disconnect();
  }
  await server.exit();
  server = null;
  Clients = null;
  t.equal(1, 1);

  t.end();
});

test('2 Test timeout', async t => {
  const NUM_OF_USERS = 3;
  t.plan(2 + NUM_OF_USERS + NUM_OF_USERS);

  let server = new Servers({ bitcoinUtils, CONFIG: { ...CONFIG, TIMEOUT: 3 } });
  console.log('Creating clients...');
  let Clients = [];
  for (let i = 0; i < NUM_OF_USERS; i++) {
    const client = new Network({
      bitcoinUtils,
      serverAddress: `http://localhost:${CONFIG.PORT}`,
      callbackBalance: response => {
        console.log(i, 'callbackBalance', response);
      },
      callbackRoundComplete: response => {
        // console.log(i, 'callbackRoundComplete', response);
        t.true(response.error);
      },
      callbackError: response => {
        console.log(i, 'callbackError', response);
        // t.throws(new Error(response.error));
        t.equal(response.error, 'Round failed at state: shuffling');
      },
      callbackStateChange: response => {
        console.log(i, 'callbackStateChange', response);
      },
    });
    if (i === 1) {
      // Force timeout
      client.shuffle = async function() {
        await client.wait(5000);
        return { error: 'Something went wrong' };
      };
    }
    await client.connect();
    Clients.push(client);
  }
  console.log('Created clients.');
  const success = await server.start({});
  t.false(success);
  for (const client of Clients) {
    client.disconnect();
  }
  await server.exit();
  server = null;
  Clients = null;
  t.equal(1, 1);

  t.end();
});

test('3 Test min_pool server', async t => {
  const NUM_OF_USERS = 2;
  t.plan(1);

  let server = new Servers({ bitcoinUtils, CONFIG });
  console.log('Creating clients...');
  let Clients = [];
  for (let i = 0; i < NUM_OF_USERS; i++) {
    const client = new Network({
      min_pool: NUM_OF_USERS + 1,
      bitcoinUtils,
      serverAddress: `http://localhost:${CONFIG.PORT}`,
      callbackBalance: response => {
        console.log(i, 'callbackBalance', response);
      },
      callbackRoundComplete: response => {
        console.log(i, 'callbackRoundComplete', response);
      },
      callbackError: response => {
        console.log(i, 'callbackError', response);
      },
      callbackStateChange: response => {
        console.log(i, 'callbackStateChange', response);
      },
    });
    await client.connect();
    Clients.push(client);
  }
  console.log('Created clients.');
  const success = await server.start({});
  t.false(success);
  for (const client of Clients) {
    client.disconnect();
  }
  await server.exit();
  server = null;
  Clients = null;

  t.end();
});

test('4 Test min_pool client', async t => {
  const NUM_OF_USERS = 2;
  t.plan(1 + NUM_OF_USERS);

  let server = new Servers({ bitcoinUtils, CONFIG });
  console.log('Creating clients...');
  let Clients = [];
  for (let i = 0; i < NUM_OF_USERS; i++) {
    const client = new Network({
      bitcoinUtils,
      serverAddress: `http://localhost:${CONFIG.PORT}`,
      callbackBalance: response => {
        console.log(i, 'callbackBalance', response);
      },
      callbackRoundComplete: response => {
        console.log(i, 'callbackRoundComplete', response);
        t.equals(response.error, 'Round failed at state: shuffling');
      },
      callbackError: response => {
        console.log(i, 'callbackError', response);
      },
      callbackStateChange: response => {
        console.log(i, 'callbackStateChange', response);
        if (response === 2) {
          client.min_pool = NUM_OF_USERS + 1;
        }
      },
    });
    await client.connect();
    Clients.push(client);
  }
  console.log('Created clients.');
  const success = await server.start({});
  t.false(success);
  for (const client of Clients) {
    client.disconnect();
  }
  await server.exit();
  server = null;
  Clients = null;

  t.end();
});

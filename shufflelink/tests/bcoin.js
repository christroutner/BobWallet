const test = require('tape');
const bcoin = require('bcoin');

const BitcoinBcoin = require('../dist/shufflelink/client/bitcoin_bcoin')
  .default;
let bitcoinUtils = new BitcoinBcoin({ CHAIN: 'tBTC', bcoin });

const seed1 =
  'price shy bulb dutch fiber coral chunk burden noodle uniform endorse pyramid';
const seed2 =
  'paper act oyster secret spice urge uncover odor fun segment immense exhaust';
const xpub1 =
  'tpubDCZhmmveHwnNhYD6KdDavDmfcGgQMMWegwhNqpeb1D9CQUsGmtij5oMiHRRGWdfb4zryswnfm55YMGz7n6JjGmddr8uZp7yvbAWNhXF77iE';
// const xpriv1 =
//   'tprv8fsfdMtQ9a6hp5BJRyYzWp7Z3FAUC2Kk7e6bZJcHawLoZzcW9Vu8uJjr7G9iSE8KS21aX2GjeDZZReKp32kqHJ1iCreKQAaExbHgSy7DiLQ';
const address1 = 'msyXVh4Sq9tiBcY2ghsmEhAwPaMd5DqBmi';

test('Test Mnemonic', async t => {
  // t.plan(5);
  let seed;
  seed = bitcoinUtils.newMnemonic(seed1);
  t.equal(seed, seed1);
  seed = bitcoinUtils.newMnemonic();
  t.equal(typeof seed, 'string');
  t.equal(seed.split(' ').length, 12);
  t.equal(bitcoinUtils.isMnemonicValid(seed1), true);
  t.equal(bitcoinUtils.isMnemonicValid('not valid seed woiefjw2'), false);
  t.equal(bitcoinUtils.isMnemonicValid(''), false);
  t.end();
});

test('Test Address Generation', async t => {
  // t.plan(5);
  let addresses;
  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed1,
  });
  t.equal(addresses.fromAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
  t.equal(addresses.changeAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.toAddress, 'myBc8uZJeyc5wo987cSvUa5n1HbTdpXj7i');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed1,
    aliceIndex: 1,
    bobIndex: 2,
  });
  t.equal(addresses.fromAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.changeAddress, 'mwmn6uU2bPuQRdKox2Q9EXfummcHSAmsEE');
  t.equal(addresses.toAddress, 'mgaXnzFBAKdzuKXAZWGpjwCXZmRnCYBSin');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed2,
    aliceIndex: 4,
  });
  t.equal(addresses.fromAddress, 'msyXVh4Sq9tiBcY2ghsmEhAwPaMd5DqBmi');
  t.equal(addresses.changeAddress, 'mgATQpCWk2uR2tnB9d2s9asWsPWMq5hjY3');
  t.equal(addresses.toAddress, 'mjCSs5NDDzeBwYnwFuWqJDGg927mGW8YX7');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed2,
    aliceIndex: 0,
    bobIndex: 2,
  });
  t.equal(addresses.fromAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
  t.equal(addresses.changeAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.toAddress, 'mikC61eegK7fNCQ6vE62PUvh67DAcrfPXK');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: xpub1,
    aliceIndex: 0,
    bobIndex: 0,
  });
  t.equal(addresses.fromAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
  t.equal(addresses.changeAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.toAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: xpub1,
    bobIndex: 3,
  });
  t.equal(addresses.toAddress, 'mtPCAA4GgDfhduFrmg4kkRAam6VCQUx76h');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed1,
    changeIndex: 6,
  });
  t.equal(addresses.fromAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
  t.equal(addresses.changeAddress, 'n4TDSqnvck8BtsGgTzTg5sdzqe8ByzyYt2');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed1,
    aliceIndex: 1,
    changeIndex: 1,
  });
  t.equal(addresses.fromAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.changeAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: address1,
  });
  t.equal(addresses.toAddress, 'msyXVh4Sq9tiBcY2ghsmEhAwPaMd5DqBmi');

  t.end();
});

test('Test Address Signing', async t => {
  // t.plan(5);
  const addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed1,
  });
  const msg = addresses.fromAddress;
  const signature = bitcoinUtils.signMessage(msg, addresses.fromPrivate);
  t.equal(
    bitcoinUtils.verifyMessage(msg, addresses.fromAddress, signature),
    true
  );
  t.equal(
    bitcoinUtils.verifyMessage(
      'invalid message',
      addresses.fromAddress,
      signature
    ),
    false
  );
  t.end();
});

test('Test Address validation', async t => {
  // t.plan(5);
  t.false(bitcoinUtils.isInvalid('mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b'));
  t.true(bitcoinUtils.isInvalid('invalidAddress'));
  t.true(bitcoinUtils.isInvalid('mzHAYhfXarPxxxkZkUDdGgYUFRmnts4m8b'));

  t.end();
});

test('Test Create Transaction', async t => {
  t.plan(2);
  const { tx, index } = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
        changeAddress: 'n4TDSqnvck8BtsGgTzTg5sdzqe8ByzyYt2',
      },
    ],
    bobs: [
      {
        toAddress: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
      },
    ],
    utxos: bitcoinUtils.getFakeUtxos({
      address: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    fees: 1,
    denomination: 10000,
    fromAddress: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
    toAddress: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
    min_pool: 1,
  });
  t.equal(index, 0);
  t.equal(
    tx.hash,
    '7706956178c40e06dfcde0edb26f43a521ce7fb879615ccc37992f790e598b2d'
  );
  t.end();
});

test('Test Create Change Dust Transaction', async t => {
  t.plan(4);
  const {
    totalChange,
    totalFees,
    index,
    changeIndex,
  } = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
        changeAddress: 'n4TDSqnvck8BtsGgTzTg5sdzqe8ByzyYt2',
      },
    ],
    bobs: [
      {
        toAddress: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
      },
    ],
    utxos: bitcoinUtils.getFakeUtxos({
      address: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: bitcoinUtils.DUST_LIMIT + 3,
    }),
    fees: 1,
    denomination: bitcoinUtils.DUST_LIMIT + 1,
    fromAddress: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
    toAddress: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
    changeAddress: 'n4TDSqnvck8BtsGgTzTg5sdzqe8ByzyYt2',
    min_pool: 1,
  });
  t.equal(totalFees, 2);
  t.equal(totalChange, 0);
  t.equal(changeIndex, -1);
  t.equal(index, 0);
  t.end();
});

test('Test validateUtxo', async t => {
  t.plan(2);
  const utxo = bitcoinUtils.getFakeUtxos({
    address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
    txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
    vout: 1,
    satoshis: 124000000,
  });
  t.equal(bitcoinUtils.validateUtxo(utxo), true);
  utxo[0].coinbase = true;
  t.throws(
    () => bitcoinUtils.validateUtxo(utxo),
    'Invalid utxo. No Coinbase coins allowed.'
  );
  t.end();
});

test('Test compareUtxoSets', async t => {
  t.plan(15);
  let utxos1 = [
    ...bitcoinUtils.getFakeUtxos({
      address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'myBc8uZJeyc5wo987cSvUa5n1HbTdpXj7i',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de42',
      vout: 1,
      satoshis: 124000000,
    }),
  ];
  let utxos2 = utxos1.slice(); // Copy
  t.equal(bitcoinUtils.compareUtxoSets(utxos1, utxos2), true);

  // Utxo has different txid
  utxos2.splice(
    0,
    1,
    ...bitcoinUtils.getFakeUtxos({
      address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de43',
      vout: 1,
      satoshis: 124000000,
    })
  );
  try {
    bitcoinUtils.compareUtxoSets(utxos1, utxos2);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 1);
    t.equal(err.data[0], 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  }

  // Missing utxo
  utxos2.splice(0, 1);
  try {
    bitcoinUtils.compareUtxoSets(utxos1, utxos2);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 1);
    t.equal(err.data[0], 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  }
  try {
    bitcoinUtils.compareUtxoSets(utxos1, []);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 3);
    t.equal(err.data[0], 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
    t.equal(err.data[1], 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
    t.equal(err.data[2], 'myBc8uZJeyc5wo987cSvUa5n1HbTdpXj7i');
  }

  // Utxo has different txid
  utxos1 = [
    ...bitcoinUtils.getFakeUtxos({
      address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
  ];
  utxos2 = utxos1.slice(); // Copy
  utxos2.splice(
    0,
    1,
    ...bitcoinUtils.getFakeUtxos({
      address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
      vout: 1,
      satoshis: 124000000,
    })
  );
  try {
    bitcoinUtils.compareUtxoSets(utxos1, utxos2);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 1);
    t.equal(err.data[0], 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  }

  t.end();
});

test('Test address to hex', async t => {
  t.plan(1);
  const addr = 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV';
  const hex = bitcoinUtils.addressToHex(addr);
  const address = bitcoinUtils.hexToAddress(hex);
  t.equal(addr, address);
  t.end();
});

test('Test cashaddr normalize', async t => {
  t.plan(1);
  const addr = 'bchtest:qpr7gquf5kqv8j4a60dqrg7n0z25yy5a2czq4hkald';
  const address = bitcoinUtils.normalizeAddress(addr);
  t.equal(address, 'mn55RMMwpgKedHD8VuoQtY5nTcGvcXtvyH');
  t.end();
});

test('Test Transaction size', async t => {
  t.plan(12);

  // base tx 10 bytes
  // every output is 34 bytes
  // every input is 41 bytes
  const baseSize = 10;
  const outputSize = 34;
  const inputSize = 41;
  const sigSize = 107;

  const addresses1 = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed1,
    aliceIndex: 0,
    bobIndex: 0,
  });
  const addresses2 = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    bobSeed: seed1,
    aliceIndex: 2,
    bobIndex: 1,
  });

  let tx = bitcoinUtils.createTransaction({
    alices: [],
    bobs: [],
    utxos: [],
    fees: 100,
    denomination: 10000,
    min_pool: 0,
  });
  t.equal(tx.size, 10);
  t.equal(tx.size, baseSize); // 10 bytes

  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
    ],
    bobs: [
      {
        toAddress: addresses1.toAddress,
      },
    ],
    utxos: bitcoinUtils.getFakeUtxos({
      address: addresses1.fromAddress,
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    fees: 100,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
  });
  t.equal(tx.size, 119);
  t.equal(tx.size, baseSize + 1 * inputSize + 2 * outputSize);

  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
      {
        fromAddress: addresses2.fromAddress,
        changeAddress: addresses2.changeAddress,
      },
    ],
    bobs: [
      {
        toAddress: addresses1.toAddress,
      },
      {
        toAddress: addresses2.toAddress,
      },
    ],
    utxos: [
      ...bitcoinUtils.getFakeUtxos({
        address: addresses1.fromAddress,
        txid:
          'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
        vout: 1,
        satoshis: 124000000,
      }),
      ...bitcoinUtils.getFakeUtxos({
        address: addresses2.fromAddress,
        txid:
          'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
        vout: 1,
        satoshis: 124000000,
      }),
    ],
    fees: 1000,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
  });
  t.equal(tx.size, 228);
  t.equal(tx.size, baseSize + 2 * inputSize + outputSize * 4);

  const expectedFee = bitcoinUtils.calculateFeeSat({
    users: 1,
    inputs: 1,
    outputs: 2,
    fees: 1,
  });
  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
    ],
    bobs: [
      {
        toAddress: addresses1.toAddress,
      },
    ],
    utxos: bitcoinUtils.getFakeUtxos({
      address: addresses1.fromAddress,
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 10000 + expectedFee,
    }),
    fees: expectedFee,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
  });
  t.equal(tx.size, 85);
  t.equal(tx.size, baseSize + 1 * inputSize + 1 * outputSize);

  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
    ],
    bobs: [
      {
        toAddress: addresses1.toAddress,
      },
    ],
    utxos: [
      ...bitcoinUtils.getFakeUtxos({
        address: addresses1.fromAddress,
        txid:
          'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
        vout: 1,
        satoshis: 11000,
      }),
      ...bitcoinUtils.getFakeUtxos({
        address: addresses1.fromAddress,
        txid:
          'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
        vout: 1,
        satoshis: 11000,
      }),
    ],
    fees: 10,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
  });
  t.equal(tx.size, 160);
  t.equal(tx.size, baseSize + 2 * inputSize + 2 * outputSize);

  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
    ],
    bobs: [
      {
        toAddress: addresses1.toAddress,
      },
    ],
    utxos: bitcoinUtils.getFakeUtxos({
      address: addresses1.fromAddress,
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    fees: 1,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
    key: addresses1.fromPrivate,
  });
  t.equal(tx.size, 226);
  t.equal(tx.size, baseSize + 1 * inputSize + 2 * outputSize + 1 * sigSize);

  t.end();
});

// test.only('Tx validator', async t => {
//   t.plan(1);
//   const tx =
//     '01000000012270713b2b3f72482d47485a74da32417b5853aae2d031f9ce24c848095945ba000000006a4730440220632811280edc837a09eade40b98164c6d1a57512d286a34c88765803174a8a6c02207039468d2f86416e5f0239ec4dae2979d438985f320e98aa77b3e15d780cd8b1412102e7709f16ab3406bd6f4784a326e713e653c80b8a6fce99c782f03fbe702de4ddffffffff01905f0100000000001976a91451702d8fc8ee0e7059050eb147f4a5a318d4234d88ac00000000';
//   t.equal(bitcoinUtils.validateTx(tx), true);
//   t.end();
// });

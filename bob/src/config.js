export const VERSION = require('package-bobwallet.json').version;

// export const DEFAULT_ROUTE = 'Home';
export const DEFAULT_ROUTE = 'Welcome';
export const DEFAULT_TAB = 'Public';

export const SERVER = {
  tBTC: 'https://tbtc.bobwallet.fun',
  tBCH: 'https://tbch.bobwallet.fun',
  BTC: 'https://btc.bobwallet.fun',
  BCH: 'https://bch.bobwallet.fun',
};

export const WALLET_TOOL_URL = 'https://iancoleman.io/bip39/';

export const TESTNET_FAUCET_URL = {
  tBTC: 'https://testnet.manu.backend.hamburg/faucet',
  tBCH: 'https://testnet.manu.backend.hamburg/bitcoin-cash-faucet',
  BTC: null,
  BCH: null,
};
export const BLOCK_EXPLORER_URL = {
  tBTC: 'https://live.blockcypher.com/btc-testnet/',
  // tBCH: 'https://test-bch-insight.bitpay.com/',
  tBCH: 'https://www.blocktrail.com/tBCC/',
  BTC: 'https://live.blockcypher.com/btc/',
  BCH: 'https://blockchair.com/bitcoin-cash/',
};
export const BLOCK_TXID_URL = (chain, txid) => {
  if (chain === 'tBTC') {
    return `https://live.blockcypher.com/btc-testnet/tx/${txid}/`;
  } else if (chain === 'tBCH') {
    // return `https://test-bch-insight.bitpay.com/api/tx/${txid}`;
    return `https://www.blocktrail.com/tBCC/tx/${txid}`;
  } else if (chain === 'BCH') {
    return `https://blockchair.com/bitcoin-cash/transaction/${txid}`;
  } else {
    return `https://www.blockchain.com/btc/tx/${txid}`;
  }
};
export const GITHUB_URL = 'https://github.com/BobWallet/BobWallet';

export const DEFAULT_CHAIN = 'tBTC';

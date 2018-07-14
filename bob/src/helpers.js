import { Dimensions } from 'react-native';
import BigNumber from 'bignumber.js';
import FileSaver from 'file-saver';

export const formatSat = amount => {
  if (typeof amount === 'undefined' || amount === null) {
    return `Unknown Amount`;
  }
  const num = new BigNumber(amount.toString());
  // if (wholeNumber) {
  //   return `${num.dividedBy(100000000).toFormat(8)} ${ticker || ''}`;
  // } else {
  //   return `${num.dividedBy(100).toFormat(0)} ${ticker || ''} bits`;
  // }
  // return `${num.dividedBy(100).toFormat(0)} ${ticker || ''} bits`;
  return `${num.dividedBy(100).toFormat(0)} bits`;
};

export const download = content => {
  var blob = new window.Blob([content], { type: 'text/plain;charset=utf-8' });
  FileSaver.saveAs(blob, 'bob_backup.txt');
};

export const smallScreen = Dimensions.get('window').width < 553;

const ROUND_MAP = {
  e: 'error',
  a: 'address',
  o: 'amount', // Amount owned,
  j: 'privateIndex', // privateSeed index for spending
  f: 'fromTxid', // Where
  s: 'sentAddress', // External sent address
  t: 'sentAmount', // External amount sent
  // c: 'change',
  // s: 'fees',
  // l: 'left',
  b: 'bobs',
  x: 'txid',
  i: 'index', // Coin index in tx
  u: 'spent', // Boolean if spent
  // n: 'disabled', // Boolean to mark if tx is disabled
  d: 'date',
};

export function maxifyRound(round) {
  if (round.date) return round;
  const newRound = {};
  Object.keys(round).map(key => {
    if (ROUND_MAP[key]) {
      newRound[ROUND_MAP[key]] = round[key];
    }
    return true;
  });
  return newRound;
}
export function minifyRound(round) {
  if (round.d) return round;
  const INVERTED_ROUND_MAP = {};
  Object.keys(ROUND_MAP).map(key => {
    if (ROUND_MAP[key]) {
      INVERTED_ROUND_MAP[ROUND_MAP[key]] = key;
    }
    return true;
  });
  const newRound = {};
  Object.keys(round).map(key => {
    if (INVERTED_ROUND_MAP[key]) {
      newRound[INVERTED_ROUND_MAP[key]] = round[key];
    }
    return true;
  });
  return newRound;
}

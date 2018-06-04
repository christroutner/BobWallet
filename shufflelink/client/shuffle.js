// Needed to run node.js tests
navigator = typeof navigator === 'undefined' ? {} : navigator;
window = typeof window === 'undefined' ? {} : window;
const JSEncrypt = require('jsencrypt').default;

const aesjs = require('aes-js');
const shuffle = require('shuffle-array');
const randomBytes = require('randombytes');

// const AES_KEY_LENGTH = 16; // 128bit
const AES_KEY_LENGTH = 32; // 256bit

function a2hex(str) {
  return new Buffer(str, 'utf8').toString('hex');
}
function hex2a(hexx) {
  return new Buffer(hexx, 'hex').toString('utf8');
}
function base64ToHex(str) {
  return new Buffer(str, 'base64').toString('hex');
}
function hexToBase64(str) {
  return new Buffer(str, 'hex').toString('base64');
}
function decimalToHex(num) {
  const hex = Number(num).toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}
function hexToNumber(hex) {
  return parseInt(hex, 16);
}

// https://en.wikipedia.org/wiki/Hybrid_cryptosystem
function encrypt(key, text) {
  const aesKey = randomBytes(AES_KEY_LENGTH).toString('hex');
  const ivData = randomBytes(16);
  const aesKeyArray = aesjs.utils.hex.toBytes(aesKey);
  const textBytes = aesjs.utils.hex.toBytes(text);
  const aesCtr = new aesjs.ModeOfOperation.ctr(aesKeyArray, ivData);
  const encryptedBytes = aesCtr.encrypt(textBytes);
  const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  const rsaEncrypt = new JSEncrypt();
  rsaEncrypt.setPublicKey(key);
  const encryptedKey = base64ToHex(rsaEncrypt.encrypt(aesKey));
  const length = decimalToHex(encryptedKey.length / 2);
  const ivLength = decimalToHex(ivData.length);
  const ivHex = ivData.toString('hex');
  return `${length}${encryptedKey}${ivLength}${ivHex}${encryptedHex}`;
}

function decrypt(key, cypher) {
  let position = 0;
  const length = hexToNumber(cypher.slice(0, 2));
  position = 2;
  const rsaData = hexToBase64(cypher.slice(position, position + length * 2));
  position = position + length * 2;
  const ivLength = hexToNumber(cypher.slice(position, position + 2));
  position = position + 2;
  const ivData = aesjs.utils.hex.toBytes(
    cypher.slice(position, position + ivLength * 2)
  );
  position = position + ivLength * 2;
  const aesData = cypher.slice(position);
  const rsaDecrypt = new JSEncrypt({ log: true });
  rsaDecrypt.setPrivateKey(key);
  const aesKey = rsaDecrypt.decrypt(rsaData);
  const aesKeyArray = aesjs.utils.hex.toBytes(aesKey);
  const textBytes = aesjs.utils.hex.toBytes(aesData);
  const aesCtr = new aesjs.ModeOfOperation.ctr(aesKeyArray, ivData);
  const decryptedBytes = aesCtr.decrypt(textBytes);
  const encryptedHex = aesjs.utils.hex.fromBytes(decryptedBytes);
  return encryptedHex;
}

function validateKeys(pubKey, privKey) {
  try {
    const key = new JSEncrypt();
    key.setPrivateKey(privKey);
    if (key.getPublicKey() === pubKey) {
      return true;
    }
  } catch (err) {
    console.log('ERROR', err);
  }
  return false;
}

function generateKey() {
  const key = new JSEncrypt();
  key.getPublicKey();
  return key;
}

module.exports = {
  encrypt,
  decrypt,
  generateKey,
  shuffle,
  hex2a,
  a2hex,
  validateKeys,
};

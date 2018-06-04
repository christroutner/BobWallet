const io = require('socket.io-client');
const Client = require('./client').default;
const normalizeUrl = require('normalize-url');
const CLIENT_STATES = require('./client_states');

const DEFAULT_URL = 'http://localhost:8081';

class Network extends Client {
  constructor(params) {
    super(params);
    this.serverAddress = params.serverAddress || DEFAULT_URL;
  }
  checkBalance(address = this.keys.fromAddress) {
    if (this.isConnected && this.socket) {
      return new Promise(resolve => {
        this.socket.emit('checkBalance', address, balance => {
          this.updateBalance(balance);
          resolve(balance);
        });
      });
    }
  }
  connect() {
    return new Promise(resolve => {
      this.isConnecting = true;
      this.isConnected = false;
      let usedPromise = false;
      this.socket = io(this.serverAddress, {
        // path: '/myownpath'
      });
      this.socket.on('join', (params, cb) => {
        console.log('join', params);
        cb(this.join(params));
      });
      this.socket.on('shuffle', async (params, cb) => {
        console.log('shuffle');
        cb(await this.shuffle(params));
      });
      this.socket.on('sign', (params, cb) => {
        console.log('sign');
        cb(this.sign(params));
      });
      this.socket.on('blame', (params, cb) => {
        console.log('blame');
        cb(this.blame(params));
      });
      this.socket.on('roundSuccess', (params, cb) => {
        console.log('roundSuccess');
        cb(this.roundSuccess(params));
      });
      this.socket.on('roundError', (params, cb) => {
        console.log('roundError');
        cb(this.setRoundError(params));
      });
      this.socket.on('balance', (params, cb) => {
        console.log('balance');
        cb(this.updateBalance(params));
      });
      this.socket.on('connect', () => {
        console.log('Client Connected');
        if (!usedPromise) {
          usedPromise = true;
          resolve();
        }
        this.isConnecting = false;
        this.isConnected = true;
        this.checkBalance();
      });
      this.socket.on('disconnect', () => {
        console.log('Client Disconnected');
        this.disconnected();
      });
      this.socket.connect();
    });
  }
  disconnected() {
    this.setState(CLIENT_STATES.unjoined);
    this.isConnecting = false;
    this.isConnected = false;
    this.roundParams = null;
    this.roundError = null;
  }
  disconnect() {
    if (this.socket) {
      // this.socket.disconnect();
      this.socket.destroy();
      this.socket = null;
    }
    this.disconnected();
  }
  setServer(serverAddress) {
    this.disconnect();
    try {
      this.serverAddress = normalizeUrl(serverAddress);
    } catch (err) {
      this.serverAddress = serverAddress;
    }
  }
  updateKeyIndexes(params) {
    super.updateKeyIndexes(params);
    this.checkBalance();
  }

  getRoundInfo() {
    const roundInfo = super.getRoundInfo();
    return Object.assign({}, roundInfo, {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      isDisconnected: !this.isConnected && !this.isConnecting,
    });
  }
}

// module.exports = Network;
export default Network;
// exports.default = Network;

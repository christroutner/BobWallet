import { observe } from 'mobx';
import store from '../store';
import ActionsClient from './client';
import ActionsSettings from './settings';
import { DEFAULT_CHAIN } from '../config';

class ActionsNav {
  constructor() {
    observe(store, 'loaded', () => {
      if (store.loaded) {
        if (!store.settings.aliceSeed || !store.settings.bobSeed) {
          this.goWelcome();
        } else {
          this.goHome();
        }
      }
    });
  }

  goEasy(chain = DEFAULT_CHAIN) {
    const aliceSeed = ActionsClient.newMnemonic();
    const bobSeed = ActionsClient.newMnemonic();
    ActionsClient.initAlice({ aliceSeed, bobSeed, chain });
    ActionsSettings.setSimpleMode(true);
    ActionsSettings.downloadBackup();
    ActionsSettings.copyBackup();
    this.goHome();
  }
  goPro({ aliceSeed, bobSeed, chain = DEFAULT_CHAIN }) {
    ActionsClient.initAlice({ aliceSeed, bobSeed, chain });
    ActionsSettings.setSimpleMode(false);
    ActionsSettings.downloadBackup();
    ActionsSettings.copyBackup();
    this.goHome();
    this.goJoin();
  }
  goWelcome() {
    ActionsClient.clearAlice();
    store.route = 'Welcome';
  }
  goRestoreWallet() {
    store.route = 'RestoreWallet';
  }
  goCreateWallet() {
    store.route = 'CreateWallet';
  }
  goHome() {
    store.route = 'Home';
  }
  goAlice() {
    store.settings.routeTab = 'Alice';
    store.save();
  }
  goAliceSimple() {
    store.settings.routeTab = 'AliceSimple';
    store.save();
  }
  goBob() {
    store.settings.routeTab = 'Bob';
    store.save();
  }
  goBobSimple() {
    store.settings.routeTab = 'BobSimple';
    store.save();
  }
  goJoin() {
    store.settings.routeTab = 'Join';
    store.save();
  }
  goSettings() {
    store.settings.routeTab = 'Settings';
    store.save();
  }
  goHelp() {
    store.settings.routeTab = 'Help';
    store.save();
  }
}

export default new ActionsNav();

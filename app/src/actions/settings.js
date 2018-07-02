import store from '../store';
import { Clipboard } from 'react-native';
import { download } from '../helpers';
import { observable } from 'mobx';

class ActionsSettings {
  flipWholeNumber() {
    store.settings.wholeNumbers = !store.settings.wholeNumbers;
    store.save();
  }

  prepareBackup() {
    let string;
    store.settings.lastBackup = new Date().getTime();
    store.save();
    const { settings, completedRounds, addressBalances } = store;
    try {
      string = JSON.stringify({
        settings,
        completedRounds,
        addressBalances,
      });
    } catch (err) {
      console.log('Could not copy all data', err);
      try {
        string = JSON.stringify({
          settings,
          addressBalances,
        });
      } catch (err) {
        console.log('Could not copy all data', err);
        string = JSON.stringify({ settings });
      }
    }
    return string;
  }

  copyBackup() {
    const string = this.prepareBackup();
    Clipboard.setString(string);
  }
  downloadBackup() {
    const string = this.prepareBackup();
    download(string);
  }
  async setBackup(backup) {
    try {
      const parsed = JSON.parse(backup);
      const { settings, completedRounds, addressBalances } = parsed;
      if (!settings.aliceSeed || !settings.bobSeed) {
        throw new Error('Missing wallet seeds');
      }
      const keys = Object.keys(settings);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (typeof store.settings[key] !== 'undefined') {
          store.settings[key] = settings[key];
        }
      }
      store.save();
      store.completedRounds = observable.array(completedRounds || []);
      store.saveCompletedRounds();
      store.addressBalances.replace(addressBalances || {});
      store.saveAddressBalances();
    } catch (err) {
      console.log('Error recovering backup', err);
      return err.message;
    }
  }
  toggleSimpleMode() {
    this.setSimpleMode(!store.settings.simpleMode);
  }
  setSimpleMode(value) {
    store.settings.simpleMode = !!value;
    if (value) {
      store.settings.wholeNumbers = true;
      store.bobClient && store.bobClient.connect();
    }
    store.save();
  }
}

export default new ActionsSettings();

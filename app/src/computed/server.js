import { computed, extendObservable } from 'mobx';

const ComputedServer = store => {
  extendObservable(store, {
    computedSuccessfulRounds: computed(() => {
      const {
        settings: { successfulRounds },
      } = store;
      return successfulRounds;
    }),
    computedFailedRounds: computed(() => {
      const {
        settings: { failedRounds },
      } = store;
      return failedRounds;
    }),

    computedBobBalance: computed(() => {
      const {
        settings: { privateBalance },
      } = store;
      return privateBalance;
    }),
    computedRoundsLeft: computed(() => {
      const {
        neededFunds,
        addressBalances,
        roundAddresses: { fromAddress },
      } = store;
      if (neededFunds && fromAddress) {
        return Math.floor(addressBalances.get(fromAddress) / neededFunds);
      } else {
        return 'Unknown';
      }
    }),
    computedLastUpdated: computed(() => {
      const { roundInfo } = store;
      const secondsAgo = roundInfo
        ? Math.ceil(
            (new Date().getTime() - new Date(roundInfo.lastUpdated).getTime()) /
              1000
          )
        : 'Never';
      return secondsAgo;
    }),

    computedAliceHistory: computed(() => {
      const {
        completedRounds,
        roundAddresses: { fromAddress },
      } = store;

      const filteredRounds = completedRounds.filter(
        item =>
          item.from === fromAddress ||
          item.to === fromAddress ||
          item.change === fromAddress
      );
      return filteredRounds;
    }),
    computedBobHistory: computed(() => {
      const {
        completedRounds,
        roundAddresses: { toAddress },
      } = store;

      const filteredRounds = completedRounds.filter(
        item =>
          item.from === toAddress ||
          item.to === toAddress ||
          item.change === toAddress
      );
      return filteredRounds;
    }),
    computedHistory: computed(() => {
      const { completedRounds } = store;
      return completedRounds.slice(0, 100); // TODO: Paginate?
    }),
    computedLowBalance: computed(() => {
      const {
        neededFunds,
        addressBalances,
        roundAddresses: { fromAddress },
      } = store;
      const balance = addressBalances.get(fromAddress);
      if (!neededFunds || balance >= neededFunds) {
        return false;
      } else {
        return true;
      }
    }),
  });
};

export default ComputedServer;

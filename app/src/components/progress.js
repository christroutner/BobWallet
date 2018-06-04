import React, { Component } from 'react';
import { Text } from '../components/text';
import { View, ProgressBar } from 'react-native';
import { colors } from '../styles';
import { observer } from 'mobx-react';
import store from '../store';

const States = {
  unjoined: 'Waiting to Join.',
  joining: 'Joining Round...',
  shuffling: 'Shuffling Private Address.',
  signing: 'Signing Transaction.',
};

class ComponentProgress extends Component {
  render() {
    const { roundInfo } = store;
    return (
      <View style={{ marginBottom: 10 }}>
        <ProgressBar
          progress={roundInfo.progress}
          style={{ borderRadius: 24, height: 30 }}
          trackColor={colors.darkgray}
          color={colors.green}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{}}>
            {States[roundInfo.currentState]}
            {roundInfo &&
              roundInfo.min_pool &&
              `  ${roundInfo.joined} of ${roundInfo.min_pool} Joined. ${
                roundInfo.joined < roundInfo.min_pool
                  ? 'Waiting for more users'
                  : ''
              }`}
          </Text>
        </View>
      </View>
    );
  }
}

export default observer(ComponentProgress);

import React, { Component } from 'react';
import { Text } from '../components/text';
import { View } from 'react-native';
import { formatSat } from '../helpers';
import { colors } from '../styles';
import { observer } from 'mobx-react';
import store from '../store';
import moment from 'moment';

class ComponentsStats extends Component {
  render() {
    const {
      // computedServerStatus,
      // computedLastUpdated,
      computedRoundsLeft,
      computedSuccessfulRounds,
      computedFailedRounds,
      // computedIsJoined,
      roundInfo,
      settings: { ticker, wholeNumbers, totalFees, privateBalance },
    } = store;
    // const safeServerStatus = computedServerStatus || {};

    const leftStyle = {
      color: roundInfo.isConnected ? colors.gray : colors.background,
      textAlign: 'right',
      borderWidth: 0.5,
      borderColor: colors.gray,
      padding: 1,
      paddingRight: 0,
    };
    const rightStyle = {
      color: roundInfo.isConnected ? colors.white : colors.background,
      textAlign: 'left',
      borderWidth: 0.5,
      borderColor: colors.gray,
      padding: 1,
    };
    const leftStyle2 = { ...leftStyle, color: colors.gray };
    const rightStyle2 = { ...rightStyle, color: colors.white };
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row' }}>
          <View>
            {/* <Text style={leftStyle2}>Joined Round:</Text> */}
            <Text style={leftStyle2}>Successful Rounds:</Text>
            <Text style={leftStyle2}>Failed Rounds:</Text>
            <Text style={leftStyle2}>Rounds Left:</Text>
            <Text style={leftStyle2}>Total Fees Paid:</Text>
            <Text style={leftStyle2}>Private Balance:</Text>
            <Text style={leftStyle2}> </Text>
            <Text style={leftStyle}>Server Version:</Text>
            <Text style={leftStyle}>Bobs Needed:</Text>
            <Text style={leftStyle}>Bobs Joined:</Text>
            <Text style={leftStyle}>Denomination:</Text>
            <Text style={leftStyle}>Network Fee:</Text>
            <Text style={leftStyle}>Server State:</Text>
            <Text style={leftStyle}>Last Updated:</Text>
          </View>
          <View>
            {/* <Text style={rightStyle2}> {computedIsJoined ? 'Yes' : 'No'}</Text> */}
            <Text style={rightStyle2}> {computedSuccessfulRounds}</Text>
            <Text style={rightStyle2}> {computedFailedRounds}</Text>
            <Text style={rightStyle2}> {computedRoundsLeft}</Text>
            <Text style={rightStyle2}>
              {' '}
              {formatSat(totalFees, ticker, wholeNumbers)}
            </Text>
            <Text style={rightStyle2}>
              {' '}
              {formatSat(privateBalance, ticker, wholeNumbers)}
            </Text>
            <Text style={leftStyle}>Server Stats</Text>
            <Text style={rightStyle}> {roundInfo.version}</Text>
            <Text style={rightStyle}> {roundInfo.min_pool}</Text>
            <Text style={rightStyle}> {roundInfo.joined}</Text>
            <Text style={rightStyle}>
              {' '}
              {formatSat(roundInfo.denomination, ticker, wholeNumbers)}
            </Text>
            <Text style={rightStyle}>
              {' '}
              {formatSat(roundInfo.fees, ticker, wholeNumbers)}
            </Text>
            <Text style={rightStyle}> {roundInfo.currentState}</Text>
            <Text style={rightStyle}>
              {' '}
              {moment(roundInfo.lastUpdated).fromNow()}
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

export default observer(ComponentsStats);

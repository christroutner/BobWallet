import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../styles';
import { formatSat } from '../helpers';
import { BLOCK_TXID_URL } from '../config';
import store from '../store';
import moment from 'moment';

class HistoryView extends Component {
  render() {
    const {
      completedRounds,
      settings: { chain },
    } = store;

    return (
      <View style={{ flex: 1 }}>
        {completedRounds.length === 0 && (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>
              No Previous Transactions.
            </Text>
            <Text style={{ color: colors.gray }}>
              Send Bitcoin to the Public Wallet to get started.
            </Text>
          </View>
        )}
        {completedRounds.length > 0 && (
          <ScrollView
            style={{ alignSelf: 'center' }}
            contentContainerStyle={{}}
          >
            {completedRounds.map((round, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  disabled={!round.x}
                  onPress={() => {
                    // Linking.openURL(BLOCK_TXID_URL(chain, round.x))
                    window.open(BLOCK_TXID_URL(chain, round.x), '_blank');
                  }}
                  style={{
                    padding: 6,
                    margin: 3,
                    borderWidth: 0.5,
                    borderColor: colors.lightgray,
                  }}
                >
                  {!!round.e && (
                    <Text style={{ color: colors.red }}>{round.e}</Text>
                  )}
                  {!round.e &&
                    !!round.s && (
                      <Text>
                        Sent{' '}
                        <Text style={{ fontWeight: 'bold' }}>
                          {formatSat(round.t)}
                        </Text>{' '}
                        to{'\n'}
                        <Text style={{ fontSize: 12 }}>{round.s}</Text>
                      </Text>
                    )}
                  {!round.e &&
                    !round.s && (
                      <Text>
                        Received{' '}
                        <Text style={{ fontWeight: 'bold' }}>
                          {formatSat(round.o)}
                        </Text>{' '}
                        from Public Wallet
                      </Text>
                    )}

                  <View style={{ flexDirection: 'row' }}>
                    {!round.e && (
                      <Text>
                        {!!round.b && <Text>{round.b} bobs mixed</Text>}{' '}
                      </Text>
                    )}
                    <Text>{moment(round.d).fromNow()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  }
}

export default observer(HistoryView);

import React, { Component } from 'react';
// import { Text } from '../components/text';
import { observer } from 'mobx-react';
import ActionsClient from '../actions/client';
import TextInput from '../components/textinput';
import { colors } from '../styles';
import store from '../store';
import { View } from 'react-native';
import Button from '../components/button';

class ComponentControls extends Component {
  render() {
    const {
      roundInfo,
      settings: { serverAddress },
    } = store;
    const connected = !!roundInfo.isConnected || !!roundInfo.isConnecting;

    return (
      <View style={{ flex: 1, marginRight: 10 }}>
        <TextInput
          placeholder="Server address"
          value={serverAddress}
          onChangeText={text => ActionsClient.updateServer(text)}
        />
        <Button
          color={connected ? colors.red : colors.green}
          text={connected ? 'Stop' : 'Start'}
          onPress={() => ActionsClient.toggleConnect()}
        />
      </View>
    );
  }
}

export default observer(ComponentControls);

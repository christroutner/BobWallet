import React, { Component } from 'react';
import { TextB } from '../components/text';
import { View } from 'react-native';
import { colors } from '../styles';
import { observer } from 'mobx-react';
import store from '../store';

class ComponentErrors extends Component {
  render() {
    const { roundInfo } = store;
    return (
      <View>
        <TextB
          style={{ alignSelf: 'center', color: colors.red, marginBottom: 4 }}
        >
          {roundInfo && roundInfo.roundError
            ? `${roundInfo.roundError.error}`
            : ' '}
        </TextB>
      </View>
    );
  }
}

export default observer(ComponentErrors);

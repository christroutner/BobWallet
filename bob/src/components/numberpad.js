import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, TouchableOpacity, Text } from 'react-native';
import { formatSat, smallScreen } from '../helpers';
import { colors } from '../styles';

const NumButton = ({ press, text }) => {
  return (
    <TouchableOpacity
      style={{
        height: smallScreen ? 50 : 60,
        width: 86,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={() => press(text)}
    >
      <Text style={{ color: colors.gray, fontSize: 30 }}>{text}</Text>
    </TouchableOpacity>
  );
};

NumButton.propTypes = {
  text: PropTypes.string,
  press: PropTypes.func,
};

class ComponentNumPad extends Component {
  constructor() {
    super();
    this.onPress = this.onPress.bind(this);
  }
  onPress(number) {
    const { max, flash, onChange, value } = this.props;
    let newValue = value.toString().slice(0, -2);
    if (number === '<') {
      newValue = newValue.toString().slice(0, -1);
    } else {
      newValue = `${newValue}${number}`;
    }
    if (!newValue) {
      newValue = '0';
    }
    newValue = `${newValue}00`;
    if (newValue > max) {
      flash(`For privacy you can only send ${formatSat(max)} per tx`);
      return onChange(max);
    }
    onChange(newValue);
  }
  render() {
    const { value } = this.props;
    return (
      <View style={{ alignSelf: 'center' }}>
        <Text style={{ alignSelf: 'center', fontSize: 32, fontWeight: 'bold' }}>
          {formatSat(value)}
        </Text>
        <View style={{ height: smallScreen ? 2 : 10 }} />
        <View style={{ flexDirection: 'row' }}>
          <NumButton press={this.onPress} text="1" />
          <NumButton press={this.onPress} text="2" />
          <NumButton press={this.onPress} text="3" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <NumButton press={this.onPress} text="4" />
          <NumButton press={this.onPress} text="5" />
          <NumButton press={this.onPress} text="6" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <NumButton press={this.onPress} text="7" />
          <NumButton press={this.onPress} text="8" />
          <NumButton press={this.onPress} text="9" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <NumButton press={() => {}} text=" " />
          <NumButton press={this.onPress} text="0" />
          <NumButton press={this.onPress} text="<" />
        </View>
      </View>
    );
  }
}

ComponentNumPad.propTypes = {
  max: PropTypes.number, // Bits
  onChange: PropTypes.func,
  flash: PropTypes.func,
  value: PropTypes.any, // Bits
};

export default ComponentNumPad;

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, View, Clipboard, Text } from 'react-native';
import QRCode from './qrcode';
import ComponentArrow from './arrow';
import { smallScreen } from '../helpers';
import { colors } from '../styles';

class ComponentAddress extends Component {
  render() {
    const {
      title,
      onPressUp,
      onPressDown,
      address,
      // privateKey,
      // onValueChange,
      value,
      // derivePath,
      // balance,
      // ticker,
      // wholeNumbers,
      flashMessage,
      disableIncrementor,
      // date,
      // bobs,
    } = this.props;
    const fontSize = smallScreen ? 12 : 16;
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            Clipboard.setString(address);
            flashMessage('Copied Address');
          }}
          style={{
            // width: 335,
            // borderWidth: 0.5,
            // borderColor: colors.lightgray,
            // shadowRadius: 2,
            // shadowOpacity: 0.5,
            // shadowColor: colors.black,
            // shadowOffset: { width: 1, height: 1 },
            alignItems: 'center',
            // justifyContent: 'center',
          }}
        >
          {/* <Text style={{ fontWeight: 'bold', fontSize: 20 }}>
            {formatSat(balance, ticker, wholeNumbers)}
          </Text> */}
          <Text
            style={{
              fontSize,
              margin: 4,
              marginTop: 12,
              marginBottom: 12,
              color: colors.gray,
            }}
          >
            {address}
          </Text>
          <Text style={{}}>{title}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(address);
              flashMessage('Copied Address');
            }}
            style={{
              width: 120,
              height: 120,
              marginLeft: 10,
              backgroundColor: 'white',
            }}
          >
            <QRCode address={address} />
          </TouchableOpacity>

          {!disableIncrementor && (
            <ComponentArrow
              onPressUp={() => onPressUp()}
              onPressDown={() => onPressDown()}
              value={value}
              // onValueChange={text => onValueChange(text)}
              disabled={false}
            />
          )}
        </View>

        {/* {!!privateKey && (
          <TouchableOpacity
            style={{
              width: 120,
              height: 120,
              marginLeft: 12,
              margin: 4,
              borderWidth: showPrivate ? 0 : 0.5,
              borderColor: colors.white,
              backgroundColor: 'white',
            }}
            onPress={() => {
              if (!showPrivate) {
                Clipboard.setString(privateKey);
                flashMessage('Copied private key');
              }
              this.setState({ showPrivate: !showPrivate });
            }}
          >
            {showPrivate ? (
              <QRCode address={privateKey} />
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}
              >
                <Text style={{ textAlign: 'center' }}>Copy Private Key</Text>
              </View>
            )}
          </TouchableOpacity>
        )} */}
      </View>
    );
  }
}

ComponentAddress.propTypes = {
  title: PropTypes.string,
  onPressUp: PropTypes.func,
  onPressDown: PropTypes.func,
  address: PropTypes.string,
  privateKey: PropTypes.string,
  onValueChange: PropTypes.func,
  value: PropTypes.any,
  derivePath: PropTypes.string,
  balance: PropTypes.number,
  ticker: PropTypes.string,
  wholeNumbers: PropTypes.bool,
  flashMessage: PropTypes.func,
  simpleMode: PropTypes.bool,
  privateAddress: PropTypes.bool,
  disableIncrementor: PropTypes.bool,
  date: PropTypes.any,
  bobs: PropTypes.number,
};

export default ComponentAddress;

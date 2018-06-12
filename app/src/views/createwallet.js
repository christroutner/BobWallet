import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ActionsNav from '../actions/nav';
import ActionsClient from '../actions/client';
import { Text, TextB } from '../components/text';
import TextInput from '../components/textinput';
import Button from '../components/button';
import ComponentBackground from '../components/background';
import { colors } from '../styles';
import { View } from 'react-native';

class CreateWallet extends Component {
  constructor() {
    super();

    this.state = {
      aliceSeed: '',
      bobSeed: '',
      nextSelected: false,
      flash: null,
    };
  }
  render() {
    const { aliceSeed, bobSeed, nextSelected, flash } = this.state;
    const invalidWallets = !(
      ActionsClient.isValidSeed(aliceSeed) &&
      (ActionsClient.isValidSeed(bobSeed) ||
        ActionsClient.isValidXPub(bobSeed) ||
        !ActionsClient.isInvalid(bobSeed))
    );
    return (
      <View
        style={{
          flex: 1,
          // alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ComponentBackground />
        {/* <TextB style={{ fontSize: 24, marginBottom: 20 }}>Create Wallet</TextB> */}
        <Text style={{ alignSelf: 'center', fontSize: 20 }}>Public Wallet</Text>
        <Text style={{ alignSelf: 'center', fontSize: 14, color: colors.gray }}>
          12 - 24 words
        </Text>
        <View
          style={{
            marginLeft: 16,
            marginRight: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextInput
            style={{ flex: 1 }}
            value={aliceSeed}
            onChangeText={aliceSeed =>
              this.setState({ nextSelected: false, flash: null, aliceSeed })
            }
          />
          <Button
            text="Generate"
            style={{ margin: 0 }}
            color={colors.darkgray}
            onPress={() =>
              this.setState({
                nextSelected: false,
                flash: null,
                aliceSeed: ActionsClient.newMnemonic(),
              })
            }
          />
        </View>
        <View style={{ height: 20 }} />

        <Text style={{ alignSelf: 'center', fontSize: 20 }}>
          Private Wallet
        </Text>
        <Text style={{ alignSelf: 'center', fontSize: 14, color: colors.gray }}>
          Master Public Key or 12 - 24 words
        </Text>
        <View
          style={{
            marginLeft: 16,
            marginRight: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextInput
            style={{ flex: 1 }}
            value={bobSeed}
            onChangeText={bobSeed =>
              this.setState({ nextSelected: false, flash: null, bobSeed })
            }
          />
          <Button
            text="Generate"
            style={{ margin: 0 }}
            color={colors.darkgray}
            onPress={() =>
              this.setState({
                nextSelected: false,
                flash: null,
                bobSeed: ActionsClient.newMnemonic(),
              })
            }
          />
        </View>

        <View style={{ alignSelf: 'center', flexDirection: 'row' }}>
          <Button
            style={{ width: 140 }}
            text="Back"
            onPress={() => ActionsNav.goWelcome()}
          />
          <Button
            color={invalidWallets ? colors.darkgray : colors.green}
            style={{ width: 140 }}
            // disabled={
            //   !(
            //     ActionsClient.isValidSeed(aliceSeed) &&
            //     (!bobSeed ||
            //       (ActionsClient.isValidSeed(bobSeed) ||
            //         ActionsClient.isValidXPub(bobSeed) ||
            //         !ActionsClient.isInvalid(bobSeed)))
            //   )
            // }
            // disabled={
            //   !(
            //     ActionsClient.isValidSeed(aliceSeed) &&
            //     (ActionsClient.isValidSeed(bobSeed) ||
            //       ActionsClient.isValidXPub(bobSeed) ||
            //       !ActionsClient.isInvalid(bobSeed))
            //   )
            // }
            text={!nextSelected ? 'Next' : 'Download Backup'}
            onPress={() => {
              if (invalidWallets) {
                this.setState({
                  flash: 'Please enter valid Wallets.',
                });
              } else {
                if (!nextSelected) {
                  this.setState({
                    nextSelected: true,
                  });
                } else {
                  ActionsNav.goPro({ aliceSeed, bobSeed });
                }
              }
            }}
          />
        </View>
        <TextB style={{ alignSelf: 'center', margin: 6, color: colors.green }}>
          {' '}
          {flash}{' '}
        </TextB>

        <Text
          style={{
            alignSelf: 'center',
            marginLeft: 20,
            marginRight: 20,
            marginTop: 50,
            color: colors.gray,
          }}
        >
          Note: You will be sending Bitcoin to your Public Wallet and Bob will
          securely move them to your Private Wallet.
        </Text>
        <Text
          style={{
            alignSelf: 'center',
            marginLeft: 20,
            marginRight: 20,
            color: colors.lightgray,
          }}
        >
          Make sure you backup both wallets!
        </Text>
      </View>
    );
  }
}

export default observer(CreateWallet);

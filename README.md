# Welcome to Bob Wallet

Note: This software is in Beta and should only be used on Testnet until thoroughly tested!

## What is Bob Wallet?

Bob Wallet was created to help preserve Bitcoin's fungibility. Today it is easy to trace Bitcoin transactions from address to address by simply using any public Block Explorer. Bob Wallet helps fix this.

To start, you will create a Bob Wallet and deposit Bitcoin to your Public address. Bob Wallet will automatically move your Bitcoin from your Public to your Private Wallet. This transfer happens by joining together all other Bob Wallet users in order to create a single transaction called a CoinJoin. Your Bitcoin can not be stolen since only you own and control your wallet keys and [no one can determine your Private Wallet addresses](https://github.com/bobwallet/bobwallet/blob/master/docs/shufflelink.md). Let's help keep Bitcoin fungible!

## What Bob Wallet is not?

Bob Wallet is not a traditional Bitcoin wallet. You cannot use it to make a payment to someone else. Its only purpose right now is to move your Bitcoins from your Public Wallet to your Private Wallet securely without anyone knowing your Private Wallet addresses. You will have to use a separate Bitcoin wallet after your Bitcoin has been made Private in order to spend them. Ideally, use a full-node for your Private Wallet because 3rd-party balance queries can de-anonymize you.

## How to get started

1.  Go to: [https://bobwallet.github.io](https://bobwallet.github.io) OR [download Bob Wallet](https://github.com/BobWallet/BobWallet/archive/master.zip) and drag and drop `bobwallet.html` into your browser
2.  Click "Start" to create a new Bob Wallet
3.  Deposit Bitcoin into your Public Wallet address
4.  Bob Wallet will automatically enter you into CoinJoin rounds with every other Bob Wallet user
5.  A successful round will send a portion of your Public Bitcoin into your Private Wallet
6.  Bob Wallet will automatically add you into following rounds until all of your Public Bitcoin is moved to your Private Wallet

There is also a [User Guide with screenshots](https://github.com/BobWallet/BobWallet/blob/master/docs/user_guide/bobwallet_user_guide.md) located in the Docs folder of this repo.

## Voting Booth (Donations)

BTC: [15fMSRKT8pP1XMfc6YM7ckH87uc9YaRcaa](bitcoin:15fMSRKT8pP1XMfc6YM7ckH87uc9YaRcaa)

BCH: [1BWTtWVk3U1JvgcV3mwDEaQDMpSpBzXLw9](bitcoincash:1BWTtWVk3U1JvgcV3mwDEaQDMpSpBzXLw9)

Which coin should we focus on first? Vote with your favorite currency!

## Advantages

- [You don't need to trust anyone with your Bitcoin](https://github.com/bobwallet/bobwallet/blob/master/docs/shufflelink.md)
- No extra fees except for the standard Bitcoin transaction miner fee per round
- Rounds are quick (Between 15 to 60 seconds per round)
- Can support many participants. More users, more privacy
- No need to download, compile, or configure a complex program. It's as simple as visiting a website. This also makes it fully cross platform on ANY device

## Questions

- What is Bob Wallet?
  - Bob Wallet securely connects you with many other users to create a single transaction called a CoinJoin. Bob Wallet will create you two wallets: Public and Private. You will deposit Bitcoin to the Public Wallet and Bob Wallet will automatically send it to your Private Wallet. By joining a combined transaction with as many people as possible it ensures the privacy of your Bitcoins in your Private Wallet. Not even the server can figure out which Private Wallet address is yours.

* Why is Bob Wallet needed?
  - To help preserve Bitcoin fungibility. Every Bitcoin transaction can be easily traced and balances determined. Not everyone needs to know how much Bitcoin you own by just visiting a Block Explorer.

- How is Bob Wallet trustless?
  - It uses a combination of CoinJoin and CoinShuffle. You never hand over control to anyone and your Bitcoin can not be stolen. You can read more about the [techniques here](https://github.com/bobwallet/bobwallet/blob/master/docs/shufflelink.md).

* Are there any extra fees to use Bob Wallet?
  - No. The only fees you pay are the standard Bitcoin miner fee for each transaction.

- Why do I have to wait so long for Bitcoin to show up in my Private Wallet?
  - Every successful round will deposit a specific amount of Bitcoin into your Private Wallet. For beta testing purposes the output amount is really low so that more rounds can be run while using less Testnet Bitcoin. This will be changed later.

* Why did we build Bob Wallet?
  - For your donations and to compete for [this bounty](https://bitcointalk.org/index.php?topic=279249.msg2983911#msg2983911). Help support us if you like Bob Wallet!

- How can I help?
  - Help by using and contributing to Bob Wallet. The more people we have using it the faster we can find and fix bugs and improve the experience. Once we are sure Bob Wallet is safe and secure we can move it to the Mainnet. Donations are also much appreciated! Let's help keep Bitcoin fungible!

## Testing Plan

[Listed here](https://github.com/bobwallet/bobwallet/blob/master/docs/testing.md)

## Future Features

[Listed here](https://github.com/bobwallet/bobwallet/blob/master/docs/future.md)

## Developers Corner

##### Build Web App

```
npm run build
```

##### Run Tests

```
npm run test
```

##### Run Dev Mode

```
npm run server

# Open new terminal tab

npm run dev
```

### Paranoid? Build Bob from the Bottom Up

1.  Clone Bob Wallet `git clone https://github.com/bobwallet/bobwallet.git` and then `cd ./bobwallet`
2.  Build bcoin, bcash and web app from source `npm run build` (or `npm run build-local` if you do not have docker)
3.  Copy built web app unto USB Drive `cp ./bobwallet.html ...`
4.  Run Tails
5.  Copy `bobwallet.html` from your USB Drive into your `Tor Persistent` folder
6.  Connect to the internet and open `bobwallet.html` in the Tor Browser
7.  Start using Bob Wallet!

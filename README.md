# Welcome to Bob Wallet

Note: This software is in Beta and should only be used on Testnet until thoroughly tested!

## How to get started

1.  Go to: [https://bobwallet.github.io](https://bobwallet.github.io)
2.  Click "Start BTC" or "Start BCH"
3.  Deposit bitcoin
4.  Bob Wallet will automatically create CoinJoin transactions with every other Bob Wallet user available
5.  Once at least one successful round has complete you can now spend!

## What is Bob Wallet?

Bob Wallet was created to help preserve bitcoin's fungibility. Today it is easy to trace bitcoin transactions from address to address by simply using any public Block Explorer. Bob Wallet helps fix this.

Bob Wallet automatically [CoinJoins](https://en.wikipedia.org/wiki/CoinJoin) your bitcoin with other Bob Wallet users breaking the on-chain transaction link. Your bitcoin can not be stolen since only you own and control your wallet keys and [no one can determine your private addresses](https://github.com/bobwallet/bobwallet/blob/master/docs/shufflelink.md) not even the server. Let's help keep bitcoin fungible!

## Advantages

- [You don't need to trust anyone with your bitcoin](https://github.com/bobwallet/bobwallet/blob/master/docs/shufflelink.md)
- No extra fees except for the standard bitcoin transaction miner fee per round
- Rounds are quick (Between 15 to 60 seconds per round)
- Can support many participants. More users, more privacy
- No need to download, compile, or configure a complex program. It's as simple as visiting a website. This also makes it fully cross platform on ANY device with a web browser

## Questions

- What is Bob Wallet?

  - Bob Wallet securely connects you with many other users to create a single transaction called a CoinJoin. Bob Wallet will create you two wallets: Public and Private. You will deposit bitcoin to the Public Wallet and Bob Wallet will automatically send it to your Private Wallet. By joining a combined transaction with as many people as possible it ensures the privacy of your bitcoins in your Private Wallet. Not even the server can figure out which Private Wallet address is yours.

- Why is Bob Wallet needed?

  - To help preserve bitcoin fungibility. Every bitcoin transaction can be easily traced and balances determined. Not everyone needs to know how much bitcoin you own by just visiting a Block Explorer.

- How is Bob Wallet trustless?

  - It uses a combination of CoinJoin and CoinShuffle. You never hand over control to anyone and your bitcoin can not be stolen. You can read more about the [techniques here](https://github.com/bobwallet/bobwallet/blob/master/docs/shufflelink.md).

- Are there any extra fees to use Bob Wallet?

  - No. The only fees you pay are the standard bitcoin miner fee for each transaction.

- Why did we build Bob Wallet?

  - For your donations and to compete for [this bounty](https://bitcointalk.org/index.php?topic=279249.msg2983911#msg2983911). Help support us if you like Bob Wallet!

- How can I help?
  - Help by using and contributing to Bob Wallet. The more people we have using it the faster we can find and fix bugs and improve the experience. Once we are sure Bob Wallet is safe and secure we can move it to the Mainnet. Donations are also much appreciated!

## Developers

##### Build Stand-alone Web App

```
git clone https://github.com/bobwallet/bobwallet.git

cd ./bobwallet

npm run build

# will produce file ./bobwallet.html
```

##### Run Server (linux)

```
# Note: this may take a while (~40 minutes) for the script to finish
# ~12GB disk space needed for both tBTC and tBCH

git clone https://github.com/bobwallet/bobwallet.git /root/bobwallet

cd /root/bobwallet

sh ./scripts/start_tbtc_tbch

# btc only: $ sh ./scripts/start_tbtc
# bch only: $ sh ./scripts/start_tbch
```

##### Run Tests

```
npm run test
```

##### Run Dev Mode

```
npm run babel

npm run server

# Open new terminal tab

npm run dev
```

### Paranoid? Build Bob from the Bottom Up

1.  Clone Bob Wallet `git clone https://github.com/bobwallet/bobwallet.git` and then `cd ./bobwallet`
2.  Build bcoin, bcash and web app from source `npm run build`
3.  Copy built web app unto USB Drive `cp ./bobwallet.html ...`
4.  Run Tails
5.  Copy `bobwallet.html` from your USB Drive into your `Tor Persistent` folder
6.  Connect to the internet and open `bobwallet.html` in the Tor Browser
7.  Start using Bob Wallet!

## Donations

BTC: [15fMSRKT8pP1XMfc6YM7ckH87uc9YaRcaa](bitcoin:15fMSRKT8pP1XMfc6YM7ckH87uc9YaRcaa)

BCH: [1BWTtWVk3U1JvgcV3mwDEaQDMpSpBzXLw9](bitcoincash:1BWTtWVk3U1JvgcV3mwDEaQDMpSpBzXLw9)

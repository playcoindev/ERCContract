# PlayCoin ERC contract

## Introduction

PlayCoin is a new cryptocurrency to be used within the GameHub ecosystem helping both game developers and online influencers to earn more profits and create a more fair and competitive environment.

GameHub is an online gaming ecosystem that aims to disrupt traditional online gaming monopolies by applying blockchain technology to streamline mobile game downloads and digital marketing to eliminate middlemen. 

This repository provides the PlayCoin contract.

## The Contract

This contract is developed using the truffle and zeppelin-solidity. So basic development can be done using the truffle with truffle embedded blockchain network, ganache, or geth.

### PlayCoin Contract

PlayCoin is a type of ERC20 token with the symbol "PLY". It inherits all the functionality of ERC20 standard token. The maximum supply is fixed to 1,000,000,000 PLY(One Billion PLY). And it has 9 decimal digits. PlayCoin is not mintable and initially all PLY tokens will be stored into safe vault to keep the remaining token safe.

The source code is `contracts/PlayCoin.sol`.

#### Reserve

PlayCoin introduces the concepts of reserve, which can be used if you want to assign some amount of PlayCoins to an address but want for that address not to spend the PlayCoins assigned. For example, the gamehub can assign some PlayCoins for some the the stakeholders with some restriction on excercising their right to spend the PlayCoins. Reserved PlayCoin will be included in the balance of the address, but that address cannot spend the PlayCoin until the admin(which is a multisig vault to protect the privilleged operation) to reduce or remove the reservation.

## Tests

There are a number of basic senario tests for PlayCoin under the `test` directory.

## Questions

We will be very happy to hear from you. Please create an issue on the contracts github repository(https://github.com/PlayCoindev/ERCContract/issues), we will appreciate you very deeply.

# Revision History

## Version 1.0.0(Initial) 2018-9-3
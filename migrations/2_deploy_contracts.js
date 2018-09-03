var PlayCoin = artifacts.require("./constracts/PlayCoin.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(PlayCoin, 'PLY', 'PlayCoin', accounts[0], accounts[1], accounts[2]).then( () => {
    console.log(`PlayCoin deployed: address = ${PlayCoin.address}`);
  });
};

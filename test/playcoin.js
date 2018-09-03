"use strict";

var PlayCoin = artifacts.require("./PlayCoin.sol");

/**
 * PlayCoin contract learning test
 *   deploy in before, and no deploy between it()
 */
contract("PlayCoin", (accounts) => {
  let owner = accounts[0];
  let admin = accounts[1];
  let vault = accounts[2];

  const NOOFTOKENS = 1000000000; // 1B tokens

  const orgOwner = accounts[0];
  const orgAdmin = accounts[1];
  const orgVault = accounts[2];

  const user1 = accounts[3];
  const user2 = accounts[4];
  const user3 = accounts[5];

  const new1 = accounts[6];
  const new2 = accounts[7];
  const new3 = accounts[8];

  let NoOfTokens, OnePlayCoin;
  let coin;

  before(async () => {
    coin = await PlayCoin.deployed();
    NoOfTokens = Number(await coin.getMaxNumberOfTokens());
    OnePlayCoin = Number(await coin.getOnePlayCoin());
  });

  beforeEach(async () => {
    // reset users' balances and reserve
    if(orgOwner !== owner) {
      await coin.setOwner(orgOwner, {from: vault});
      owner = orgOwner;
    }
    if(orgAdmin !== admin) {
      await coin.setAdmin(orgAdmin, {from: owner});
      admin = orgAdmin;
    }
    if(orgVault !== vault) {
      await coin.setVault(orgVault, {from: owner});
      vault = orgVault;
    }
    await coin.setReserve(user1, 0, {from: admin});
    await coin.transfer(vault, await coin.balanceOf(user1), {from: user1});
    await coin.setReserve(user2, 0, {from: admin});
    await coin.transfer(vault, await coin.balanceOf(user2), {from: user2});
    await coin.setReserve(user3, 0, {from: admin});
    await coin.transfer(vault, await coin.balanceOf(user3), {from: user3});
  });

  it("coin initial values", async () => {
    // basic token functions
    assert.equal(await coin.symbol(), "PLY");
    assert.equal(await coin.name(), "PlayCoin");
    assert.equal(await coin.decimals(), 9);
    assert.equal(await coin.totalSupply(), NOOFTOKENS * OnePlayCoin);  // 1B * 9 decimals
    assert.equal(await coin.totalSupply(), NoOfTokens * OnePlayCoin);
    assert.equal(await coin.balanceOf(owner), 0);  // 0
    assert.equal(await coin.balanceOf(admin), 0);  // 0
    assert.equal(await coin.balanceOf(vault), NoOfTokens * OnePlayCoin);  // 2B * 9 decimals

    // playcoin functions
    assert.equal(await coin.getOwner(), owner);
    assert.equal(await coin.getAdmin(), admin);
    assert.equal(await coin.getVault(), vault);
  });

  it("token distribution", async () => {
    // initial balances
    assert.equal(await coin.balanceOf(owner), 0);
    assert.equal(await coin.balanceOf(admin), 0);
    assert.equal(await coin.balanceOf(vault), NoOfTokens * OnePlayCoin);  // 2B * 9 decimals

    // transfer 1 token from vault to admin
    await coin.transfer(admin, OnePlayCoin * 1, {from: vault});
    assert.equal(await coin.balanceOf(admin), OnePlayCoin * 1);

    // transfer 0.5 token from admin to owner
    await coin.transfer(owner, OnePlayCoin * 0.5, {from: admin});
    assert.equal(await coin.balanceOf(owner), OnePlayCoin * 0.5);
    assert.equal(await coin.balanceOf(admin), OnePlayCoin * 0.5);
    assert.equal(await coin.balanceOf(vault), (NoOfTokens-1) * OnePlayCoin);
  });

  it("marginal transfers", async () => {
    // initial balances
    assert.equal(Number(await coin.balanceOf(user1)), 0);
    assert.equal(Number(await coin.balanceOf(user2)), 0);
    assert(Number(await coin.balanceOf(vault)) > 0);

    // transfer 1 token from user1(balance 0) to user2
    try {
      await coin.transfer(user2, OnePlayCoin * 1, {from: user1});
      assert.fail();
    }
    catch(exception) { assert.isTrue(exception.message.includes("revert")); }

    // transfer 0 token from user1(balance 0) to user2
    await coin.transfer(user2, OnePlayCoin * 0, {from: user1});

    // transfer 0 token from vault(balance > 0) to user1
    await coin.transfer(user1, OnePlayCoin * 1, {from: vault});

    // transfer whole balance to other
    await coin.transfer(user1, OnePlayCoin * 1, {from: vault});
    assert(Number(await coin.balanceOf(user1)), OnePlayCoin * 1);
    await coin.transfer(user2, OnePlayCoin * 1, {from: user1});
    assert(Number(await coin.balanceOf(user1)), OnePlayCoin * 0);
    assert(Number(await coin.balanceOf(user2)), OnePlayCoin * 1);
  });

  /****************************************************************************/
  /* reserve                                                                  */
  /****************************************************************************/
  it("only admin can set reserve", async () => {
    await coin.setReserve(user1, OnePlayCoin, {from: admin});

    try {
      await coin.setReserve(user1, 0, {from: vault});
      assert.fail();
    }
    catch(exception) { assert.isTrue(exception.message.includes("revert")); }

    try {
        await coin.setReserve(user1, 0, {from: user1});
        assert.fail();
    }
    catch(exception) { assert.isTrue(exception.message.includes("revert")); }

    try {
      await coin.setReserve(user1, 0, {from: owner});
      assert.fail();
    }
    catch(exception) { assert.isTrue(exception.message.includes("revert")); }
  });

  it("reserve and reserveOf", async () => {
    await coin.setReserve(user1, 0, { from: admin }); // set 0 reserve to 0 reserve user
    await coin.transfer(user1, OnePlayCoin * 10, { from: vault });
    await coin.setReserve(user1, OnePlayCoin * 5, { from: admin });
    assert.equal(await coin.reserveOf(user1), OnePlayCoin * 5);
  });
  
  it("transfer after setting reservation", async () => {    
    await coin.transfer(user1, OnePlayCoin * 10, { from: vault });
    await coin.setReserve(user1, OnePlayCoin * 5, { from: admin });
    await coin.transfer(user2, OnePlayCoin * 1, {from: user1});        // keeping reserved amount
    assert.equal(Number(await coin.balanceOf(user1)), OnePlayCoin * 9);
    coin.transfer(user2, OnePlayCoin * 3, {from: user1});        // keeping reserved amount
    assert.equal(Number(await coin.balanceOf(user1)), OnePlayCoin * 6);

    try {
      let tx = await coin.transfer(user2, OnePlayCoin * 2, {from: user1}); // violating reserved amount
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });

  /****************************************************************************/
  /* setAdmin, setOwner, setVault                                             */
  /****************************************************************************/
  it("setAdmin", async () => {
    await coin.setAdmin(new1, {from: owner});
    admin = new1;
    assert.equal(new1, await coin.getAdmin({from: owner}));

    await coin.setAdmin(new2, {from: vault});
    admin = new2;
    assert.equal(new2, await coin.getAdmin({from: vault}));

    try {
      await coin.setAdmin(new3, {from: admin});
      assert.fail();    // only owner or vault can set admin
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });

  it("setOwner", async () => {
    // only vault can set owner

    try {
      await coin.setOwner(new2, {from: owner});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    await coin.setOwner(new3, {from: vault});
    owner = new3;
    assert.equal(new3, await coin.getOwner({from: vault}));

    try {
      await coin.setOwner(new1, {from: admin});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });

  it("setVault", async () => {
    // only owner can set vault

    assert.equal(0, await coin.balanceOf(new3));
    let bal = Number(await coin.balanceOf(vault));
    assert.isTrue(bal > 0);

    await coin.setVault(new3, {from: owner});
    let oldVault = vault;
    vault = new3;
    assert.equal(new3, await coin.getVault({from: owner}));

    // check transfer
    const vaultBalance = await coin.balanceOf(vault);
    const oldVaultBalance = await coin.balanceOf(oldVault);
    assert.equal(bal, vaultBalance);
    assert.equal(0, oldVaultBalance);

    try {
      await coin.setVault(new1, {from: vault});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    try {
      await coin.setVault(new2, {from: admin});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });
});

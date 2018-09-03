var PlayCoin = artifacts.require("./PlayCoin.sol");

/**
 * PlayCoin contract tests 2
 */
contract('PlayCoin2', function(accounts) {
  let coin, OnePlayCoin, NoOfTokens;  // 1.0000000000 playcoin (10 decimals)

  const tokenBalanceOf = async addr => Number(await coin.balanceOf(addr));
  const tokenReserveOf = async addr => Number(await coin.reserveOf(addr));

  const owner = accounts[0];
  const admin = accounts[1];
  const vault = accounts[2];

  const user1 = accounts[3];
  const user2 = accounts[4];
  const user3 = accounts[5];
  const user4 = accounts[6];
  const user5 = accounts[7];
  
  before(async () => {
    coin = await PlayCoin.deployed();
    NoOfTokens = Number(await coin.getMaxNumberOfTokens());
    OnePlayCoin = Number(await coin.getOnePlayCoin());
  });

  const clearUser = async user => {
    await coin.setReserve(user, 0, {from: admin});
    await coin.transfer(vault, await tokenBalanceOf(user), {from: user});
  };

  beforeEach(async () => {
    await clearUser(user1);
    await clearUser(user2);
    await clearUser(user3);
    await clearUser(user4);
    await clearUser(user5);
  });

  it("only admin can recall", async () => {
    assert.equal(await tokenBalanceOf(user1), 0);
    await coin.transfer(user1, OnePlayCoin, {from: vault});
    await coin.setReserve(user1, OnePlayCoin, {from: admin});
    assert.equal(await tokenBalanceOf(user1), OnePlayCoin);
    assert.equal(await tokenReserveOf(user1), OnePlayCoin);

    try {
      await coin.recall(user1, OnePlayCoin, {from: user1});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    try {
      await coin.recall(user1, OnePlayCoin, {from: owner});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    try {
      await coin.recall(user1, OnePlayCoin, {from: vault});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    await coin.recall(user1, OnePlayCoin, {from: admin});
  });

  it("recall fails", async () => {
    assert.equal(await tokenBalanceOf(user2), 0);
    coin.transfer(user2, OnePlayCoin, {from: vault});
    assert.equal(await tokenBalanceOf(user2), OnePlayCoin);
    assert.equal(await tokenReserveOf(user2), 0);

    try {
      // require(currentReserve >= _amount);
      await coin.recall(user2, OnePlayCoin, {from: admin});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    coin.setReserve(user2, OnePlayCoin * 2, {from: admin});
    try {
      // require(currentBalance >= _amount);
      await coin.recall(user2, OnePlayCoin * 1.1, {from: admin});
      assert.fail();
    }
    catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });

  it("after recall all coin", async () => {
    assert.equal(await tokenBalanceOf(user3), 0);
    coin.transfer(user3, OnePlayCoin, {from: vault});
    coin.setReserve(user3, OnePlayCoin, {from: admin});
    assert.equal(await tokenBalanceOf(user3), OnePlayCoin);
    assert.equal(await tokenReserveOf(user3), OnePlayCoin);

    const vaultBal = Number(await tokenBalanceOf(vault));

    coin.recall(user3, OnePlayCoin, {from: admin});

    assert.equal(await tokenBalanceOf(user3), 0);
    assert.equal(await tokenReserveOf(user3), 0);

    assert.equal(await tokenBalanceOf(vault), vaultBal + OnePlayCoin);
  });

  it("after recall half", async () => {
    assert.equal(await tokenBalanceOf(user4), 0);
    coin.transfer(user4, OnePlayCoin, {from: vault});
    coin.setReserve(user4, OnePlayCoin, {from: admin});
    assert.equal(await tokenBalanceOf(user4), OnePlayCoin);
    assert.equal(await tokenReserveOf(user4), OnePlayCoin);

    const vaultBal = Number(await tokenBalanceOf(vault));

    coin.recall(user4, OnePlayCoin / 2, {from: admin});

    assert.equal(await tokenBalanceOf(user4), OnePlayCoin / 2);
    assert.equal(await tokenReserveOf(user4), OnePlayCoin / 2);

    assert.equal(await tokenBalanceOf(vault), vaultBal + (OnePlayCoin /2));
  });

  it("reserve and then approve", async() => {
    assert.equal(await tokenBalanceOf(user4), 0);

    // send 2 PLY to user4 and set 1 PLY reserve
    coin.transfer(user4, OnePlayCoin * 2, {from: vault});
    coin.setReserve(user4, OnePlayCoin, {from: admin});
    assert.equal(await tokenBalanceOf(user4), OnePlayCoin*2);
    assert.equal(await tokenReserveOf(user4), OnePlayCoin);

    // approve 2 PLY to user5
    await coin.approve(user5, OnePlayCoin*2, {from:user4});
    assert.equal(Number(await coin.allowance(user4, user5)), OnePlayCoin*2);

    // transfer 2 PLY from user4 to user5 SHOULD NOT BE POSSIBLE
    try {
      await coin.transferFrom(user4, user5, OnePlayCoin * 2, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    // transfer 1 PLY from user4 to user5 SHOULD BE POSSIBLE
    await coin.transferFrom(user4, user5, OnePlayCoin * 1, {from: user5});
    assert.equal(await tokenBalanceOf(user4), OnePlayCoin*1);
    assert.equal(await tokenReserveOf(user4), OnePlayCoin*1); // reserve will not change
    assert.equal(Number(await coin.allowance(user4, user5)), OnePlayCoin*1); // allowance will be reduced
    assert.equal(await tokenBalanceOf(user5), OnePlayCoin*1);
    assert.equal(await tokenReserveOf(user5), OnePlayCoin*0);

    // transfer .5 PLY from user4 to user5 SHOULD NOT BE POSSIBLE if balance <= reserve
    try {
      await coin.transferFrom(user4, user5, OnePlayCoin * 0.5, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  })
});

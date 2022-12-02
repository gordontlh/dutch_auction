const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");





describe("Auction contract", function () {

  async function deployAuctionFixture() {
    const Auction = await ethers.getContractFactory("Auction");
    const [owner, addr1, addr2] = await ethers.getSigners();
    const provider = ethers.provider;
    const now = Math.floor(Date.now() / 1000)
    const auction = await Auction.deploy("token", "tkn", 10,ethers.utils.parseEther("10"), ethers.utils.parseEther("1"), ethers.utils.parseEther("2"), now);
    const auction2 = await Auction.deploy("token2", "tkn2", 10,ethers.utils.parseEther("10"), ethers.utils.parseEther("3"), ethers.utils.parseEther("4"), now);
    const auction3 = await Auction.deploy("token3", "tkn", 10,ethers.utils.parseEther("10"), ethers.utils.parseEther("1"), ethers.utils.parseEther("2"), now + 20*60);
    const auction4 = await Auction.deploy("token3", "tkn", 10,ethers.utils.parseEther("10"), ethers.utils.parseEther("4"), ethers.utils.parseEther("3"), now );
    await auction.deployed();
    await auction2.deployed();
    await auction3.deployed();
    await auction4.deployed();
    // Fixtures can return anything you consider useful for your tests
    return { Auction, auction, auction2, auction3, auction4 , owner, provider, addr1, addr2 };
  }
  it("Create token upon instantiation", async function () {
    const { auction, owner } = await loadFixture(deployAuctionFixture)
    const tokens = await auction.getTokenSupply();
    const name = await auction.getTokenName();

    expect(name).to.equal("token");
    expect(tokens).to.equal(10000000000000000000n);
  });

  it("Check for flow of auction", async function () {
    //const [owner] = await ethers.getSigners();

    // const Auction = await ethers.getContractFactory("Auction");
    // const auction = await Auction.deploy("token", "tkn", 1000);
    //const hardhatToken = await Token.deploy("token", "tkn", 1000);
    const { auction, owner } = await loadFixture(deployAuctionFixture)
    const state = await auction.getState();
    const ownerC = await auction.getOwner();
    expect(ownerC).to.equal(owner.address);
    expect(state).to.equal(0);
    //const ownerBalance = await hardhatToken.balanceOf(owner.address);
    //expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Allow for bids", async function () {
    const { auction, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    await auction.startBid()
    const state = await auction.getState();
    expect(state).to.equal(1);
    const cost1 = ethers.utils.parseEther("10");
    const cost2 = ethers.utils.parseEther("10");
    const cost3 = ethers.utils.parseEther("10");
    await auction.placeBid(1, { value: cost1 });
    await auction.connect(addr1).placeBid(1, { value: cost2 })
    await auction.connect(addr2).placeBid(1, { value: cost3 })

  });

  it("Allow for bidding to start only at designated time", async function () {
    const { auction3, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    //start after 20mins
    await expect(auction3.startBid()).to.be.revertedWith('Bid can only start after start time');
    const state1 = await auction3.getState();
    expect(state1).to.equal(0);
    const time = 20 * 60
     // Fast forward time
     await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction3.startBid();
    const state = await auction3.getState();
    expect(state).to.equal(1);
    const cost1 = ethers.utils.parseEther("10");
    const cost2 = ethers.utils.parseEther("10");
    const cost3 = ethers.utils.parseEther("10");
    await auction3.placeBid(1, { value: cost1 });
    await auction3.connect(addr1).placeBid(1, { value: cost2 })
    await auction3.connect(addr2).placeBid(1, { value: cost3 })

  });

  it("Auction should close after 20mins", async function () {
    const { auction, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    const time = 20 * 60
    await auction.startBid()
    const state = await auction.getState();
    const n1 = ethers.BigNumber.from(10000000000000000000n)
    await auction.placeBid(1, { value: n1 });
    expect(state).to.equal(1);

    // Fast forward time
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });

    //Problem now is we need to call a function to trigger a
    await auction.placeBid(1, { value: n1 });
    const state2 = await auction.getState();
    expect(state2).to.equal(2);
    //await auction.placeBid({value:cost1}); // This SHOULD NOT work

  })

  it("Auction should experience price dropping at expected rate and shouldnt price should not go below lowest possible bid", async function () {
    const { auction4, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    const time = 1 * 60
    await auction4.startBid()
    const state = await auction4.getState();
    const price = await auction4.getPrice();
    expect(state).to.equal(1);
    const n1 = ethers.BigNumber.from(10000000000000000000n)
    expect(price).to.equal(n1);
    await auction4.placeBid(1, { value: n1 });

    // Fast forward time
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });

    await auction4.updatePrice();
    const price1 = await auction4.getPrice();
    expect(price1).to.equal(ethers.BigNumber.from(6000000000000000000n));

    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });

    await auction4.updatePrice();
    const price2 = await auction4.getPrice();
    expect(price2).to.equal(ethers.BigNumber.from(3000000000000000000n));

    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });

    await auction4.updatePrice();
    const price3 = await auction4.getPrice();
    expect(price3).to.equal(ethers.BigNumber.from(3000000000000000000n));

    //await auction.placeBid(1);

    //await auction.placeBid({value:cost1}); // This SHOULD NOT work

  })

  it("Should allow withdrawal once bidding phase over", async function () {
    //Should call all the transitions 
    //Final transition; calculation should be done 
    //Those that bid higher than min final bid; get refund 
    //Those that bid lower
    const { auction, provider, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    await auction.startBid()
    let cost1 = ethers.utils.parseEther("60");
    await auction.placeBid(6, { value: cost1 });


    // Fast forward time and update price
    let time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction.updatePrice();
    let state1 = await auction.getState();
    expect(state1).to.equal(1);


    //Fast forward time and update price
    time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction.updatePrice();
    state1 = await auction.getState();
    expect(state1).to.equal(1);

    //Fast forward time and update price
    time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction.updatePrice();
    state1 = await auction.getState();
    expect(state1).to.equal(1);

    //Fast forward time and update price
    time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction.updatePrice();
    state1 = await auction.getState();
    expect(state1).to.equal(2);

    //Fast forward time and update price
    time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    state1 = await auction.getState();
    expect(state1).to.equal(2);



    // //Withdraw
    // const balance1 = await provider.getBalance(owner.address)
    // const balance2 = await provider.getBalance(addr1.address)
    // const balance3 = await provider.getBalance(addr2.address)


    await auction.connect(owner).withdraw();

    const tokenAddress = await auction.getToken();
    const balance1a = await auction.getTokenBalance();
    expect(balance1a == ethers.utils.parseEther("10"));

  })

  it("Should exhibit FCFS behaviour when it comes to settling bids", async function () {
    //Should call all the transitions 
    //Final transition; calculation should be done 
    //Those that bid higher than min final bid; get refund 
    //Those that bid lower
    const { auction, auction2, provider, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    await auction2.startBid()
    let cost1 = ethers.utils.parseEther("40");
    await auction2.placeBid(4, { value: cost1 });


    // Fast forward time and update price
    let time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();
    let state1 = await auction2.getState();
    expect(state1).to.equal(1);
    cost1 = ethers.utils.parseEther("21");
    await auction2.connect(addr1).placeBid(3, { value: cost1 });


    //Fast forward time and update price
    time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    state1 = await auction2.getState();
    let price = await auction2.getPrice();
    expect(price).to.equal(ethers.BigNumber.from(4000000000000000000n));
    expect(state1).to.equal(2);

    const contractBalance1 = await ethers.provider.getBalance(auction2.address);

    //Withdraw
    let balance1 = await provider.getBalance(owner.address)

    let balance2 = await provider.getBalance(addr1.address)
  

    //account for gas fees
    let txResp = await auction2.connect(owner).withdraw();
    txReceipt = await txResp.wait();
    withdrawGas = ethers.BigNumber.from(txReceipt.gasUsed);
    let txCost = withdrawGas.mul(txReceipt.effectiveGasPrice)
    

    let txResp2 = await auction2.connect(addr1).withdraw();
    txReceipt2 = await txResp2.wait();
    withdrawGas2 = ethers.BigNumber.from(txReceipt2.gasUsed);
    let txCost2 = withdrawGas2.mul(txReceipt2.effectiveGasPrice)
    
    await expect(auction2.connect(addr2).withdraw()).to.be.revertedWith('You do not possess any tokens or do not have any pending refunds');

    let balance1a = await auction2.connect(owner).getTokenBalance();
    let balance2a = await auction2.connect(addr1).getTokenBalance();

    let balance1b = await provider.getBalance(owner.address)
   
    let balance2b = await provider.getBalance(addr1.address)
  

    //compare token and ether balances
    const contractBalance2 = await ethers.provider.getBalance(auction2.address);
    expect(balance1a).to.equal(10000000000000000000n);
    expect(balance2a).to.equal(0);
    

    expect(balance1b).to.equal(balance1.sub(txCost));
    const cost = ethers.utils.parseEther("21");
    let balance2c = (balance2.sub(txCost2))
    balance2c = balance2c.add(cost);
    expect(balance2b).to.equal(balance2c)

  })

  it("Should exhibit FCFS behaviour when it comes to settling bids case 2", async function () {
    //Should call all the transitions 
    //Final transition; calculation should be done 
    //Those that bid higher than min final bid; get refund 
    //Those that bid lower
    const { auction, auction2, provider, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    await auction2.startBid()
    let cost1 = ethers.utils.parseEther("30");
    await auction2.placeBid(3, { value: cost1 });

    cost1 = ethers.utils.parseEther("20");
    await auction2.connect(addr1).placeBid(3, { value: cost1 });


    // Fast forward time and update price
    let time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();
    let state1 = await auction2.getState();
    expect(state1).to.equal(1);

    //Fast forward time and update price
    time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    state1 = await auction2.getState();
    let price = await auction2.getPrice();
    expect(price).to.equal(ethers.BigNumber.from(4000000000000000000n));
    expect(state1).to.equal(2);


    //Withdraw
    let balance1 = await provider.getBalance(owner.address)

    let balance2 = await provider.getBalance(addr1.address)
  

    //account for gas fees
    let txResp = await auction2.connect(owner).withdraw();
    txReceipt = await txResp.wait();
    withdrawGas = ethers.BigNumber.from(txReceipt.gasUsed);
    let txCost = withdrawGas.mul(txReceipt.effectiveGasPrice)

    let txResp2 = await auction2.connect(addr1).withdraw();
    txReceipt2 = await txResp2.wait();
    withdrawGas2 = ethers.BigNumber.from(txReceipt2.gasUsed);
    let txCost2 = withdrawGas2.mul(txReceipt2.effectiveGasPrice)

    //compare token balances
    let balance1a = await auction2.connect(owner).getTokenBalance();
    let balance2a = await auction2.connect(addr1).getTokenBalance();

    expect(balance1a).to.equal(7000000000000000000n);
    expect(balance2a).to.equal(3000000000000000000n);


    //compare ether balances
    let balance1b = await provider.getBalance(owner.address)
    let balance2b = await provider.getBalance(addr1.address)
    

    //expect(balance1b).to.equal(balance1.sub(txCost));
    const cost = ethers.utils.parseEther("8");
    let balance2c = (balance2.sub(txCost2))
    balance2c = balance2c.add(cost);
    expect(balance2b).to.equal(balance2c)

  })
  it("Should exhibit FCFS behaviour when it comes to settling bids case 3", async function () {
    //Should call all the transitions 
    //Final transition; calculation should be done 
    //Those that bid higher than min final bid; get refund 
    //Those that bid lower
    const { auction, auction2, provider, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    await auction2.startBid();
    let cost1 = ethers.utils.parseEther("20");
    await auction2.placeBid(2, { value: cost1 });


    // Fast forward time and update price
    let time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();
    let state1 = await auction2.getState();
    expect(state1).to.equal(1);
    cost1 = ethers.utils.parseEther("14");
    await auction2.connect(addr1).placeBid(2, { value: cost1 });
    await auction2.connect(owner).placeBid(2, { value: cost1 });

    //Fast forward time and update price
    time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    state1 = await auction2.getState();
    let price = await auction2.getPrice();
    expect(price).to.equal(ethers.BigNumber.from(4000000000000000000n));
    expect(state1).to.equal(2);


    //Withdraw
    let balance1 = await provider.getBalance(owner.address)

    let balance2 = await provider.getBalance(addr1.address)
  

    //account for gas fees
    let txResp = await auction2.connect(owner).withdraw();
    txReceipt = await txResp.wait();
    withdrawGas = ethers.BigNumber.from(txReceipt.gasUsed);
    let txCost = withdrawGas.mul(txReceipt.effectiveGasPrice)

    let txResp2 = await auction2.connect(addr1).withdraw();
    txReceipt2 = await txResp2.wait();
    withdrawGas2 = ethers.BigNumber.from(txReceipt2.gasUsed);
    let txCost2 = withdrawGas2.mul(txReceipt2.effectiveGasPrice)

    //compare token balances
    let balance1a = await auction2.connect(owner).getTokenBalance();
    let balance2a = await auction2.connect(addr1).getTokenBalance();

    expect(balance1a).to.equal(7000000000000000000n);
    expect(balance2a).to.equal(3000000000000000000n);


    //compare ether balances
    let balance1b = await provider.getBalance(owner.address)
    let balance2b = await provider.getBalance(addr1.address)
    

    //expect(balance1b).to.equal(balance1.sub(txCost));
    let refund = ethers.utils.parseEther("2");
    let balance2c = (balance2.sub(txCost2))
    balance2c = balance2c.add(refund);
    expect(balance2b).to.equal(balance2c)
    // refund = ethers.utils.parseEther("6");
    // let balance1c = (balance1.sub(txCost2))
    // balance1c = balance1c.add(refund);
    // expect(balance1b).to.equal(balance1c)

  })
  it("Should burn remaining supply case1: nobody bids", async function () {
    //Should call all the transitions 
    //Final transition; calculation should be done 
    //Those that bid higher than min final bid; get refund 
    //Those that bid lower
    const { auction, auction2, provider, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    await auction2.startBid();
    let state = await auction2.getState();
    expect(state).to.equal(1);


    // Fast forward time and update price
    let time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();
    let state1 = await auction2.getState();
    expect(state1).to.equal(1);

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();
    state1 = await auction2.getState();
    expect(state1).to.equal(2);
    

    const tokenSupply = await auction2.getTokenSupply();
    const tokenSupply2 = await auction2.getTokenBalance();
    expect(tokenSupply).to.equal(0);
    expect(tokenSupply2).to.equal(0);
    // refund = ethers.utils.parseEther("6");
    // let balance1c = (balance1.sub(txCost2))
    // balance1c = balance1c.add(refund);
    // expect(balance1b).to.equal(balance1c)

  })
  it("Should burn remaining supply case 2: bids were placed - correct token allocated and remaining is burned", async function () {
    //Should call all the transitions 
    //Final transition; calculation should be done 
    //Those that bid higher than min final bid; get refund 
    //Those that bid lower
    const { auction, auction2, provider, owner, addr1, addr2 } = await loadFixture(deployAuctionFixture)
    await auction2.startBid();

    // Fast forward time and update price
    let time = 1 * 60
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();
    let state1 = await auction2.getState();
    expect(state1).to.equal(1);

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    let cost1 = ethers.utils.parseEther("4");
    await auction2.placeBid(1, { value: cost1 });

    cost1 = ethers.utils.parseEther("8");
    await auction2.connect(addr1).placeBid(1, {value: cost1})

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();

    // Fast forward time and update price
    await network.provider.request({
      method: 'evm_increaseTime',
      params: [time],
    });
    await auction2.updatePrice();
    state1 = await auction2.getState();
    expect(state1).to.equal(2);
    

    state1 = await auction2.getState();
    let price = await auction2.getPrice();
    expect(price).to.equal(ethers.BigNumber.from(4000000000000000000n));
    expect(state1).to.equal(2);


    //Withdraw
    let balance1 = await provider.getBalance(owner.address)

    let balance2 = await provider.getBalance(addr1.address)
  

    //account for gas fees
    let txResp = await auction2.connect(owner).withdraw();
    txReceipt = await txResp.wait();
    withdrawGas = ethers.BigNumber.from(txReceipt.gasUsed);
    let txCost = withdrawGas.mul(txReceipt.effectiveGasPrice)

    let txResp2 = await auction2.connect(addr1).withdraw();
    txReceipt2 = await txResp2.wait();
    withdrawGas2 = ethers.BigNumber.from(txReceipt2.gasUsed);
    let txCost2 = withdrawGas2.mul(txReceipt2.effectiveGasPrice)

    //compare token balances
    let balance1a = await auction2.connect(owner).getTokenBalance();
    let balance2a = await auction2.connect(addr1).getTokenBalance();

    expect(balance1a).to.equal(1000000000000000000n);
    expect(balance2a).to.equal(2000000000000000000n);


    // //compare ether balances
    let balance1b = await provider.getBalance(owner.address)
    let balance2b = await provider.getBalance(addr1.address)
    

    // //expect(balance1b).to.equal(balance1.sub(txCost));
    let balance2c = (balance2.sub(txCost2))
    expect(balance2b).to.equal(balance2c)
    
    const tokenSupply = await auction2.getTokenSupply();
    expect(tokenSupply).to.equal(3000000000000000000n);

    let balance1c = (balance1.sub(txCost2))
    // expect(balance1b).to.equal(balance1c)

  })


})
const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { extractDocumentation } = require("typechain");


describe("Auction Factory contract", function () {

  async function deployAuctionFixture() {
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    const [owner, addr1, addr2] = await ethers.getSigners();
    const provider = ethers.provider;
    const auctionFactory = await AuctionFactory.deploy();  
    await auctionFactory.deployed();
  

    // Fixtures can return anything you consider useful for your tests
    return { AuctionFactory, auctionFactory, owner, provider, addr1, addr2 };
  }
  it("Create auctions", async function () {
    const { auctionFactory, owner } = await loadFixture(deployAuctionFixture)
    const now = Math.floor(Date.now() / 1000)
    await auctionFactory.createAuction("token", "tkn", 10, 10, 1, 2, now);
    const auctions = await auctionFactory.getAuctions();
    const Auction = await ethers.getContractFactory('Auction');
    const auction = await Auction.attach(auctions[0]);
    const tokens = await auction.getTokenSupply();
    expect(tokens).to.equal(10000000000000000000n);
  });

  it("Should not allow creation of auctions with same token name", async function () {
    const { auctionFactory, owner } = await loadFixture(deployAuctionFixture)
    const now = Math.floor(Date.now() / 1000)
    await auctionFactory.createAuction("token", "tkn", 10, 10, 1, 2, now);
    await expect(auctionFactory.createAuction("token", "tkn", 10, 10, 1, 2, now)).to.be.revertedWith('Token name already exists');
    await auctionFactory.createAuction("token2", "tkn2", 10, 10, 1, 2, now);
    const auctions = await auctionFactory.getAuctions();
    expect(auctions.length).to.equal(2);
  
  });

  it("Should not allow creation of auctions with same token symbol", async function () {
    const { auctionFactory, owner } = await loadFixture(deployAuctionFixture)
    const now = Math.floor(Date.now() / 1000)
    await auctionFactory.createAuction("token", "tkn", 10, 10, 1, 2, now);
    await expect(auctionFactory.createAuction("token2", "tkn", 10, 10, 1, 2, now)).to.be.revertedWith('Token symbol already exists');
    await auctionFactory.createAuction("token2", "tkn2", 10, 10, 1, 2, now);
    const auctionNames = await auctionFactory.getAuctionNames();
    expect(auctionNames.length).to.equal(2);
  
  });
})

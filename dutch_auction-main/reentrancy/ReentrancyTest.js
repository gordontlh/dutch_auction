const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { extractDocumentation } = require("typechain");


describe("Reentrancy contract", function () {

    async function deployAuctionFixture() {
        const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
        const [owner, addr1, addr2] = await ethers.getSigners();
        const provider = ethers.provider;
        const auctionFactory = await AuctionFactory.deploy();

        await auctionFactory.deployed();

        // Fixtures can return anything you consider useful for your tests
        return { AuctionFactory, auctionFactory, owner, provider, addr1, addr2 };
    }

    //Attacker must have been given a refund/ have tokens for them to even access the contract balance based on existing code 

    it("Reentrancy attack should not work when attacker has pending refund", async function () {
        const ReentrancyAttack = await ethers.getContractFactory("Reentrancy");


        const { auctionFactory, owner } = await loadFixture(deployAuctionFixture)
        const now = Math.floor(Date.now() / 1000)
        await auctionFactory.createAuction("token", "tkn", 10, ethers.utils.parseEther("10"), ethers.utils.parseEther("3"), ethers.utils.parseEther("4"), now);
        const auctions = await auctionFactory.getAuctions();
        expect(auctions.length).to.equal(1)
        const Auction = await ethers.getContractFactory('Auction');
        const auction = await Auction.attach(auctions[0]);
        const reentrancyAttack = await ReentrancyAttack.deploy(auctions[0]);
        await reentrancyAttack.deployed();
        let state1 = await auction.getState();
        let rstate = await reentrancyAttack.getAuctionState();
        expect(state1).to.equal(0)
        expect(rstate).to.equal(0)
        await auction.updatePrice();
        state1 = await auction.getState();
        rstate = await reentrancyAttack.getAuctionState();
        expect(state1).to.equal(1)
        expect(rstate).to.equal(1)
        // let timeNow = Math.floor(Date.now() / 1000)
        // let start = await auction.getStartTime();
        // expect(timeNow).to.equal(BigInt(start));
        // expect(timeNow).to.equal(BigInt(start));
        let cost1 = ethers.utils.parseEther("40");
        await auction.placeBid(4, { value: cost1, gasLimit: 12450000 });
        cost1 = ethers.utils.parseEther("30");
        await reentrancyAttack.placeBid(3, { value: cost1, gasLimit: 12450000 });
        // Fast forward time and update price
        let time = 1 * 60
        await network.provider.request({
            method: 'evm_increaseTime',
            params: [time],
        });
        let timeNow = Math.floor(Date.now() / 1000);
        let start = await auction.getStartTime();
        //expect(timeNow).to.equal(1)
        await auction.updatePrice();
        let price = await auction.getPrice();
        expect(price).to.equal(ethers.utils.parseEther("7"));
        await network.provider.request({
            method: 'evm_increaseTime',
            params: [time],
        });
        await auction.updatePrice();
        //expect(state1).to.equal(2)
        rstate = await reentrancyAttack.getAuctionState();
        expect(rstate).to.equal(2)

        await expect(reentrancyAttack.attack({ value: cost1, gasLimit: 12450000})).to.be.revertedWith('You do not possess any tokens or do not have any pending refunds');;
        const tbalance = await reentrancyAttack.getTokenAmount();
        expect(tbalance).to.equal(0)
        const balance = await reentrancyAttack.getAmount();
        //expected amount, reentrancy did not take place, otherwisse it should be 70 as it would be able to drain all the balance out.
        const refund = ethers.utils.parseEther("30")
        expect(balance).to.equal(refund)

    });
    //https://hackernoon.com/how-to-hack-smart-contracts-self-destruct-and-solidity
   


})


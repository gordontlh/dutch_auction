const fs = require('fs');
const AuctionFactory2 = require('../artifacts/contracts/AuctionFactory.sol/AuctionFactory.json')  
const path = require('path');

async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    const auctionFactory = await AuctionFactory.deploy();
    console.log("Factory address:", auctionFactory.address);

    const data = {
      address: auctionFactory.address,
      abi: JSON.parse(auctionFactory.interface.format('json'))
    }
    //Write file and update when you call deploy script
    fs.writeFileSync('./src/artifacts/AuctionFactory.json', JSON.stringify(data));

    // const Auction = await ethers.getContractFactory("Auction");
    // const auction = await Auction.deploy();
    // console.log("Factory address:", auction.address);

    // const data2 = {
    //   address: auction.address,
    //   abi: JSON.parse(auction.interface.format('json'))
    // }
    // //Write file and update when you call deploy script
    // fs.writeFileSync('./src/artifacts/Auction.json', JSON.stringify(data2));

    // const Token = await ethers.getContractFactory("Token");
    // const token = await Token.deploy();
    // console.log("Factory address:", token.address);

    // const data3 = {
    //   address: token.address,
    //   abi: JSON.parse(token.interface.format('json'))
    // }
    // //Write file and update when you call deploy script
    // fs.writeFileSync('./src/artifacts/Token.json', JSON.stringify(data3));
   
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });

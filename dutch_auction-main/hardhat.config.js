//require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

// Go to https://www.alchemyapi.io, sign up, create
// a new App in its dashboard, and replace "KEY" with its key
const ALCHEMY_API_KEY = "Hi4hhMoABwofJ0umgZQ95VK3OHYUPDbf";

// Replace this private key with your Goerli account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const GOERLI_PRIVATE_KEY = "21f127009f59acc4ab5a3f7189c8e08d6ce711319474b2e844694438a14abac9";

module.exports = {
  solidity: "0.8.17",
  etherscan: {
    apiKey: "ABCDE12345ABCDE12345ABCDE123456789",
  },
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY],
      gas: "auto",
      gasPrice: "auto",
    },
    hardhat:{
      allowUnlimitedContractSize: true
    }
  }
};

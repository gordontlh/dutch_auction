//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Auction.sol";
import "hardhat/console.sol";

contract AuctionFactory {
    address[] public auctions;
    string[] public names;
    string[] public symbols;

    event NewAuction(address auctionAddress);

    //create token from here, update tokens mapping to reflect minted tokens.
    function createAuction(
        string memory _name,
        string memory _symbol,
        uint256 _quantity,
        uint256 _startingPrice,
        uint256 _discountRate,
        uint256 _lowestPossibleBid,
        uint256 _start
    ) public returns (bool) {
        //ensure name doesnt already exist
        require(!checkIfNameExists(_name), "Token name already exists");
        require(!checkIfSymbolExists(_symbol), "Token symbol already exists");
        Auction newAuction = new Auction(
            _name,
            _symbol,
            _quantity,
            _startingPrice,
            _discountRate,
            _lowestPossibleBid,
            _start
        ); //hopefully it returns the address?
        auctions.push(address(newAuction));
        names.push(_name);
        symbols.push(_symbol);
        emit NewAuction(address(newAuction));
    }

    function getAuctions() public view returns (address[] memory) {
        return auctions;
    }

    function getAuctionNames() public view returns (string[] memory) {
        return names;
    }

    function getAuctionSymbols() public view returns (string[] memory) {
        return symbols;
    }

    function checkIfNameExists(string memory name) private view returns (bool) {
        for (uint i = 0; i < names.length; i++) {
            //comparing strings gives errors
            //https://stackoverflow.com/questions/54499116/how-do-you-compare-strings-in-solidity
            if (
                keccak256(abi.encodePacked(names[i])) ==
                keccak256(abi.encodePacked(name))
            ) {
                return true;
            }
        }
        return false;
    }

    function checkIfSymbolExists(string memory symbol)
        private
        view
        returns (bool)
    {
        for (uint i = 0; i < symbols.length; i++) {
            //comparing strings gives errors
            //https://stackoverflow.com/questions/54499116/how-do-you-compare-strings-in-solidity
            if (
                keccak256(abi.encodePacked(symbols[i])) ==
                keccak256(abi.encodePacked(symbol))
            ) {
                return true;
            }
        }
        return false;
    }
}

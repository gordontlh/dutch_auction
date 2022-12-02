// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract Token is ERC20 {
    uint initialSupply; 
    address owner;
    mapping (address => uint) owners; 
    constructor(
        string memory _name,
        string memory _symbol,
        uint  _initialSupply
    ) ERC20(_name,_symbol) {
        initialSupply = _initialSupply;
        _mint(msg.sender, initialSupply); //in this case, we are calling from the auction contract
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    //do I need double only owner? 
    function burn(uint256 _number) public onlyOwner{
        _burn(msg.sender, _number);
        console.log("%d tokens burned", _number);
    }

  
}
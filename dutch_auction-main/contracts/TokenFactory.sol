
//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Token.sol";

contract TokenFactory{
    
    Token [] tokens;
  

    //create token from here, update tokens mapping to reflect minted tokens.
    function createToken(string memory name, string memory symbol,  uint initialSupply) public{
        //ensure name doesnt already exist
        Token newToken = new Token(name, symbol, initialSupply); //hopefully it returns the address? 
        tokens.push(newToken);
    }
    //read tokens
    function readTokenName(uint index)  public view returns(string memory){
        address tokenAddress = address(tokens[index]);
        return Token(tokenAddress).name();
    }

    //transfer(address recipient, uint256 amount) → bool public
    //transferring the token to user 
    //probably from marketplace, write for loop transfer to each user whose bid >= minimumBid
    

    
}
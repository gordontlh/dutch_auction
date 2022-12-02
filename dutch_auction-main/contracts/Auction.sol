//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Token.sol";
import "hardhat/console.sol";

contract Auction {
    mapping(address => User) private bidsByUser;
    mapping(address => uint256) private assignedTokens;
    Bid[] private bids;
    address[] private bidders;
    uint256 private totalBids;
    uint256 private lowestPossibleBid;
    uint256 private startingPrice;
    uint256 price;
    uint256 discountRate;
    uint256 quantity;
    uint256 initialQuantity;
    address owner;
    Token tokens;
    States state;
    uint256 start;
    uint256 end;
    uint256 decimals = 10**18;
    bool internal locked;

    struct User {
        uint256 amount;
        bool isExist;
    }

    //Used when bidding
    struct Bid {
        address user; // address
        uint256 amount; // value in wei
        uint256 price; // price
        uint256 quantity; // quantity
        uint256 time;
    }

    //Used to allow frontend to collect data
    struct Data {
        address tokenAddress;
        string name;
        string symbol;
        uint256 quantity;
        uint256 startDateTime;
        uint256 startingPrice;
        uint256 state;
        uint256 price;
        Bid[] bids;
    }

    event NewBid(
        address user,
        uint256 amount,
        uint256 price,
        uint quantity,
        uint256 time
    );

    //States that govern flow of contract
    //0. Before starting
    //1. Bidding phase where people can place bids
    //2. Withdrawal phase where people can obtain their tokens and refunds
    enum States {
        Pending,
        AcceptingBids,
        Withdrawal
    }

    //Events
    event AssignmentStart();
    event AssignmentDone();

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _quantity,
        uint256 _startingPrice,
        uint256 _discountRate,
        uint256 _lowestPossibleBid,
        uint256 _start
    ) {
        owner = msg.sender;
        quantity = _quantity;
        lowestPossibleBid = _lowestPossibleBid;
        startingPrice = _startingPrice;
        discountRate = _discountRate;
        price = _startingPrice;
        initialQuantity = _quantity;
        //initialize tokens
        tokens = new Token(_name, _symbol, _quantity * decimals);
        start = _start;
        state = States.Pending;
    }

    //MODIFIERS

    // Perform timed transitions to facilitiate state transitions for our auction. Used to perform checks and call functions based on time
    modifier timedTransitions() {
        //as long total value obtained is more than lowest price * qty, we should initiate withdrawal
        console.log("Total Bids: %d", totalBids);
        console.log("Allowance: %d", price * quantity);
        if (state == States.AcceptingBids && totalBids >= price * quantity) {
            assignTokens();
            nextStage();
        }
        if (
            state == States.AcceptingBids &&
            block.timestamp >= start + 20 minutes
        ) {
            assignTokens();
            nextStage();
        }
        if (state == States.Withdrawal && block.timestamp >= start + 1 hours) {
            nextStage();
        }
        // The other stages transition by transaction
        _;
    }

    // Perform timed transitions to help state transitions for our auction. Used to perform checks and call functions based on time
    //This is the same as above function but checks after function has been called. Used only in updatePrice function
    modifier timedTransitions2() {
        //as long total value obtained is more than lowest price * qty, we should initiate withdrawal
        _;
        console.log("Total Bids: %d", totalBids);
        console.log("Allowance: %d", price * quantity);
        if (state == States.AcceptingBids && totalBids >= price * quantity) {
            assignTokens();
            nextStage();
        }
        if (
            state == States.AcceptingBids &&
            block.timestamp >= start + 20 minutes
        ) {
            assignTokens();
            burn();
            nextStage();
        }
    }

    //only the contract owner should be able to start voting
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier atState(States state_) {
        require(state == state_, "You are not at correct state");
        _;
    }

    modifier notAtState(States state_) {
        require(state != state_, "You are not at correct state");
        _;
    }

    function nextStage() internal {
        state = States(uint256(state) + 1);
    }

    //Used to prevent more than one function from being executed at a time by locking the contract.
    modifier reentrancyGuard() {
        require(!locked);
        locked = true;
        _;
        locked = false;
    }

    //VIEW FUNCTIONS
    function getState() public view returns (States) {
        console.log(uint256(state));
        return state;
    }

    function getQuantity() public view returns (uint256) {
        return initialQuantity;
    }

    function getStartTime() public view returns (uint256) {
        return start;
    }

    function getToken() public view returns (address) {
        return address(tokens);
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getData() public view returns (Data memory) {
        Data memory result = Data(
            getToken(),
            getTokenName(),
            getTokenSymbol(),
            quantity,
            start,
            startingPrice,
            uint(state),
            price,
            bids
        );
        return result;
    }

    function getBids() public view returns (Bid[] memory) {
        return bids;
    }

    function getTokenName() public view returns (string memory) {
        string memory name = ERC20(tokens).name();
        return name;
    }

    function getTokenSymbol() public view returns (string memory) {
        string memory symbol = ERC20(tokens).symbol();
        return symbol;
    }

    function getTokenSupply() public view returns (uint256) {
        uint256 supply = IERC20(tokens).totalSupply();
        return supply;
    }

    function getTokenBalance() public view returns (uint256) {
        uint256 balance = IERC20(tokens).balanceOf(msg.sender);
        console.log("Token balance is %d", balance);
        return balance;
    }

    function getStartingPrice() public view returns (uint256) {
        return startingPrice;
    }

    function getPrice() public view returns (uint256) {
        return price;
    }

    function getAssigned() public view returns (uint256) {
        if (assignedTokens[msg.sender] > 0) {
            return assignedTokens[msg.sender];
        }
        return 0;
    }

    function getBidsByUser() public view returns (uint256) {
        if (bidsByUser[msg.sender].isExist) {
            return bidsByUser[msg.sender].amount;
        }
        return 0;
    }

    function checkAssigned() public view returns (bool) {
        if (
            assignedTokens[msg.sender] > 0 || bidsByUser[msg.sender].amount > 0
        ) {
            return true;
        }
        return false;
    }

    //FUNCTIONS

    //Used to start auction bidding based on start time
    function startBid() public atState(States.Pending) {
        console.log("block.timestamp: %d", block.timestamp);
        console.log("start: %d", start);
        require(
            block.timestamp >= start,
            "Bid can only start after start time"
        );
        nextStage();
        console.log("Start time is : %s", start);
    }

    //Used to update price based on dutch auction mechanism
    //After every 1 minute, price should drop until minimum possible price and remaining unsold tokens are burned.
    //Called on frontend at regular interval of 1minute.
    function updatePrice()
        public
        timedTransitions2
        notAtState(States.Withdrawal)
    {
        console.log("block.timestamp: %d", block.timestamp);
        console.log("start: %d", start);
        require(block.timestamp >= start, "Auction have yet to start.");
        console.log("state is %d", uint(state));
        uint256 timeElapsed = (block.timestamp - start) / 60;
        console.log("Time elapsed is %s", timeElapsed);
        if (state == States.Pending) {
            startBid();
        }
        uint256 discount = discountRate * timeElapsed;
        //first condition prevents negative value, prevents underflow
        if (
            discount < startingPrice &&
            startingPrice - discount >= lowestPossibleBid
        ) {
            price = startingPrice - discount;
        }
        if (
            discount < startingPrice &&
            startingPrice - discount < lowestPossibleBid
        ) {
            price = lowestPossibleBid;
        }
    }

    //Used to place bid based on number of tokens.
    function placeBid(uint256 qty)
        public
        payable
        atState(States.AcceptingBids)
        timedTransitions
    {
        console.log(price * qty);
        require(msg.sender.balance > msg.value, "Insufficient balance"); //checks
        if (!bidsByUser[msg.sender].isExist) {
            bidders.push(msg.sender);
        }
        bids.push(Bid(msg.sender, msg.value, price, qty, block.timestamp));
        bidsByUser[msg.sender].amount += msg.value;
        bidsByUser[msg.sender].isExist = true;
        totalBids += msg.value;
        emit NewBid(msg.sender, msg.value, price, qty, block.timestamp);
    }

    //Used to assign tokens based on bids, assigning based on FCFS order.
    //Once we have run out of tokens to assign, this function stops.
    function assignTokens() public {
        console.log("Bidders length %d", bidders.length);
        emit AssignmentStart();
        //Iterate through all bids and assign based on amount of bid/current price
        for (uint256 i = 0; i < bids.length; i++) {
            console.log("Iteration %d", bids.length);
            if (quantity > 0) {
                uint256 amount = bids[i].amount;
                uint256 tokenAmount = amount / price;
                //If the assigned tokens is less than quantity of tokens left, user gets assigned amount.
                if (quantity >= tokenAmount) {
                    console.log(bidsByUser[bids[i].user].amount);
                    quantity -= tokenAmount;
                    bidsByUser[bids[i].user].amount -= tokenAmount * price;
                    assignedTokens[bids[i].user] += tokenAmount;
                    console.log(bidsByUser[bids[i].user].amount);
                }
                //If the assigned tokens is more than quantity of tokens left, user gets all the remaining tokens.
                else {
                    console.log(bidsByUser[bids[i].user].amount);
                    bidsByUser[bids[i].user].amount -= quantity * price;
                    assignedTokens[bids[i].user] += quantity;
                    console.log(bidsByUser[bids[i].user].amount);
                    quantity = 0;
                }
                console.log(
                    "Assigned tokens for %s : %d",
                    bids[i].user,
                    assignedTokens[bids[i].user]
                );
            } else {
                break;
            }
        }
        emit AssignmentDone();
    }

    //Used to withdraw assigned tokens and refunds after bid has ended.
    //Only able to withdraw if you have tokens assigned/pending refunds that have not been withdrawn
    //Checks, effects, interactions pattern and reentrancy guard to safeguard against reentrancy attacks.

    function withdraw()
        public
        payable
        atState(States.Withdrawal)
        reentrancyGuard
    {
        //CHECK whether user has any tokens or pending refunds
        require(
            assignedTokens[msg.sender] > 0 || bidsByUser[msg.sender].amount > 0,
            "You do not possess any tokens or do not have any pending refunds"
        );
        console.log("Current price %d", price);
        //EFFECTS: deduct assigned tokens * current price from user bids
        if (assignedTokens[msg.sender] > 0) {
            uint256 tokenAmount = assignedTokens[msg.sender];
            console.log("Received tokens %d", assignedTokens[msg.sender]);
            assignedTokens[msg.sender] -= tokenAmount;

            //INTERACTIONS; transfer tokens
            bool success = tokens.transfer(msg.sender, tokenAmount * decimals);
            console.log(success);
        }
        //refund the rest if any
        if (bidsByUser[msg.sender].amount > 0) {
            //EFFECTS: deduct assigned tokens * price from user bids
            uint256 amount = bidsByUser[msg.sender].amount;
            console.log("Refunded amount %d", amount);
            bidsByUser[msg.sender].amount -= amount;
            //INTERACTIONS: transfer refund
            (bool sent, bytes memory data) = msg.sender.call{value: amount}("");
            require(sent, "Failed to send Ether");
        }
    }

    //Used to burn remaining tokens after times up
    function burn() private {
        tokens.burn(quantity * decimals);
        console.log("%d tokens burned", quantity);
    }

    //Used when unidentified function call is made
    fallback() external {
        console.log("fallback triggered.");
    }
}

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./HappeningNow.css";
import Token from "./Token.js";
import LogWindow from "./LogWindow.js";
import BiddingWindow from "./BiddingWindow.js";
import { Card, Container, Row, Col, Button } from "react-bootstrap";
import AuctionABI from "../artifacts/Auction.json";

const HappeningNow = ({ auction }) => {
    const [dateTime, setDateTime] = useState(new Date());
    const [currentPrice,setCurrentPrice] = useState(auction.price);
    const [isAssigned, setIsAssigned] = useState(false);
    const [amtAssigned, setAmtAssigned] = useState(0);
    const [biddedAmount, setBiddedAmount] = useState(0);
    const [remainingQty, setRemainingQty] = useState(auction.quantity);
    const [updated, setUpdated] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [currentState, setCurrentState] = useState(0);
    
    useEffect(() => {
        console.log("auction passed in", auction);  //reset each time
        setCurrentPrice(auction.price);
        setCurrentState(auction.state);
        setAmtAssigned(0);
        setBiddedAmount(0);
        getAuctionData();
        getIsAssigned();
        updatePrice();
    }, [auction]);

    useEffect(() => {
        if(!updated) return
        console.log("updated!, fetching...")
        getAuctionData();
    }, [updated]);

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(new Date());
            if (currentState !== 0 && (new Date().getSeconds() < 5)) {   //update price every minute
                updatePrice();
            }
        }, 1000);
        return () => {
            clearInterval(timer); 
        };
    }, [auction]);

    // for place bid event listener
    useEffect(() => {
        if(Math.floor(Date.now() / 1000) > auction.startDateTime +1200){
            // console.log("no listener as auction is over");
            return;
        }
        const provider = new ethers.providers.JsonRpcProvider(
            "http://127.0.0.1:8545"
        );
        const contract = new ethers.Contract(
            auction.address,
            AuctionABI.abi,
            provider
        );
        contract.on("NewBid", (sender, amount, price, quantity, time) => {
            console.log("NewBid Event received!")
            console.log("sender",sender);
            console.log("amount",ethers.utils.formatEther(amount));
            console.log("price",ethers.utils.formatEther(price));
            console.log("quantity",quantity.toNumber());
            console.log("time", parseTime(time.toNumber()));
            auction.bids = [...auction.bids,{
                "user": sender,
                "amount": amount,
                "price": price,
                "quantity": quantity,
                "time": time
            }];
            console.log("auction.bids", auction.bids);
            updatePrice();
        });
        contract.on("AssignmentStart", () => {
            console.log("AssignmentStart Event received!");
            setCalculating(true);
            console.log("calculating set to true");
            getAuctionData();
        });
        contract.on("AssignmentDone", () => {
            console.log("AssignmentDone Event received!");
            setTimeout(10000);
            setCalculating(false);
            console.log("calculating set to false");
            getAuctionData();
        });
        // console.log("new listener");
        return()=>{
            contract.removeAllListeners();
            // console.log("removed old listener");
        }
    }, [auction]);

    useEffect(() => {
        setRemainingQty(getRemainingQty());     //on new bids or change in current price, calculate remaining qty.
    }, [auction.bids,currentPrice]);

    const getAuctionData = async () => {
        console.log("fetching data...");
        console.log("auction used to fetch:", auction);
        const provider = new ethers.providers.JsonRpcProvider();
        const contract = new ethers.Contract(
            auction.address,
            AuctionABI.abi,
            provider
        );
        const data = await contract.getData();
        const processedData = {
            address: auction.address,
            tokenAddress: data.tokenAddress,
            name: data.name,
            symbol: data.symbol,
            quantity: data.quantity.toNumber(),
            startDateTime: data.startDateTime.toNumber(),
            startingPrice: ethers.utils.formatEther(data.startingPrice),
            state: data.state.toNumber(),
            price: ethers.utils.formatEther(data.price),
            bids: data.bids,
        };
        console.log("updated" , processedData);
        setCurrentPrice(processedData.price);
        setCurrentState(processedData.state);
        getIsAssigned();
        getBidsByUser();
        setUpdated(false);
    };

    function getRemainingQty(){
        var count = 0;
        auction.bids.forEach(bid => {
            count += Math.floor(ethers.utils.formatEther(bid.amount)/currentPrice);
        });
        if(count> auction.quantity) return 0;
        return auction.quantity-count;
    }

    const getIsAssigned = async () => {
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
        );
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            auction.address,
            AuctionABI.abi,
            signer
        );
        const res = await contract.checkAssigned();
        setIsAssigned(res);
        if(res) getAssigned();
    };

    const getAssigned = async () => {
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
        );
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            auction.address,
            AuctionABI.abi,
            signer
        );
        const res = await contract.getAssigned();
        console.log("Assigned amount: ", res.toNumber());
        setAmtAssigned(res.toNumber());
    };

    const getBidsByUser = async () => {
        console.log("here");
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
        );
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            auction.address,
            AuctionABI.abi,
            signer
        );
        const res = await contract.getBidsByUser();
        const amt = ethers.utils.formatEther(res);
        console.log("Amount bidded: ", amt);
        setBiddedAmount(amt);
    };

    async function updatePrice() {
        if(Math.floor(Date.now() / 1000) < auction.startDateTime){
            console.log("Can't update as auction have yet started.");
            return;
        }
        // console.log("updating");
        const provider = new ethers.providers.JsonRpcProvider();
        const signer = provider.getSigner(); //change to our private key
        const contract = new ethers.Contract(
            auction.address,
            AuctionABI.abi,
            signer
        );

        await contract.updatePrice({ gasLimit: 12450000 });
        console.log("updated");
        setUpdated(true);
    }

    async function placeBid(bidAmount) {
        if(currentState!==1){
            return alert("Auction not in session!");
        }
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
        );
        const ethValue = (bidAmount * currentPrice).toString();
        // console.log(ethValue);
        const signer = provider.getSigner();
        console.log(signer);
        console.log("Account:", await signer.getAddress());
        const contract = new ethers.Contract(
            auction.address,
            AuctionABI.abi,
            signer
        );

        const bid = await contract.placeBid(bidAmount, {
            value: ethers.utils.parseEther(ethValue),
            gasLimit: 12450000,
        }).catch((err)=>{console.log(err.message)});
    }

    async function withdraw() {
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
        );
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            auction.address,
            AuctionABI.abi,
            signer
        );
        
        const withdraw = await contract.withdraw({
            gasLimit: 12450000,
        }).catch((error)=>{
            if(error.__proto__.name === "Error"){ 
                const start = error.message.indexOf("{");
                const end = error.message.lastIndexOf("}");
                if(start && end) {
                    error = error.message.substring(start, end + 1);
                    error = error.replaceAll("\\","");
                    console.log(error);
                }
            }
        });
        console.log("withdraw", withdraw);
        alert(`Withdrawn : ${amtAssigned} tokens, refunded ${biddedAmount} eth.`);
        getAuctionData();
    }

    function parseTime(unixTimeStamp) {
        return new Date(unixTimeStamp * 1000);
    }

    function countDown(timeleft) {
        var days = Math.floor(timeleft / (1000 * 60 * 60 * 24));
        var hours = Math.floor(
            (timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        var minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
        var res = "";
        if (days > 0) res = res + days + " days ";
        if (hours > 0) res = res.concat(hours, "  hours ");
        if (minutes > 0) res = res.concat(minutes, "  min ");
        if (seconds > 0) res = res.concat(seconds, "  sec");
        return res;
    }

    function ToMinutesAndSeconds(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + " min " + (seconds < 10 ? "0" : "") + seconds + " sec";
    }

    return (
        <Card className="happeningNow">
            token address: {auction.tokenAddress}
            <Card.Body className="container">
                <Container>
                    <Row>
                        <Col md={4}>
                            <Card.Title>
                                <Token
                                    name={auction.name}
                                    symbol={auction.symbol}
                                ></Token>
                            </Card.Title>
                        </Col>
                        <Col md={2}></Col>
                        <Col md={6}>
                            <Row className="time">
                                Current time: {dateTime.toLocaleString()}{" "}
                            </Row>
                            <Row className="time">
                                Auction Start time :{" "}
                                {parseTime(
                                    auction.startDateTime
                                ).toLocaleString()}
                            </Row>
                            {currentState === 0 && (
                                <Row className="time">
                                    Time till Auction:{" "}
                                    {countDown(
                                        parseTime(auction.startDateTime) -
                                            dateTime
                                    )}
                                </Row>
                            )}
                            {currentState === 1 && (
                                <Row className="time">
                                    Time remaining :{" "}
                                    {ToMinutesAndSeconds(
                                        parseTime(
                                            auction.startDateTime + 1200
                                        ) - dateTime
                                    )}
                                </Row>
                            )}
                            {currentState === 2 && (
                                <Row className="time">Auction ended</Row>
                            )}
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Row>
                                Starting Price: {auction.startingPrice} eth
                            </Row>
                            {currentState===1 && <Row>Current Price: {currentPrice} eth</Row>}
                            {currentState===2 && <Row>Ending Price: {currentPrice} eth</Row>}
                            <Row>Total Quantity: {auction.quantity}</Row>
                            <Row>
                                Remaining Quantity: {currentState===2 ? 0 : remainingQty}
                            </Row>
                            <Row></Row>
                            {biddedAmount>0 && currentState===1 && <Row>Amount committed: {biddedAmount}</Row>}
                            {calculating && <Row>Calculating...</Row>}
                            {!calculating && amtAssigned>0 && <Row>Quantity available for withdraw: {amtAssigned}</Row>}
                            {!calculating && isAssigned && currentState===2 && <Row>Eth to be refunded: {biddedAmount}</Row>}
                        </Col>
                        <Col md={8}>
                            <LogWindow bidLog={auction.bids}></LogWindow>
                            {currentState===1 && <BiddingWindow currentPrice={currentPrice} remainingQty={remainingQty} onPlaceBid={placeBid}></BiddingWindow>}
                            {currentState===2 && isAssigned && (
                                <div className="withdraw" >
                                    <Button onClick={withdraw}>Withdraw</Button>
                                </div>
                            )}
                            {currentState===2 && !isAssigned && (
                                <div className="withdraw">
                                    <Button onClick={withdraw} disabled>Withdraw</Button>
                                    <div style={{alignContent:"center", display:"flex"}}>No tokens assigned!</div>
                                </div>   
                            )
                            }
                        </Col>
                    </Row>
                </Container>
            </Card.Body>
        </Card>
    );
};

export default HappeningNow;

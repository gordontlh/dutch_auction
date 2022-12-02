import { FaBars, FaTimes } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container } from "react-bootstrap";
import HappeningNow from "./components/HappeningNow";
import Auctions from "./components/Auctions";
import logo from "./assets/logo.jpg";
import CreateAuctionBtn from "./components/CreateAuctionBtn";
import AuctionFactoryABI from "./artifacts/AuctionFactory.json";
import AuctionABI from "./artifacts/Auction.json";

function App() {
    // hamburger click
    const [click, setClick] = useState(false);
    const handleClick = () => setClick(!click);

    const initalBtnTxt = "Connect Wallet";
    const [btnTxt, setBtnTxt] = useState(initalBtnTxt);

    const provider = new ethers.providers.JsonRpcProvider();
    const contract = new ethers.Contract(
        AuctionFactoryABI.address,
        AuctionFactoryABI.abi,
        provider
    );

    const [addressList, setAddressList] = useState([]);
    const [auctionNameList, setAuctionNameList] = useState([]);
    const [auctionSymbolList, setAuctionSymbolList] = useState([]);
    const [data, setData] = useState([]);
    const [fetched, setFetched] = useState(false);

    // auction card click (clickedAuction for JiaKai)
    const [clickedAuction, setClickedAuction] = useState(null);

    useEffect(() => {
        try {
            connect();
        } catch (err) {
            console.error(err.message);
            setBtnTxt("Connecting Wallet...");
        }
    }, []);

    useEffect(() => {
        getAddressList();  //on start, fetch auctions addresses
    }, []);

    useEffect(() => {
            getAuctionsData();  //everytime list of address changes, fetch their data
            getAuctionNames();
            getAuctionSymbols();
    }, [addressList]);

    useEffect(() => {
        const provider = new ethers.providers.JsonRpcProvider(
            "http://127.0.0.1:8545"
        );
        for (const address of addressList) {       
            const contract = new ethers.Contract(
                address,
                AuctionABI.abi,
                provider
            );
            contract.on("AssignmentDone", () => {       //add listener to check if auction ended
                getAuctionsData();
            });
        }
        return()=>{
            contract.removeAllListeners();
        }
    }, [addressList]);

    // Auction creation listener
    useEffect(() => {
        const provider = new ethers.providers.JsonRpcProvider(
            "http://127.0.0.1:8545"
        );
        const contract = new ethers.Contract(
            AuctionFactoryABI.address,
            AuctionFactoryABI.abi,
            provider
        );
        contract.on("NewAuction", (AuctionAddress) => {     //add listener for auction creation
            // console.log("New Auction creation event received!")
            // console.log("new AuctionAddress:",AuctionAddress);
            setAddressList(currentList => [...currentList,AuctionAddress]);
            setFetched(false);
        });
        return()=>{
            contract.removeAllListeners();
        }
    }, []);

    const connect = async () => {
        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
        );
        // Prompt user for account connections
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        // console.log("Account:", await signer.getAddress());
        setBtnTxt("Wallet Connected");
    };

    const getAddressList = async () => {
        const data = await contract.getAuctions();
        setAddressList(data);
    };
    const getAuctionNames = async () => {
        const data = await contract.getAuctionNames();
        setAuctionNameList(data);
    };
    const getAuctionSymbols = async () => {
        const data = await contract.getAuctionSymbols();
        setAuctionSymbolList(data);
    };

    const getAuctionsData = async () => {
        const res = [];
        for (const address of addressList) {
            const data = await getAuctionData(address);
            res.push(data);
        }
        setData(res);
        if(res.length===0){
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        setFetched(true);
    };

    async function getAuctionData(address) {
        const provider = new ethers.providers.JsonRpcProvider();
        const contract = new ethers.Contract(address, AuctionABI.abi, provider);
        const data = await contract.getData();
        const processedData = {
            address: address,
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
        return processedData;
    }

    const createAuction = async () => {
        const signer = provider.getSigner();
        const contract2 = new ethers.Contract(
            AuctionFactoryABI.address,
            AuctionFactoryABI.abi,
            signer
        );
        await contract2.createAuction(
            "NTUcoin",
            "NTC",
            500,
            ethers.utils.parseEther("100"),
            ethers.utils.parseEther("10"),
            ethers.utils.parseEther("30"),
            Math.floor(Date.now() / 1000)-(60*60)
        );
        await contract2.createAuction(
            "SMUcoin",
            "SMC",
            300,
            ethers.utils.parseEther("300"),
            ethers.utils.parseEther("20"),
            ethers.utils.parseEther("120"),
            Math.floor(Date.now() / 1000)+(60*60)
        );
        await contract2.createAuction(
            "NUScoin",
            "NUC",
            1000,
            ethers.utils.parseEther("200"),
            ethers.utils.parseEther("20"),
            ethers.utils.parseEther("50"),
            Math.floor(Date.now() / 1000)+(3*60*60)
        );
    };

    // Auctions.js onClicks
    function handleCardClick(clickedAuction) {
        // console.log("clicked card: ", clickedAuction);
        setClickedAuction(clickedAuction);
    }

    //need to change
    async function isAuctionNameValid(auctionName) {
        // console.log("auction name list: ", auctionNameList);
        return !auctionNameList.includes(auctionName);
    }

    async function isAuctionSymbolValid(symbol) {
        // console.log("auction symbol list: ", auctionSymbolList);
        return !auctionSymbolList.includes(symbol);
    }


    async function handleCreateAuction(auctionProps) {
        const signer = provider.getSigner();
        const contract2 = new ethers.Contract(
            AuctionFactoryABI.address,
            AuctionFactoryABI.abi,
            signer
        );
        const auction = await contract2.createAuction(
            auctionProps.name,
            auctionProps.symbol,
            auctionProps.quantity,
            ethers.utils.parseEther(auctionProps.startingPrice.toString()),
            ethers.utils.parseEther(auctionProps.discountRate.toString()), 
            ethers.utils.parseEther(auctionProps.lowestPossibleBid.toString()),
            auctionProps.startDateTime
        );

        console.log("auction created: ", auction);
    }
    
    return (
        <div className="app">
            <div className="header">
                <div className="container">
                    <img className="logo" src={logo} alt="Logo" />
                    <ul className={click ? "nav-menu active" : "nav-menu"}>
                        <li>
                            <a href="#HappeningNow">Happening Now</a>
                        </li>
                        <li>
                            <a href="#Auctions">Auctions</a>
                        </li>
                    </ul>
                    <div className="btn-group">
                        <button
                            className="button-36"
                            style={{ cursor: "context-menu" }}
                        >
                            {btnTxt}
                        </button>
                        {/* <button onClick={createAuction}>Create Auction</button> */}
                        <div className="hamburger" onClick={handleClick}>
                            {click ? (
                                <FaTimes size={36} style={{ color: "#333" }} />
                            ) : (
                                <FaBars size={36} style={{ color: "#333" }} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="body">
                {clickedAuction != null && (
                    <div className="HappeningNow" id="HappeningNow">
                        <HappeningNow auction={clickedAuction} />
                    </div>
                )}
                <div className="Auctions" id="Auctions">
                    <Container fluid>
                        <h1 className="text-center text-white">Auctions</h1>
                        <CreateAuctionBtn
                            auctionList={data}
                            isAuctionNameValid={isAuctionNameValid}
                            isAuctionSymbolValid={isAuctionSymbolValid}
                            onCreateAuction={handleCreateAuction}
                        ></CreateAuctionBtn>
                    </Container>
                    <Auctions
                        auctionList={data}
                        fetched={fetched}
                        onCardClick={handleCardClick}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;

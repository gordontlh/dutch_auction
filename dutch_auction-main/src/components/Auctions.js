import "./Auctions.css";
import React, { useState, useEffect } from "react";
import { Card, Badge, Row, Col } from "react-bootstrap";
import Token from "./Token.js";
import "bootstrap/dist/css/bootstrap.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

const Auctions = ({ auctionList, fetched, onCardClick }) => {
    const [auctions, setAuctions] = useState(auctionList);
    const [sortedAuctions, setSortedAuctions] = useState([]);

    useEffect(() => {
        setAuctions(auctionList);
    }, [auctionList]);

    useEffect(() => {
        function sortByTime() {
            const sorted = auctions.sort((a, b) => {
                return a.startDateTime - b.startDateTime;
            });
            setSortedAuctions(sorted);
        }
        sortByTime();
    }, [auctions]);

    function parseTime(unixTimeStamp) {
        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
        };

        return (
            new Date(unixTimeStamp * 1000).toLocaleString("en-US", options) +
            ", " +
            new Date(unixTimeStamp * 1000).toLocaleString("en-US", {
                timeStyle: "short",
                hour12: false,
            })
        );
    }

    // TODO: add badge, to show happening soon, now, ended
    function badge(unixTimeStamp, state) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (state === 2){
            return <Badge bg="danger">Ended</Badge>;
        }
        if (
            currentTime < unixTimeStamp + 1200 &&
            currentTime >= unixTimeStamp
        ) {
            return <Badge bg="success">Happening Now</Badge>;
        } else if (unixTimeStamp > currentTime) {
            return <Badge bg="primary">Happening Soon</Badge>;
        } else {
            return <Badge bg="danger">Ended</Badge>;
        }
    }

    let settings = {
        infinite: false,
        speed: 1000,
        arrows: true,
        slidesToShow: 3,
        slidesToScroll: 1,

        responsive: [
            {
                breakpoint: 1800,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                },
            },
            {
                breakpoint: 1400,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                },
            },
            {
                breakpoint: 950,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                },
            },
        ],
    };

    return (
        <div className="auctions">
            <div className="myContainer">
                {sortedAuctions.length === 0 ? (
                    <div className="text-center" style={{ padding: "160px" }}>
                        { fetched ? 
                        <div>
                            <p style={{ color: "white"}}>
                                No auctions
                            </p>    
                        </div> : 
                        <div>
                            <span className="loader"> </span>
                            <p style={{ color: "white", marginTop: "50px" }}>
                                Loading auctions...
                            </p>
                        </div>}
                    </div>
                ) : (
                    <Slider {...settings}>
                        {sortedAuctions.map((current,index) => (
                            <div className="out" key={current.name}>
                                <Card
                                    className="card_ys"
                                    onClick={() => onCardClick(current)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <Card.Body>
                                        <Card.Title>
                                            <Row className="align-items-center">
                                                <Col>
                                                    <Token
                                                        name={current.name}
                                                        symbol={current.symbol}
                                                    ></Token>
                                                </Col>
                                                <Col>
                                                    {badge(
                                                        current.startDateTime, current.state
                                                    )}
                                                </Col>
                                            </Row>
                                        </Card.Title>
                                        <Card.Text
                                            style={{
                                                fontSize: "24px",
                                            }}
                                        >
                                            {parseTime(current.startDateTime)}
                                        </Card.Text>
                                        <Card.Text
                                            style={{
                                                color: "#04FF04",
                                                fontSize: "42px",
                                            }}
                                        >
                                            {current.startingPrice} ETH
                                        </Card.Text>
                                        <Card.Text
                                            style={{
                                                fontSize: "32px",
                                            }}
                                        >
                                            {current.quantity} tokens left
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </div>
                        ))}
                    </Slider>
                )}
            </div>
        </div>
    );
};

export default Auctions;

import React, { useEffect } from "react";
import { ethers } from "ethers";
import "./LogWindow.css";
import { Card, ListGroup } from "react-bootstrap";

const LogWindow = ({ bidLog }) => {

    function parseTime(unixTimeStamp) {
        return new Date(unixTimeStamp * 1000);
    }

    return (
        <Card className="logWindow" bg="secondary">
            {bidLog.length === 0 ? (
                <div className="text-center">
                    <p>No bids placed</p>
                </div>
            ) : (
                <ListGroup variant="flush" className="listGroup">
                    {bidLog.map((log) => (
                        <ListGroup.Item>
                            User {log.user.substring(0,6)} placed bid for {log.quantity.toNumber()} tokens at {ethers.utils.formatEther(log.price)} ETH each for {ethers.utils.formatEther(log.amount)} ETH at {parseTime((log.time).toNumber()).toLocaleTimeString()}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </Card>
    );
};

export default LogWindow;

import React, { useState } from "react";
import "./BiddingWindow.css";
import { Row, Col, Button, Form, InputGroup } from "react-bootstrap";


const BiddingWindow = ({currentPrice, remainingQty, onPlaceBid}) => {
    const [bidAmount, setBidAmount] = useState(0);

    async function handleSubmit (){
        console.log("submitting new bid...");
        onPlaceBid(bidAmount);
    };
    
    return (
        <div className="biddingWindow">
            <Form>
                <Row>
                    <Form.Label>Token Bidding</Form.Label>
                    <InputGroup>
                        <Button variant="outline-secondary" onClick={(e)=> setBidAmount((Number.isNaN(bidAmount) || bidAmount-10<0) ? 0 : bidAmount-10)}>- 10</Button>
                        <Button variant="outline-secondary" onClick={(e)=> setBidAmount((Number.isNaN(bidAmount) || bidAmount-1<0) ? 0 : bidAmount-1)}>- 1</Button>
                        <Form.Control
                        placeholder="Token Amount"
                        aria-label="User's desired token amount"
                        type="number"
                        value={bidAmount}
                        onChange={(e) => {console.log("remainingQty",remainingQty); setBidAmount(e.target.value>remainingQty ? remainingQty : parseInt(e.target.value))}}
                        required
                        />
                        <Button variant="outline-secondary" onClick={(e)=> setBidAmount(Number.isNaN(bidAmount) ? 1: (bidAmount+1>remainingQty ? remainingQty:bidAmount+1))}>+ 1</Button>
                        <Button variant="outline-secondary" onClick={(e)=> setBidAmount(Number.isNaN(bidAmount) ? 10: (bidAmount+10>remainingQty ? remainingQty:bidAmount+10))}>+ 10</Button>
                    </InputGroup>
                </Row>
                <Row className="buttonRow">
                    <Col>
                    Estimated Total cost: {Number.isNaN(bidAmount) ? 0 : bidAmount*currentPrice} eth
                    </Col>
                    <Col className="buttonCol">
                    {remainingQty>0 && <Button onClick={handleSubmit}>Place Bid</Button>}
                    {remainingQty==0 && <Button disabled>Place Bid</Button>}
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default BiddingWindow;

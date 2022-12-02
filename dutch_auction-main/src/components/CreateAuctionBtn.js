import React, { Component } from "react";
import "./CreateAuctionBtn.css";
import { Button, Modal, Form, Row, Col, InputGroup } from "react-bootstrap";

//https://github.com/learnetto/react-form-validation-demo/blob/master/src/Form.js
class CreateAuctionBtn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            show: false,
            name: "",
            symbol: "",
            quantity: "",
            startDateTime: this.dateTimeNow(),
            startingPrice: "",
            discountRate: "",
            lowestBid: "",
            formErrors: {
                name: "",
                symbol: "",
                quantity: "",
                startDateTime: "",
                startingPrice: "",
                discountRate: "",
                lowestBid: "",
            },
            nameValid: false,
            symbolValid: false,
            quantityValid: false,
            startDateTimeValid: false,
            startingPriceValid: false,
            discountRateValid: false,
            lowestBidValid: false,
            formValid: false,
        };

        this.handleShow = this.handleShow.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.dateTimeNow = this.dateTimeNow.bind(this);
    }
    handleShow() {
        this.setState({
            show: !this.state.show,
        });
        // return this.state.show;
    }

    // string memory _name, string memory _symbol, uint _quantity, uint _startingPrice, uint _discountRate, uint _lowestPossibleBid
    async handleSubmit() {
        console.log("submitting new auction...");

        const auctionProps = {
            name: this.state.name,
            symbol: this.state.symbol,
            quantity: this.state.quantity,
            startingPrice: this.state.startingPrice,
            discountRate: this.state.discountRate,
            lowestPossibleBid: this.state.lowestBid,
            startDateTime: new Date(this.state.startDateTime).getTime() / 1000,
        };
        this.props.onCreateAuction(auctionProps);

        //reset state
        this.setState({
            show: false,
            name: "",
            symbol: "",
            quantity: "",
            startDateTime: this.dateTimeNow(),
            startingPrice: "",
            discountRate: "",
            lowestBid: "",
            formErrors: {
                name: "",
                symbol: "",
                quantity: "",
                startDateTime: "",
                startingPrice: "",
                discountRate: "",
                lowestBid: "",
            },
            nameValid: false,
            symbolValid: false,
            quantityValid: false,
            startDateTimeValid: false,
            startingPriceValid: false,
            discountRateValid: false,
            lowestBidValid: false,
            formValid: false,
        });

        // close modal
        this.handleShow();
    }

    handleUserInput = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        this.setState({ [name]: value }, () => {
            this.validateField(name, value);
        });
    };
    validateField(fieldName, value) {
        let fieldValidationErrors = this.state.formErrors;
        let symbolValid = this.state.symbolValid;
        let quantityValid = this.state.quantityValid;
        let startDateTimeValid = this.state.startDateTimeValid;
        let startingPriceValid = this.state.startingPriceValid;
        let discountRateValid = this.state.discountRateValid;
        let lowestBidValid = this.state.lowestBidValid;

        switch (fieldName) {
            case "name":
                const isNameValidPromise = this.props.isAuctionNameValid(value);
                isNameValidPromise.then((value) => {
                    fieldValidationErrors.name = value
                        ? ""
                        : "Name is already used";
                    this.setState(
                        { nameValid: value, formErrors: fieldValidationErrors },
                        this.validateForm
                    );
                });
                break;
            case "symbol":
                // TODO can symbols be the same?
                const isAuctionValidPromise = this.props.isAuctionSymbolValid(value);
                isAuctionValidPromise.then((value) => {
                    fieldValidationErrors.symbol = value
                        ? ""
                        : "Symbol is already used";
                    this.setState(
                        { symbolValid: value, formErrors: fieldValidationErrors },
                        this.validateForm
                    )})
                symbolValid = value.length >= 3 && value.length <= 4;
                if (!symbolValid){
                    console.log(this.state.formErrors.symbol)
                    fieldValidationErrors.symbol = this.state.formErrors.symbol + " Symbol must be between length 3-4"
                    this.setState(
                        { symbolValid: value, formErrors: fieldValidationErrors },
                        this.validateForm
                    )
                }
                // fieldValidationErrors.symbol = symbolValid
                //     ? ""
                //     : "Symbol must be between length 3-5.";
                
                break;
            case "quantity":
                quantityValid = value > 0;
                fieldValidationErrors.quantity = quantityValid
                    ? ""
                    : "Quantity must be bigger than 0.";
                break;
            case "startDateTime":
                startDateTimeValid = Date.parse(value) > Date.now();
                fieldValidationErrors.startDateTime = startDateTimeValid
                    ? ""
                    : "Starting datetime must be bigger than current time.";
                break;
            case "startingPrice":
                const lowestBid = this.state.lowestBid
                    ? this.state.lowestBid
                    : 0;
                startingPriceValid = (parseInt(value) > 0) & (parseInt(value) > parseInt(lowestBid));

                if (startingPriceValid) {
                    fieldValidationErrors.startingPrice = "";
                } else {
                    fieldValidationErrors.startingPrice =
                        value > 0
                            ? "Starting price must be bigger than the lowest bid."
                            : "Starting price must be bigger than 0 ETH.";
                }
                if (value > lowestBid) {
                    fieldValidationErrors.lowestBid = "";
                }
                break;
            case "discountRate":
                discountRateValid = value > 0;
                fieldValidationErrors.discountRate = discountRateValid
                    ? ""
                    : "Discount rate must be bigger than 0 ETH.";
                break;
            case "lowestBid":
                const startPrice = this.state.startingPrice
                    ? this.state.startingPrice
                    : 0;
                lowestBidValid = (parseInt(value) > 0) & (parseInt(value) < parseInt(startPrice));

                if (lowestBidValid) {
                    fieldValidationErrors.lowestBid = "";
                } else {
                    fieldValidationErrors.lowestBid =
                        value > 0
                            ? "Lowest bid must be lower than the starting price."
                            : "Lowest bid must be bigger than 0 ETH.";
                }
                if (value < startPrice) {
                    fieldValidationErrors.startingPrice = "";
                }
                break;
            default:
                break;
        }
        this.setState(
            {
                formErrors: fieldValidationErrors,
                symbolValid: symbolValid,
                quantityValid: quantityValid,
                startDateTimeValid: startDateTimeValid,
                startingPriceValid: startingPriceValid,
                discountRateValid: discountRateValid,
                lowestBidValid: lowestBidValid,
            },
            this.validateForm
        );
    }

    validateForm() {
        this.setState({
            formValid:
                this.state.nameValid &&
                this.state.symbolValid &&
                this.state.quantityValid &&
                this.state.startDateTimeValid &&
                this.state.startingPriceValid &&
                this.state.discountRateValid &&
                this.state.lowestBidValid,
        });
    }

    dateTimeNow() {
        // Parse our locale string to [date, time]
        var date = new Date()
            .toLocaleString("en-US", { hour12: false })
            .split(" ");

        // Now we can access our time at date[1], and monthdayyear @ date[0]
        var time = date[1];
        var mdy = date[0];

        // We then parse  the time into parts
        time = time.split(":");
        var hh =
            parseInt(time[0]) > 9
                ? "" + parseInt(time[0])
                : "0" + parseInt(time[0]);
        var mm =
            parseInt(time[1]) > 9
                ? "" + parseInt(time[1])
                : "0" + parseInt(time[1]);

        // We then parse  the mdy into parts
        mdy = mdy.split("/");
        var month = parseInt(mdy[0]);
        var day = parseInt(mdy[1]);
        var year = parseInt(mdy[2]);

        // Putting it all together
        // yyyy-MM-ddThh:mm
        var formattedDateTime =
            year + "-" + month + "-" + day + "T" + hh + ":" + mm;

        // console.log(formattedDateTime);
        return formattedDateTime;
    }

    render() {
        return (
            <div>
                <Button
                    className="float-end me-5"
                    variant="outline-primary"
                    onClick={this.handleShow}
                >
                    Create New Auction
                </Button>
                <Modal
                    show={this.state.show}
                    onHide={this.handleShow}
                    size="lg"
                    backdrop="static"
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Create New Auction</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group
                                as={Row}
                                className="mb-3"
                                controlId="formTokenName"
                            >
                                <Form.Label column sm="2">
                                    Token Name:
                                </Form.Label>
                                <Col sm="10">
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter token name"
                                        name="name"
                                        value={this.state.name}
                                        onChange={this.handleUserInput}
                                    />
                                    <span className="mb-3 text-danger">
                                        {this.state.nameValid
                                            ? ""
                                            : this.state.formErrors.name}
                                    </span>
                                </Col>
                            </Form.Group>
                            <Form.Group
                                as={Row}
                                className="mb-3"
                                controlId="formTokenSymbol"
                            >
                                <Form.Label column sm="2">
                                    Token Symbol:
                                </Form.Label>
                                <Col sm="10">
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter token symbol"
                                        name="symbol"
                                        value={this.state.symbol}
                                        onChange={this.handleUserInput}
                                    />
                                    <span className="mb-3 text-danger">
                                        {this.state.symbolValid
                                            ? ""
                                            : this.state.formErrors.symbol}
                                    </span>
                                </Col>
                            </Form.Group>
                            <Form.Group
                                as={Row}
                                className="mb-3"
                                controlId="formQuantity"
                            >
                                <Form.Label column sm="2">
                                    Quantity:
                                </Form.Label>
                                <Col sm="10">
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        placeholder="Enter quantity"
                                        name="quantity"
                                        value={this.state.quantity}
                                        onChange={this.handleUserInput}
                                    />
                                    <span className="mb-3 text-danger">
                                        {this.state.quantityValid
                                            ? ""
                                            : this.state.formErrors.quantity}
                                    </span>
                                </Col>
                            </Form.Group>
                            <Form.Group
                                as={Row}
                                className="mb-3"
                                controlId="formStartingDateTime"
                            >
                                <Form.Label column sm="2">
                                    Starting DateTime:
                                </Form.Label>
                                <Col sm="10">
                                    <InputGroup as={Row}>
                                        <Col sm="5">
                                            <input
                                                type="datetime-local"
                                                id="StartingDateTime"
                                                min={this.dateTimeNow()}
                                                // value={dateTimeNow()}
                                                // max="2018-06-14T00:00"
                                                name="startDateTime"
                                                value={this.state.startDateTime}
                                                onChange={this.handleUserInput}
                                            ></input>
                                        </Col>
                                        <span className="text-danger">
                                            {this.state.startDateTimeValid
                                                ? ""
                                                : this.state.formErrors
                                                      .startDateTime}
                                        </span>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Select a date time that is greater than
                                        current date time.
                                    </Form.Text>
                                </Col>
                            </Form.Group>

                            <Form.Group
                                as={Row}
                                className="mb-3"
                                controlId="formStartingPrice"
                            >
                                <Form.Label column sm="2">
                                    Starting Price:
                                </Form.Label>
                                <Col sm="10">
                                    <InputGroup>
                                        <InputGroup.Text>ETH</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            placeholder="Enter starting price"
                                            name="startingPrice"
                                            value={this.state.startingPrice}
                                            onChange={this.handleUserInput}
                                        />
                                    </InputGroup>
                                    <span className="mb-3 text-danger">
                                        {this.state.startingPriceValid
                                            ? ""
                                            : this.state.formErrors
                                                  .startingPrice}
                                    </span>
                                </Col>
                            </Form.Group>
                            <Form.Group
                                as={Row}
                                className="mb-3"
                                controlId="formDiscountRate"
                            >
                                <Form.Label column sm="2">
                                    Discount Rate:
                                </Form.Label>
                                <Col sm="10">
                                    <InputGroup>
                                        <InputGroup.Text>ETH</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            placeholder="Enter discount rate"
                                            name="discountRate"
                                            value={this.state.discountRate}
                                            onChange={this.handleUserInput}
                                        />
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Rate at which bid will decrease every
                                        minute.
                                    </Form.Text>
                                </Col>
                                <div className="sm-10 offset-sm-2">
                                    <span className="text-danger">
                                        {this.state.discountRateValid
                                            ? ""
                                            : this.state.formErrors
                                                  .discountRate}
                                    </span>
                                </div>
                            </Form.Group>
                            <Form.Group
                                as={Row}
                                className="mt-3"
                                controlId="formLowestBid"
                            >
                                <Form.Label column sm="2">
                                    Lowest Bid:
                                </Form.Label>
                                <Col sm="10">
                                    <InputGroup>
                                        <InputGroup.Text>ETH</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            placeholder="Enter lowest bid"
                                            name="lowestBid"
                                            value={this.state.lowestBid}
                                            onChange={this.handleUserInput}
                                        />
                                    </InputGroup>
                                    <span className="text-danger">
                                        {this.state.lowestBidValid
                                            ? ""
                                            : this.state.formErrors.lowestBid}
                                    </span>
                                </Col>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.handleShow}>
                            Close
                        </Button>
                        <Button
                            variant="primary"
                            onClick={this.handleSubmit}
                            disabled={!this.state.formValid}
                        >
                            Submit
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

export default CreateAuctionBtn;

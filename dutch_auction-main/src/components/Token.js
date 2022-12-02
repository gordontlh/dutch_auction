import React from "react";
import "./Token.css";
import Col from 'react-bootstrap/Col';


const Token = ({name, symbol}) => {
    return (
        <div className="token">
                <div className="avatar">
                    <span>
                    {symbol.substring(0,3)}
                    </span>
                </div>
                <div>{name}</div>
        </div>
    );
};

export default Token;

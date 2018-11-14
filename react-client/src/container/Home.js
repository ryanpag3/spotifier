import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import homeAPI from '../api/homeAPI';

export default class Home extends Component {
    render() {
        return (
            <div><Link to="" onClick={homeAPI.login}>Login</Link></div>
        );
    }
}


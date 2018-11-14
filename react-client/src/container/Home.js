import React, { Component } from 'react';
import homeAPI from '../api/homeAPI';

export default class Home extends Component {
    render() {
        return (
            <div><a onClick={homeAPI.login} href={'#'}>Login</a></div>
        );
    }
}


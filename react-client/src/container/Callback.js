import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import querystring from 'query-string';
import Cookie from 'universal-cookie';

const cookies = new Cookie();

class Callback extends Component {

    constructor(props) {
        super(props);
        this.authState = cookies.get('spotify_auth_state');
        this.user = cookies.get('spotify_username');
    }

    async componentDidMount() {
        await this.apiCallback(querystring.parse(this.props.location.search));
    }

    render() {
        return (
            <div>
                Callback baby!

                {JSON.stringify(querystring.parse(this.props.location.search))}

                Auth state: {this.authState}<br/><br/>
                User: {JSON.stringify(this.user)}
            </div>
        );
    }

    async apiCallback(queryParamObj) {
        console.log(JSON.stringify(queryParamObj));
        const res = await fetch('/user/callback', {
            method: 'post', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(queryParamObj)
        });
        console.log(res);
    }

}

export default Callback;
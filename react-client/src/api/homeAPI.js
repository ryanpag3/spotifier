import React from 'react';
import { Redirect } from 'react-router-dom';

export default class HomeAPI {
    static async login() {
        try {
            const res = await fetch('/user/login', {method: 'GET', redirect: 'follow'});
            console.log(res);
            <Redirect to=""
        } catch (e) {
            console.log(e);
        }
    }
}
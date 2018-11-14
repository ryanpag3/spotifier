import { Redirect } from 'react-router-dom';

export default class HomeAPI {
    static async login() {
        const res = await fetch('/api/user/test');
        const loginURL = await res.json();
        console.log(loginURL);
        window.location.assign(loginURL);
    }
}
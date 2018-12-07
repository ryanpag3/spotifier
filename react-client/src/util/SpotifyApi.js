import querystring from 'querystring';
import request from 'request-promise';
import LocalStorage from './LocalStorage';
import Util from '../util/Util';

const SPOTIFY_BASE = 'https://api.spotify.com';
const SEARCH_PATH = '/v1/search';

export default class SpotifyApi {
    user;

    constructor() {
        this.user = this.getUser();
        console.log(this.user);
    }

    async init() {
        console.log('init spotify api');
        this.user.access_token = await this.getAccessToken();
        console.log(this.user);
    }

    getUser() {
        if (!this.userExists()) 
            throw new Error('Cannot find user. Please try logging out and in again.');
        return JSON.parse(Buffer.from(localStorage.getItem(LocalStorage.SPOTIFIER_USER), 'base64').toString('utf8'));
    }

    userExists() {
        const usr = localStorage.getItem(LocalStorage.SPOTIFIER_USER);
        return usr !== undefined;
    }

    mergePath(baseUrl, path) {
        return baseUrl + path;
    }


    qs(queryObj) {
        return '?' + querystring.stringify(queryObj);
    }

    async getAccessToken() {
        const res = await fetch('/user/access-token', {
            method: 'GET',
            headers: {
                ...Util.getReactHeader(),
                refresh_token: this.user.refresh_token
            }
        });

        const obj = await res.json();
        return obj.access_token;
    }

    async search(query) {
        console.log(this.qs({
            q: query,
            type: 'album,artist,track'
        }));

        const options = {
            method: 'GET',
            uri: SPOTIFY_BASE + SEARCH_PATH,
            qs: {
                q: query + '*',
                type: 'album,artist,track'
            },
            headers: {
                Authorization: 'Bearer ' + this.user.access_token
            }
            
        }
        return await request(options);
    }

}
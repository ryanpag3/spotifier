import React, { Component } from 'react';
import LocalStorage from '../util/LocalStorage';
import Util from '../util/Util';

export default class LibraryAPI extends Component {

    static async sync() {
        try {
            const res = await fetch('/library/sync', {method: 'GET', headers: {
                ...Util.getReactHeader()
            }});
        } catch (e) {
            this.props.history.push('/error');
        }
    }

    static async get() {
        try {
           const res = await fetch('/library', {method: 'GET', headers: {
               ...Util.getReactHeader()
           }});
           const json = await res.json();
           console.log(json); 
           return json;
        } catch (e) {
            this.props.history.push('/error');
        }
    }
}
import React, {
    Component
} from 'react';
import LocalStorage from '../util/LocalStorage';
import Util from '../util/Util';

export default class LibraryAPI extends Component {

    static async sync() {
        try {
            const res = await fetch('/library/sync', {
                method: 'GET',
                headers: {
                    ...Util.getReactHeader()
                }
            });
        } catch (e) {
            console.log(e);
            // this.props.history.push('/error');
        }
    }

    static async get() {
        try {
            const res = await fetch('/library/get', {
                method: 'GET',
                headers: {
                    ...Util.getReactHeader()
                }
            });
            // console.log(res);
            if (res.status !== 200)
                return [];

            const json = await res.json();
            //    console.log(json); 
            return json;
        } catch (e) {
            console.log(e);
            // this.props.history.push('/error');
        }
    }
}
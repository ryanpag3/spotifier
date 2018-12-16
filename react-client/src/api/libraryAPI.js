import {
    Component
} from 'react';
import Util from '../util/Util';

export default class LibraryAPI extends Component {

    static async sync() {
        try {
            await fetch('/library/sync', {
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
            if (res.status !== 200)
                return [];

            const json = await res.json();
            return json;
        } catch (e) {
            console.log(e);
            // this.props.history.push('/error');
        }
    }

    static async removeSelected(artists) {
        try {
            await fetch('/library/remove-selected', {
                method: 'POST',
                headers: {
                    ...Util.getReactHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    artists: artists
                })
            });
        } catch (e) {
            console.log(e);
        }
    }

    static async addArtist(artist) {
        console.log('hmm');
        try {
            const result = await fetch('/library/add', {
                method: 'POST',
                headers: {
                    ...Util.getReactHeader(),
                    'Content-Tye': 'application/json'
                },
                body: JSON.stringify({
                    artist: artist
                })
            })
        console.log(result);
        } catch (e) {
            console.log(e.toString());
        }
    }
}
import React, { Component } from 'react';
import Fuse from 'fuse.js';
import SearchResult from './SearchResult';
import SpotifyApi from '../util/SpotifyApi';

import './Search.css';

const SEARCH_RESULTS_LEN = 5;


class Search extends Component {
    state = {
        results : [],
        query: ''
    }
    spotifyApi = new SpotifyApi();

    constructor(props) {
        super(props);
    }

    async componentDidMount() {
        await this.spotifyApi.init();
        // await this.spotifyApi.search('A*');
    }

    async search(query) {
        if (query === '') return;
        try {
            const payload = await this.spotifyApi.search(query);
            let results = this.fuzzySort(JSON.parse(payload), query);
            this.setState({ results: results});
            this.setState({ query: query });
        } catch (e) {
            console.log(e);
        }
    }

    fuzzySort(searchResult, query) {
        console.log(searchResult);
        console.log('.......')
        const options = {
            shouldSort: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            keys: [
                'name'
            ]
        }
        const combined = [...searchResult.artists.items, ...searchResult.albums.items, ...searchResult.tracks.items];
        const fuse = new Fuse(combined, options);
        const results = fuse.search(query);
        // console.log(results);
        return results.slice(0, SEARCH_RESULTS_LEN);
    }

    normalizeSearchResults(rawResults, maxLength) {
        // map rawResults and get artist release if it's an artist result
    }

    render() {
        return (
            <div className="search-container">
                <input onChange={(e) => this.search(e.target.value)}></input>
                <SearchResult query={this.state.query} results={this.state.results}/>
            </div>
        );
    }
}

export default Search;
import React, { Component } from 'react';
import { IoMdAdd, IoMdClose, IoMdCheckmark } from 'react-icons';
import Fuse from 'fuse.js';
import SearchResult from './SearchResult';
import SpotifyApi from '../util/SpotifyApi';
import LocalStorage from '../util/LocalStorage';

import './Search.css';

const SEARCH_RESULTS_LEN = 60;

class Search extends Component {
    state = {
        results : [],
        query: '',
        searchPrefs: {
            artists: true,
            albums: false,
            tracks: false
        }
    }
    spotifyApi = new SpotifyApi();

    async componentDidMount() {
        this.init();
        await this.spotifyApi.init();
    }

    init() {
        this.setInitialSearchPrefs();
    }

    setInitialSearchPrefs() {
        const prefsStr = LocalStorage.get(LocalStorage.SPOTIFIER_SEARCH_PREFS, true);
        if (!prefsStr)
            return;
        console.log(prefsStr);
        const prefs = JSON.parse(prefsStr);
        this.setState({ searchPrefs: prefs });
    }

    toggleCheck(key) {
        let prefs = this.state.searchPrefs;
        prefs[key] = !prefs[key];
        this.setState({ searchPrefs: prefs });
        this.persistSettings();
    }

    persistSettings() {
        LocalStorage.insert(LocalStorage.SPOTIFIER_SEARCH_PREFS, JSON.stringify(this.state.searchPrefs));
    }

    async search(query) {
        if (query === '') return;
        try {
            const payload = await this.spotifyApi.search(query);
            // console.log(JSON.parse(payload));
            let results = this.fuzzySort(JSON.parse(payload), query);
            this.setState({ results: results});
            this.setState({ query: query });
        } catch (e) {
            console.log(e);
        }
    }

    fuzzySort(searchResult, query) {
        const options = {
            shouldSort: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            keys: [
                'name',
                'artists.name'
            ]
        }
        const combined = this.buildCombinedResults(searchResult);
        const fuse = new Fuse(combined, options);
        const results = fuse.search(query);
        // console.log(results);
        return results.slice(0, SEARCH_RESULTS_LEN);
    }

    buildCombinedResults(rawResults) {
        let combined = [];
        if (this.state.searchPrefs.artists)
            combined = [combined, ...rawResults.artists.items];

        if (this.state.searchPrefs.albums)
            combined = [combined, ...rawResults.albums.items];

        if (this.state.searchPrefs.tracks)
            combined = [combined, ...rawResults.tracks.items];

        return combined;
    }

    normalizeSearchResults(rawResults, maxLength) {
        // map rawResults and get artist release if it's an artist result
    }

    render() {
        return (
            <div className="search-container">
                <input onChange={(e) => this.search(e.target.value)}></input>
                <div>
                    <input type="checkbox" onClick={(e) => this.toggleCheck('artists')} checked={this.state.searchPrefs.artists}/><label> artists </label>
                    <input type="checkbox" onClick={(e) => this.toggleCheck('albums')} checked={this.state.searchPrefs.albums}/><label> albums </label>
                    <input type="checkbox" onClick={(e) => this.toggleCheck('tracks')} checked={this.state.searchPrefs.tracks}/><label> tracks </label>
                </div>
                <SearchResult query={this.state.query} results={this.state.results}/>
            </div>
        );
    }
}

export default Search;
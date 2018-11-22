import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'semantic-ui-react';
import Fuse from 'fuse.js';
import Button from '@material-ui/core/Button';
import LibraryApi from '../api/libraryAPI';
import ReleaseTable from '../component/ReleaseTable';

class Library extends Component {
    constructor() {
        super();
        this.state = {
            library: []
        };

        // this.searchArtists = this.searchArtists.bind(this);
    };

    async initialize() {
        console.log('initializing user library');
        const payload = await LibraryApi.get();
        this.setState({ library: payload ? payload.library : [] });
        this.setState({ masterLibrary: payload ? payload.library : [] }); // backup for filtering
    }

    async componentDidMount() {
        this.initialize();
    }

    filterLibrary(filterQuery) {
        if (filterQuery === '') {
            this.resetLibraryToMaster();
            return;
        }

        const options = {
            shouldSort: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                'name',
                'recent_release.title'
            ]
        }

        const fuse = new Fuse(this.state.masterLibrary, options);
        const result = fuse.search(filterQuery);
        this.setState({library: result});
    }

    searchArtists(e) {
        if (e.keyCode !== 13) return;
        this.filterLibrary(e.target.value);
    }

    resetLibraryToMaster() {
        this.setState({library: this.state.masterLibrary})
    }

    render() {
        return (
            <div className="library-container">
                <Button variant="contained" onClick={LibraryApi.sync}>
                    Sync Library
                </Button>
                <Input icon='search' placeholder='Search...' onKeyDown={(e) => this.searchArtists(e)} onChange={(e) => this.filterLibrary(e.target.value)}/>
                <ReleaseTable library={this.state.library}/>
            </div>
        );
    }
}

Library.propTypes = {

};

export default Library;
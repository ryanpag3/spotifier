import React, { Component } from 'react';
import { Input } from 'semantic-ui-react';
import Fuse from 'fuse.js';
import ArraySort from 'array-sort';
import Button from '@material-ui/core/Button';
import LibraryApi from '../api/libraryAPI';
import ReleaseTable from '../component/ReleaseTable';

const ASCENDING = true;
const DESCENDING = false;
const SortTypes = {
    ARTIST: 'artist',
    RELEASE: 'release',
    DATE: 'date'
};

class Library extends Component {
    constructor(props) {
        super(props);
        this.state = {
            library: [],
            sort: {
                type: null, // artist, release, date
                sorted: null
            }
        };
    };

    async initialize() {
        console.log('initializing user library');
        const payload = await LibraryApi.get();
        console.log(payload.library);
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

    sort(sortType) {
        const SortFields = {
            artist: 'name',
            release: 'recent_release.title',
            date: 'recent_release.release_date'
        };
        const sortField = SortFields[sortType];
        this.addDecaseProperty(this.state.library, sortField);
        const result = ArraySort(this.state.library || [], 'sortkey');
        if (this.state.sort.sorted === ASCENDING) result.reverse();
        this.setState({
            library: result,
            sort: {
                type: sortType,
                sorted: this.state.sort.type === sortType ? !this.state.sort.sorted : ASCENDING
            }
        });
    }

    addDecaseProperty(jsonArr, property) {
        jsonArr = jsonArr.map(json => {
            json['sortkey'] = this.getDescendantProp(json,property).toLowerCase();
            return json;
        });
    }

    getDescendantProp(obj, desc) {
        var arr = desc.split(".");
        while(arr.length && (obj = obj[arr.shift()]));
        return obj;
    }
    

    render() {
        return (
            <div className="library-container">
                <Button variant="contained" onClick={LibraryApi.sync}>
                    Sync Library
                </Button>
                <Input icon='search' placeholder='Search...' onKeyDown={(e) => this.searchArtists(e)} onChange={(e) => this.filterLibrary(e.target.value)}/>
                <div className="sortbar-container">
                    <button onClick={() => this.sort('artist')}>Artist</button> |&nbsp;
                    <button onClick={() => this.sort('release')}>Release</button> |&nbsp;
                    <button onClick={() =>this.sort('date')}>Date</button>
                </div>
                <ReleaseTable library={this.state.library}/>
            </div>
        );
    }
}

Library.propTypes = {

};

export default Library;
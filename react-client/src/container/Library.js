import React, { Component } from 'react';
import { Input } from 'semantic-ui-react';
import Fuse from 'fuse.js';
import ArraySort from 'array-sort';
import Button from '@material-ui/core/Button';
import LibraryApi from '../api/libraryAPI';
import ReleaseTable from '../component/ReleaseTable';
import SortIndicator from '../component/SortIndicator';
import Search from '../component/Search';

import './Library.css';

const DESCENDING = false;

class Library extends Component {
    constructor(props) {
        super(props);
        this.state = {
            library: [],
            selectEnabled: localStorage.getItem('spotifier_select_enabled') || false,
            sort: {
                type: null, // artist, release, date
                sorted: null
            },
            hideSearch: false
        };
    };

    async initialize() {
        console.log('initializing user library');
        const payload = await LibraryApi.get();
        this.setState({ library: payload ? payload.library.slice() : [] });
        this.setState({ masterLibrary: payload ? payload.library.slice() : [] }); // backup for filtering
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
        this.setState({
            library: this.state.masterLibrary.slice(),
            sort: {
                type: null,
                sorted: null
            }
        });
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
        if (this.state.sort.sorted !== DESCENDING) result.reverse();
        this.setState({
            library: result,
            sort: {
                type: sortType,
                sorted: this.state.sort.type === sortType ? !this.state.sort.sorted : DESCENDING
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

    toggleSelectColumn() {
        const bool = !(String(this.state.selectEnabled) === 'true');
        localStorage.setItem('spotifier_select_enabled', bool);
        this.setState({ selectEnabled: bool });
    }

    selectedReleaseCallback(index) {
        const library = this.state.library;
        library[index].checked = library[index].checked ? !library[index].checked : true;
        this.setState({ library: library });
    }

    toggleSelectAll() {
        let library = this.state.library;
        library = library.map((release) => {
            release.checked =  release.checked !== undefined ? !release.checked : true;
            return release;
        });
        this.setState({ library: library });
    }

    async removeSelected() {
        const selected = this.state.library.filter((element) => element.checked === true);
        try {
            await LibraryApi.removeSelected(selected);
            const library = this.state.library.filter(element => element.checked !== true);
            this.setState({ library: library })
        } catch (e) {
            console.log(e);
        }
    }

    async deletedCallback(index) {
        try {
            const selected = [this.state.library[index]];
            await LibraryApi.removeSelected(selected);
            const library = this.state.library.filter(element => JSON.stringify(element) !== JSON.stringify(selected[0]));
            this.setState({
                library: library
            });
        } catch (e) {
            console.log(e);
        }
    }

    closeSearchWindowCallback() {
        this.setState({ hideSearch: true })
    }

    render() {
        return (
            <div className={`library-container`}>
                <Button variant="contained" onClick={LibraryApi.sync}>
                    Sync Library
                </Button>
                <Input icon='search' placeholder='Search...' onKeyDown={(e) => this.searchArtists(e)} onChange={(e) => this.filterLibrary(e.target.value)}/>
                <div className={`sortbar-container`}>
                    <SortIndicator direction={this.state.sort.sorted} type={this.state.sort.type}/>
                    <button onClick={() => this.sort('artist')}>Artist</button>&nbsp;|&nbsp;
                    <button onClick={() => this.sort('release')}>Release</button>&nbsp;|&nbsp;
                    <button onClick={() =>this.sort('date')}>Date</button>&nbsp;|&nbsp;
                    <button onClick={() => this.resetLibraryToMaster()}>Reset</button>
                    <button onClick={() => this.removeSelected()} className="select-toggle">Remove</button> &nbsp;|&nbsp;
                    <button onClick={() => this.toggleSelectColumn()}>Select</button> &nbsp;|&nbsp;
                    <button onClick={() => this.toggleSelectAll()}>Select All</button>
                </div>
                {
                this.state.hideSearch ? null :
                <Search closeSearchWindowCallback={() => this.closeSearchWindowCallback()} library={this.state.library}/>
                }
                <ReleaseTable 
                    className="release-table"
                    library={this.state.library} 
                    selectedCallback={(index) => this.selectedReleaseCallback(index)} 
                    deletedCallback={index => this.deletedCallback(index)}
                    selectEnabled={this.state.selectEnabled} />
            </div>
        );
    }
}

Library.propTypes = {

};

export default Library;
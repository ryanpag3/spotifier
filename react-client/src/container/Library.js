import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import LibraryApi from '../api/libraryAPI';
import ReleaseTable from '../component/ReleaseTable';

class Library extends Component {
    constructor() {
        super();
        this.state = {
            library: []
        };
    };

    async initialize() {
        console.log('initializing user library');
        const payload = await LibraryApi.get();
        this.setState({ library: payload ? payload.library : [] });
    }

    async componentDidMount() {
        this.initialize();
    }

    render() {
        return (
            <div>
                <Button variant="contained" onClick={LibraryApi.sync}>
                    Sync Library
                </Button><br/><br/>
                <ReleaseTable library={this.state.library}/>
            </div>
        );
    }
}

Library.propTypes = {

};

export default Library;
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import LibraryApi from '../api/libraryAPI';
import ReleaseTable from '../component/ReleaseTable';

class Library extends Component {
    render() {
        return (
            <div>
                <Button variant="contained" onClick={LibraryApi.sync}>
                    Sync Library
                </Button><br/><br/>
                <ReleaseTable />
            </div>
        );
    }
}

Library.propTypes = {

};

export default Library;
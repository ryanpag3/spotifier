import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LibraryApi from '../api/libraryAPI';


class ReleaseTable extends Component {
    releases; // fetched on mount

    async componentDidMount() {
        // this.state.library = await LibraryApi.get();
        // this.setState({library: await LibraryApi.get()});
    };

    render() {
        return (
            <div>
                ReleaseTable<br/>
                asd {this.library}
            </div>
        );
    }
}

ReleaseTable.propTypes = {

};

export default ReleaseTable;
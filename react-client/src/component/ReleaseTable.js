import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Header, Image, Table } from 'semantic-ui-react';
import ReactJson from 'react-json-view';
import LibraryApi from '../api/libraryAPI';


class ReleaseTable extends Component {
    releases; // fetched on mount

    table = {
        headers: ['', '', 'Artist', 'New Release', 'Date']
    };

    constructor(props) {
        super(props);
        this.state = {
            library : []
        };
    }

    async componentDidMount() {
        // console.log(await LibraryApi.get());
        // this.state.library = await LibraryApi.get();
        const payload = await LibraryApi.get();
        this.setState({ library: payload.library });
    };

    render() {
        return (
            <div>
                ReleaseTable<br/>
                <ReactJson src={this.state.library} collapsed="true"></ReactJson>
                <Table>
                    <Table.Header>
                    <Table.Row>
                        {this.table.headers.map(header => {
                            return (
                                <Table.HeaderCell>{header}</Table.HeaderCell>
                            );
                        })}
                    </Table.Row>
                </Table.Header>
                </Table>
            </div>
        );
    }
}

ReleaseTable.propTypes = {

};

export default ReleaseTable;
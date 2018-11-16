import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Header, Image, Table } from 'semantic-ui-react';
import Button from '@material-ui/core/Button';
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

                    <Table.Body>
                        {this.state.library.map(element => {
                            return (
                                <Table.Row>
                                    <Table.Cell>
                                        <Button></Button>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Image src={this.getRecentReleaseImg(element)}></Image>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {element.name}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {element.recent_release.title}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {element.recent_release.release_date}
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            </div>
        );
    }

    getRecentReleaseImg(release) {
        if (!release.recent_release)
            return '';
        
        if(!release.recent_release.images)
            return '';
        
        const imgs = release.recent_release.images;
        return imgs[imgs.length-1].url;
        
    }
}

ReleaseTable.propTypes = {

};

export default ReleaseTable;
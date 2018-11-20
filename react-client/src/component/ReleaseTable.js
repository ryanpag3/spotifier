import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Header, Image, Table } from 'semantic-ui-react';
import Button from '@material-ui/core/Button';
import ReactJson from 'react-json-view';
import LibraryApi from '../api/libraryAPI';

class ReleaseTable extends Component {
    releases; // fetched on mount

    state = {
        column: null,
        library: [],
        direction: null,
      };

    table = {
        headers: ['', '', 'Artist', 'New Release', 'Date']
    };

    constructor(props) {
        super(props);
        // this.state = {
        //     library : []
        // };
    }

    async componentDidMount() {
        // console.log(await LibraryApi.get());
        // this.state.library = await LibraryApi.get();
        const payload = await LibraryApi.get();
        this.setState({ library: payload.library });
    };

    handleSort = clickedColumn => () => {
        console.log('handling sort');
        const { column, library, direction } = this.state
    
        if (column !== clickedColumn) {
          this.setState({
            column: clickedColumn,
            data: _.sortBy(library, [clickedColumn]),
            direction: 'ascending',
          })
    
          return
        }
    
        this.setState({
          library: library.reverse(),
          direction: direction === 'ascending' ? 'descending' : 'ascending',
        })
    };

    getRecentReleaseImg(release) {
        if (!release.recent_release)
            return '';
        
        if(!release.recent_release.images)
            return '';
        
        const imgs = release.recent_release.images;
        return imgs[imgs.length-1].url;
        
    };

    render() {
        const { column, library, direction } = this.state;

        return (
            <div>
                ReleaseTable<br/>
                {/* <ReactJson src={this.state.library} collapsed="true"></ReactJson> */}
                <Table celled>

                {/* <Table sortable celled fixed> */}
                    <Table.Header>
                        <Table.Row>
                            {this.table.headers.map(header => {
                                return (
                                    <Table.HeaderCell
                                        sorted={column === header && header != '' ? direction : null}
                                        onClick={this.handleSort(header)}
                                    >{header}</Table.HeaderCell>
                                );
                            })}
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {_.map(library, element => {
                            return (
                                <Table.Row>
                                    <Table.Cell>
                                        <Button></Button>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Image src={this.getRecentReleaseImg(element)}></Image>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <a target="_blank" href={element.url}>{element.name}</a>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <a target="_blank" href={element.recent_release.url}>{element.recent_release.title}</a>
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


}

ReleaseTable.propTypes = {

};

export default ReleaseTable;
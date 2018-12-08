import React, { Component } from 'react';
import { List, AutoSizer } from 'react-virtualized';
import { IoMdAdd, IoMdClose, IoMdCheckmark } from 'react-icons/io';

import './SearchResult.css';

const rowHeight = 60; // todo, make config level
const overscanRowCount = 25;

class SearchResult extends Component {


    constructor(props) {
        super(props);
        this.state = {
            results: [],
            query: ''
        }
        this.renderRow = this.renderRow.bind(this);
    }

    componentWillReceiveProps(newProps) {
        this.setState({ results: newProps.results });
        this.setState({ library: newProps.library });
        this.setState({ query: newProps.query });
        this.refs.forceUpdateGrid();
    }

    onSearchBtnHover(id) {
        console.log(id);
    }

    renderRow({index, key, style}) {
        return (
            <div id={this.state.results[index].id} key={key} style={style} className="search-row-container">
                <div onMouseEnter={(e) => this.onSearchBtnHover('hi')} className="search-btn-container">
                    {
                        this.state.results[index].selected || this.isInLibrary(index) ?
                        <button className="no-style-btn"><IoMdCheckmark className="search-result-icon"/></button> :
                        <button className="no-style-btn"><IoMdAdd className="search-result-icon"/></button>
                    }
                </div>
                {this.renderResult(index)}
            </div>
        );
    }

    isInLibrary(index) {
        const result = this.state.results[index];
        return this.state.library.map((e) => e.name).indexOf(result.name) !== -1;
    }
    
    renderResult(index) {
        switch (this.state.results[index].type) {
            case 'artist':
                return this.renderArtistRow(index);
            case 'album':
                return this.renderAlbumRow(index);
            case 'track':
                return this.renderTrackRow(index);
            default:
                return;
        }
    }

    renderArtistRow(index) {
        return (
            <div className="search-row">
                {this.state.results[index].name}
                <div>{this.state.results[index].type}</div>
            </div>
        )
    }

    renderAlbumRow(index) {
        return (
            <div className="search-row">
                {this.state.results[index].name}
                <div className="artist-anchors-container">{this.getArtistAnchors(index)}</div>
                <div>{this.state.results[index].type}</div>
            </div>
        )
    }

    getArtistAnchors(index) {
        return this.state.results[index].artists.map((artist) => {
            return <a key={artist.id} href={artist.uri} rel="noopener noreferrer">{artist.name} </a>;
        });
    }

    renderTrackRow(index) {
        return (
            <div className="search-row">
                {this.state.results[index].name}
                <div className="artist-anchors-container">{this.getArtistAnchors(index)}</div>
                <div>{this.state.results[index].type}</div>
            </div>
        )
    }

    render() {
        return (
            <div className="SearchResult">
                <div className="list">
                    <AutoSizer>
                        {
                            ({ width, height }) => {
                                return <List
                                    style={{ outline: 'none'}}
                                    ref={ref => this.refs = ref}
                                    width={width}
                                    height={height}
                                    rowHeight={rowHeight}
                                    rowRenderer={this.renderRow}
                                    rowCount={this.state.results.length}
                                    overscanRowCount={overscanRowCount}
                                />
                            }
                        }
                    </AutoSizer>
                </div>
            </div>
        );
    }
}

export default SearchResult;
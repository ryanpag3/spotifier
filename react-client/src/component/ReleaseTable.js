import React, { Component } from 'react';
import { List, AutoSizer } from 'react-virtualized';
import ReactJson from 'react-json-view';
import libraryAPI from '../api/libraryAPI';
import './ReleaseTable.css';

import DummyAlbumArt from '../static/dummy-album-art.png';

const rowHeight = 55; // todo, make config level
const overscanRowCount = 25;

export default class ReleaseTable extends Component {
    constructor(props) {
        super(props);
        this.renderRow = this.renderRow.bind(this);
        this.state = {
            library : this.props.library
        };
    }

    componentWillReceiveProps(newProps) {
        this.setState({ library: newProps.library });
    }

    renderRow({ index, key, style }) {
        return (
            <div key={key} style={style} className="row">
                <div className="row-container flex-row center-vert">
                    <div className="album-img-background">
                        <img className="album-img" src={this.getRecentReleaseImg(this.state.library[index])} alt=""/>
                    </div>
                    <div className="album-info flex-col center-vert">
                        <div className="release">
                            <a href={this.state.library[index].recent_release.url}>
                                {this.state.library[index].recent_release.title}
                            </a>
                        </div>
                        <div className="name">
                            <a href={this.state.library[index].url}>
                                {this.state.library[index].name}
                            </a>
                        </div>
                    </div>
                    <div className="release-date-container align-right">
                        <div className="release-date">{new Date(this.state.library[index].recent_release.release_date).toLocaleDateString()}</div>
                    </div>
                </div>

            </div>
        );
    }

    getRecentReleaseImg(release) {
        if (!release.recent_release){
            return DummyAlbumArt;
        }
        
        if(!release.recent_release.images) {
            return DummyAlbumArt;
        }
        
        const imgs = release.recent_release.images;
        return imgs[imgs.length-1].url;
        
    };

    render() {
        return (
            <div className="ReleaseTable">
                <div className="list">
                    <AutoSizer>
                    {
                        ({width, height}) => {
                            return <List
                                width={width}
                                height={height}
                                rowHeight={rowHeight}
                                rowRenderer={this.renderRow}
                                rowCount={this.state.library.length}
                                overscanRowCount={overscanRowCount}/>
                        }
                    }
                    </AutoSizer>
                </div>
            </div>
        );
    }
}
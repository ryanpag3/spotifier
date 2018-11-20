import React, { Component } from 'react';
import { List, AutoSizer } from 'react-virtualized';
import ReactJson from 'react-json-view';
import libraryAPI from '../api/libraryAPI';
import './ReleaseTable.css';

const rowHeight = 50; // todo, make config level
const overscanRowCount = 3;

export default class ReleaseTable extends Component {
    constructor() {
        super();
        this.renderRow = this.renderRow.bind(this);
        this.state = {
            list : []
        };
        this.initialize();
    }

    async initialize() {
        console.log('initializing release library');
        const payload = await libraryAPI.get();
        this.setState({ list: payload ? payload.library : [] });
        console.log('get res');
        console.log(this.state.list);
    }

    renderRow({ index, key, style }) {
        return (
            <div key={key} style={style} className="row">
                <div className="flex-row center-vert">
                    <div className="album-art">
                        <div className="album-img-background">
                            <img className="album-img" src={this.getRecentReleaseImg(this.state.list[index])} alt=""/>
                        </div>
                    </div>
                    <div className="album-info flex-col center-vert">
                        <div className="release">{this.state.list[index].recent_release.title}</div>
                        <div className="name">{this.state.list[index].name}</div>
                    </div>
                    <div className="release-date-container flex-row align-right">
                        <div className="release-date">{this.state.list[index].recent_release.release_date}</div>
                    </div>
                </div>

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
                                rowCount={this.state.list.length}
                                overscanRowCount={overscanRowCount}/>
                        }
                    }
                    </AutoSizer>
                </div>
            </div>
        );
    }
}
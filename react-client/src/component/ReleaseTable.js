import React, { Component } from 'react';
import { List, AutoSizer, Table } from 'react-virtualized';
import { Checkbox } from 'semantic-ui-react';
import { FiMinusCircle } from 'react-icons/fi';
import moment from 'moment';
import './ReleaseTable.css';

import DummyAlbumArt from '../static/dummy-album-art.png';

const rowHeight = 60; // todo, make config level
const overscanRowCount = 25;

export default class ReleaseTable extends Component {
    constructor(props) {
        super(props);
        console.log(typeof this.props.selectEnabled + ' ' + this.props.selectEnabled);
        this.renderRow = this.renderRow.bind(this);
        this.state = {
            library : this.props.library,
            selectEnabled: String(this.props.selectEnabled) === 'true'
        };
        console.log(this.state);
    }

    componentWillReceiveProps(newProps) {
        this.toggleSelectColumn(newProps.selectEnabled);
        this.setState({ library: newProps.library });
        this.refs.forceUpdateGrid();
    }

    toggleSelectColumn(enabled) {
        this.setState({ selectEnabled: enabled });
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
        
    }

    calcHowLongAgo(releaseDate) {
        const now = moment();
        return new moment(releaseDate).from(now);
    }

    handleSelect(index) {
        this.props.selectedCallback(index);
    }

    handleDeleted(index) {
        this.props.deletedCallback(index);
    }

    renderRow({ index, key, style }) {
        return (
            <div key={key} style={style} className="row">
                <div className="row-container flex-row center-vert">
                    {
                    String(this.state.selectEnabled) === 'true' ?
                    <div className="select-container">
                        <Checkbox checked={this.state.library[index].checked} onClick={(e) => this.handleSelect(index)}/>
                    </div>
                    : null
                    }
                    <div className="album-img-background">
                        <img className="album-img" src={this.getRecentReleaseImg(this.state.library[index])} alt=""/>
                    </div>
                    <div className="album-info flex-col center-vert">
                        <div className="release">
                            <a href={this.state.library[index].recent_release.url} target="_blank" rel="noopener noreferrer">
                                {this.state.library[index].recent_release.title}
                            </a>
                        </div>
                        <div className="name">
                            <a href={this.state.library[index].url} target="_blank" rel="noopener noreferrer">
                                {this.state.library[index].name}
                            </a>
                        </div>
                    </div>
                    <div className="release-date-container align-right">
                        <div className="delete-btn-container">
                            <button className="delete-btn" onClick={(index) => this.handleDeleted(index)}><a href="javascript:void(0)"><FiMinusCircle/></a></button>
                        </div>
                        <div className="release-date" 
                                title={this.calcHowLongAgo(this.state.library[index].recent_release.release_date)}>
                                {new Date(this.state.library[index].recent_release.release_date).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className="ReleaseTable">
                <div className="list">
                    <AutoSizer>
                    {
                        ({width, height}) => {
                            return <List
                                ref={ref => this.refs = ref}
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
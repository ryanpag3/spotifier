import React, { Component } from 'react';
import { List, AutoSizer } from 'react-virtualized';
import { Checkbox } from 'semantic-ui-react';
import { FiMinusCircle } from 'react-icons/fi';
import moment from 'moment';
import * as Vibrant from 'node-vibrant';
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
    }

    componentDidMount() {
    }

    componentWillReceiveProps(newProps) {
        this.toggleSelectColumn(newProps.selectEnabled);
        this.setState({ library: newProps.library });
        this.refs.forceUpdateGrid();
        setTimeout(() => this.buildVibranceMap(), 10);
    }

    toggleSelectColumn(enabled) {
        this.setState({ selectEnabled: enabled });
    }

    /**
     * optional high res bool flag
     */ 
    getRecentReleaseImg(release, highRes) {
        if (!release.recent_release){
            return DummyAlbumArt;
        }
        
        if(!release.recent_release.images) {
            return DummyAlbumArt;
        }
        
        const imgs = release.recent_release.images;
        const img = highRes === true ? imgs[0].url : imgs[imgs.length-1].url; 
        
        return img;
        
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

    enableRowBackground(index) {
        const library = this.state.library;
        library[index].showBackground = true;
        this.setState({ library: library });
        // console.log(library);
        this.refs.forceUpdateGrid();
    }

    disableRowBackground(index) {
        const library = this.state.library;
        library[index].showBackground = false;
        this.setState({ library: library });
        this.refs.forceUpdateGrid();
    }

    async buildVibranceMap() {
        let library = this.state.library;
        try {
            for (let i = 0; i < library.length; i++) {
                const url = this.getRecentReleaseImg(library[i]);
                const palette = await Vibrant.from(url).getPalette();
                library[i].palette = palette;
            }
            this.setState({ library: library });
        } catch (e) {
            console.log(e);
        }
    }

    getRowStyle(index) {
        if (!this.state.library[index] || !this.state.library[index].palette) return;
        const { Vibrant, DarkMuted, DarkVibrant, LightMuted, LightVibrant, Muted } = this.state.library[index].palette; 
        const Swatch = LightVibrant || DarkVibrant || Vibrant || Muted || LightMuted || DarkMuted || {r: 0, b: 0, g: 0};
        return {
            backgroundColor: `rgba(${Swatch.r}, ${Swatch.g}, ${Swatch.b}, .2)`
        }
    }

    renderRow({ index, key, style }) {
        return (
            <div key={key} style={style} className="row">
                <div onMouseEnter={(e) => this.enableRowBackground(index)} 
                        onMouseLeave={(e) => this.disableRowBackground(index)}
                        className="row-container flex-row center-vert">
                    {
                        this.state.library[index].showBackground ?
                        <div className="row-background-container" style={this.getRowStyle(index)}>
                            {/* <img className="background-img" src={this.getRecentReleaseImg(this.state.library[index])} alt=""></img> */}
                        </div> :
                        null
                    }
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
                            <button className="delete-btn" onClick={(e) => this.handleDeleted(index)}><FiMinusCircle className="icon-hover"/></button>
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
                                style={{ outline: 'none' }}
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
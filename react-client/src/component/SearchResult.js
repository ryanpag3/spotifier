import React, { Component } from 'react';

class SearchResult extends Component {
    state = {
        results: [],
        query: ''
    }

    componentWillReceiveProps(newProps) {
        this.setState({ results: newProps.results });
        this.setState({ query: newProps.query });
    }

    renderRow({index, key, style}) {
        if (this.state.results[index] === 0) return;
        switch(this.state.results[index]) {
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
            <div>
                
            </div>
        )
    }

    renderAlbumRow(index) {
        return (
            <div>
                
            </div>
        )
    }

    renderTrackRow(index) {
        return (
            <div>

            </div>
        )
    }

    render() {
        return (
            <div>
                
            </div>
        );
    }
}

export default SearchResult;
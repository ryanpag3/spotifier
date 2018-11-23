import React, { Component } from 'react';
import './SortBar.css';

class SortBar extends Component {
    state = {
        type: null,
        sorted: null
    }

    render() {
        return (
            <div className="sortbar-container">
                <button>Artist</button> | <button>Release</button> | <button>Date</button>
            </div>
        );
    }
}

export default SortBar;
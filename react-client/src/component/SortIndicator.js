import React, { Component } from 'react';
import { IconContext } from 'react-icons';
import { IoIosArrowRoundUp, IoIosArrowRoundDown } from 'react-icons/io';

import css from './SortIndicator.css';

const UP = true;
const DOWN = false;

class SortIndicator extends Component {
    state = { direction: null, type: null }

    componentWillReceiveProps(newProps) {
        // if (this.state.direction === null || !this.isSameType(newProps)) { // first sort is ascending
        //     console.log('hi');
        //     this.setState({ direction: newProps.direction, type: newProps.type});
        //     return;
        // }
        console.log(newProps.direction);
        this.setState({ direction: newProps.direction, type: newProps.type });
        // console.log(this.state.direction);
    }

    isSameType(newProps) {
        return newProps.type === this.state.type;
    }

    getArrow(direction) {
        switch (direction) {
            case UP:
                return <IoIosArrowRoundUp className={`${css.sortIcon}`}/>
            case DOWN:
                return <IoIosArrowRoundDown className={`${css.sortIcon}`}/>
            default:
                return; 
        }
    }

    render() {
        return ( 
            <IconContext.Provider value={{className: 'sortIcon'}}>
                {this.getArrow(this.state.direction)}
            </IconContext.Provider>
        );
    }
}

export default SortIndicator;
import React, { Component } from 'react';
import { IconContext } from 'react-icons';
import { IoIosArrowRoundUp, IoIosArrowRoundDown } from 'react-icons/io';

import css from './SortIndicator.css';

const UP = true;
const DOWN = false;

class SortIndicator extends Component {
    state = { direction: null }

    componentWillReceiveProps(newProps) {
        console.log(newProps);
        if (this.state.direction === null) {
            this.setState({ direction: newProps.direction});
            // this.forceUpdate();
            return;
        }
        this.setState({ direction: !this.state.direction });
        // this.forceUpdate();
    }

    getArrow(direction) {
        switch (direction) {
            case UP:
                return <IoIosArrowRoundUp className={`${css.sortIcon}`}/>
            case DOWN:
                return <IoIosArrowRoundDown className={`${css.sortIcon}`}/>
            default:
                return <IoIosArrowRoundUp className={`${css.sortIcon}`}/>
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
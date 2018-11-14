import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Home from './containers/Home';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <Router>
        <Route exact path="/" component={Home}/>
        <Route exact path="" component={}/>
      </Router>
    );
  }
}

export default App;

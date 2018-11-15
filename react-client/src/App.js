import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

// import logo from './logo.svg';
import './App.css';

// containers, i.e pages
import Home from './container/Home';
import Register from './container/Register';
import Library from './container/Library';
import Unsubscribe from './container/Unsubscribe';
import Settings from './container/Settings';
import Callback from './container/Callback';

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <Route exact path="/" component={Home}/>
          <Route exact path="/register" component={Register}/>
          <Route exact path="/callback" component={Callback}/>
          <Route exact path="/library" component={Library}/>
          <Route exact path="/unsubscribe" component={Unsubscribe}/> 
          <Route exact path="/settings" component={Settings}/>
        </div>
      </Router>
    );
  }
}

export default App;

import 'bootstrap/scss/bootstrap.scss';
import 'font-awesome/css/font-awesome.css';
import 'typeface-open-sans/index.css';
import 'common/src/assets/styles/master.scss';
import './assets/styles/master.scss';
import 'discussions/src/assets/styles/master.scss';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import axios from 'axios';
import { actions } from 'discussions/src/redux/modules/discussions';
import { actions as socketActions } from 'discussions/src/redux/modules/socket';

import { LoginForm } from './components/LoginForm';
import { ConnectionForm } from './components/ConnectionForm';

import { DiscussionsList } from './components/DiscussionsList';
import { DiscussionsContainer } from './components/DiscussionsContainer';
import { SOCKET_STATUS } from 'discussions/src/api/socket';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { discussionTabs: [] };
  }

  addDiscussionTab = discussionId =>
    this.setState({
      discussionTabs: [discussionId, ...this.state.discussionTabs],
    });

  componentWillMount() {
    const token = localStorage.getItem('jwt');
    const host = 'localhost';
    const port = '7070';

    // Set the token in the store for future requests.
    this.props.setToken(token || '');

    // If we already have a token attempt to connect to the default host.
    if (token) {
      console.log('Attempting to auto connect.');
      this.props.connect({ host, port, token });
    }
  }

  handleConnect = async (host, port) => {
    this.props.connect({ host, port, token: this.props.token });
  };

  handleLogin = async (userInput, passInput) => {
    const result = await axios.request({
      method: 'post',
      url: `http://localhost:7071/acme/app/api/v1/authenticate`,
      data: {
        username: userInput,
        password: passInput,
      },
    });

    if (result.data.jwt) {
      localStorage.setItem('jwt', result.data.jwt);
      this.props.setToken(result.data.jwt);
    }
  };

  render() {
    const { token, status } = this.props;

    return (
      <div className="App">
        <div className="row">
          <div className="col">
            <div>{`Socket Status: ${status}`}</div>
          </div>
        </div>
        {status === SOCKET_STATUS.CLOSED && (
          <div className="row">
            {token === '' && (
              <div className="col">
                <LoginForm handleLogin={this.handleLogin} />
              </div>
            )}
            {token !== '' && (
              <div className="col">
                <ConnectionForm handleConnect={this.handleConnect} />
              </div>
            )}
          </div>
        )}

        <div className="row">
          {status !== SOCKET_STATUS.CLOSED &&
            status !== SOCKET_STATUS.CONNECTING && (
              <div className="col-3">
                <DiscussionsList addDiscussionTab={this.addDiscussionTab} />
              </div>
            )}
          <div className="col">
            <DiscussionsContainer discussionTabs={this.state.discussionTabs} />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  token: state.discussions.socket.token,
  status: state.discussions.socket.status,
});

const mapDispatchToProps = {
  setToken: socketActions.setToken,
  connect: socketActions.connect,
};

export const AppContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);

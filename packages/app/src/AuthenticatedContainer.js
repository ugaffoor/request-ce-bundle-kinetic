import React from 'react';
import { connect } from 'react-redux';
import { compose, withState, withHandlers, lifecycle } from 'recompose';
import { Route, Switch } from 'react-router-dom';
import { push } from 'connected-react-router';
import { bundle } from 'react-kinetic-core';
import { I18n } from './I18nProvider';

import logoImage from './assets/images/gb-logo.png';
import logoName from './assets/images/login-name.png';

import { ResetTokenForm } from './components/authentication/ResetTokenForm';
import { ResetPasswordForm } from './components/authentication/ResetPasswordForm';
import { LoginForm } from './components/authentication/LoginForm';
import { CreateAccountForm } from './components/authentication/CreateAccountForm';
import { UnauthenticatedForm } from './components/authentication/UnauthenticatedForm';

export const LoginScreen = props => (
  <div className="login-section">
    <div
      className="login-image-container"
      style={{ backgroundImage: `url(${logoImage})` }}
    ></div>
    <div className="login-container">
      <div className="login-wrapper">{props.children}</div>
    </div>
  </div>
);

const toResetPassword = ({ push, setDisplay }) => routed => () =>
  routed ? push('/reset-password') : setDisplay('reset');
const toSignIn = ({ push, setDisplay }) => routed => () =>
  routed ? push('/login') : setDisplay('none');
const toCreateAccount = ({ push, setDisplay }) => routed => () =>
  routed ? push('/create-account') : setDisplay('create-account');

const handleEmail = ({ setEmail }) => e => setEmail(e.target.value);
const handlePassword = ({ setPassword }) => e => setPassword(e.target.value);
const handleAuthenticated = ({
  setError,
  setDisplay,
  setEmail,
  setPassword,
  setAttempting,
  setAuthenticated,
}) => () => {
  setError('');
  setDisplay('none');
  setEmail('');
  setPassword('');
  setAttempting(false);
  setAuthenticated(true);
};

export const handleUnauthorized = props => () => {
  props.setDisplay('login');
};

const Authenticated = props => {
  const { children, authenticated, attempting, isPublic } = props;

  return authenticated && !isPublic ? (
    children
  ) : attempting ? null : (
    <div>
      {props.display === 'none' ? (
        <Switch>
          <Route
            path="/login"
            exact
            render={route => (
              <LoginScreen>
                <LoginForm {...props} {...route} routed />
              </LoginScreen>
            )}
          />
          <Route
            path="/reset-password"
            exact
            render={route => (
              <LoginScreen>
                <ResetPasswordForm {...props} {...route} routed />{' '}
              </LoginScreen>
            )}
          />
          <Route
            path="/reset-password/:token"
            exact
            render={route => (
              <LoginScreen>
                <ResetTokenForm {...props} {...route} routed />
              </LoginScreen>
            )}
          />
          <Route
            path="/create-account"
            exact
            render={route => (
              <LoginScreen>
                <CreateAccountForm {...props} {...route} routed />
              </LoginScreen>
            )}
          />
          <Route
            path="/kapps/:kappSlug/forms/:formSlug"
            exact
            render={route => (
              <UnauthenticatedForm {...props} {...route} routed />
            )}
          />
          <Route
            path="/kapps/:kappSlug/submissions/:id"
            exact
            render={route => (
              <UnauthenticatedForm {...props} {...route} routed />
            )}
          />
          <Route
            path="/kapps/:kappSlug/forms/:formSlug/submissions/:id"
            exact
            render={route => (
              <UnauthenticatedForm {...props} {...route} routed />
            )}
          />
          <Route
            path="/"
            render={route => (
              <LoginScreen>
                {props.display === 'reset' ? (
                  <ResetPasswordForm {...props} />
                ) : props.display === 'reset-token' ? (
                  <ResetTokenForm {...props} />
                ) : props.display === 'create-account' ? (
                  <CreateAccountForm {...props} />
                ) : (
                  <LoginForm {...props} />
                )}
              </LoginScreen>
            )}
          />
        </Switch>
      ) : (
        <Route
          path="/"
          render={route => (
            <LoginScreen>
              {props.display === 'reset' ? (
                <ResetPasswordForm {...props} />
              ) : props.display === 'reset-token' ? (
                <ResetTokenForm {...props} />
              ) : props.display === 'create-account' ? (
                <CreateAccountForm {...props} />
              ) : (
                <LoginForm {...props} />
              )}
            </LoginScreen>
          )}
        />
      )}
    </div>
  );
};

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  isPublic: state.router.location.search.includes('public'),
});

export const AuthenticatedContainer = compose(
  connect(mapStateToProps, { push }),
  withState('display', 'setDisplay', 'none'),
  withState('error', 'setError', ''),
  withState('email', 'setEmail', ''),
  withState('password', 'setPassword', ''),
  withState('attempting', 'setAttempting', false),
  withState('authenticated', 'setAuthenticated', false),

  withHandlers({
    toResetPassword,
    toSignIn,
    toCreateAccount,
    handleEmail,
    handlePassword,
    handleAuthenticated,
    handleUnauthorized,
  }),

  lifecycle({
    componentWillMount() {
      if (bundle.identity() !== 'anonymous') {
        this.props.setAttempting(false);
        this.props.setAuthenticated(true);
      }
    },
  }),
)(Authenticated);

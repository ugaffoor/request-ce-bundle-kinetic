import React from 'react';
import { connect } from 'react-redux';
import { compose, withState, withHandlers, lifecycle } from 'recompose';
import { Route, Switch } from 'react-router-dom';
import { push } from 'connected-react-router';
import { bundle } from '@kineticdata/react';
import {
  exchangeStashedCredentials,
  stashCredentials,
} from 'gbmembers/src/lib/firebaseAuth';

import logoImage from './assets/images/gb-logo.jpg';

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
    />
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
  if (setError) setError('');
  if (setDisplay) setDisplay('none');
  if (setEmail) setEmail('');
  if (setPassword) setPassword('');
  if (setAttempting) setAttempting(false);
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

const mapStateToProps = state => {
  return {
    pathname: state.router.location.pathname,
    isPublic: state.router.location.search.includes('public'),
  };
};

export const AuthenticatedContainer = compose(
  connect(
    mapStateToProps,
    { push },
  ),
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
    UNSAFE_componentWillMount() {
      if (bundle.identity() !== 'anonymous') {
        this.props.setAttempting(false);
        this.props.setAuthenticated(true);
      }
    },
  }),
)(Authenticated);

export const Authentication = compose(
  connect(
    mapStateToProps,
    { push },
  ),
  withState('display', 'setDisplay', 'none'),
  withState('authenticated', 'setAuthenticated', false),
  withHandlers({
    toResetPassword,
    toSignIn,
    toCreateAccount,
    handleAuthenticated,
  }),
  lifecycle({
    componentDidMount() {
      this.props.setAuthenticated(this.props.loggedIn);
    },
    componentDidUpdate(prevProps) {
      if (
        this.props.loggedIn !== prevProps.loggedIn ||
        this.props.timedOut !== prevProps.timedOut
      ) {
        this.props.setAuthenticated(
          this.props.loggedIn && !this.props.timedOut,
        );
      }

      // Kinetic has just accepted the sign-in, so trade the credentials it
      // accepted for a Firebase custom token. Deliberately not awaited: chat
      // is secondary to being logged into GB Members, and every failure path
      // in the bridge resolves to "chat isn't available this session".
      if (this.props.loggedIn && !prevProps.loggedIn) {
        exchangeStashedCredentials();
      }
    },
  }),
)(({ loginProps, timedOut, authenticated, children, isPublic, ...props }) => {
  // Capture the credentials as the sign-in is submitted -- the one moment the
  // password exists in the browser. The exchange itself waits for Kinetic to
  // confirm the login (componentDidUpdate above), so a failed sign-in never
  // reaches the Cloud Function.
  const bridgedLoginProps = loginProps && {
    ...loginProps,
    onLogin: event => {
      stashCredentials({
        userName: loginProps.username,
        password: loginProps.password,
      });
      return loginProps.onLogin(event);
    },
  };

  return (
    <>
      {authenticated && !isPublic ? (
        children
      ) : (
        <div>
          {props.display === 'none' ? (
            <Switch>
              <Route
                path="/login"
                exact
                render={route => (
                  <LoginScreen>
                    <LoginForm
                      {...props}
                      {...bridgedLoginProps}
                      {...route}
                      routed
                    />
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
                      <LoginForm {...props} {...bridgedLoginProps} />
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
                    <LoginForm {...props} {...bridgedLoginProps} />
                  )}
                </LoginScreen>
              )}
            />
          )}
        </div>
      )}
    </>
  );
});

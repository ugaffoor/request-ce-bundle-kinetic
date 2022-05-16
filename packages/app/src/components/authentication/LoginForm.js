import React from 'react';
import { compose, withHandlers, lifecycle } from 'recompose';
import { login } from '../../utils/authentication';
import { I18n } from '../../I18nProvider';
import { Utils } from 'common';
import { App as SpaceApp } from 'space/src/App';

export const Login = ({
  handleLogin,
  toResetPassword,
  toCreateAccount,
  email,
  password,
  handleEmail,
  handlePassword,
  error,
  routed,
  space,
  pathname,
}) => (
  <form className="login-form-container" onSubmit={handleLogin}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <p>{Utils.getAttributeValue(SpaceApp, 'School Email')}</p>
      <div className="form-group">
        {pathname.includes('redirected') && (
          <span className="redirected">
            The GB Members environment has been migrated. If you have been
            provided a new password, please proceed with the Sign In. Otherwise,
            click "RESET PASSWORD" to reset a password.
          </span>
        )}
        <label htmlFor="email">
          <I18n>User Name</I18n>
        </label>
        <input
          type="text"
          autoFocus
          className="form-control"
          id="email"
          placeholder=""
          value={email}
          onChange={handleEmail}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">
          <I18n>Password</I18n>
        </label>
        <input
          type="password"
          className="form-control"
          id="password"
          placeholder=""
          value={password}
          onChange={handlePassword}
        />
      </div>
      <span className="text-danger">{error || ' '}</span>
    </div>
    <div className="button-group">
      <button className="btn btn-primary">
        <I18n>Sign In</I18n>
      </button>
      <hr />
      <button
        type="button"
        className="btn btn-link"
        onClick={toResetPassword(routed)}
      >
        <I18n>Reset Password</I18n>
      </button>
    </div>
  </form>
);

const handleLogin = ({ tryAuthentication, email, password }) => e => {
  e.preventDefault();
  tryAuthentication(email, password);
};
const tryAuthentication = ({
  setError,
  setPassword,
  handleAuthenticated,
  routed,
  push,
  pathname,
}) => async (username, password) => {
  try {
    await login(username, password);

    handleAuthenticated();

    if (routed || pathname.includes('redirected')) {
      push('/');
    }
  } catch (error) {
    setError('Invalid username or password.');
    setPassword('');
  }
};
export const LoginForm = compose(
  withHandlers({
    tryAuthentication,
  }),
  withHandlers({
    handleLogin,
  }),
  lifecycle({
    /*    componentDidMount() {
      console.log("Login Form mounted");
      setTimeout(function(){
        console.log("Login Form:"+window.bundle.config.translations);
        debugger;
        if (window.bundle.identity()!=="unus@uniqconsulting.com.au" && window.bundle.config.translations !== undefined && window.bundle.config.translations.shared.Redirect !== undefined){
          window.location=window.bundle.config.translations.shared.Redirect;
        }
      },1000);
    },*/
  }),
)(Login);

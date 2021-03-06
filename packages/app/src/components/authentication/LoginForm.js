import React from 'react';
import { compose, withHandlers } from 'recompose';
import { login } from '../../utils/authentication';
import { I18n } from '../../I18nProvider';

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
}) => (
  <form className="login-form-container" onSubmit={handleLogin}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="form-group">
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
}) => async (username, password) => {
  try {
    await login(username, password);

    handleAuthenticated();

    if (routed) {
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
)(Login);

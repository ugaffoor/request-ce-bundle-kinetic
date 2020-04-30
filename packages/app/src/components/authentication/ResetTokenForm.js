import React from 'react';
import { compose, lifecycle, withState, withHandlers } from 'recompose';
import { parse, stringify } from 'qs';
import axios from 'axios';
import { bundle } from 'react-kinetic-core';
import { I18n } from '../../I18nProvider';

const ResetToken = ({
  email,
  handleEmail,
  password,
  handlePassword,
  handlePasswordReset,
  passwordConfirm,
  handlePasswordConfirm,
  formValid,
  error,
  routed,
  toSignIn,
}) => (
  <form className="login-form-container" onSubmit={handlePasswordReset}>
    <div>
      <h3 className="form-title">
        <I18n>Password Reset</I18n>
      </h3>
      <div className="form-group">
        <label htmlFor="email">
          <I18n>Email Address</I18n>
        </label>
        <p className="form-control-static">{email}</p>
      </div>
      <div className="form-group">
        <label htmlFor="password">
          <I18n>Password</I18n>
        </label>
        <I18n
          render={translate => (
            <input
              autoFocus
              type="password"
              className="form-control"
              id="password"
              placeholder={translate('password')}
              value={password}
              onChange={handlePassword}
            />
          )}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password-confirm">
          <I18n>Confirm Password</I18n>
        </label>
        <I18n
          render={translate => (
            <input
              type="password"
              className="form-control"
              id="password-confirm"
              placeholder={translate('confirm password')}
              value={passwordConfirm}
              onChange={handlePasswordConfirm}
            />
          )}
        />
      </div>
      <span className="text-danger">
        <I18n>{error}</I18n>
      </span>
    </div>
    <div className="button-group">
      <button type="submit" className="btn btn-primary" disabled={!formValid}>
        <I18n>Reset</I18n>
      </button>
      <button type="button" className="btn btn-link" onClick={toSignIn(routed)}>
        &larr; <I18n>Back to Sign In</I18n>
      </button>
    </div>
  </form>
);

const handlePassword = ({
  passwordConfirm,
  setPassword,
  setFormValid,
}) => e => {
  setPassword(e.target.value);
  setFormValid(e.target.value === passwordConfirm && e.target.value.length > 0);
};

const handlePasswordConfirm = ({
  password,
  setPasswordConfirm,
  setFormValid,
}) => e => {
  setPasswordConfirm(e.target.value);
  setFormValid(e.target.value === password && e.target.value.length > 0);
};

const handlePasswordReset = ({
  setError,
  password,
  passwordConfirm,
  email,
  token,
  push,
  handleAuthenticated,
}) => async e => {
  e.preventDefault();

  try {
    const data = stringify({
      username: email,
      token: token,
      password: password,
      confirmPassword: passwordConfirm,
    });

    await axios.request({
      method: 'post',
      url: `${bundle.spaceLocation()}/app/reset-password/token`,
      data,
    });
  } catch (error) {
    if (error.response.status !== 302) {
      setError(
        'There was a problem resetting your password! Please note that password reset links may only be used once.',
      );
      return;
    }
  }
  handleAuthenticated();
  push('/');
};

export const ResetTokenForm = compose(
  withState('error', 'setError', ''),
  withState('email', 'setEmail', ({ location }) => {
    const query = parse(location.search.substr(1));
    return query.u;
  }),
  withState('token', '_', ({ match }) => match.params.token),
  withState('password', 'setPassword', ''),
  withState('passwordConfirm', 'setPasswordConfirm', ''),
  withState('formValid', 'setFormValid', false),
  withHandlers({
    handlePassword,
    handlePasswordConfirm,
    handlePasswordReset,
  }),
  lifecycle({
    componentWillMount() {
      console.log(this.props);
    },
  }),
)(ResetToken);

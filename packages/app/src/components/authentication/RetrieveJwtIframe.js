import React from 'react';
import { compose, lifecycle, withHandlers } from 'recompose';
import { OAUTH_CLIENT_ID } from '../../utils/authentication';

const oAuthAuthorizeUrl = `app/oauth/authorize?grant_type=implicit&response_type=token&client_id=${OAUTH_CLIENT_ID}`;

export const RetrieveJwt = ({ retrieveJwt, frameRef }) => {
  return (
    <iframe
      title="oauth-jwt iframe"
      src={retrieveJwt ? oAuthAuthorizeUrl : null}
      style={{ display: 'none' }}
      ref={frameRef}
    />
  );
};

export const RetrieveJwtIframe = compose(
  withHandlers(() => {
    let frameRef;
    return {
      frameRef: () => ref => (frameRef = ref),
      getFrameRef: () => () => frameRef,
      handleFrameLoad: ({ retrieveJwt, handleJwt }) => () => {
        if (retrieveJwt && handleJwt) {
          handleJwt(frameRef);
        }
      },
    };
  }),
  lifecycle({
    componentDidMount() {
      this.props.getFrameRef().onload = this.props.handleFrameLoad;
    },
  }),
)(RetrieveJwt);

import React from 'react';
import { connect } from 'react-redux';
import { compose, withState, lifecycle } from 'recompose';
import { Link } from 'react-router-dom';
import { Utils, PageTitle } from 'common';
import { bundle } from 'react-kinetic-core';
import { Discussion as KinopsDiscussion } from 'discussions';
import { commonActions } from 'common';
import { SOCKET_STATUS } from 'discussions/src/api/socket';

const buildRelatedItemLink = (relatedItem, profile) => {
  let label = relatedItem.type;
  let link;
  if ('Form' === relatedItem.type) {
    label = 'Manage Form';
  } else if ('Queue Task' === relatedItem.type) {
    label = 'Open Task';
  } else if ('Team' === relatedItem.type) {
    label = 'Team Home';
  }

  if ('Form' === relatedItem.type) {
    let idSegments = relatedItem.key.split('/');
    link = `/kapps/${idSegments[0]}/settings/forms/${idSegments[1]}`;
  } else if ('Queue Task' === relatedItem.TYPE) {
    let assignedIndividual = relatedItem['Assigned Individual'];
    let assignedTeam = relatedItem['Assigned Team'];
    if (
      assignedIndividual === profile.username ||
      Utils.isMemberOf(profile, assignedTeam)
    ) {
      link = '/kapps/queue/submissions/' + relatedItem.ID;
    }
  } else if ('Team' === relatedItem.type) {
    link = '/teams/' + relatedItem.key;
  }

  return (
    link && (
      <Link
        className="btn btn-inverse btn-sm related-link ml-3"
        to={link}
        key={`${relatedItem.type}/${relatedItem.key}`}
      >
        {label}
      </Link>
    )
  );
};

export const DiscussionComponent = ({
  discussionId,
  discussionName,
  relatedItems,
  profile,
  socketStatus,
}) => (
  <div className="discussion-wrapper">
    <PageTitle parts={[discussionName, 'Discussions']} />
    <div className="subheader">
      <Link to={'/'}>home</Link> / {discussionName}
      {relatedItems &&
        relatedItems.map(relatedItem =>
          buildRelatedItemLink(relatedItem, profile),
        )}
    </div>
    {discussionId ? (
      socketStatus === SOCKET_STATUS.IDENTIFIED ? (
        <KinopsDiscussion
          discussionId={discussionId}
          renderClose={() => (
            <Link to={`/`} className="btn btn-link">
              Close
            </Link>
          )}
        />
      ) : (
        <div className="empty-discussion">
          <h6>
            Real-time connection to server has been interrupted. Please refresh
            and try again.
          </h6>
        </div>
      )
    ) : (
      <div className="empty-discussion">
        <h6>No discussion to display</h6>
      </div>
    )}
  </div>
);

const mapStateToProps = (state, props) => {
  const discussionId = props.match.params.id;
  const discussion = state.discussions.discussions.discussions.get(
    discussionId,
  );

  return {
    socketStatus: state.discussions.socket.status,
    sidebarOpen: state.app.layout.sidebarOpen,
    profile: state.app.profile,
    discussionId: props.match.params.id,
    discussionName:
      discussion && discussion.title ? discussion.title : 'Loading...',
    relatedItems: discussion ? discussion.relatedItems : [],
  };
};

const mapDispatchToProps = {
  setSidebarOpen: commonActions.setSidebarOpen,
};

export const Discussion = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('sidebarWasOpen', '_', true, props => props.sidebarOpen),
  lifecycle({
    componentWillMount() {
      if (this.props.sidebarWasOpen) {
        this.props.setSidebarOpen(false);
      }
    },
    componentWillUnmount() {
      if (this.props.sidebarWasOpen) {
        this.props.setSidebarOpen(true);
      }
    },
  }),
)(DiscussionComponent);

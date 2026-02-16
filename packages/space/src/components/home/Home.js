import React from 'react';
import { Link } from 'react-router-dom';
import { compose, lifecycle, withHandlers } from 'recompose';
import { connect } from 'react-redux';
import { GroupDivider, PageTitle } from 'common';
import { actions } from '../../redux/modules/spaceApp';
import { actions as teamListActions } from '../../redux/modules/teamList';
import wallyMissingImage from 'common/src/assets/images/wally-missing.svg';
import { bundle } from '@kineticdata/react';
import { I18n } from '@kineticdata/react';

const HomeComponent = ({
  spaceName,
  kapps,
  teams,
  handleLoadMoreButtonClick,
  handleHomeLinkClick,
}) => (
  <div className="page-container page-container--space-home">
    <PageTitle parts={['Home']} />
    <CreateDiscussionModal />
    <div className="page-panel page-panel--space-home">
      <h4 className="space-home-title">
        <I18n>Welcome to GB Members for</I18n> {spaceName}
      </h4>
      <div className="empty-state empty-state--wally">
        <img src={wallyMissingImage} alt="Missing Wally" />
      </div>
    </div>
  </div>
);

export const mapStateToProps = state => ({
  spaceName: state.app.space.name,
  me: state.app.profile,
  teams: state.space.teamList.data,
});

export const mapDispatchToProps = {
  fetchTeams: teamListActions.fetchTeams,
};

export const Home = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handleHomeLinkClick: props => event => {
      event.preventDefault();
    },
    handleLoadMoreButtonClick: ({}) => event => {},
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchTeams();
    },
  }),
)(HomeComponent);

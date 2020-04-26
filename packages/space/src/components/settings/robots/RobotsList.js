import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { compose, lifecycle } from 'recompose';
import moment from 'moment';
import { Constants, Loading, PageTitle } from 'common';
import wallyHappyImage from 'common/src/assets/images/wally-happy.svg';
import { actions } from '../../../redux/modules/settingsRobots';
import { I18n } from '../../../../../app/src/I18nProvider';

const getStatusColor = status =>
  status === 'Inactive'
    ? 'status--red'
    : status === 'Expired'
    ? 'status--yellow'
    : 'status--green';

const getNextExecution = (nextExecutions, robotId) => {
  let nextExecution;
  const found = nextExecutions.find(
    execution => execution.values['Robot ID'] === robotId,
  );

  if (found) {
    nextExecution = found.values['Next Execution']
      ? found.values['Next Execution']
      : 'No upcoming executions scheduled';
  } else {
    nextExecution = 'Unknown';
  }

  return nextExecution;
};

const WallyEmptyMessage = () => {
  return (
    <div className="empty-state empty-state--wally">
      <h5>
        <I18n>No Robots Found</I18n>
      </h5>
      <img src={wallyHappyImage} alt="Happy Wally" />
    </div>
  );
};

const RobotsListComponent = ({
  robots,
  robotsLoading,
  robotsLoaded,
  robotsErrors,
  nextExecutions,
  nextExecutionsLoading,
}) => {
  const loading = !nextExecutionsLoading && !robotsLoading && !robotsLoaded;
  return loading ? (
    <Loading />
  ) : (
    <div className="page-container page-container--robots">
      <PageTitle parts={['Robots', 'Settings']} />
      <div className="page-panel page-panel--scrollable page-panel--robots-content">
        <div className="page-title">
          <div className="page-title__wrapper">
            <h3>
              <Link to="/">
                <I18n>home</I18n>
              </Link>{' '}
              /{` `}
              <Link to="/settings">
                <I18n>settings</I18n>
              </Link>{' '}
              /{` `}
            </h3>
            <h1>
              <I18n>Robots</I18n>
            </h1>
          </div>
          <Link to={`/settings/robots/robots/new`} className="btn btn-primary">
            <I18n>Create Robot</I18n>
          </Link>
        </div>
        {robots.size <= 0 && robotsErrors.length > 0 && (
          <div className="text-center text-danger">
            <h1>
              <I18n>Oops!</I18n>
            </h1>
            <h2>
              <I18n>Robots Not Found</I18n>
            </h2>
            {robotsErrors.map(error => (
              <p className="error-details">{error}</p>
            ))}
          </div>
        )}
        {robots.size > 0 && (
          <table className="table table-sm table-striped table-robots">
            <thead className="header">
              <tr>
                <th scope="col">
                  <I18n>Robot Name</I18n>
                </th>
                <th scope="col" width="25%">
                  <I18n>Status</I18n>
                </th>
                <th scope="col">
                  <I18n>Category</I18n>
                </th>
                <th scope="col">
                  <I18n>Tree Name</I18n>
                </th>
                <th scope="col">
                  <I18n>Description</I18n>
                </th>
                <th scope="col">
                  <I18n>Next Execution Time</I18n>
                </th>
              </tr>
            </thead>
            <tbody>
              {robots.map(robot => {
                const nextExecution = nextExecutions
                  ? getNextExecution(nextExecutions, robot.id)
                  : 'fetching';
                const isExpired =
                  robot.values['End Date'] &&
                  moment(robot.values['End Date']).isBefore(moment());
                return (
                  <tr key={robot.id}>
                    <td scope="row">
                      <Link to={`/settings/robots/${robot.id}`}>
                        <span>{robot.values['Robot Name']}</span>
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`status ${getStatusColor(
                          robot.values['Status'],
                        )}`}
                      >
                        {robot.values['Status']}
                      </span>
                      {isExpired && (
                        <span className={`status ${getStatusColor('Expired')}`}>
                          Expired
                        </span>
                      )}
                    </td>
                    <td>{robot.values['Category']}</td>
                    <td>{robot.values['Task Tree']}</td>
                    <td>{robot.values['Description']}</td>
                    <td>
                      {moment(nextExecution).isValid()
                        ? moment(nextExecution).format(Constants.TIME_FORMAT)
                        : nextExecution}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {robotsErrors.length <= 0 && robots.size === 0 && <WallyEmptyMessage />}
      </div>
    </div>
  );
};

export const mapStateToProps = state => ({
  robot: state.space.settingsRobots.robot,
  robots: state.space.settingsRobots.robots,
  robotsLoading: state.space.settingsRobots.robotsLoading,
  robotsLoaded: state.space.settingsRobots.robotsLoaded,
  robotsErrors: state.space.settingsRobots.robotsErrors,
  nextExecutions: state.space.settingsRobots.nextExecutions,
  nextExecutionsLoading: state.space.settingsRobots.nextExecutionsLoading,
});

export const mapDispatchToProps = {
  push,
  fetchRobots: actions.fetchRobots,
  fetchNextExecutions: actions.fetchNextExecutions,
};

export const RobotsList = compose(
  connect(mapStateToProps, mapDispatchToProps),
  lifecycle({
    componentWillMount() {
      this.props.fetchRobots();
      this.props.fetchNextExecutions();
    },
  }),
)(RobotsListComponent);

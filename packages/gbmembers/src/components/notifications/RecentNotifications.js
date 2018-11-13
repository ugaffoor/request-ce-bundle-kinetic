import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import $ from 'jquery';
import ReactTable from 'react-table';

const mapStateToProps = state => ({
  recentNotifications: state.member.errors.recentNotifications,
});
const mapDispatchToProps = {};

const util = require('util');
export const RecentNotificationsHome = ({ recentNotifications }) => (
  <RecentNotifications recentNotifications={recentNotifications} />
);

export const RecentNotificationsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(RecentNotificationsHome);

export class RecentNotifications extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.recentNotifications);
    let columns = this.getColumns();

    let showNotifications = false;
    let notificationsBtnLabel = 'Show Recent Notifications';
    this.showHideNotifications = this.showHideNotifications.bind(this);

    this.state = {
      data,
      columns,
      showNotifications,
      notificationsBtnLabel,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.recentNotifications) {
      this.setState({
        data: this.getData(nextProps.recentNotifications),
      });
    }
  }

  getData(recentNotifications) {
    if (!recentNotifications || recentNotifications.size <= 0) {
      return [];
    }

    const data = [];
    recentNotifications.forEach(notification => {
      data.push({
        _id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.msg,
      });
    });
    return data;
  }

  getColumns(data) {
    const columns = [
      { accessor: 'type', Header: 'Type', width: 100 },
      { accessor: 'title', Header: 'Title', width: 250 },
      {
        accessor: '_id',
        Header: 'Date Time',
        width: 250,
        Cell: props => moment(props.value).format('DD MMM YYYY hh:mm:ss A'),
      },
      {
        accessor: 'message',
        Header: 'Message',
        width: 800,
        className: 'whiteSpaceNoWrap',
      },
    ];
    return columns;
  }

  showHideNotifications() {
    let label = this.state.showNotifications
      ? 'Show Recent Notifications'
      : 'Hide Recent Notifications';
    this.setState({
      showNotifications: !this.state.showNotifications,
      notificationsBtnLabel: label,
    });
  }

  render() {
    const { data, columns } = this.state;
    return (
      <span>
        <div>
          <button
            type="button"
            id="showHideNotifications"
            className={'btn btn-primary'}
            onClick={e => this.showHideNotifications()}
          >
            {this.state.notificationsBtnLabel}
          </button>
        </div>
        {this.state.showNotifications ? (
          <div>
            <ReactTable
              columns={columns}
              data={data}
              className="-striped -highlight"
              defaultPageSize={data.length > 0 ? data.length : 2}
              pageSize={data.length > 0 ? data.length : 2}
              showPagination={false}
            />
          </div>
        ) : (
          ''
        )}
      </span>
    );
  }
}

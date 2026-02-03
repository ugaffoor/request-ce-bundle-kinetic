import React from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { KappLink as Link, PageTitle } from 'common';
import { actions } from '../../redux/modules/queue';
import { QueueItemDetailsContainer } from './QueueItemDetails';
import { getFilterByPath, buildFilterPath } from '../../redux/modules/queueApp';
import { I18n } from '@kineticdata/react';

export const QueueItem = ({ filter, queueItem }) =>
  queueItem !== null && (
    <div className="queue-item-container">
      {filter && (
        <Link to={buildFilterPath(filter)} className="nav-return">
          <span className="icon">
            <span className="fa fa-fw fa-chevron-left" />
          </span>
          <I18n>{filter.name || 'Adhoc'}</I18n>
        </Link>
      )}
      <div className="queue-item-content">
        <PageTitle
          parts={[
            queueItem ? queueItem.handle : '',
            filter ? filter.name || 'Adhoc' : '',
          ]}
        />
        <QueueItemDetailsContainer filter={filter} />
      </div>
    </div>
  );

export const mapStateToProps = (state, props) => ({
  id: props.match.params.id,
  filter: getFilterByPath(state, props.location.pathname),
  queueItem: state.queue.queue.currentItem,
});

export const mapDispatchToProps = {
  fetchCurrentItem: actions.fetchCurrentItem,
  setCurrentItem: actions.setCurrentItem,
};

export const QueueItemContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchCurrentItem(this.props.id);
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.id !== nextProps.id) {
        this.props.fetchCurrentItem(nextProps.id);
      }
    },
    componentWillUnmount() {
      this.props.setCurrentItem(null);
    },
  }),
)(QueueItem);

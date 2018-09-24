import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { ModalBody } from 'reactstrap';
import { OrderedMap } from 'immutable';
import { actions } from '../../redux/modules/filterMenu';

export const SORT_OPTIONS = OrderedMap([
  ['createdAt', { label: 'Created At', id: 'sorted-by-created-at' }],
  ['updatedAt', { label: 'Updated At', id: 'sorted-by-updated-at' }],
  ['closedAt', { label: 'Closed At', id: 'sorted-by-closed-at' }],
  ['Due Date', { label: 'Due Date', id: 'sorted-by-due-date' }],
]);

export const SortedBySection = ({ filter, setSortedByHandler }) => (
  <ModalBody className="filter-section">
    <h5>Sorted By</h5>
    {SORT_OPTIONS.map(({ label, id }, value) => (
      <label key={id} htmlFor={id}>
        <input
          type="radio"
          id={id}
          value={value}
          name="sorted-by"
          checked={value === filter.sortBy}
          onChange={setSortedByHandler}
        />
        {label}
      </label>
    )).toArray()}
  </ModalBody>
);

export const SortedBySectionContainer = compose(
  connect(
    null,
    {
      setSortedBy: actions.setSortedBy,
    },
  ),
  withHandlers({
    setSortedByHandler: props => event => props.setSortedBy(event.target.value),
  }),
)(SortedBySection);

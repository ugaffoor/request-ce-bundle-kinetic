import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { ModalBody } from 'reactstrap';
import { actions } from '../../redux/modules/filterMenu';
import { AttributeSelectors } from 'common';
import { I18n } from '../../../../app/src/I18nProvider';

export const GroupedBySection = ({ filter, forms, setGroupedByHandler }) => (
  <ModalBody className="filter-section">
    <h5>
      <I18n>Grouped By</I18n>
    </h5>
    <label htmlFor="grouped-by">
      <AttributeSelectors.FieldSelect
        forms={forms}
        value={filter.groupBy}
        onChange={setGroupedByHandler}
      />
    </label>
  </ModalBody>
);

export const GroupedBySectionContainer = compose(
  connect(
    state => ({
      forms: state.queue.queueApp.forms,
    }),
    {
      setGroupedBy: actions.setGroupedBy,
    },
  ),
  withHandlers({
    setGroupedByHandler: props => event =>
      props.setGroupedBy(event.target.value),
  }),
)(GroupedBySection);

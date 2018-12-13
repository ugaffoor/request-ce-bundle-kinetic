import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import {
  compose,
  lifecycle,
  withHandlers,
  withState,
  withProps,
} from 'recompose';
import { parse } from 'query-string';
import { Form } from './Form';
import { actions as memberActions } from '../../redux/modules/members';
import { actions as errorActions } from '../../redux/modules/errors';
import { actions as formActions } from '../../redux/modules/forms';
import $ from 'jquery';

const valuesFromQueryParams = queryParams => {
  const params = parse(queryParams);
  return Object.entries(params).reduce((values, [key, value]) => {
    if (key.startsWith('values[')) {
      const vk = key.match(/values\[(.*?)\]/)[1];
      return { ...values, [vk]: value };
    }
    return values;
  }, {});
};

const util = require('util');

const populateFormFields = memberItem => {
  $('[name="First Name"]').val(memberItem.values['First Name']);
  $('[name="Last Name"]').val(memberItem.values['Last Name']);
  $('[name="Address"]').val(memberItem.values['Address']);
  $('[name="Suburb"]').val(memberItem.values['Suburb']);
  $('[name="Postcode"]').val(memberItem.values['Postcode']);
  $('[name="State"]').val(memberItem.values['State']);

  $('[name="DOB"]').val(memberItem.values['DOB']);
  $('[name="Email"]').val(memberItem.values['Email']);
  $('[name="Payment"]').val(memberItem.values['Membership Cost']);
  $('[name="First Payment"]').val(memberItem.values['Membership Cost']);
  $('[name="Billing Period"]').val('2');
};

export const handleCompleted = props => response => {
  props.registerBillingMember({
    memberItem: props.memberItem,
    billingInfo: response.submission,
    addNotification: props.addNotification,
    setSystemError: props.setSystemError,
    fetchBillingInfoAfterRegistration: props.fetchBillingInfoAfterRegistration,
    setBillingInfo: props.setBillingInfo,
    updateMember: props.updateMember,
    fetchCurrentMember: props.fetchCurrentMember,
  });
  //$('#billingDialogClsBtn').click();
  props.handleClose();
};

export const handleCreated = props => response => {
  console.log('In handleCreated');
};

export const handleLoaded = props => form => {
  populateFormFields(props.memberItem);
  props.setFormSlug(form.slug());
};

export const handleUpdated = props => response => {
  console.log('In handleUpdated');
};

export const handleDelete = props => () => {
  const deleteCallback = () => {
    props.fetchCurrentPage();
    props.push(`/kapps/${props.kappSlug}`);
  };
  props.deleteSubmission(props.submissionId, deleteCallback);
};

export const mapStateToProps = state => ({
  forms: state.services.forms.data,
  kappSlug: state.app.config.kappSlug,
  memberItem: state.member.members.currentMember,
  forms: state.member.forms.data,
});

export const mapDispatchToProps = {
  push,
  registerBillingMember: memberActions.registerBillingMember,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchBillingInfoAfterRegistration:
    memberActions.fetchBillingInfoAfterRegistration,
  setBillingInfo: memberActions.setBillingInfo,
  updateMember: memberActions.updateMember,
  fetchCurrentMember: memberActions.fetchCurrentMember,
  fetchForms: formActions.fetchForms,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('formSlug', 'setFormSlug', props => props.formSlug),
  withProps(props => ({
    form: props.forms.find(form => form.slug === props.formSlug),
  })),
  withHandlers({
    handleUpdated,
    handleCompleted,
    handleCreated,
    handleLoaded,
    handleDelete,
  }),
  lifecycle({
    componentWillReceiveProps(nextProps) {
      if (this.props.formSlug !== nextProps.formSlug) {
        this.props.setFormSlug(nextProps.formSlug);
      }
    },
    componentWillMount() {
      this.props.fetchForms();
    },
  }),
);

export const FormContainer = enhance(Form);

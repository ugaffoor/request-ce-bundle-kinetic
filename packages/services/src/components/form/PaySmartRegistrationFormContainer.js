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
import { PaySmartRegistrationForm } from './PaySmartRegistrationForm';
import { actions } from '../../redux/modules/submission';
import { actions as submissionsActions } from '../../redux/modules/submissions';
import { actions as memberActions } from '../../redux/modules/members';
import { actions as errorActions } from '../../redux/modules/errors';

var React = require('react');
var SignaturePad = require('react-signature-pad');

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

export const getSubmissionId = props =>
  props.match.isExact
    ? props.match.params.submissionId
    : props.location.pathname.replace(props.match.url, '').replace('/', '');

export const handleCompleted = props => response => {
  if (!props.submissionId) {
    let selectedMember = null;
    for (let i = 0; i < props.members.length; i++) {
      if (props.members[i].values['Member ID'] === props.selectedMemberId) {
        selectedMember = props.members[i];
        break;
      }
    }
    props.registerBillingMember({
      memberItem: selectedMember,
      billingInfo: response.submission,
      fetchBillingInfoAfterRegistration: props.fetchBillingInfoAfterRegistration,
      updateMember: props.updateMember,
      fetchMembers: props.fetchMembers,
      addNotification: props.addNotification,
      setSystemError: props.setSystemError
    });
  }
  if (!response.submission.currentPage) {
    props.push(
      `/kapps/${props.kappSlug}/requests/request/${
        response.submission.id
      }/confirmation`,
    );
  }
  props.fetchCurrentPage();
};

export const handleCreated = props => response => {
  props.push(
    response.submission.coreState === 'Submitted'
      ? `/kapps/${props.kappSlug}/requests/request/${
          response.submission.id
        }/confirmation`
      : `${props.match.url}/${response.submission.id}`,
  );
};

export const handleLoaded = props => form => {
  if (!props.submissionId) {
    $('#signature-canvas').attr('width', '666');
    $('#signature-canvas').attr('height', '268');
    let selectedMember = null;
    for (let i = 0; i < props.members.length; i++) {
      if (props.members[i].values['Member ID'] === props.selectedMemberId) {
        selectedMember = props.members[i];
        break;
      }
    }
    if (selectedMember) {
      $('[name="First Name"]').val(selectedMember.values['First Name']);
      $('[name="Last Name"]').val(selectedMember.values['Last Name']);
      $('[name="Address"]').val(selectedMember.values['Address']);
      $('[name="Suburb"]').val(selectedMember.values['Suburb']);
      $('[name="Postcode"]').val(selectedMember.values['Postcode']);
      $('[name="State"]').val(selectedMember.values['State']);

      $('[name="DOB"]').val(selectedMember.values['DOB']);
      $('[name="Email"]').val(selectedMember.values['Email']);
      $('[name="Payment"]').val(selectedMember.values['Membership Cost']);
      $('[name="First Payment"]').val(selectedMember.values['Membership Cost']);
      $('[name="Billing Period"]').val('2');
    }
  }

  props.setFormSlug(form.slug());
};

export const handleDelete = props => () => {
  const deleteCallback = () => {
    props.fetchCurrentPage();
    props.push(`/kapps/${props.kappSlug}`);
  };
  props.deleteSubmission(props.submissionId, deleteCallback);
};

export const mapStateToProps = (state, { match: { params } }) => ({
  category: params.categorySlug
    ? state.services.categories.data.find(
        category => category.slug === params.categorySlug,
      )
    : null,
  forms: state.services.forms.data,
  values: valuesFromQueryParams(state.router.location.search),
  kappSlug: state.app.config.kappSlug,
  members: state.services.members.allMembers
});

export const mapDispatchToProps = {
  push,
  deleteSubmission: actions.deleteSubmission,
  fetchCurrentPage: submissionsActions.fetchCurrentPage,
  fetchMembers: memberActions.fetchMembers,
  fetchBillingInfoAfterRegistration: memberActions.fetchBillingInfoAfterRegistration,
  updateMember: memberActions.updateMember,
  registerBillingMember: memberActions.registerBillingMember,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError
};

const util = require('util');

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('submissionId', 'setSubmissionId', getSubmissionId),
  withState('formSlug', 'setFormSlug', props => props.match.params.formSlug),
  withState('selectedMemberId', 'setSlectedMemberId', null),
  withProps(props => ({
    form: props.forms.find(form => form.slug === props.formSlug),
  })),
  withHandlers({ handleCompleted, handleCreated, handleLoaded, handleDelete }),
  lifecycle({
    componentWillMount() {
      if (this.props.members.size <= 0) {
        this.props.fetchMembers();
      }
    },
    componentWillReceiveProps(nextProps) {
      if (
        this.props.match.params.formSlug !== nextProps.match.params.formSlug
      ) {
        this.props.setFormSlug(nextProps.match.params.formSlug);
      }
      if (
        this.props.match.params.submissionId !==
        nextProps.match.params.submissionId
      ) {
        this.props.setSubmissionId(nextProps.match.params.submissionId);
      }
    },
  }),
);

export const PaySmartRegistrationFormContainer = enhance(PaySmartRegistrationForm);

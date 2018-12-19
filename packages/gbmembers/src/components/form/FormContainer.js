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

const populateFormFields = values => {
  for (let key in values) {
    $('[name="' + key + '"]').val(values[key]);
  }
};

export const handleCompleted = props => response => {
  props.state.onSubmit({ submission: response.submission });
  if (props.history && props.state.redirectTo) {
    props.history.push(props.state.redirectTo);
  }
};

export const handleCreated = props => response => {
  console.log('In handleCreated');
};

export const handleLoaded = props => form => {
  console.log('in handleLoaded');
  if (props.state && props.state.autoFillValues) {
    populateFormFields(props.state.autoFillValues);
  } else {
    props.history.push('/kapps/gbmembers/Home');
  }
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

export const getSubmissionId = props =>
  props.match.isExact
    ? props.match.params.submissionId
    : props.location.pathname.replace(props.match.url, '').replace('/', '');

export const mapStateToProps = state => ({
  forms: state.services.forms.data,
  kappSlug: state.app.config.kappSlug,
  memberItem: state.member.members.currentMember,
  forms: state.member.forms.data,
});

export const mapDispatchToProps = {
  push,
  fetchForms: formActions.fetchForms,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('submissionId', 'setSubmissionId', getSubmissionId),
  withState('formSlug', 'setFormSlug', props => props.match.params.formSlug),
  withProps(props => ({
    form: props.forms.find(form => form.slug === props.formSlug),
    state: props.location.state,
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

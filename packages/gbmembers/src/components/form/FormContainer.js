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
import moment from 'moment';

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

const populateFormFields = (formSlug, values) => {
  for (let key in values) {
    $('[name="' + key + '"]').val(values[key]);
  }

  if (formSlug === 'paysmart-member-registration') {
    //$('[name="Billing Start Date"]').next('input').val(values['Billing Start Date']).change();
    $('[name="DOB"]')
      .next('input')
      .val(moment(values['DOB'], 'YYYY-MM-DD').format('DD/MM/YYYY'))
      .change();
  }
};

export const handleCompleted = props => response => {
  props.state.onSubmit({ submission: response.submission });
  if (props.history && props.state.redirectTo) {
    props.history.push('/kapps/' + props.kappSlug + props.state.redirectTo);
  }
};

export const handleCreated = props => response => {
  console.log('In handleCreated');
};

export const handleLoaded = props => form => {
  console.log('in handleLoaded');
  if (!props.match.params.submissionId) {
    if (props.state && props.state.autoFillValues) {
      populateFormFields(form.slug(), props.state.autoFillValues);
    } else {
      props.history.push('/kapps/' + props.kappSlug + '/Home');
    }
  }
  props.setFormSlug(form.slug());
};

export const getSubmissionId = props =>
  props.match.isExact
    ? props.match.params.submissionId
    : props.location.pathname.replace(props.match.url, '').replace('/', '');

export const mapStateToProps = state => ({
  forms: state.services.forms.data,
  kappSlug: state.app.config.kappSlug,
  forms: state.member.forms.data,
});

export const mapDispatchToProps = {
  push,
  fetchForms: formActions.fetchForms,
};

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('submissionId', 'setSubmissionId', getSubmissionId),
  withState('formSlug', 'setFormSlug', props => props.match.params.formSlug),
  withProps(props => ({
    form: props.forms.find(form => form.slug === props.formSlug),
    state: props.location.state,
  })),
  withHandlers({
    handleCompleted,
    handleCreated,
    handleLoaded,
  }),
  lifecycle({
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.formSlug !== nextProps.formSlug) {
        this.props.setFormSlug(nextProps.formSlug);
      }
    },
    UNSAFE_componentWillMount() {
      this.props.fetchForms();
    },
  }),
);

export const FormContainer = enhance(Form);

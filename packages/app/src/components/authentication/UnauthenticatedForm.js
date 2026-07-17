import React, { Fragment } from 'react';
import { CoreForm, bundle, I18n } from '@kineticdata/react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { parse } from 'query-string';
import axios from 'axios';
import { importLocale } from 'common';
import { actions as configActions } from '../../redux/modules/config';

import { PageTitle } from 'common';

// Asynchronously import the global dependencies that are used in the embedded
// forms. Note that we deliberately do this as a const so that it should start
// immediately without making the application wait but it will likely be ready
// before users nagivate to the actual forms.
const globals = import('common/globals');

const UnauthenticatedFormComponent = props => {
  const {
    isPublic,
    kappSlug,
    formSlug,
    submissionId,
    handleCreated,
    handleLoaded,
    formName,
    values,
    showHeader,
    handleUnauthorized,
  } = props;

  return (
    <I18n context={`kapps.${kappSlug}.forms.${formSlug}`}>
      <div className="page--container">
        <PageTitle parts={[formSlug]} />
        <div className="page-panel">
          {showHeader && (
            <div className="page-title">
              <div className="page-title__wrapper">
                <h1>
                  <I18n>{formName}</I18n>
                </h1>
              </div>
            </div>
          )}
          {submissionId ? (
            <Fragment>
              <CoreForm
                public={isPublic}
                onUnauthorized={handleUnauthorized}
                submission={submissionId}
                globals={globals}
                created={handleCreated}
                loaded={handleLoaded}
              />
            </Fragment>
          ) : (
            <Fragment>
              <CoreForm
                public={isPublic}
                onUnauthorized={handleUnauthorized}
                kapp={kappSlug}
                form={formSlug}
                globals={globals}
                created={handleCreated}
                loaded={handleLoaded}
                values={values}
              />
            </Fragment>
          )}
        </div>
      </div>
    </I18n>
  );
};

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

const showHeader = queryParams => {
  const params = parse(queryParams);
  return Object.keys(params).includes('showHeader');
};

const mapStateToProps = (state, { match: { params } }) => ({
  submissionId: params.id,
  kappSlug: params.kappSlug,
  formSlug: params.formSlug,
  showHeader: showHeader(state.router.location.search),
  values: valuesFromQueryParams(state.router.location.search),
  isPublic: state.router.location.search.includes('public'),
});

export const handleCreated = props => response => {
  props.push(
    `/kapps/${props.kappSlug}/submissions/${response.submission.id}${
      props.isPublic ? '?public' : ''
    }`,
  );
};

export const handleLoaded = props => form => {
  props.setFormName(form.name());
};

export const UnauthenticatedForm = compose(
  connect(
    mapStateToProps,
    { push, setLocale: configActions.setLocale },
  ),
  withState('formName', 'setFormName', ''),
  lifecycle({
    componentDidMount() {
      axios
        .get(`${bundle.apiLocation()}/space?include=details`)
        .then(({ data }) => {
          const locale = data.space && data.space.defaultLocale;
          if (locale) {
            importLocale(locale);
            this.props.setLocale(locale);
          }
        })
        .catch(() => {});
    },
  }),
  withHandlers({ handleCreated, handleLoaded }),
)(UnauthenticatedFormComponent);

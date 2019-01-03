import React, { Fragment } from 'react';
import { CoreForm } from 'react-kinetic-core';
import {
  KappLink as Link,
  ErrorNotFound,
  ErrorUnauthorized,
  ErrorUnexpected,
  PageTitle,
} from 'common';

// Asynchronously import the global dependencies that are used in the embedded
// forms. Note that we deliberately do this as a const so that it should start
// immediately without making the application wait but it will likely be ready
// before users nagivate to the actual forms.
const globals = import('common/globals');

export const Form = ({
  form,
  category,
  submissionId,
  match,
  handleCreated,
  handleCompleted,
  handleLoaded,
  handleDelete,
  values,
  kappSlug,
  history,
  state,
}) =>
  !form ? (
    <span>Loading form. Please wait ...</span>
  ) : (
    <Fragment>
      <PageTitle parts={[form ? form.name : '']} />
      <span className="services-color-bar services-color-bar__blue-slate" />
      <div className="page-container page-container--services-form">
        <div className="page-title">
          <div className="page-title__wrapper">
            <h3>
              <Link to={state ? state.redirectTo : '/kapps/gbmembers/Home'}>
                {state ? state.label : 'Back'}
              </Link>{' '}
              /{' '}
            </h3>
            {form && <h1>{form.name}</h1>}
          </div>
        </div>
        <div className="form-description">
          {form && <p>{form.description}</p>}
        </div>
        <div className="embedded-core-form--wrapper">
          {submissionId ? (
            <CoreForm
              submission={submissionId}
              globals={globals}
              review
              loaded={handleLoaded}
              completed={handleCompleted}
            />
          ) : (
            <CoreForm
              kapp={kappSlug}
              form={form.slug}
              globals={globals}
              loaded={handleLoaded}
              created={handleCreated}
              completed={handleCompleted}
              values={values}
              notFoundComponent={ErrorNotFound}
              unauthorizedComponent={ErrorUnauthorized}
              unexpectedErrorComponent={ErrorUnexpected}
            />
          )}
        </div>
      </div>
    </Fragment>
  );

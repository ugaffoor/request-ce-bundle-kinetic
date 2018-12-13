import React, { Fragment, Component } from 'react';
import { CoreForm } from 'react-kinetic-core';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import {
  KappLink as Link,
  ErrorNotFound,
  ErrorUnauthorized,
  ErrorUnexpected,
  PageTitle,
} from 'common';
import ReactSpinner from 'react16-spinjs';

// Asynchronously import the global dependencies that are used in the embedded
// forms. Note that we deliberately do this as a const so that it should start
// immediately without making the application wait but it will likely be ready
// before users nagivate to the actual forms.
const globals = import('common/globals');

export const Form = ({
  form,
  category,
  handleCreated,
  handleCompleted,
  handleLoaded,
  handleDelete,
  values,
  kappSlug,
  handleUpdated,
  handleClose,
}) =>
  !form ? (
    <span>
      <p>Loading registration form</p>
      <ReactSpinner />
    </span>
  ) : (
    <Fragment>
      <PageTitle parts={[form ? form.name : '']} />
      <span className="services-color-bar services-color-bar__blue-slate" />
      <div className="page-container page-container--services-form">
        <div className="page-title row">
          <div className="page-title__wrapper col-md-10">
            {form && <h1>{form.name}</h1>}
          </div>
          <div className="col-md-2" style={{ textAlign: 'right' }}>
            {handleClose && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ margin: '10px' }}
                id="billingDialogClsBtn"
                onClick={e => handleClose()}
              >
                Close
              </button>
            )}
          </div>
        </div>
        <div className="form-description">
          {form && <p>{form.description}</p>}
        </div>
        <div className="embedded-core-form--wrapper">
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
            updated={handleUpdated}
          />
        </div>
      </div>
    </Fragment>
  );

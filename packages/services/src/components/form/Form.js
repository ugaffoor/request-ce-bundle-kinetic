import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { CoreForm } from 'react-kinetic-core';
import { bundle } from 'react-kinetic-core';
import SignatureCanvas from 'react-signature-canvas';
import Select, { components } from 'react-select';
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
}) => (
  <Fragment>
    <PageTitle parts={[form ? form.name : '']} />
    <span className="services-color-bar services-color-bar__blue-slate" />
    <div className="page-container page-container--services-form">
      <div className="page-title">
        <div className="page-title__wrapper">
          <h3>
            <Link to="/">services</Link> /{' '}
            {match.url.startsWith('/request') && (
              <Link to="/requests">requests</Link>
            )}
            {match.url.startsWith('/request') && ' / '}
            {match.url.startsWith('/request') &&
              match.params.type && (
                <Link to={`/requests/${match.params.type || ''}`}>
                  {match.params.type}
                </Link>
              )}
            {match.url.startsWith('/request') && match.params.type && ' / '}
            {category && <Link to="/categories">categories</Link>}
            {category && ' / '}
            {category && (
              <Link to={`/categories/${category.slug}`}>{category.name}</Link>
            )}
            {category && ' / '}
          </h3>
          {form && <h1>{form.name}</h1>}
        </div>
        {submissionId && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-outline-danger"
          >
            Cancel Request
          </button>
        )}
      </div>
      <div className="form-description">
        {form && <p>{form.description}</p>}
      </div>
      <div className="embedded-core-form--wrapper">
        {submissionId ? (
          <CoreForm
            submission={submissionId}
            globals={globals}
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

export class SignatureCanvasWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.onEnd = this.onEnd.bind(this);
  }

  setValue(value) {
    const { height, width } = this.props;
    if (value) {
      this.signatureCanvas.fromDataURL(value, { height, width });
    } else {
      this.signatureCanvas.clear();
    }
  }

  componentDidMount() {
    const { initialValue, height, width, disable } = this.props;
    if (initialValue) {
      this.signatureCanvas.fromDataURL(initialValue, { height, width });
    }
    if (disable) this.signatureCanvas.off();
  }

  clear = () => {
    this.signatureCanvas.clear();
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange('');
    }
  };
  undo = () => {
    var data = this.signatureCanvas.toData();
    if (data) {
      data.pop(); // remove the last dot or line
      this.signatureCanvas.fromData(data);
    }
  };
  onEnd() {
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange(this.signatureCanvas.toDataURL());
    }
  }

  render() {
    const { height, width, disable } = this.props;
    return (
      <div className="signature-pad">
        <SignatureCanvas
          canvasProps={{ height, width }}
          onEnd={this.onEnd}
          ref={el => (this.signatureCanvas = el)}
        />
        <div
          className={
            'signature-pad--footer' + (this.props.disable ? ' disabled' : '')
          }
        >
          <div className="description">Sign above</div>
          <div className="signature-pad--actions">
            <div>
              <button
                type="button"
                className="button clear"
                onClick={this.clear}
              >
                Clear
              </button>
              <button type="button" className="button" onClick={this.undo}>
                Undo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

bundle.config.widgets = {
  signatureCanvas: ({
    element,
    initialValue,
    height,
    width,
    ref,
    onChange,
    disable,
  }) => {
    ReactDOM.render(
      <SignatureCanvasWrapper
        initialValue={initialValue}
        onChange={onChange}
        ref={ref}
        height={height}
        width={width}
        disable={disable}
      />,
      element,
    );
  },
  selectMenu: ({ element, onChange, options }) => {
    ReactDOM.render(
      <Select
        onChange={onChange}
        options={options}
        closeMenuOnSelect={true}
        hideSelectedOptions={false}
        isMulti={false}
      />,
      element,
    );
  },
};

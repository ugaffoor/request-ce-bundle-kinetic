import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { CoreForm } from 'react-kinetic-core';
import { bundle } from 'react-kinetic-core';
import SignatureCanvas from 'react-signature-canvas';
import DateTimePicker from 'react-xdsoft-datetimepicker';
import Select, { components } from 'react-select';
import {
  KappLink as Link,
  ErrorNotFound,
  ErrorUnauthorized,
  ErrorUnexpected,
  PageTitle,
} from 'common';
import ReactQuill, { Quill } from 'react-quill';
import moment from 'moment';

// Asynchronously import the global dependencies that are used in the embedded
// forms. Note that we deliberately do this as a const so that it should start
// immediately without making the application wait but it will likely be ready
// before users nagivate to the actual forms.
const globals = import('common/globals');
var Block = Quill.import('blots/block');
Block.tagName = 'DIV';
Quill.register(Block, true);

var Size = Quill.import('attributors/style/size');
Size.whitelist = ['10px', '18px', '32px', '64px'];
Quill.register(Size, true);

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
            {match.url.startsWith('/request') && match.params.type && (
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

export class QuillEditorWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.quillRef = null;
    this.reactQuillRef = null;
    this.attachQuillRefs = this.attachQuillRefs.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      text: this.props.text ? this.props.text : '', // You can also pass a Quill Delta here
    };

    this.modules = {
      toolbar: {
        container: [
          ['bold', 'italic', 'underline', 'strike'], // toggled buttons
          ['blockquote', 'code-block'],

          [{ size: ['10px', '18px', '32px', '64px'] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }], // outdent/indent

          [{ align: [] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          [{ font: [] }],
          ['link'],
          ['image'],
          ['clean'],
          ['firstname'],
          ['lastname'],
          ['emailfooter'],
        ],
        handlers: {},
      },
    };
  }

  componentDidMount() {
    this.attachQuillRefs();
  }
  componentDidUpdate() {
    this.attachQuillRefs();
  }

  attachQuillRefs() {
    // Ensure React-Quill reference is available:
    if (
      this.reactQuillRef &&
      typeof this.reactQuillRef.getEditor !== 'function'
    )
      return;
    // Skip if Quill reference is defined:
    if (this.quillRef != null) return;

    const quillRef = this.reactQuillRef ? this.reactQuillRef.getEditor() : null;
    if (quillRef != null) this.quillRef = quillRef;
  }

  formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'color',
    'width',
    'height',
    'align',
    'text-align',
    'size',
  ];

  handleChange(html, text) {
    this.setState({ text: html });
    if (
      this.reactQuillRef &&
      this.reactQuillRef
        .getEditor()
        .getText()
        .trim().length > 0
    ) {
      $("[name='" + this.props.elementName + "']").val(html);
    } else {
      $("[name='" + this.props.elementName + "']").val('');
    }
  }

  render() {
    return (
      <div className="form-group required">
        <label className="field-label" id="quill_editor_label">
          {this.props.label}
        </label>
        <ReactQuill
          ref={el => {
            this.reactQuillRef = el;
          }}
          value={this.state.text}
          onChange={this.handleChange}
          theme="snow"
          modules={this.modules}
          formats={this.formats}
        />
      </div>
    );
  }
}

export class DatepickerWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      options: this.props.options,
    };
  }
  componentDidMount() {}
  componentDidUpdate() {
    if (
      this.state.options.allowDates.length !==
        this.props.options.allowDates.length ||
      (this.state.options.allowDates.length !== 0 &&
        this.props.options.allowDates !== 0 &&
        this.state.options.allowDates[0] !== this.props.options.allowDates[0])
    ) {
      this.setState({ options: this.props.options });
    }
  }
  render() {
    const {
      parentID,
      value,
      value_format,
      defaultValue,
      displayDateFormat,
      minDate,
      timepicker,
      datepicker,
      onSelectDate,
      inline,
      onGenerate,
    } = this.props;
    return (
      <DateTimePicker
        value={value}
        value_format={value_format}
        defaultValue={defaultValue}
        displayDateFormat={displayDateFormat}
        minDate={minDate}
        options={this.state.options}
        timepicker={timepicker}
        datepicker={datepicker}
        inline={inline}
        onGenerate={onGenerate}
        onSelectDate={onSelectDate}
      />
    );
  }
}

bundle.config.widgets = {
  xdsoftDatepickerRemove: ({ element }) => {
    ReactDOM.unmountComponentAtNode(element);
  },
  xdsoftDatepicker: ({
    element,
    parentID,
    value,
    value_format,
    defaultValue,
    displayDateFormat,
    minDate,
    options,
    timepicker,
    datepicker,
    onSelectDate,
    onGenerate,
    inline,
  }) => {
    ReactDOM.render(
      <DatepickerWrapper
        parentID={parentID}
        value={value}
        value_format={value_format}
        defaultValue={defaultValue}
        minDate={minDate}
        displayDateFormat={displayDateFormat}
        options={options}
        inline={inline}
        timepicker={timepicker}
        datepicker={datepicker}
        onGenerate={onGenerate}
        onSelectDate={onSelectDate}
      />,
      element,
    );
  },
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
  quillEditor: ({ element, editorContent, label, elementName }) => {
    ReactDOM.render(
      <QuillEditorWrapper
        text={editorContent}
        label={label}
        elementName={elementName}
      />,
      element,
    );
  },
  selectMenu: ({ element, value, onChange, options }) => {
    ReactDOM.render(
      <Select
        onChange={onChange}
        options={options}
        closeMenuOnSelect={true}
        hideSelectedOptions={false}
        isMulti={false}
        value={value}
      />,
      element,
    );
  },
};

import React, { Component, Fragment } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { CoreForm } from 'react-kinetic-core';
import { Loading } from 'common';
import ReactDOM from 'react-dom';
import ReactQuill, { Quill } from 'react-quill';

const globals = import('common/globals');

export const handleLoaded = props => form => {
  if (form.slug() === 'call-scripts') {
    form
      .getFieldByName('Target')
      .value(compThis.props.target === 'Member' ? 'Members' : 'Leads');
    form.getFieldByName('Target').hide();
  }

  compThis.setState({
    loadingForm: false,
  });
  onCallScriptFormLoaded();
};
export const handleUpdated = props => response => {
  if (response.submission.id) {
    props.updateTriggerDetails(
      'scriptTemplate',
      response.submission,
      props.journeyTriggers,
    );
    props.setShowScriptDialog(false);
  }
};
export const handleError = props => response => {};
export const handleCreated = props => (response, actions) => {
  props.updateTriggerDetails(
    'scriptTemplate',
    response.submission,
    props.journeyTriggers,
    true,
  );
  props.setShowScriptDialog(false);
};
function onCallScriptFormLoaded() {
  $("[data-element-name='Script']").css({
    'line-height': 0,
    height: 0,
    overflow: 'hidden',
  });
  let scriptContent = $("[name='Script']").val();
  ReactDOM.render(
    <ScriptEditor text={scriptContent} label="Script" elementName="Script" />,
    document.getElementById('script_editor'),
  );
  //  $("[data-element-name='Submit Button']").click(onCallScriptFormSubmit);
}

export class ScriptEditor extends Component {
  constructor(props) {
    super(props);
    this.reactQuillRef = null;
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
        ],
      },
      imageResize: {
        parchment: Quill.import('parchment'),
        format: ['width', 'height'],
        displaySize: true,
      },
    };
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
    'style',
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

const mapStateToProps = state => ({});
const mapDispatchToProps = {};
var compThis = undefined;
const util = require('util');
export class ScriptTemplate extends Component {
  handleClick = () => {};
  handleClose = () => {
    this.props.setShowScriptDialog(false);
  };

  constructor(props) {
    super(props);
    compThis = this;

    this.handleLoaded = this.props.handleLoaded.bind(this);
    this.handleUpdated = this.props.handleUpdated.bind(this);
    this.handleCreated = this.props.handleCreated.bind(this);
    this.handleError = this.props.handleError.bind(this);

    this.state = {
      loadingForm: true,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}

  render() {
    return (
      <div>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="scriptEditingDialog"
            onClose={this.handleClose}
            style={inlineStyle}
            dismissOnBackgroundClick={false}
          >
            {this.state.loadingForm && <Loading text="Loading ..." />}
            <Fragment>
              {this.props.scriptTemplateID !== undefined ? (
                <CoreForm
                  datastore
                  review={false}
                  submission={this.props.scriptTemplateID}
                  onLoaded={this.handleLoaded}
                  updated={this.handleUpdated}
                  error={this.handleError}
                  globals={globals}
                />
              ) : (
                <CoreForm
                  datastore
                  form="call-scripts"
                  onLoaded={this.handleLoaded}
                  onCreated={this.handleCreated}
                  error={this.handleError}
                  globals={globals}
                />
              )}
            </Fragment>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({
    handleUpdated,
    handleCreated,
    handleError,
    handleLoaded,
  }),
);
const inlineStyle = {
  width: '1200px',
  top: '5%',
  left: '5%',
};

export const ScriptTemplateContainer = enhance(ScriptTemplate);

import React, { Component, Fragment } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { CoreForm } from '@kineticdata/react';
import { Loading } from 'common';
import ReactDOM from 'react-dom';
import EmailEditor from 'react-email-editor';

const globals = import('common/globals');

export const handleLoaded = props => form => {
  compThis.setState({
    loadingForm: false,
  });
  onEmailTemplateFormLoaded();
};
export const handleUpdated = props => response => {
  if (response.submission.id) {
    props.updateTriggerDetails(
      'emailTemplate',
      response.submission,
      props.journeyTriggers,
    );
    props.setShowEmailDialog(false);
  }
};
export const handleError = props => response => {};
export const handleCreated = props => (response, actions) => {
  props.updateTriggerDetails(
    'emailTemplate',
    response.submission,
    props.journeyTriggers,
    true,
  );
  props.setShowEmailDialog(false);
};
var emailEditorRef = null;
var escapeJSON = function(str) {
  return str.replace(/(["])/g, '\\$1');
};
function onLoadEmailTemplate() {
  setTimeout(function() {
    emailEditorRef.editor.addEventListener('design:loaded', () => {
      emailEditorRef.editor.setBodyValues({
        backgroundColor: '#FFFFFF',
      });
    });
    emailEditorRef.addEventListener('design:updated', function(updates) {
      // Design is updated by the user
      emailEditorRef.exportHtml(function(data) {
        var json = data.design; // design json
        var html = data.html; // design html

        // Save the json, or html here
        $("[name='Email Content']").val(html);
        $("[name='Email JSON']").val(JSON.stringify(json));
      });
    });
    if ($("[name='Email JSON']").val() !== '') {
      emailEditorRef.loadDesign(JSON.parse($("[name='Email JSON']").val()));
    } else if ($("[name='Email Content']").val() !== '') {
      var template = BLANK_TEMPLATE.replace(
        '##CONTENT##',
        escapeJSON($("[name='Email Content']").val()),
      );
      emailEditorRef.loadDesign(JSON.parse(template));
    }
  }, 1000);
}

function onEmailTemplateFormLoaded() {
  $("[data-element-name='Email Content']").css({
    'line-height': 0,
    height: 0,
    overflow: 'hidden',
  });

  $('#email_editor').removeClass('ql-editor');
  ReactDOM.render(
    <EmailEditor
      ref={editor => (emailEditorRef = editor)}
      onLoad={onLoadEmailTemplate}
      minHeight={'850px'}
      options={[
        ('setLinkTypes': {
          name: 'static_google_link',
          label: 'Go to Google',
          attrs: {
            href: 'https://google.com/',
            target: '_blank',
          },
        }),
      ]}
    />,
    document.getElementById('email_editor'),
  );
  //  $("[data-element-name='Submit Button']").click(onEmailTemplateFormSubmit);
}

const mapStateToProps = state => ({});
const mapDispatchToProps = {};
var compThis = undefined;
const util = require('util');
export class EmailTemplate extends Component {
  handleClick = () => {};
  handleClose = () => {
    this.props.setShowEmailDialog(false);
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
            className="emailEditingDialog"
            onClose={this.handleClose}
            style={inlineStyle}
            dismissOnBackgroundClick={false}
          >
            {this.state.loadingForm && <Loading text="Loading ..." />}
            <Fragment>
              {this.props.emailTemplateID !== undefined ? (
                <CoreForm
                  datastore
                  review={false}
                  submission={this.props.emailTemplateID}
                  onLoaded={this.handleLoaded}
                  updated={this.handleUpdated}
                  error={this.handleError}
                  globals={globals}
                />
              ) : (
                <CoreForm
                  datastore
                  form="email-templates"
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
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
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

export const EmailTemplateContainer = enhance(EmailTemplate);

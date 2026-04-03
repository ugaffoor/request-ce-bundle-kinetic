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
var defaultTemplateJSON = '';
var defaultContentWidth = '';
const BLANK_TEMPLATE =
  '{"counters":{"u_column":1,"u_row":1,"u_content_text":1},"body":{"rows":[{"cells":[1],"columns":[{"contents":[{"type":"text","values":{"containerPadding":"10px","_meta":{"htmlID":"u_content_text_1","htmlClassNames":"u_content_text"},"selectable":true,"draggable":true,"deletable":true,"color":"#000000","textAlign":"left","lineHeight":"140%","linkStyle":{"inherit":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"text":"<p style=\\"font-size: 14px; line-height: 140%;\\"><span style=\\"font-size: 14px; line-height: 19.6px;\\">##CONTENT##</span></p>"}}],"values":{"backgroundColor":"","padding":"0px","border":{},"_meta":{"htmlID":"u_column_1","htmlClassNames":"u_column"}}}],"values":{"columns":false,"backgroundColor":"","columnsBackgroundColor":"","backgroundImage":{"url":"","fullWidth":true,"repeat":false,"center":true,"cover":false},"padding":"0px","hideDesktop":false,"hideMobile":false,"noStackMobile":false,"_meta":{"htmlID":"u_row_1","htmlClassNames":"u_row"},"selectable":true,"draggable":true,"deletable":true}}],"values":{"backgroundColor":"#e7e7e7","backgroundImage":{"url":"","fullWidth":true,"repeat":false,"center":true,"cover":false},"contentWidth":"500px","fontFamily":{"label":"Arial","value":"arial,helvetica,sans-serif"},"linkStyle":{"body":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"_meta":{"htmlID":"u_body","htmlClassNames":"u_body"}}}}';
var escapeJSON = function(str) {
  return str.replace(/(["])/g, '\\$1');
};
function onLoadEmailTemplate() {
  setTimeout(function() {
    emailEditorRef.editor.addEventListener('design:loaded', () => {
      emailEditorRef.editor.setBodyValues({
        backgroundColor: '#FFFFFF',
        ...(defaultContentWidth ? { contentWidth: defaultContentWidth } : {}),
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
    } else if (defaultTemplateJSON !== '') {
      emailEditorRef.loadDesign(JSON.parse(defaultTemplateJSON));
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
    defaultTemplateJSON = this.props.defaultTemplate || '';
    defaultContentWidth = this.props.defaultContentWidth || '';

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
                  values={{
                    'Template Name': this.props.defaultTemplateName || '',
                    Category: this.props.defaultCategory || '',
                  }}
                  alterFields={
                    this.props.defaultCategory
                      ? { Category: { enabled: false } }
                      : undefined
                  }
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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { compose, withHandlers, withState, lifecycle } from 'recompose';
import { Link } from 'react-router-dom';
import { parse } from 'query-string';
import { ButtonGroup, Button } from 'reactstrap';
import { CoreForm } from 'react-kinetic-core';
import { LinkContainer } from 'react-router-bootstrap';
import $ from 'jquery';

import { PageTitle, toastActions } from 'common';
import { selectDiscussionsEnabled } from 'common/src/redux/modules/common';
import EmailEditor from 'react-email-editor';
import { I18n } from '../../../../../app/src/I18nProvider';
import ReactDOM from 'react-dom';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';

import {
  selectPrevAndNext,
  selectFormBySlug,
  actions,
} from '../../../redux/modules/settingsDatastore';
import { actions as memberActions } from '../../../../../gbmembers/src/redux/modules/memberApp';

import { DatastoreDiscussions } from './DatastoreDiscussions';

const globals = import('common/globals');
var Block = Quill.import('blots/block');
Block.tagName = 'DIV';
Quill.register(Block, true);

var Size = Quill.import('attributors/style/size');
Size.whitelist = ['10px', '18px', '32px', '64px'];
Quill.register(Size, true);

var BaseImageFormat = Quill.import('formats/image');
const ImageFormatAttributesList = ['alt', 'height', 'width', 'style'];

class ImageFormat extends BaseImageFormat {
  static formats(domNode) {
    return ImageFormatAttributesList.reduce(function(formats, attribute) {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }
  format(name, value) {
    if (ImageFormatAttributesList.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}

Quill.register(ImageFormat, true);
Quill.register('modules/imageResize', ImageResize);
var emailEditorRef = null;
const DatastoreSubmissionComponent = ({
  form,
  showPrevAndNext,
  prevAndNext,
  submissionId,
  handleLoaded,
  handleCreated,
  handleUpdated,
  handleError,
  values,
  submission,
  isEditing,
  isSpaceAdmin,
  formKey,
  discussionsEnabled,
}) => (
  <I18n context={`datastore.forms.${form.slug}`}>
    <div className="page-container page-container--panels page-container--datastore">
      <PageTitle
        parts={[
          submissionId ? (submission ? submission.label : '') : 'New Record',
          'Datastore',
        ]}
      />
      <div className="page-panel page-panel--three-fifths page-panel--space-datastore-submission page-panel--scrollable">
        <div className="page-title">
          <div className="page-title__wrapper">
            {isSpaceAdmin && (
              <h3>
                <Link to="/">
                  <I18n>home</I18n>
                </Link>{' '}
                /{` `}
                <Link to="/settings">
                  <I18n>settings</I18n>
                </Link>{' '}
                /{` `}
                <Link to={`/settings/datastore/`}>
                  <I18n>datastore</I18n>
                </Link>{' '}
                /{` `}
                <Link to={`/settings/datastore/${form.slug}/`}>
                  <I18n>{form.name}</I18n>
                </Link>{' '}
                /
              </h3>
            )}
            <h1>
              {submissionId ? (
                submission ? (
                  submission.label
                ) : (
                  ''
                )
              ) : (
                <I18n>New Record</I18n>
              )}
            </h1>
          </div>
          <div className="page-title__actions">
            {showPrevAndNext && !isEditing && (
              <ButtonGroup className="datastore-prev-next">
                <LinkContainer to={prevAndNext.prev || ''}>
                  <Button color="inverse" disabled={!prevAndNext.prev}>
                    <span className="icon">
                      <span className="fa fa-fw fa-caret-left" />
                    </span>
                  </Button>
                </LinkContainer>
                <LinkContainer to={prevAndNext.next || ''}>
                  <Button color="inverse" disabled={!prevAndNext.next}>
                    <span className="icon">
                      <span className="fa fa-fw fa-caret-right" />
                    </span>
                  </Button>
                </LinkContainer>
              </ButtonGroup>
            )}
            {submissionId && !isEditing && (
              <Link
                to={`/settings/datastore/${form.slug}/${submissionId}/edit`}
                className="btn btn-primary ml-3 datastore-edit"
              >
                <I18n>Edit Record</I18n>
              </Link>
            )}
          </div>
        </div>
        <div>
          {submissionId ? (
            <CoreForm
              datastore
              review={!isEditing}
              submission={submissionId}
              onLoaded={handleLoaded}
              updated={handleUpdated}
              error={handleError}
              globals={globals}
            />
          ) : (
            <CoreForm
              key={formKey}
              form={form.slug}
              datastore
              onLoaded={handleLoaded}
              onCreated={handleCreated}
              error={handleError}
              values={values}
              globals={globals}
            />
          )}
        </div>
      </div>
      {discussionsEnabled &&
        submission &&
        submission.form &&
        submission.form.fields &&
        submission.form.fields.find(f => f.name === 'Discussion Id') && (
          <DatastoreDiscussions />
        )}
    </div>
  </I18n>
);

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

export const getRandomKey = () =>
  Math.floor(Math.random() * (100000 - 100 + 1)) + 100;

export const shouldPrevNextShow = state =>
  state.space.settingsDatastore.submission !== null &&
  state.space.settingsDatastore.submissions.size > 0;

export const handleUpdated = props => response => {
  if (props.submissionId) {
    props.addSuccess(
      `Successfully updated submission (${response.submission.handle})`,
      'Submission Updated!',
    );
    props.push(props.match.url.replace('/edit', ''));
  }
};

export const handleError = props => response => {
  props.addError(response.error, 'Error');
};

export const handleCreated = props => (response, actions) => {
  props.addSuccess(
    `Successfully created submission (${response.submission.handle})`,
    'Submission Created!',
  );
  props.setFormKey(getRandomKey());
};

export const handleLoaded = props => form => {
  if (!props.submissionId || props.match.params.mode === 'edit') {
    if (props.form.slug === 'call-scripts') {
      onCallScriptFormLoaded();
    } else if (props.form.slug === 'email-templates') {
      onEmailTemplateFormLoaded(props.snippets);
    }
  } else if (props.submissionId) {
    if (props.form.slug === 'email-templates') {
      $('#email_editor').removeClass('ql-editor');
    }
  }
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
  $("[data-element-name='Submit Button']").click(onCallScriptFormSubmit);
}

function onCallScriptFormSubmit() {
  if ($("[name='Script']").val().length <= 0) {
    $('.quill').css({
      'border-color': 'red',
      'border-style': 'solid',
      'border-width': '1px',
    });
    $('#quill_editor_label').css({ color: 'red' });
  } else {
    $('.quill').css({ 'border-color': '#d3dce7', 'border-style': 'none' });
    $('#quill_editor_label').css({ color: 'rgba(34, 34, 34, 0.75)' });
  }
}
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
function onEmailTemplateFormLoaded(snippets) {
  $("[data-element-name='Email Content']").css({
    'line-height': 0,
    height: 0,
    overflow: 'hidden',
  });
  if (snippets.size > 0) {
    let footer = snippets.find(function(el) {
      if (el.name === 'Email Footer') return el;
    }).value;
    $('#emailFooter').val(footer);
  }

  $('#email_editor').removeClass('ql-editor');
  ReactDOM.render(
    <EmailEditor
      ref={editor => (emailEditorRef = editor)}
      onLoad={onLoadEmailTemplate}
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
  /*  ReactDOM.render(
    <EmailEditor
      text={scriptContent}
      label="Email Content"
      elementName="Email Content"
      snippets={snippets}
    />,
    document.getElementById('email_editor'),
  );
*/
  $("[data-element-name='Submit Button']").click(onEmailTemplateFormSubmit);
}

function onEmailTemplateFormSubmit() {
  /*  if ($("[name='Email Content']").val().length <= 0) {
    $('.quill').css({
      'border-color': 'red',
      'border-style': 'solid',
      'border-width': '1px',
    });
    $('#quill_editor_label').css({ color: 'red' });
  } else {
    $('.quill').css({ 'border-color': '#d3dce7', 'border-style': 'none' });
    $('#quill_editor_label').css({ color: 'rgba(34, 34, 34, 0.75)' });
  }
*/
  /*   emailEditorRef.exportHtml(data => {
      const { design, html } = data;
      $("[name='Email Content']").val(html);
      console.log('exportHtml', html)
    })
*/
}

export const mapStateToProps = (state, { match: { params } }) => ({
  submissionId: params.id,
  submission: state.space.settingsDatastore.submission,
  showPrevAndNext: shouldPrevNextShow(state),
  prevAndNext: selectPrevAndNext(state),
  form: selectFormBySlug(state, params.slug),
  values: valuesFromQueryParams(state.router.location.search),
  isEditing: params.mode && params.mode === 'edit' ? true : false,
  discussionsEnabled: selectDiscussionsEnabled(state),
  snippets: state.member.app.snippets,
});

export const mapDispatchToProps = {
  push,
  fetchSubmission: actions.fetchSubmission,
  resetSubmission: actions.resetSubmission,
  addSuccess: toastActions.addSuccess,
  addError: toastActions.addError,
  loadAppSettings: memberActions.loadAppSettings,
};

export const DatastoreSubmission = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('formKey', 'setFormKey', getRandomKey),
  withHandlers({
    handleUpdated,
    handleCreated,
    handleError,
    handleLoaded,
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      if (this.props.match.params.id) {
        this.props.fetchSubmission(this.props.match.params.id);
      }
      if (this.props.snippets === undefined || this.props.snippets.size === 0) {
        this.props.loadAppSettings();
      }
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (
        nextProps.match.params.id &&
        this.props.match.params.id !== nextProps.match.params.id
      ) {
        this.props.fetchSubmission(nextProps.match.params.id);
      }
      if (
        nextProps.snippets.size !== this.props.snippets.size ||
        $('#emailFooter').val() === ''
      ) {
        if (nextProps.snippets.size > 0) {
          let footer = nextProps.snippets.find(function(el) {
            if (el.name === 'Email Footer') return el;
          }).value;
          $('#emailFooter').val(footer);
        }
      }
    },
    componentWillUnmount() {
      this.props.resetSubmission();
    },
  }),
)(DatastoreSubmissionComponent);

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

export class QuillEmailEditor extends Component {
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
          ['id'],
          ['firstname'],
          ['lastname'],
          ['emailfooter'],
        ],
        handlers: {
          id: this.insertID,
          firstname: this.insertFirstName,
          lastname: this.insertLastName,
          emailfooter: this.insertEmailFooter.bind(this),
        },
      },
      imageResize: {
        parchment: Quill.import('parchment'),
        format: ['width', 'height'],
        displaySize: true,
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

  insertID() {
    const cursorPosition = this.quill.getSelection().index;
    this.quill.insertText(cursorPosition, "member('ID')");
    this.quill.setSelection(cursorPosition + "member('ID')".length + 1);
  }
  insertFirstName() {
    const cursorPosition = this.quill.getSelection().index;
    this.quill.insertText(cursorPosition, "member('First Name')");
    this.quill.setSelection(cursorPosition + "member('First Name')".length + 1);
  }
  insertLastName() {
    const cursorPosition = this.quill.getSelection().index;
    this.quill.insertText(cursorPosition, "member('Last Name')");
    this.quill.setSelection(cursorPosition + "member('Last Name')".length + 1);
  }
  insertEmailFooter() {
    const cursorPosition = this.reactQuillRef.editor.getSelection().index;
    let footer = this.props.snippets.find(function(el) {
      if (el.name === 'Email Footer') return el;
    }).value;
    this.reactQuillRef.editor.pasteHTML(cursorPosition, footer);
    this.reactQuillRef.editor.setSelection(cursorPosition + footer.length + 1);
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

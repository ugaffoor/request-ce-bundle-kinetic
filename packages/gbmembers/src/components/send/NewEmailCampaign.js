import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/campaigns';
import $ from 'jquery';
import 'react-datetime/css/react-datetime.css';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';
import moment from 'moment';
import { email_sent_date_format } from '../leads/LeadsUtils';
import { AttachmentForm } from './AttachmentForm';
import '../../styles/quill.snow.scss.css';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as membersActions } from '../../redux/modules/members';
import { actions as campaignActions } from '../../redux/modules/campaigns';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { matchesMemberFilter } from '../../utils/utils';
import Select from 'react-select';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  campaignItem: state.member.campaigns.newEmailCampaign,
  newCampaignLoading: state.member.campaigns.newEmailCampaignLoading,
  memberLists: state.member.app.memberLists,
  snippets: state.member.app.snippets,
  allMembers: state.member.members.allMembers,
  space: state.member.app.space,
  leadItem: state.member.leads.currentLead,
  memberItem: state.member.members.currentMember,
  emailTemplates: state.member.datastore.emailTemplates,
  emailTemplatesLoading: state.member.datastore.emailTemplatesLoading,
});
const mapDispatchToProps = {
  createCampaign: actions.createEmailCampaign,
  fetchNewCampaign: actions.fetchNewEmailCampaign,
  updateCampaign: actions.updateEmailCampaign,
  fetchLead: leadsActions.fetchCurrentLead,
  fetchMember: membersActions.fetchCurrentMember,
  fetchEmailTemplates: dataStoreActions.fetchEmailTemplates,
  fetchEmailCampaign: campaignActions.fetchEmailCampaign,
};

const util = require('util');

var Block = Quill.import('blots/block');
Block.tagName = 'DIV';
Quill.register(Block, true);

var Size = Quill.import('attributors/style/size');
Size.whitelist = ['10px', '18px', '32px', '64px'];
Quill.register(Size, true);

var Link = Quill.import('formats/link');
var builtInFunc = Link.sanitize;
var campaignSpace = null;
Link.sanitize = function modifyLinkInput(linkValueInput) {
  console.log('linkValueInput:' + linkValueInput);
  if (linkValueInput.indexOf('${') !== -1) return linkValueInput;
  var val = btoa(linkValueInput).replace('/', 'XXX');
  return builtInFunc.call(
    this,
    'https://gbbilling.com.au:8443/billingservice/goToUrl/' +
      campaignSpace +
      '/__campaign_id__/__member_id__/' +
      val,
  ); // retain the built-in logic
};

export class NewEmailCampaign extends Component {
  constructor(props) {
    super(props);

    campaignSpace = this.props.space.slug;
    this.handleChange = this.handleChange.bind(this);
    this.handleRecipientChange = this.handleRecipientChange.bind(this);

    this.preview = this.preview.bind(this);
    this.back = this.back.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.createCampaign = this.createCampaign.bind(this);
    this.getSelectOptions = this.getSelectOptions.bind(this);
    this.insertEmailTemplate = this.insertEmailTemplate.bind(this);
    this.renderTemplatesList = this.renderTemplatesList.bind(this);
    this.quillRef = null;
    this.reactQuillRef = null;
    this.attachQuillRefs = this.attachQuillRefs.bind(this);
    if (this.props.submissionId != null) {
      this.currentMember = this.props.allMembers.find(
        member => member['id'] === this.props.submissionId,
      );
    }
    this.state = {
      text: '', // You can also pass a Quill Delta here
      subject: '',
      options: this.getSelectOptions(
        this.props.memberLists,
        this.props.allMembers,
      ),
      selectedOption: [],
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
          [{ templates: [] }],
        ],
        handlers: {
          firstname: this.insertFirstName,
          lastname: this.insertLastName,
          emailfooter: this.insertEmailFooter.bind(this),
        },
      },
      imageResize: {
        parchment: Quill.import('parchment'),
      },
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allMembers.length !== this.props.allMembers.length) {
      this.setState({
        options: this.getSelectOptions(
          nextProps.memberLists,
          nextProps.allMembers,
        ),
      });
    }

    if (nextProps.emailTemplates.length !== this.props.emailTemplates.length) {
      this.renderTemplatesList(
        nextProps.emailTemplates,
        nextProps.emailTemplatesLoading,
      );
    }
    let subject = '';
    let text = '';
    if (
      this.state.subject === '' &&
      this.state.text === '' &&
      nextProps.replyType === 'activity' &&
      nextProps.leadItem.emailsReceived
    ) {
      for (var i = 0; i < nextProps.leadItem.emailsReceived.length; i++) {
        if (
          nextProps.leadItem.emailsReceived[i]['Activity ID'] ===
          nextProps.campaignId
        ) {
          subject = 'Re: ' + nextProps.leadItem.emailsReceived[i]['Subject'];
          text = ' ' + nextProps.leadItem.emailsReceived[i]['Content'];
          break;
        }
      }
      this.setState({ subject: subject, text: text });
    }
    if (
      this.state.subject === '' &&
      this.state.text === '' &&
      nextProps.replyType === 'activity' &&
      nextProps.memberItem.emailsReceived
    ) {
      for (i = 0; i < nextProps.memberItem.emailsReceived.length; i++) {
        if (
          nextProps.memberItem.emailsReceived[i]['Activity ID'] ===
          nextProps.campaignId
        ) {
          subject = 'Re: ' + nextProps.memberItem.emailsReceived[i]['Subject'];
          text = ' ' + nextProps.memberItem.emailsReceived[i]['Content'];
          break;
        }
      }
      this.setState({ subject: subject, text: text });
    }
  }

  componentDidMount() {
    this.attachQuillRefs();
    this.renderTemplatesList(
      this.props.emailTemplates,
      this.props.emailTemplatesLoading,
    );
  }

  componentDidUpdate() {
    this.attachQuillRefs();
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
  insertEmailTemplate() {
    let templateId = $('.ql-templates-list').val();
    if (!templateId) {
      console.log('Please select a template');
      return;
    }
    let content = this.props.emailTemplates.find(
      template => template['id'] === templateId,
    ).values['Email Content'];
    var range = this.quillRef.getSelection();
    let position = range ? range.index : 0;
    this.quillRef.pasteHTML(position, content);
  }

  renderTemplatesList(emailTemplates, emailTemplatesLoading) {
    let templates = [];
    let selectHtml = "<select class='ql-templates-list' >";
    if (emailTemplatesLoading) {
      selectHtml += "<option value=''>Loading templates...</option>";
    } else {
      selectHtml += "<option value=''>- Select Template -</option>";
      emailTemplates.forEach(template => {
        templates.push({
          value: template['id'],
          label: template.values['Template Name'],
          template: template,
        });
        selectHtml +=
          "<option value='" +
          template['id'] +
          "'>" +
          template.values['Template Name'] +
          '</option>';
      });
    }

    selectHtml += '</select>';
    document.querySelectorAll(
      '.ql-templates.ql-picker',
    )[0].innerHTML = selectHtml;
    $('.ql-templates-list').change(this.insertEmailTemplate);
  }

  getSelectOptions(memberLists, allMembers) {
    //If submissionId is present then submissionId is the recipient.
    //So no need to populate or display recipient list dropdown.
    if (this.props.submissionId) {
      return [];
    }
    let options = [];
    let activeMembers = [];
    let inactiveMembers = [];

    allMembers.forEach(member => {
      if (member.values['Status'] === 'Active') {
        activeMembers.push(member['id']);
      } else {
        inactiveMembers.push(member['id']);
      }
    });

    if (activeMembers.length > 0) {
      options.push({
        value: '__active_members__',
        label: 'Active Members',
        members: activeMembers,
      });
    }

    if (inactiveMembers.length > 0) {
      options.push({
        value: '__inactive_members__',
        label: 'Inactive Members',
        members: inactiveMembers,
      });
    }

    memberLists.forEach(list => {
      options.push({
        value: list.name,
        label: list.name,
        members: matchesMemberFilter(allMembers, list.filters).map(
          member => member['id'],
        ),
      });
    });

    return options;
  }

  handleRecipientChange = selectedOption => {
    this.setState({ selectedOption });
    //console.log(`Option selected:`, selectedOption);
  };

  createCampaign() {
    if (!this.props.submissionId && this.state.selectedOption.length <= 0) {
      console.log('Recipients, subject and body is required');
      return;
    }

    if (this.state.text.length <= 0 || this.state.subject.length <= 0) {
      console.log('Recipients, subject and body is required');
      return;
    }

    let recipientIds = [];
    if (this.props.submissionId) {
      recipientIds = [this.props.submissionId];
    } else {
      this.state.selectedOption.forEach(option => {
        recipientIds.push(...option.members);
      });
    }
    // Extract Embedded images from the Body
    let embeddedImages = [];
    let body = '';

    if (this.state.text.indexOf('<img src="data:') !== -1) {
      let pos = 0;
      let idx = 0;
      let endIdx = 0;
      while (this.state.text.indexOf('<img src="data:', endIdx) !== -1) {
        idx = this.state.text.indexOf('<img src="data:', endIdx);
        endIdx = this.state.text.indexOf('>', idx);
        let now = new Date().getTime() + '_' + pos;
        let encodedImg =
          'EMBEDDED_IMAGE_' +
          now +
          ':' +
          this.state.text.substring(idx, endIdx);
        embeddedImages.push(encodedImg);
        body = body + this.state.text.substring(pos, idx);
        body = body + 'EMBEDDED_IMAGE_' + now;
        pos = endIdx + 1;
      }
      body = body + this.state.text.substring(endIdx + 1);
    } else {
      body = this.state.text;
    }

    body = body.replace(
      /class="ql-align-center"/g,
      'style="text-align: center;"',
    );
    body = body.replace(
      /class="ql-align-right"/g,
      'style="text-align: right;"',
    );
    body = body.replace(
      /class="ql-align-justify"/g,
      'style="text-align: justify;"',
    );
    if (this.props.submissionId) {
      body +=
        "<div id='__gbmembers-" +
        this.props.submissionType +
        '-' +
        this.props.submissionId +
        "' />";
    }

    this.props.saveCampaign(
      this.state.subject,
      recipientIds,
      body,
      embeddedImages,
      this.props.space,
    );
  }

  preview() {
    if (
      $('.attachment-form')
        .find('button[data-element-name="Submit Button"]')
        .css('display') === 'inline-block'
    ) {
      this.props.setShowAttachmentError(true);
    } else {
      this.props.setShowEditor(false);
      this.props.setShowPreview(true);
      this.props.setShowAttachmentError(false);
    }
  }

  back() {
    this.props.setShowEditor(true);
    this.props.setShowPreview(false);
  }

  handleChange(html, text) {
    this.setState({ text: html });
    //console.log("Text = " + html);
  }

  handleSubjectChange(event) {
    this.setState({ subject: event.target.value });
  }

  render() {
    return (
      <div className="new_campaign" style={{ marginTop: '2%' }}>
        <div
          className="row"
          style={{
            height: '100px',
            backgroundColor: '#f7f7f7',
            paddingTop: '2%',
          }}
        >
          <div className="col-md-4" style={{ textAlign: 'right' }}>
            You are currently sending this email to
          </div>
          <div className="col-md-4">
            {this.props.submissionId ? (
              <input
                type="text"
                readOnly
                style={{ width: '100%' }}
                value={
                  this.props.submissionType === 'member'
                    ? this.props.memberItem && this.props.memberItem.values
                      ? this.props.memberItem.values['Email'] +
                        (this.props.memberItem.values['Additional Email']
                          ? ',' +
                            this.props.memberItem.values['Additional Email']
                          : '')
                      : ''
                    : this.props.leadItem && this.props.leadItem.values
                    ? this.props.leadItem.values['Email'] +
                      (this.props.leadItem.values['Additional Email']
                        ? ',' + this.props.leadItem.values['Additional Email']
                        : '')
                    : ''
                }
              />
            ) : (
              <Select
                value={this.state.selectedOption}
                onChange={this.handleRecipientChange}
                options={this.state.options}
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                controlShouldRenderValue={true}
                isMulti={true}
              />
            )}
          </div>
          <div className="col-md-3">&nbsp;</div>
        </div>
        <div className="row">
          <div className="col-md-10" style={{ height: '1000px' }}>
            <span className="line">
              <div>
                <label htmlFor="subject" required>
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  style={{ width: '100%' }}
                  required
                  value={this.state.subject}
                  onChange={e => this.handleSubjectChange(e)}
                  readOnly={this.props.showPreview}
                />
              </div>
            </span>
            <span className="line">
              <div>
                <AttachmentForm campaignItem={this.props.campaignItem} />
              </div>
            </span>
            {this.props.showEditor && (
              <ReactQuill
                ref={el => {
                  this.reactQuillRef = el;
                }}
                value={this.state.text}
                onChange={this.handleChange}
                theme="snow"
                modules={this.modules}
                formats={this.formats}
                debug={true}
              />
            )}
            {this.props.showPreview && (
              <div
                id="previewDiv"
                ref="previewDiv"
                className="ql-editor"
                style={{ border: '1px solid #ccc' }}
              >
                <span dangerouslySetInnerHTML={{ __html: this.state.text }} />
              </div>
            )}
          </div>
          <div className="col-md buttons" style={{ verticalAlign: 'middle' }}>
            {this.props.showEditor && (
              <button
                type="button"
                id="saveButton"
                className="btn btn-primary preview_send"
                onClick={e => this.preview()}
              >
                Preview & Send
              </button>
            )}
            {this.props.showAttachmentError && (
              <span className="attachmentWarning">
                Submit your Attachment or remove to continue
              </span>
            )}
            {this.props.showPreview && (
              <span className="preview">
                <button
                  type="button"
                  id="saveButton"
                  className="btn btn-primary send"
                  onClick={e => this.createCampaign()}
                >
                  Send
                </button>
                &nbsp;
                <button
                  type="button"
                  className="btn btn-primary sendback"
                  onClick={e => this.back()}
                >
                  Back
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export const NewEmailCampaignView = ({
  campaignItem,
  newCampaignLoading,
  saveCampaign,
  memberLists,
  snippets,
  isDirty,
  setIsDirty,
  showEditor,
  setShowEditor,
  showAttachmentError,
  setShowAttachmentError,
  showPreview,
  setShowPreview,
  updateCampaign,
  allMembers,
  submissionId,
  submissionType,
  leadItem,
  memberItem,
  space,
  emailTemplates,
  emailTemplatesLoading,
  replyType,
  campaignId,
}) =>
  newCampaignLoading ? (
    <div />
  ) : (
    <div className="container-fluid">
      <NewEmailCampaign
        campaignItem={campaignItem}
        saveCampaign={saveCampaign}
        memberLists={memberLists}
        snippets={snippets}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        showEditor={showEditor}
        showAttachmentError={showAttachmentError}
        setShowAttachmentError={setShowAttachmentError}
        setShowEditor={setShowEditor}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        updateCampaign={updateCampaign}
        allMembers={allMembers}
        submissionId={submissionId}
        submissionType={submissionType}
        leadItem={leadItem}
        memberItem={memberItem}
        space={space}
        emailTemplates={emailTemplates}
        emailTemplatesLoading={emailTemplatesLoading}
        replyType={replyType}
        campaignId={campaignId}
      />
    </div>
  );

export const EmailCampaignContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ match }) => {
    return {
      submissionId: match.params.submissionId,
      submissionType: match.params.submissionType,
      replyType: match.params.replyType,
      campaignId: match.params.campaignId,
    };
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('showEditor', 'setShowEditor', true),
  withState('showAttachmentError', 'setShowAttachmentError', false),
  withState('showPreview', 'setShowPreview', false),
  withHandlers({
    saveCampaign: ({ campaignItem, createCampaign }) => (
      subject,
      recipients,
      body,
      embeddedImages,
      space,
    ) => {
      campaignItem.values['From'] = space.attributes['School Email'][0];
      campaignItem.values['Recipients'] = recipients;
      campaignItem.values['Subject'] = subject;
      campaignItem.values['Body'] = body;
      campaignItem.values['Embedded Images'] = embeddedImages;
      campaignItem.values['Sent Date'] = moment().format(
        email_sent_date_format,
      );

      createCampaign({ campaignItem, history: campaignItem.history });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchNewCampaign({
        myThis: this,
        history: this.props.history,
        fetchEmailCampaigns: null,
      });
      if (this.props.submissionType && this.props.submissionType === 'lead') {
        this.props.fetchLead({
          id: this.props.submissionId,
        });
      }
      if (this.props.submissionType && this.props.submissionType === 'member') {
        this.props.fetchMember({
          id: this.props.submissionId,
        });
      }
      this.props.fetchEmailTemplates();
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchNewCampaign({
          myThis: this,
          history: this.props.history,
          fetchEmailCampaigns: null,
        });
      }
    },
    componentDidMount() {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(NewEmailCampaignView);

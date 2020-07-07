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
import moment from 'moment';
import { email_sent_date_format } from '../leads/LeadsUtils';
import { AttachmentForm } from './AttachmentForm';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as membersActions } from '../../redux/modules/members';
import { actions as campaignActions } from '../../redux/modules/campaigns';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { matchesMemberFilter } from '../../utils/utils';
import Select from 'react-select';
import EmailEditor from 'react-email-editor';
import {
  BrowserView,
  MobileView,
  TabletView,
  isBrowser,
  isMobile,
  isTablet,
} from 'react-device-detect';
import './tinymce.min.js';
import { TinyMCEComponent, createEditorStore } from 'mb-react-tinymce';
import { CopyToClipboard } from 'react-copy-to-clipboard';

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
  emailTemplateCategories: state.member.datastore.emailTemplateCategories,
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

var campaignSpace = null;

var emailEditorRef = null;
var editorThis = null;
const BLANK_TEMPLATE =
  '{"counters":{"u_column":1,"u_row":1,"u_content_text":1},"body":{"rows":[{"cells":[1],"columns":[{"contents":[{"type":"text","values":{"containerPadding":"10px","_meta":{"htmlID":"u_content_text_1","htmlClassNames":"u_content_text"},"selectable":true,"draggable":true,"deletable":true,"color":"#000000","textAlign":"left","lineHeight":"140%","linkStyle":{"inherit":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"text":"<p style=\\"font-size: 14px; line-height: 140%;\\"><span style=\\"font-size: 14px; line-height: 19.6px;\\">##CONTENT##</span></p>"}}],"values":{"backgroundColor":"","padding":"0px","border":{},"_meta":{"htmlID":"u_column_1","htmlClassNames":"u_column"}}}],"values":{"columns":false,"backgroundColor":"","columnsBackgroundColor":"","backgroundImage":{"url":"","fullWidth":true,"repeat":false,"center":true,"cover":false},"padding":"0px","hideDesktop":false,"hideMobile":false,"noStackMobile":false,"_meta":{"htmlID":"u_row_1","htmlClassNames":"u_row"},"selectable":true,"draggable":true,"deletable":true}}],"values":{"backgroundColor":"#e7e7e7","backgroundImage":{"url":"","fullWidth":true,"repeat":false,"center":true,"cover":false},"contentWidth":"500px","fontFamily":{"label":"Arial","value":"arial,helvetica,sans-serif"},"linkStyle":{"body":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"_meta":{"htmlID":"u_body","htmlClassNames":"u_body"}}}}';

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

    if (this.props.submissionId != null) {
      this.currentMember = this.props.allMembers.find(
        member => member['id'] === this.props.submissionId,
      );
    }

    this.state = {
      text: '',
      subject: '',
      options: this.getSelectOptions(
        this.props.memberLists,
        this.props.allMembers,
      ),
      selectedOption: [],
      isMenuOpen: false,
    };
    editorThis = this;
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

  componentWillMount() {
    if (isMobile || isTablet) {
      this.editorStore = createEditorStore();
    }
  }

  componentDidUpdate() {}

  escapeJSON(str) {
    return str.replace(/(["])/g, '\\$1');
  }

  getEmailTemplates(emailTemplates) {
    let templates = [];
    emailTemplates.forEach(template => {
      templates.push({
        label:
          template.values['Category'] !== undefined &&
          template.values['Category'] !== null
            ? template.values['Category'] +
              '->' +
              template.values['Template Name']
            : template.values['Template Name'],
        value: template.id,
      });
    });
    return templates;
  }
  selectEmailTemplate(e) {
    let templateId = e.value;
    if (!templateId) {
      console.log('Please select a template');
      return;
    }
    let template = this.props.emailTemplates.find(
      template => template['id'] === templateId,
    );

    if (
      template.values['Email JSON'] !== '' &&
      template.values['Email JSON'] !== undefined &&
      template.values['Email JSON'] !== null
    ) {
      emailEditorRef.loadDesign(JSON.parse(template.values['Email JSON']));
      emailEditorRef.exportHtml(function(data) {
        var html = data.html; // design html

        // Save the json, or html here
        editorThis.setState({ text: html });
      });
    } else if (template.values['Email Content'] !== '') {
      var templateStr = BLANK_TEMPLATE.replace(
        '##CONTENT##',
        editorThis.escapeJSON(template.values['Email Content']),
      );
      emailEditorRef.loadDesign(JSON.parse(templateStr));
      emailEditorRef.exportHtml(function(data) {
        var html = data.html; // design html

        // Save the json, or html here
        editorThis.setState({ text: html });
      });
    }
  }
  selectEmailTemplateMobile(e) {
    let templateId = e.value;
    if (!templateId) {
      console.log('Please select a template');
      return;
    }
    let template = this.props.emailTemplates.find(
      template => template['id'] === templateId,
    );

    if (template.values['Email Content'] !== '') {
      var templateStr = BLANK_TEMPLATE.replace(
        '##CONTENT##',
        editorThis.escapeJSON(template.values['Email Content']),
      );
      // Save the json, or html here
      editorThis.setState({ text: template.values['Email Content'] });
    }
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
    if (this.state.text.indexOf('<a href="') !== -1) {
      let idx = 0;
      let endIdx = 0;
      var contentHTML = this.state.text;
      /*
      while (contentHTML.indexOf('<a href="', endIdx) !== -1) {
        idx = contentHTML.indexOf('<a href="', endIdx);
        endIdx = contentHTML.indexOf('"', idx + '<a href="'.length);
        var url = contentHTML.substring(idx + '<a href="'.length, endIdx);
        var encodeVal = btoa(url).replace('/', 'XXX');

        var newUrl =
            'https://gbbilling.com.au:8443/billingservice/goToUrl/' +
            campaignSpace +
            '/__campaign_id__/__member_id__/' +
            encodeVal,
          contentHTML = contentHTML.replace(url, newUrl);

      }
*/

      body = contentHTML;
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
    if (isMobile || isTablet) {
      this.setState({
        text: $('.emailEditor .mce-content-body').html(),
      });
    }
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
  onLoadEmailTemplate() {
    setTimeout(function() {
      emailEditorRef.addEventListener('design:updated', function(updates) {
        // Design is updated by the user
        emailEditorRef.exportHtml(function(data) {
          var json = data.design; // design json
          var html = data.html; // design html

          // Save the json, or html here
          editorThis.setState({ text: html });
        });
      });
    }, 1000);
  }
  handleTinyEditorChange = (content, editor) => {
    console.log('Content was updated:', content);
  };

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
          <div className="col-md-10 details">
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
            <span className="line options">
              <span className="attachmentForm">
                <AttachmentForm campaignItem={this.props.campaignItem} />
              </span>
              <span
                className="line templateMenu"
                style={{
                  display: this.props.showEditor ? 'inline-block' : 'none',
                }}
              >
                <Select
                  closeMenuOnSelect={true}
                  options={this.getEmailTemplates(this.props.emailTemplates)}
                  className="hide-columns-container"
                  classNamePrefix="hide-columns"
                  placeholder="Select Email Template"
                  onChange={e => {
                    if (isBrowser) {
                      this.selectEmailTemplate(e);
                    }
                    if (isMobile || isTablet) {
                      this.selectEmailTemplateMobile(e);
                    }
                  }}
                  style={{ width: '300px' }}
                />
              </span>
            </span>
            <span className="line copyTags">
              <div className="copyItem">
                <div className="copySample">member('ID')</div>
                <CopyToClipboard
                  text={"member('ID')"}
                  onCopy={console.log("member('ID') copied to Clipboard")}
                >
                  <i className="fa fa-clipboard" aria-hidden="true"></i>
                </CopyToClipboard>
              </div>
              <div className="copyItem">
                <div className="copySample">member('First Name')</div>
                <CopyToClipboard
                  text={"member('First Name')"}
                  onCopy={console.log(
                    "member('First Name') copied to Clipboard",
                  )}
                >
                  <i className="fa fa-clipboard" aria-hidden="true"></i>
                </CopyToClipboard>
              </div>
              <div className="copyItem">
                <div className="copySample"> member('Last Name')</div>
                <CopyToClipboard
                  text={"member('Last Name')"}
                  onCopy={console.log(
                    "member('Last Name') copied to Clipboard",
                  )}
                >
                  <i className="fa fa-clipboard" aria-hidden="true"></i>
                </CopyToClipboard>
              </div>
              <div className="copyItem">
                <div className="copySample"> Email Footer (HTML only)</div>
                <CopyToClipboard
                  text={
                    this.props.snippets.find(function(el) {
                      if (el.name === 'Email Footer') return el;
                    }).value
                  }
                  onCopy={console.log(
                    'Email Footer copied to Clipboard, only paste into a HTML block',
                  )}
                >
                  <i className="fa fa-clipboard" aria-hidden="true"></i>
                </CopyToClipboard>
              </div>
            </span>
            <span
              className="line emailEditor"
              style={{ display: this.props.showEditor ? 'block' : 'none' }}
            >
              <BrowserView>
                <EmailEditor
                  ref={editor => (emailEditorRef = editor)}
                  onLoad={this.onLoadEmailTemplate}
                />
              </BrowserView>
              <MobileView>
                <TinyMCEComponent
                  value={this.state.text}
                  isActive={true}
                  editorStore={this.editorStore}
                  init={{
                    menubar: false,
                  }}
                />
              </MobileView>
              <TabletView>
                <TinyMCEComponent
                  value={this.state.text}
                  isActive={true}
                  editorStore={this.editorStore}
                  init={{
                    menubar: false,
                  }}
                />
              </TabletView>
            </span>
            <div
              id="previewDiv"
              ref="previewDiv"
              style={{
                display: this.props.showPreview ? 'block' : 'none',
                border: '1px solid #ccc',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: this.state.text }} />
            </div>
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
  emailTemplateCategories,
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
        emailTemplateCategories={emailTemplateCategories}
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

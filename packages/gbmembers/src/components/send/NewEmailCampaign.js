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
import { actions as attendanceActions } from '../../redux/modules/attendance';
import {
  removeExcludedMembers,
  matchesMemberFilter,
  removeExcludedLeads,
  matchesLeadFilter,
} from '../../utils/utils';
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
import { actions as appActions } from '../../redux/modules/memberApp';
import '../helpers/jquery.multiselect.js';

<script src="../helpers/jquery.multiselect.js" />;

const Datetime = require('react-datetime');

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  campaignItem: state.member.campaigns.newEmailCampaign,
  newCampaignLoading: state.member.campaigns.newEmailCampaignLoading,
  memberLists: state.member.app.memberLists,
  leadLists: state.member.app.leadLists,
  snippets: state.member.app.snippets,
  allMembers: state.member.members.allMembers,
  allLeads: state.member.leads.allLeads,
  space: state.member.app.space,
  leadItem: state.member.leads.currentLead,
  memberItem: state.member.members.currentMember,
  emailTemplateCategories: state.member.datastore.emailTemplateCategories,
  emailTemplates: state.member.datastore.emailTemplates,
  emailTemplatesLoading: state.member.datastore.emailTemplatesLoading,
  classAttendances: state.member.attendance.classAttendances,
});
const mapDispatchToProps = {
  createCampaign: actions.createEmailCampaign,
  fetchNewCampaign: actions.fetchNewEmailCampaign,
  updateCampaign: actions.updateEmailCampaign,
  fetchLead: leadsActions.fetchCurrentLead,
  fetchMember: membersActions.fetchCurrentMember,
  fetchEmailTemplates: dataStoreActions.fetchEmailTemplates,
  fetchEmailCampaign: campaignActions.fetchEmailCampaign,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  fetchClassAttendances: attendanceActions.fetchClassAttendances,
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
    this.handleLeadRecipientChange = this.handleLeadRecipientChange.bind(this);
    this.preview = this.preview.bind(this);
    this.back = this.back.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.createCampaign = this.createCampaign.bind(this);
    this.getSelectOptions = this.getSelectOptions.bind(this);
    this.validScheduledDate = this.validScheduledDate.bind(this);
    var enablePreview = false;

    if (
      this.props.submissionId != null &&
      this.props.submissionType === 'member'
    ) {
      this.currentMember = this.props.allMembers.find(
        member => member['id'] === this.props.submissionId,
      );
    }

    if (
      this.props.submissionType === 'class' ||
      this.props.submissionId != null
    ) {
      enablePreview = true;
    }
    this.state = {
      schoolEmail: this.props.space.attributes['School Email'][0],
      aliasEmail: undefined,
      aliasEmailOptions: this.getEmailAlias(
        this.props.space.attributes['School Email Alias'],
      ),
      text: '',
      subject: '',
      options: this.getSelectOptions(
        this.props.memberLists,
        this.props.allMembers,
      ),
      selectedOption: [],
      leadOptions: this.getSelectLeadOptions(
        this.props.leadLists,
        this.props.allLeads,
      ),
      selectedLeadOption: [],
      isMenuOpen: false,
      selectMember: false,
      enablePreview: enablePreview,
      selectedSpecificMembers: [],
    };
    editorThis = this;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      nextProps.allMembers !== undefined &&
      nextProps.allMembers.length !== this.props.allMembers.length
    ) {
      this.setState({
        options: this.getSelectOptions(
          nextProps.memberLists,
          nextProps.allMembers,
        ),
      });
    }
    if (
      nextProps.allLeads !== undefined &&
      nextProps.allLeads.length !== this.props.allLeads.length
    ) {
      this.setState({
        leadOptions: this.getSelectLeadOptions(
          nextProps.leadLists,
          nextProps.allLeads,
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

  UNSAFE_componentWillMount() {
    if (isMobile) {
      this.editorStore = createEditorStore();
    }
  }

  componentDidUpdate() {
    $(this.refs.specificMembersDiv)
      .find('select')
      .multiselect({
        texts: { placeholder: 'Select Members' },
        search: true,
      });
  }

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
      template.values['Subject'] !== '' &&
      template.values['Subject'] !== undefined &&
      template.values['Subject'] !== null
    ) {
      editorThis.setState({ subject: template.values['Subject'] });
    }
    if (
      template.values['Email JSON'] !== '' &&
      template.values['Email JSON'] !== undefined &&
      template.values['Email JSON'] !== null
    ) {
      emailEditorRef.editor.loadDesign(
        JSON.parse(template.values['Email JSON']),
      );
      emailEditorRef.editor.exportHtml(function(data) {
        var html = data.html; // design html

        // Save the json, or html here
        editorThis.setState({ text: html });
      });
    } else if (template.values['Email Content'] !== '') {
      var templateStr = BLANK_TEMPLATE.replace(
        '##CONTENT##',
        editorThis.escapeJSON(template.values['Email Content']),
      );
      emailEditorRef.editor.loadDesign(JSON.parse(templateStr));
      emailEditorRef.editor.exportHtml(function(data) {
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
    if (
      template.values['Subject'] !== '' &&
      template.values['Subject'] !== undefined &&
      template.values['Subject'] !== null
    ) {
      editorThis.setState({ subject: template.values['Subject'] });
    }
    if (template.values['Email Content'] !== '') {
      var templateStr = BLANK_TEMPLATE.replace(
        '##CONTENT##',
        editorThis.escapeJSON(template.values['Email Content']),
      );
      // Save the json, or html here
      editorThis.setState({ text: template.values['Email Content'] });
    }
  }
  getEmailAlias(fromAlias) {
    let options = [];
    options.push({ value: '', label: '' });
    if (fromAlias !== undefined)
      fromAlias.forEach(item => options.push({ value: item, label: item }));
    return options;
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
    let frozenMembers = [];

    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        activeMembers.push(member['id']);
      } else if (member.values['Status'] === 'Inactive') {
        inactiveMembers.push(member['id']);
      } else if (member.values['Status'] === 'Frozen') {
        frozenMembers.push(member['id']);
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

    if (frozenMembers.length > 0) {
      options.push({
        value: '__frozen_members__',
        label: 'Frozen Members',
        members: frozenMembers,
      });
    }

    memberLists.forEach(list => {
      options.push({
        value: list.name,
        label: list.name,
        members: removeExcludedMembers(
          matchesMemberFilter(allMembers, list.filters),
          list.excluded !== undefined ? list.excluded : [],
        ).map(member => member['id']),
      });
    });

    return options;
  }
  getSelectLeadOptions(leadLists, allLeads) {
    //If submissionId is present then submissionId is the recipient.
    //So no need to populate or display recipient list dropdown.
    if (this.props.submissionId || leadLists === undefined) {
      return [];
    }
    let options = [];

    leadLists.forEach(list => {
      options.push({
        value: list.name,
        label: list.name,
        leads: removeExcludedLeads(
          matchesLeadFilter(allLeads, list.filters),
          list.excluded !== undefined ? list.excluded : [],
        ).map(lead => lead['id']),
      });
    });

    return options;
  }

  handleRecipientChange = selectedOption => {
    var enablePreview = false;
    if (selectedOption.length > 0) enablePreview = true;
    this.setState({
      selectedOption,
      enablePreview,
    });
  };
  handleLeadRecipientChange = selectedLeadOption => {
    var enablePreview = false;
    if (selectedLeadOption.length > 0) enablePreview = true;
    this.setState({
      selectedLeadOption,
      enablePreview,
    });
  };

  createCampaign() {
    if (
      !this.props.submissionId &&
      this.state.selectedOption.length <= 0 &&
      this.state.selectedLeadOption.length <= 0 &&
      this.state.selectedSpecificMembers.length <= 0
    ) {
      console.log('Recipients, subject and body is required');
      return;
    }

    if (this.state.text.length <= 0 || this.state.subject.length <= 0) {
      console.log('Recipients, subject and body is required');
      return;
    }

    $('#saveButton').prop('disabled', true);
    let recipientIds = [];
    if (this.props.submissionId && this.props.submissionType !== 'class') {
      recipientIds = [this.props.submissionId];
    } else if (this.props.submissionType === 'class') {
      this.props.classAttendances
        .filter(checkin => {
          return (
            checkin.values['Class Time'] === this.props.submissionId &&
            (checkin.values['Title'] === undefined ||
              checkin.values['Title'] === this.props.campaignId) &&
            checkin.values['Class'] === this.props.replyType
          );
        })
        .map((checkin, index) => {
          recipientIds.push(checkin.memberItem.id);
        });
    } else if (this.state.selectedSpecificMembers.length > 0) {
      recipientIds = this.state.selectedSpecificMembers;
    } else {
      this.state.selectedOption.forEach(option => {
        recipientIds.push(...option.members);
      });
      this.state.selectedLeadOption.forEach(option => {
        recipientIds.push(...option.leads);
      });
    }
    let uniqueRecipientIds = recipientIds.filter(
      (x, i, a) => a.indexOf(x) === i,
    );
    // Extract Embedded images from the Body
    let embeddedImages = [];
    let body = '';
    if (this.state.text.indexOf('<a href="') !== -1) {
      let idx = 0;
      let endIdx = 0;
      var contentHTML = this.state.text;

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
    if (this.props.submissionId && this.props.submissionType !== 'class') {
      body +=
        "<div id='__gbmembers-" +
        this.props.submissionType +
        '-' +
        this.props.submissionId +
        "' />";
    }

    this.props.saveCampaign(
      this.state.schoolEmail,
      this.state.aliasEmail,
      this.state.subject,
      uniqueRecipientIds,
      body,
      embeddedImages,
      this.props.space,
      this.state.scheduleEmail,
      this.state.scheduleDate,
    );
  }

  preview() {
    if (isMobile) {
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
    }
    if (this.state.text.indexOf('data:image') !== -1) {
      this.props.setShowImageIssue(true);
    } else {
      this.props.setShowEditor(false);
      this.props.setShowPreview(true);
      this.props.setShowAttachmentError(false);
      this.props.setShowImageIssue(false);
    }
    this.setState({
      scheduleEmail: false,
    });
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
      if (emailEditorRef !== undefined && emailEditorRef !== null) {
        emailEditorRef.editor.addEventListener('design:loaded', () => {
          if (editorThis.state.text === '') {
            emailEditorRef.editor.setBodyValues({
              backgroundColor: '#FFFFFF',
            });
          }
        });
        emailEditorRef.editor.addEventListener('design:updated', function(
          updates,
        ) {
          // Design is updated by the user
          emailEditorRef.editor.exportHtml(function(data) {
            var json = data.design; // design json
            var html = data.html; // design html

            // Save the json, or html here
            editorThis.setState({ text: html });
          });
        });
      } else {
        onLoadEmailTemplate();
      }
    }, 1000);
  }
  handleTinyEditorChange = (content, editor) => {
    console.log('Content was updated:', content);
  };

  validScheduledDate(current) {
    if (current.isBefore(moment())) return false;
    return true;
  }

  render() {
    return (
      <div className="new_campaign" style={{ marginTop: '2%' }}>
        <div className="row">
          {this.state.aliasEmailOptions.length !== 0 && (
            <div className="col-md-4">
              <Select
                options={this.state.aliasEmailOptions}
                placeholder="Select Alias"
                closeMenuOnSelect={true}
                hideSelectedOptions={false}
                controlShouldRenderValue={true}
                isMulti={false}
                onChange={e => {
                  this.setState({
                    aliasEmail: e.value === '' ? undefined : e.value,
                  });
                }}
              />
            </div>
          )}
        </div>
        <div
          className="row"
          style={{
            paddingBottom: '2%',
            backgroundColor: '#f7f7f7',
            paddingTop: '2%',
          }}
        >
          <div className="col-md-4" style={{ textAlign: 'right' }}>
            You are currently sending this email to{' '}
            {this.props.submissionType === 'member' ||
            this.props.submissionType === 'class'
              ? 'Members'
              : 'Leads'}
          </div>
          <div className="col-md-4">
            {this.props.submissionId &&
            this.props.submissionType !== 'class' ? (
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
            ) : this.state.selectMember ? (
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">
                      Specific Members
                    </legend>
                    <div
                      className="form-group form-inline"
                      ref="specificMembersDiv"
                    >
                      <label htmlFor="specificMembers">
                        Specific Members(Except Inactive)&nbsp;
                      </label>
                      <select
                        className="form-control"
                        multiple
                        id="specificMembers"
                        ref={input => (this.input = input)}
                        style={{ height: 'auto' }}
                      >
                        {this.props.allMembers
                          .filter(
                            member => member.values['Status'] !== 'Inactive',
                          )
                          .sort((a, b) => {
                            if (
                              a.values['Last Name'] + a.values['First Name'] <
                              b.values['Last Name'] + b.values['First Name']
                            ) {
                              return -1;
                            } else if (
                              a.values['Last Name'] + a.values['First Name'] >
                              b.values['Last Name'] + b.values['First Name']
                            ) {
                              return 1;
                            }
                            return 0;
                          })
                          .map(member => (
                            <option key={member.id} value={member.id}>
                              {member.values['Last Name'] +
                                ' ' +
                                member.values['First Name']}
                            </option>
                          ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                  </fieldset>
                </div>
              </div>
            ) : this.props.submissionType === 'member' ? (
              <Select
                value={this.state.selectedOption}
                onChange={this.handleRecipientChange}
                options={this.state.options}
                placeholder="Select Member List"
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                controlShouldRenderValue={true}
                isMulti={true}
              />
            ) : this.props.submissionType === 'lead' ? (
              <Select
                value={this.state.selectedLeadOption}
                onChange={this.handleLeadRecipientChange}
                options={this.state.leadOptions}
                placeholder="Select Lead List"
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                controlShouldRenderValue={true}
                isMulti={true}
              />
            ) : (
              <div className="classInfo">
                that attended class <b>{this.props.replyType}</b> at{' '}
                <b>
                  {moment(this.props.submissionId, 'hh:mm').format('h:mm A')}
                </b>
              </div>
            )}
          </div>
          {this.props.submissionId === undefined &&
            this.props.submissionType === 'member' && (
              <div className="col-md-4">
                <button
                  type="button"
                  id="selectMembers"
                  className="btn btn-primary"
                  onClick={e => {
                    if (this.state.selectMember) {
                      this.setState({
                        enablePreview: false,
                      });
                    }
                    this.setState({
                      selectMember: this.state.selectMember ? false : true,
                      selectedSpecificMembers: [],
                    });

                    setTimeout(function() {
                      $('#specificMembers').change(function() {
                        console.log($(this).val());
                        editorThis.setState({
                          selectedSpecificMembers: $(this).val(),
                          enablePreview: $(this).val().length > 0,
                        });
                      });
                    }, 500);
                  }}
                >
                  {!this.state.selectMember ? 'Select Members' : 'Cancel'}
                </button>
              </div>
            )}
          <div className="col-md-3">&nbsp;</div>
        </div>
        {this.props.submissionType === 'class' && (
          <div className="row classEmails">
            {this.props.classAttendances
              .filter(checkin => {
                return (
                  checkin.values['Class Time'] === this.props.submissionId &&
                  (checkin.values['Title'] === undefined ||
                    checkin.values['Title'] === this.props.campaignId) &&
                  checkin.values['Class'] === this.props.replyType
                );
              })
              .map((checkin, index) => (
                <span key={index} className="memberEmail" id={checkin.id}>
                  {checkin.memberItem.values['Email']}
                </span>
              ))}
          </div>
        )}
        <div className="row">
          <div className="col-md-10 details">
            <span className="line options">
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
                    if (isMobile) {
                      this.selectEmailTemplateMobile(e);
                    }
                  }}
                  style={{ width: '300px' }}
                />
              </span>
              <span className="attachmentForm">
                <AttachmentForm campaignItem={this.props.campaignItem} />
              </span>
            </span>
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
              <div className="copyItem">
                <div className="copySample"> Opt-Out (HTML only)</div>
                <CopyToClipboard
                  text={
                    "<a href=\"${kappAttributes('Kinetic Email Server URL')}/opt-out?space=${spaceSlug}&id=member('ID')\">Opt-Out</a>"
                  }
                  onCopy={console.log("member('ID') copied to Clipboard")}
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
                <EmailEditor
                  ref={editor => (emailEditorRef = editor)}
                  onLoad={this.onLoadEmailTemplate}
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
                disabled={!this.state.enablePreview}
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
            {this.props.showImageIssue && (
              <span className="imageWarning">
                Something is wrong, you have added an Image(s) that has embedded
                content. Please remove and add the Image(s) again and ensure it
                is uploaded first.
              </span>
            )}
            {this.props.showPreview && (
              <span className="preview">
                <span className="buttons">
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
                <div className="checkinFilter">
                  <label htmlFor="schedule">Schedule</label>
                  <div className="checkboxFilter">
                    <input
                      id="schedule"
                      type="checkbox"
                      value="1"
                      onChange={e => {
                        this.setState({
                          scheduleEmail: !this.state.scheduleEmail,
                        });
                      }}
                    />
                    <label htmlFor="schedule"></label>
                  </div>
                </div>
                {this.state.scheduleEmail && (
                  <Datetime
                    className="float-right"
                    isValidDate={this.validScheduledDate}
                    onChange={date => {
                      this.setState({
                        scheduleDate: date,
                      });
                      console.log(date);
                    }}
                    defaultValue={moment()}
                  />
                )}
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
  leadLists,
  snippets,
  isDirty,
  setIsDirty,
  showEditor,
  setShowEditor,
  showAttachmentError,
  setShowAttachmentError,
  showImageIssue,
  setShowImageIssue,
  showPreview,
  setShowPreview,
  updateCampaign,
  allMembers,
  allLeads,
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
  classAttendances,
}) =>
  newCampaignLoading ? (
    <div />
  ) : (
    <div className="container-fluid">
      <NewEmailCampaign
        campaignItem={campaignItem}
        saveCampaign={saveCampaign}
        memberLists={memberLists}
        leadLists={leadLists}
        snippets={snippets}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        showEditor={showEditor}
        showAttachmentError={showAttachmentError}
        setShowAttachmentError={setShowAttachmentError}
        showImageIssue={showImageIssue}
        setShowImageIssue={setShowImageIssue}
        setShowEditor={setShowEditor}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        updateCampaign={updateCampaign}
        allMembers={allMembers}
        allLeads={allLeads}
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
        classAttendances={classAttendances}
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
  withState('showImageIssue', 'setShowImageIssue', false),
  withState('showPreview', 'setShowPreview', false),
  withHandlers({
    saveCampaign: ({ campaignItem, createCampaign }) => (
      schoolEmail,
      aliasEmail,
      subject,
      recipients,
      body,
      embeddedImages,
      space,
      scheduleEmail,
      scheduleDate,
    ) => {
      campaignItem.values['From'] =
        aliasEmail === undefined ? schoolEmail : aliasEmail;
      campaignItem.values['Recipients'] = recipients;
      campaignItem.values['Subject'] = subject;
      campaignItem.values['Body'] = body;
      campaignItem.values['Emailed Count'] = '0';
      campaignItem.values['Embedded Images'] = embeddedImages;

      if (scheduleEmail) {
        campaignItem.values['Scheduled Time'] = scheduleDate.format(
          'YYYY-MM-DDTHH:mm:ssZ',
        );
      }
      campaignItem.values['Sent Date'] = moment().format(
        'YYYY-MM-DDTHH:mm:ssZ',
      );

      createCampaign({ campaignItem, history: campaignItem.history });
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchNewCampaign({
        myThis: this,
        history: this.props.history,
        fetchEmailCampaigns: null,
      });
      if (
        this.props.submissionType &&
        this.props.submissionType === 'lead' &&
        this.props.submissionId !== undefined
      ) {
        this.props.fetchLead({
          id: this.props.submissionId,
        });
      }
      if (
        this.props.submissionType &&
        this.props.submissionType === 'member' &&
        this.props.submissionId !== undefined
      ) {
        this.props.fetchMember({
          id: this.props.submissionId,
        });
      }
      this.props.fetchEmailTemplates();
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchNewCampaign({
          myThis: this,
          history: this.props.history,
          fetchEmailCampaigns: null,
        });
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(NewEmailCampaignView);

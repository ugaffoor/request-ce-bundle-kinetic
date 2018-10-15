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
import { KappNavLink as NavLink } from 'common';
import $ from 'jquery';
import NumberFormat from 'react-number-format';
import 'react-datetime/css/react-datetime.css';
import ReactTable from 'react-table';
import ReactQuill from 'react-quill';
import moment from 'moment';
import { email_sent_date_format } from '../leads/LeadsUtils';
import { Quill } from 'react-quill';
import axios, { post } from 'axios';
import { AttachmentForm } from './AttachmentForm';
import '../../styles/quill.snow.scss.css';
import Select, { components } from 'react-select';
import { actions as leadsActions } from '../../redux/modules/leads';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  campaignItem: state.member.campaigns.newCampaign,
  newCampaignLoading: state.member.campaigns.newCampaignLoading,
  memberLists: state.member.app.memberLists,
  snippets: state.member.app.snippets,
  allMembers: state.member.members.allMembers,
  space: state.member.app.space,
  leadItem: state.member.leads.currentLead,
});
const mapDispatchToProps = {
  createCampaign: actions.createCampaign,
  fetchNewCampaign: actions.fetchNewCampaign,
  updateCampaign: actions.updateCampaign,
  fetchLead: leadsActions.fetchCurrentLead,
};

const util = require('util');

const MultiValueContainer = props => {
  let members = 0;
  props.selectProps.value.forEach(option => {
    members += option.members ? option.members.length : 0;
  });
  return <span>{members} Members</span>;
};

var Link = Quill.import('formats/link');
var builtInFunc = Link.sanitize;
Link.sanitize = function modifyLinkInput(linkValueInput) {
  var val = btoa(linkValueInput);
  return builtInFunc.call(
    this,
    'http://18.222.185.221/billingservice/goToUrl/__campaign_id__/__member_id__/' +
      val,
  ); // retain the built-in logic
};

export class NewManualCampaign extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleRecipientChange = this.handleRecipientChange.bind(this);

    this.preview = this.preview.bind(this);
    this.back = this.back.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.createCampaign = this.createCampaign.bind(this);
    this.getSelectOptions = this.getSelectOptions.bind(this);

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

          [{ header: 1 }, { header: 2 }], // custom button values
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
          [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
          [{ direction: 'rtl' }], // text direction

          [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
          [{ header: [1, 2, 3, 4, 5, 6, false] }],

          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          [{ font: [] }],
          [{ align: [] }],
          ['link'],
          //['image'],
          ['clean'],
          ['firstname'],
          ['lastname'],
          ['emailfooter'],
        ],
        handlers: {
          firstname: this.insertFirstName,
          lastname: this.insertLastName,
          emailfooter: this.insertEmailFooter.bind(this),
        },
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
  ];
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
    this.reactQuillRef.editor.pasteHTML(
      cursorPosition,
      this.props.snippets.find(function(el) {
        if (el.name === 'Email Footer') return el;
      }).value,
    );
    this.reactQuillRef.editor.setSelection(cursorPosition + 1);
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

    memberLists.forEach(list => {
      options.push({
        value: list.name,
        label: list.name,
        members: list.members,
      });
    });

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
    this.props.saveCampaign(
      this.state.subject,
      recipientIds,
      body,
      embeddedImages,
      this.props.space,
    );
  }

  preview() {
    this.props.setShowEditor(false);
    this.props.setShowPreview(true);
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
                    ? this.props.allMembers && this.props.allMembers.length > 0
                      ? this.props.allMembers.find(
                          member => member['id'] === this.props.submissionId,
                        ).values['Email']
                      : ''
                    : this.props.leadItem && this.props.leadItem.values
                      ? this.props.leadItem.values['Email']
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
                components={{ MultiValueContainer }}
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
                  defaultValue={this.state.subject}
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
              />
            )}
            {this.props.showPreview && (
              <div
                id="previewDiv"
                ref="previewDiv"
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

export const NewManualCampaignView = ({
  campaignItem,
  newCampaignLoading,
  saveCampaign,
  memberLists,
  snippets,
  isDirty,
  setIsDirty,
  showEditor,
  setShowEditor,
  showPreview,
  setShowPreview,
  updateCampaign,
  allMembers,
  submissionId,
  submissionType,
  leadItem,
  space,
}) =>
  newCampaignLoading ? (
    <div />
  ) : (
    <div className="container-fluid">
      <NewManualCampaign
        campaignItem={campaignItem}
        saveCampaign={saveCampaign}
        memberLists={memberLists}
        snippets={snippets}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        showEditor={showEditor}
        setShowEditor={setShowEditor}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        updateCampaign={updateCampaign}
        allMembers={allMembers}
        submissionId={submissionId}
        submissionType={submissionType}
        leadItem={leadItem}
        space={space}
      />
    </div>
  );

export const ManualCampaignContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ match }) => {
    return {
      submissionId: match.params.submissionId,
      submissionType: match.params.submissionType,
    };
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('showEditor', 'setShowEditor', true),
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
        fetchCampaigns: null,
      });
      if (this.props.submissionType && this.props.submissionType === 'lead') {
        this.props.fetchLead({
          id: this.props.submissionId,
        });
      }
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchNewCampaign({
          myThis: this,
          history: this.props.history,
          fetchCampaigns: null,
        });
      }
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(NewManualCampaignView);

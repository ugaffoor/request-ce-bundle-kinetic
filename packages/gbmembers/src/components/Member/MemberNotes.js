import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/members';
import { KappNavLink as NavLink } from 'common';
import $ from 'jquery';
import { contact_date_format } from '../leads/LeadsUtils';
import moment from 'moment';
import { getJson } from './MemberUtils';
import ReactTable from 'react-table';
import 'react-datetime/css/react-datetime.css';
import phone from '../../images/phone.png';
import { StatusMessagesContainer } from '../StatusMessages';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  currentMemberLoading: state.member.members.currentMemberLoading,
});
const mapDispatchToProps = {
  updateMember: actions.updateMember,
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchMembers: actions.fetchMembers,
};

const Datetime = require('react-datetime');
function getLatestHistory(history) {
  //console.log("# history = " + util.inspect(history));
  let sortedHistory = getJson(history)
    .slice()
    .sort(function(a, b) {
      if (
        moment(a['contactDate'], contact_date_format).isBefore(
          moment(b['contactDate'], contact_date_format),
        )
      )
        return 1;
      if (
        moment(a['contactDate'], contact_date_format).isAfter(
          moment(b['contactDate'], contact_date_format),
        )
      )
        return -1;
      return 0;
    });

  return sortedHistory[0];
}

export class MemberNotesHome extends Component {
  constructor(props) {
    super(props);
    this.saveMember = this.props.saveMember;
    let note = '';
    let contactDate = moment().format(contact_date_format);
    let latestHistory = getLatestHistory(
      this.props.memberItem.values['Notes History'],
    );
    this.handleDateChange = this.handleDateChange.bind(this);

    let data = this.getData(this.props.memberItem);
    let columns = this.getColumns();
    this.state = {
      note,
      contactDate,
      latestHistory,
      data,
      columns,
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      latestHistory: getLatestHistory(
        nextProps.memberItem.values['Notes History'],
      ),
      data: this.getData(nextProps.memberItem),
      columns: this.getColumns(),
    });
  }

  handleChange(key, event) {
    if (key === 'note') {
      this.setState({
        note: event.target.value,
      });
    }
  }

  handleDateChange(date) {
    this.setState({
      contactDate: moment(date).format(contact_date_format),
    });
  }

  saveNote() {
    if (!this.state.note || !this.state.contactDate) {
      return;
    }
    let newHistory = {
      note: this.state.note,
      contactDate: this.state.contactDate,
    };
    this.saveMember(newHistory);
  }

  getColumns() {
    const columns = [];
    columns.push({
      accessor: 'note',
      className: 'notes',
      Cell: row => this.formatNoteCell(row),
    });
    columns.push({
      accessor: 'contactDate',
      width: 150,
      Cell: row =>
        moment(row.original.contactDate, contact_date_format).format(
          'Do MMMM YYYY',
        ),
    });

    return columns;
  }

  getData(memberItem) {
    let histories = getJson(memberItem.values['Notes History']).map(history => {
      return {
        ...history,
      };
    });

    return histories.sort(function(history1, history2) {
      if (
        moment(history1.contactDate, contact_date_format).isAfter(
          moment(history2.contactDate, contact_date_format),
        )
      ) {
        return -1;
      }
      if (
        moment(history1.contactDate, contact_date_format).isBefore(
          moment(history2.contactDate, contact_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }

  formatNoteCell(row) {
    if (!row.original.note) {
      return '';
    }
    return row.original.note;
  }

  render() {
    return (
      <div className="container-fluid" id="noteDetailDiv">
        <StatusMessagesContainer />
        <div className="card">
          <div className="card-header card-subtitle mb-2 text-muted">
            {this.state.latestHistory ? this.state.latestHistory.note : ''}
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            <div className="row">
              <div className="col-md-6 text-center">
                <span className="float-md-left">
                  <div
                    style={{
                      fontFamily: 'Arial-BoldMT, "Arial Bold", Arial',
                      fontWeight: '700',
                      fontStyle: 'normal',
                      fontSize: '24px',
                      color: '#333333',
                    }}
                  >
                    {this.props.memberItem.values['First Name']}
                    &nbsp;
                    {this.props.memberItem.values['Last Name']}
                  </div>
                  <div>
                    <img
                      alt="Phone Number"
                      src={phone}
                      style={{ border: 'none', marginRight: '5px' }}
                    />
                    {this.props.memberItem.values['Phone Number']}
                  </div>
                </span>
              </div>
              <div className="col-md-6 text-center">
                <span className="float-md-right">
                  <NavLink
                    to={`/MemberFollowUp/${this.props.memberItem['id']}`}
                    className="btn btn-primary followup_button followup_image"
                    style={{
                      backgroundColor: '#991B1E',
                      height: '45px',
                      width: '100px',
                      textAlign: 'center',
                    }}
                    title="Set Followup date"
                  >
                    Follow Up
                    <br />
                    {this.props.memberItem.values['Reminder Date']
                      ? moment(
                          this.props.memberItem.values['Reminder Date'],
                          'YYYY-MM-DD',
                        ).format('DD MMM YYYY')
                      : ''}
                  </NavLink>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div id="notesDiv" className="card">
          <div className="card-header">
            <ul
              className="nav nav-tabs card-header-tabs contact-methods"
              role="tablist"
            >
              <li className="nav-item">Member Notes</li>
              <li className="nav-item">
                <Datetime
                  onChange={this.handleDateChange}
                  defaultValue={moment()}
                />
              </li>
            </ul>
          </div>
          <div className="card-body">
            <div className="tab-content">
              <div
                className="tab-pane fade show active"
                id="method"
                role="tabpanel"
                aria-labelledby="contact_method"
              >
                <div className="row">
                  <div className="col-sm-11">
                    <textarea
                      id="notes"
                      rows="5"
                      style={{
                        width: '100%',
                        display: 'block',
                        borderTop: '0',
                      }}
                      value={this.state.note}
                      onChange={e => this.handleChange('note', e)}
                      placeholder="Start Typing..."
                    />
                  </div>
                  <div className="col-sm-1">
                    <button
                      type="button"
                      id="saveNote"
                      className="btn btn-primary btn-block"
                      onClick={e => this.saveNote()}
                    >
                      Save Notes and Complete Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12 text-center" id="notesDiv">
            <ReactTable
              data={this.state.data}
              columns={this.state.columns}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px', textAlign: 'left' }}>
                    {row.original.note}
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export const MemberNotesView = ({
  memberItem,
  saveMember,
  currentMemberLoading,
}) =>
  currentMemberLoading ? (
    <div />
  ) : (
    <MemberNotesHome memberItem={memberItem} saveMember={saveMember} />
  );

export const MemberNotesContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(() => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({
    saveMember: ({
      memberItem,
      updateMember,
      fetchCurrentMember,
      fetchMembers,
    }) => newHistory => {
      let notesHistory = memberItem.values['Notes History'];
      if (notesHistory) {
        notesHistory = JSON.parse(notesHistory);
      } else {
        notesHistory = [];
      }
      notesHistory.push(newHistory);
      memberItem.values['Notes History'] = notesHistory;
      // Clear Reminder Date
      memberItem.values['Reminder Date'] = '';
      updateMember({
        id: memberItem['id'],
        memberItem: memberItem,
        fetchMember: fetchCurrentMember,
        fetchMembers: fetchMembers,
        myThis: this,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchCurrentMember({
        id: this.props.match.params['id'],
        myThis: this,
        history: this.props.history,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchCurrentMember({
          id: this.props.match.params['id'],
          myThis: this,
          history: this.props.history,
        });
      }
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(MemberNotesView);

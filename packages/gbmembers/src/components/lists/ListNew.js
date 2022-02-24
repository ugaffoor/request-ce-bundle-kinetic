import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/scss/bootstrap.scss';
import ReactTable from 'react-table';
import { actions as appActions } from '../../redux/modules/memberApp';
import uuid from 'uuid';
import { StatusMessagesContainer } from '../StatusMessages';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import '../helpers/jquery.multiselect.js';
import { KappNavLink as NavLink } from 'common';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

<script src="../helpers/jquery.multiselect.js" />;

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  membershipTypes: state.member.app.membershipTypes,
  memberLists: state.member.app.memberLists,
  belts: state.member.app.belts,
  memberStatusValues: state.member.app.memberStatusValues,
  profile: state.member.app.profile,
  space: state.member.app.space,
});

const mapDispatchToProps = {
  fetchMembers: actions.fetchMembers,
  addMembersList: appActions.addMembersList,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
var compThis = undefined;

export const ListNewView = ({
  allMembers,
  programs,
  additionalPrograms,
  membershipTypes,
  belts,
  memberLists,
  addNewList,
  memberStatusValues,
  profile,
  space,
}) => (
  <div>
    <StatusMessagesContainer />
    <ListNewHome
      allMembers={allMembers}
      programs={programs}
      additionalPrograms={additionalPrograms}
      membershipTypes={membershipTypes}
      belts={belts}
      memberLists={memberLists}
      addNewList={addNewList}
      memberStatusValues={memberStatusValues}
      profile={profile}
      space={space}
    />
  </div>
);

export const ListNewContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(() => {
    return {};
  }),
  withHandlers({
    addNewList: ({ addMembersList, history }) => newList => {
      addMembersList({
        newList,
        history: history,
      });
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
    },
    UNSAFE_componentWillReceiveProps(nextProps) {},
    componentWillUnmount() {},
  }),
)(ListNewView);

export class ListNewHome extends Component {
  constructor(props) {
    super(props);
    compThis = this;

    this._columns = this.getColumns();
    this.getExcluded = this.getExcluded.bind(this);
    this.state = {
      data: [],
      joiningDateStart: undefined,
      joiningDateEnd: undefined,
      excluded: [],
    };
  }
  getExcluded() {
    return this.state.excluded;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}

  componentDidMount() {
    this.refs.statusDiv &&
      $(this.refs.statusDiv)
        .find('select')
        .multiselect({
          texts: { placeholder: 'Select Status' },
        });

    this.refs.programsDiv &&
      $(this.refs.programsDiv)
        .find('select')
        .multiselect({
          texts: { placeholder: 'Select Program' },
        });

    this.refs.beltsDiv &&
      $(this.refs.beltsDiv)
        .find('select')
        .multiselect({
          texts: { placeholder: 'Select Belt' },
        });
    this.refs.additionalProgram1Div &&
      $(this.refs.additionalProgram1Div)
        .find('select')
        .multiselect({
          texts: { placeholder: 'Select Additional Program 1' },
        });
    this.refs.additionalProgram2Div &&
      $(this.refs.additionalProgram2Div)
        .find('select')
        .multiselect({
          texts: { placeholder: 'Select Additional Program 2' },
        });
  }

  createList() {
    if (
      !$('#listName').val() ||
      !this.state.data ||
      this.state.data.length <= 0
    ) {
      return;
    }

    let newList = {
      id: uuid(),
      name: $('#listName').val(),
      filters: this.state.filters,
      excluded: this.state.excluded,
    };
    this.props.addNewList(newList);
  }

  getColumns = () => {
    return [
      {
        id: 'selection',
        Header: 'Exclude',
        Cell: props => {
          return (
            <div>
              <input
                type="checkbox"
                checked={
                  this.getExcluded() !== undefined
                    ? this.getExcluded().find(id => id === props.original._id)
                    : false
                }
                onChange={e => {}}
                onClick={e => {
                  console.log(props.original._id);
                  var excludes =
                    this.state.excluded !== undefined
                      ? this.state.excluded
                      : [];
                  if (e.currentTarget.checked) {
                    excludes.push(props.original._id);
                  } else {
                    var idx = excludes.findIndex(
                      id => id === props.original._id,
                    );
                    excludes.splice(idx, 1);
                  }
                  this.setState({
                    excluded: excludes,
                  });
                }}
              />
            </div>
          );
        },
      },
      {
        accessor: 'Member ID',
        Header: 'Member',
        Cell: props => {
          return (
            <NavLink to={`/Member/${props.original._id}`} className="">
              {props.original['First Name']} {props.original['Last Name']}
            </NavLink>
          );
        },
      },
      { accessor: 'Gender', Header: 'Gender' },
      { accessor: 'Member Type', Header: 'Member Type' },
      { accessor: 'Ranking Program', Header: 'Program' },
      { accessor: 'Ranking Belt', Header: 'Belt' },
      { accessor: 'Additional Program 1', Header: 'Additional Program 1' },
      { accessor: 'Additional Program 2', Header: 'Additional Program 2' },
    ];
  };

  getData(members) {
    if (!members) {
      return [];
    }

    let data = [];
    members.forEach(member => {
      data.push({
        _id: member['id'],
        ...member.values,
      });
    });

    return data;
  }

  applyFilters() {
    let filters = [];
    let startDate = null,
      endDate = null;

    if (
      this.state.joiningDateStart !== undefined &&
      this.state.joiningDateEnd !== undefined
    ) {
      filters.push({
        joiningDateFilter: {
          startDate: this.state.joiningDateStart,
          endDate: this.state.joiningDateEnd,
        },
      });
      startDate = moment(this.state.joiningDateStart, 'YYYY-MM-DD');
      endDate = moment(this.state.joiningDateEnd, 'YYYY-MM-DD');
    }

    if ($('#status').val() && $('#status').val().length > 0) {
      filters.push({ statusFilter: { status: $('#status').val() } });
    }

    if ($('#fromAge').val() || $('#toAge').val()) {
      filters.push({
        ageFilter: { fromAge: $('#fromAge').val(), toAge: $('#toAge').val() },
      });
    }

    if ($('input[name=gender]:checked').val()) {
      filters.push({
        genderFilter: { gender: $('input[name=gender]:checked').val() },
      });
    }

    if ($('#program').val() && $('#program').val().length > 0) {
      filters.push({ programFilter: { programs: $('#program').val() } });
    }

    if ($('#belt').val() && $('#belt').val().length > 0) {
      filters.push({ beltFilter: { belts: $('#belt').val() } });
    }

    if (
      $('#additionalProgram1').val() &&
      $('#additionalProgram1').val().length > 0
    ) {
      filters.push({
        additionalProgram1Filter: { programs: $('#additionalProgram1').val() },
      });
    }

    if (
      $('#additionalProgram2').val() &&
      $('#additionalProgram2').val().length > 0
    ) {
      filters.push({
        additionalProgram2Filter: { programs: $('#additionalProgram2').val() },
      });
    }

    if ($('#memberType').val()) {
      filters.push({
        memberTypeFilter: { memberType: $('#memberType').val() },
      });
    }

    if ($('input[name=billingMember]:checked').val()) {
      filters.push({ billingMemberFilter: true });
    }

    let members = this.props.allMembers.filter(function(member) {
      let match = true;
      for (var i = 0; i < filters.length; i++) {
        let keys = Object.keys(filters[i]);
        if (keys[0] === 'joiningDateFilter') {
          if (
            !moment(member.values['Date Joined'], 'YYYY-MM-DD').isBetween(
              startDate,
              endDate,
            )
          ) {
            match = false;
          }
        } else if (keys[0] === 'genderFilter') {
          if (member.values['Gender'] !== filters[i][keys[0]].gender) {
            match = false;
          }
        } else if (keys[0] === 'ageFilter') {
          let years = moment().diff(member.values['DOB'], 'years');
          if (
            !(
              years >= filters[i][keys[0]].fromAge &&
              years <= filters[i][keys[0]].toAge
            )
          ) {
            match = false;
          }
        } else if (keys[0] === 'statusFilter') {
          if (
            $.inArray(member.values['Status'], filters[i][keys[0]].status) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'programFilter') {
          if (
            $.inArray(
              member.values['Ranking Program'],
              filters[i][keys[0]].programs,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'beltFilter') {
          if (
            $.inArray(
              member.values['Ranking Belt'],
              filters[i][keys[0]].belts,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'additionalProgram1Filter') {
          if (
            $.inArray(
              member.values['Additional Program 1'],
              filters[i][keys[0]].programs,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'additionalProgram2Filter') {
          if (
            $.inArray(
              member.values['Additional Program 2'],
              filters[i][keys[0]].programs,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'memberTypeFilter') {
          if (member.values['Member Type'] !== filters[i][keys[0]].memberType) {
            match = false;
          }
        } else if (keys[0] === 'billingMemberFilter') {
          if (!member.values['Billing Customer Id']) {
            match = false;
          }
        }
      }
      return match;
    });

    this.setState({
      data: this.getData(members),
      filters: filters,
    });
  }

  render() {
    return (
      <div className="container-fluid memberLists">
        <div className="row">
          <div
            className="col-md-4"
            style={{
              backgroundColor: '#F7F7F7',
              borderColor: '#D5D5D5',
              borderRight: 'solid 1px',
            }}
          >
            <form id="form" name="form">
              <div className="row">
                <div className="col">
                  <button
                    type="button"
                    id="applyFilter"
                    className="btn btn-primary"
                    style={{ borderRadius: '0' }}
                    onClick={e => this.applyFilters()}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">Status</legend>
                    <div className="form-group form-inline" ref="statusDiv">
                      <label htmlFor="status">Status&nbsp;</label>
                      <select
                        className="form-control"
                        multiple
                        id="status"
                        ref={input => (this.input = input)}
                        style={{ height: 'auto' }}
                      >
                        {[
                          ...new Set(
                            this.props.memberStatusValues.map(
                              (status, index) => status,
                            ),
                          ),
                        ].map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">Joining Date</legend>
                    <div className="form-group form-inline">
                      <label htmlFor="joiningDateStart">Start Date&nbsp;</label>
                      <DayPickerInput
                        name="joiningDateStart"
                        id="joiningDateStart"
                        placeholder={moment(new Date())
                          .localeData()
                          .longDateFormat('L')
                          .toLowerCase()}
                        formatDate={formatDate}
                        parseDate={parseDate}
                        value={
                          this.state.joiningDateStart !== undefined
                            ? moment(
                                this.state.joiningDateStart,
                                'YYYY-MM-DD',
                              ).toDate()
                            : ''
                        }
                        onDayChange={function(
                          selectedDay,
                          modifiers,
                          dayPickerInput,
                        ) {
                          compThis.setState({
                            joiningDateStart: moment(selectedDay).format(
                              'YYYY-MM-DD',
                            ),
                          });
                        }}
                        dayPickerProps={{
                          locale:
                            this.props.profile.preferredLocale == null
                              ? 'en-au'
                              : this.props.profile.preferredLocale.toLowerCase(),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </div>
                    <div className="form-group form-inline">
                      <label htmlFor="joiningDateEnd">End Date&nbsp;</label>
                      <DayPickerInput
                        name="joiningDateEnd"
                        id="joiningDateEnd"
                        placeholder={moment(new Date())
                          .localeData()
                          .longDateFormat('L')
                          .toLowerCase()}
                        formatDate={formatDate}
                        parseDate={parseDate}
                        value={
                          this.state.joiningDateEnd !== undefined
                            ? moment(
                                this.state.joiningDateEnd,
                                'YYYY-MM-DD',
                              ).toDate()
                            : ''
                        }
                        onDayChange={function(
                          selectedDay,
                          modifiers,
                          dayPickerInput,
                        ) {
                          compThis.setState({
                            joiningDateEnd: moment(selectedDay).format(
                              'YYYY-MM-DD',
                            ),
                          });
                        }}
                        dayPickerProps={{
                          locale:
                            this.props.profile.preferredLocale == null
                              ? 'en-au'
                              : this.props.profile.preferredLocale.toLowerCase(),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">Age</legend>
                    <div className="form-group form-inline">
                      <label htmlFor="fromAge">From&nbsp;</label>
                      <input
                        id="fromAge"
                        name="fromAge"
                        type="text"
                        ref={input => (this.input = input)}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="form-group form-inline">
                      <label htmlFor="toAge">To&nbsp;</label>
                      <input
                        id="toAge"
                        name="toAge"
                        type="text"
                        ref={input => (this.input = input)}
                        className="form-control form-control-sm"
                      />
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">Gender</legend>
                    <div className="form-check form-check-inline">
                      <label className="form-check-label">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="gender"
                          value="Male"
                          ref={input => (this.input = input)}
                        />{' '}
                        Male
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <label className="form-check-label">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="gender"
                          value="Female"
                          ref={input => (this.input = input)}
                        />{' '}
                        Female
                      </label>
                    </div>
                    {getAttributeValue(
                      this.props.space,
                      'Additional Gender Options',
                    ) === 'YES' && (
                      <div className="form-check form-check-inline">
                        <label className="form-check-label">
                          <input
                            type="radio"
                            className="form-check-input"
                            name="gender"
                            value="Prefer not to answer"
                            ref={input => (this.input = input)}
                          />{' '}
                          Prefer not to answer
                        </label>
                      </div>
                    )}
                    {getAttributeValue(
                      this.props.space,
                      'Additional Gender Options',
                    ) === 'YES' && (
                      <div className="form-check form-check-inline">
                        <label className="form-check-label">
                          <input
                            type="radio"
                            className="form-check-input"
                            name="gender"
                            value="Other"
                            ref={input => (this.input = input)}
                          />{' '}
                          Other
                        </label>
                      </div>
                    )}
                  </fieldset>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">
                      Ranking Program
                    </legend>
                    <div className="form-group form-inline" ref="programsDiv">
                      <label htmlFor="program">Ranking Program&nbsp;</label>
                      <select
                        className="form-control"
                        multiple
                        id="program"
                        ref={input => (this.input = input)}
                        style={{ height: 'auto' }}
                      >
                        {this.props.programs.map(program => (
                          <option key={program.program} value={program.program}>
                            {program.program}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">Ranking Belt</legend>
                    <div className="form-group form-inline" ref="beltsDiv">
                      <label htmlFor="belt">Ranking Belt&nbsp;</label>
                      <select
                        className="form-control"
                        multiple
                        id="belt"
                        ref={input => (this.input = input)}
                        style={{ height: 'auto' }}
                      >
                        {[
                          ...new Set(this.props.belts.map(belt => belt.belt)),
                        ].map(belt => (
                          <option key={belt} value={belt}>
                            {belt}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">
                      Additional Programs
                    </legend>
                    <div
                      className="form-group form-inline"
                      ref="additionalProgram1Div"
                    >
                      <label htmlFor="additionalProgram1">
                        Additional Program 1&nbsp;
                      </label>
                      <select
                        className="form-control"
                        multiple
                        id="additionalProgram1"
                        ref={input => (this.input = input)}
                        style={{ height: 'auto' }}
                      >
                        {this.props.additionalPrograms.map(program => (
                          <option key={program.program} value={program.program}>
                            {program.program}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                    <div
                      className="form-group form-inline"
                      ref="additionalProgram2Div"
                    >
                      <label htmlFor="additionalProgram2">
                        Additional Program 2&nbsp;
                      </label>
                      <select
                        className="form-control"
                        multiple
                        id="additionalProgram2"
                        ref={input => (this.input = input)}
                        style={{ height: 'auto' }}
                      >
                        {this.props.additionalPrograms.map(program => (
                          <option key={program.program} value={program.program}>
                            {program.program}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">Member Type</legend>
                    <div className="form-group form-inline">
                      <label htmlFor="memberType">Member Type&nbsp;</label>
                      <select
                        className="form-control"
                        id="memberType"
                        ref={input => (this.input = input)}
                      >
                        <option value="" />
                        {this.props.membershipTypes.map(type => (
                          <option key={type.type} value={type.type}>
                            {type.type}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border">Billing Member</legend>
                    <div className="form-check">
                      <label className="form-check-label">
                        <input
                          type="checkbox"
                          id="billingMember"
                          name="billingMember"
                          className="form-check-input"
                          value="true"
                        />{' '}
                        Billing Member
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>
            </form>
          </div>
          <div className="col-md-8">
            <div className="row">
              <div className="col">
                <div className="form-group form-inline">
                  <label htmlFor="listName">List Name</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '50%' }}
                    id="listName"
                    ref={input => (this.input = input)}
                  />
                </div>
                <div className="form-group">
                  <button
                    type="button"
                    id="createList"
                    className="btn btn-primary"
                    onClick={e => this.createList()}
                  >
                    Create List
                  </button>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <ReactTable
                  columns={this._columns}
                  data={this.state.data}
                  defaultPageSize={this.state.data.length}
                  pageSize={this.state.data.length}
                  showPagination={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

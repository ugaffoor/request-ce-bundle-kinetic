import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/scss/bootstrap.scss';
import ReactTable from 'react-table';
import { actions as appActions } from '../../redux/modules/memberApp';
import { StatusMessagesContainer } from '../StatusMessages';
import { matchesMemberFilter } from '../../utils/utils';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

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
  updateMembersList: appActions.updateMembersList,
};
var compThis = undefined;

export const ListEditView = ({
  allMembers,
  programs,
  additionalPrograms,
  membershipTypes,
  belts,
  memberLists,
  updateList,
  match,
  memberStatusValues,
  profile,
  space,
}) => (
  <div>
    <StatusMessagesContainer />
    <ListEditHome
      allMembers={allMembers}
      programs={programs}
      additionalPrograms={additionalPrograms}
      membershipTypes={membershipTypes}
      belts={belts}
      memberLists={memberLists}
      updateList={updateList}
      match={match}
      memberStatusValues={memberStatusValues}
      profile={profile}
      space={space}
    />
  </div>
);

export const ListEditContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(() => {
    return {};
  }),
  withHandlers({
    updateList: ({ updateMembersList, history }) => updatedList => {
      updateMembersList({
        updatedList,
        history: history,
      });
    },
  }),
  lifecycle({
    componentWillMount() {},
    componentWillReceiveProps(nextProps) {},
    componentWillUnmount() {},
  }),
)(ListEditView);

export class ListEditHome extends Component {
  constructor(props) {
    super(props);
    compThis = this;
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this._columns = this.getColumns();
    let data = [];
    let listToBeUpdated = null;
    if (
      this.props.allMembers &&
      this.props.allMembers.length > 0 &&
      this.props.memberLists &&
      this.props.memberLists.size > 0
    ) {
      listToBeUpdated = this.props.memberLists
        .filter(list => list.name === this.props.match.params.name)
        .get(0);

      let members = matchesMemberFilter(
        this.props.allMembers,
        listToBeUpdated.filters,
      );

      data = this.getData(members);
    }

    this.state = {
      data,
      listToBeUpdated,
      joiningDateStart: undefined,
      joiningDateEnd: undefined,
    };
  }

  componentWillReceiveProps(nextProps) {
    //console.log("next props = " + util.inspect(nextProps));
    if (nextProps.allMembers) {
      let data = [];
      let listToBeUpdated = nextProps.memberLists
        .filter(list => list.name === this.props.match.params.name)
        .get(0);
      if (listToBeUpdated) {
        let members = matchesMemberFilter(
          this.props.allMembers,
          listToBeUpdated.filters,
        );
        data = this.getData(members);
        this.populateFilters(listToBeUpdated);
      }

      this.setState({
        data,
        listToBeUpdated,
      });
    }
  }

  componentDidMount() {
    this.populateFilters(this.state.listToBeUpdated);
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

  updateList() {
    if (
      !$('#listName').val() ||
      !this.state.data ||
      this.state.data.length <= 0
    ) {
      return;
    }

    let newList = {
      id: this.state.listToBeUpdated['id'],
      name: $('#listName').val(),
      filters: this.state.filters,
    };
    this.props.updateList(newList);
  }

  getColumns = () => {
    return [
      { accessor: 'Member ID', Header: 'Member Id' },
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

    let members = matchesMemberFilter(this.props.allMembers, filters);

    this.setState({
      data: this.getData(members),
      filters: filters,
    });
  }

  populateFilters(listToBeUpdated) {
    if (!listToBeUpdated) {
      return;
    }

    listToBeUpdated.filters.forEach(filter => {
      let key = Object.keys(filter)[0];
      if (key === 'joiningDateFilter') {
        compThis.setState({
          joiningDateStart: filter[key].endDate,
          joiningDateEnd: filter[key].startDate,
        });
      } else if (key === 'genderFilter') {
        $('input[name=gender][value=' + filter[key].gender + ']').attr(
          'checked',
          'checked',
        );
      } else if (key === 'ageFilter') {
        $('#fromAge').val(filter[key].fromAge);
        $('#toAge').val(filter[key].toAge);
      } else if (key === 'statusFilter') {
        $('#status').val(filter[key].status);
      } else if (key === 'programFilter') {
        $('#program').val(filter[key].programs);
      } else if (key === 'beltFilter') {
        $('#belt').val(filter[key].belts);
      } else if (key === 'additionalProgram1Filter') {
        $('#additionalProgram1').val(filter[key].programs);
      } else if (key === 'additionalProgram2Filter') {
        $('#additionalProgram2').val(filter[key].programs);
      } else if (key === 'memberTypeFilter') {
        $('#memberType').val(filter[key].memberType);
      } else if (key === 'billingMemberFilter') {
        $('input[name=billingMember][value=true]').attr('checked', 'checked');
      }
    });

    this.setState({
      filters: listToBeUpdated.filters,
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
                    defaultValue={
                      this.state.listToBeUpdated
                        ? this.state.listToBeUpdated.name
                        : ''
                    }
                  />
                </div>
                <div className="form-group">
                  <button
                    type="button"
                    id="updateList"
                    className="btn btn-primary"
                    style={{ borderRadius: '0' }}
                    onClick={e => this.updateList()}
                  >
                    Update List
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

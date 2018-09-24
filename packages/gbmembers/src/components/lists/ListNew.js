import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/scss/bootstrap.scss';
import ReactTable from 'react-table';
import { actions as appActions } from '../../redux/modules/memberApp';
import Chance from 'chance';
import { StatusMessagesContainer } from '../StatusMessages';
<script src="../helpers/jquery.multiselect.js" />;

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  membershipTypes: state.member.app.membershipTypes,
  memberLists: state.member.app.memberLists,
  belts: state.member.app.belts,
});

const mapDispatchToProps = {
  fetchMembers: actions.fetchMembers,
  addMembersList: appActions.addMembersList,
};

const chance = new Chance();

export const ListNewView = ({
  allMembers,
  programs,
  membershipTypes,
  belts,
  memberLists,
  addNewList,
}) => (
  <div>
    <StatusMessagesContainer />
    <ListNewHome
      allMembers={allMembers}
      programs={programs}
      membershipTypes={membershipTypes}
      belts={belts}
      memberLists={memberLists}
      addNewList={addNewList}
    />
  </div>
);

export const ListNewContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
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
    componentWillMount() {},
    componentWillReceiveProps(nextProps) {},
    componentWillUnmount() {},
  }),
)(ListNewView);

export class ListNewHome extends Component {
  constructor(props) {
    super(props);
    this._columns = this.getColumns();
    this.state = {
      data: [],
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentDidMount() {
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
  }

  createList() {
    if (
      !$('#listName').val() ||
      !this.state.data ||
      this.state.data.length <= 0
    ) {
      return;
    }

    let memberIds = this.state.data.map(member => member['_id']);
    let newList = {
      id: chance.guid(),
      name: $('#listName').val(),
      members: memberIds,
      filters: this.state.filters,
    };
    this.props.addNewList(newList);
  }

  getColumns = () => {
    return [
      { accessor: 'Member ID', Header: 'Member Id' },
      { accessor: 'Gender', Header: 'Gender' },
      { accessor: 'Member Type', Header: 'Member Type' },
      { accessor: 'Ranking Program', Header: 'Program' },
      { accessor: 'Ranking Belt', Header: 'Belt' },
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

    if ($('#joiningDateStart').val() && $('#joiningDateEnd').val()) {
      filters.push({
        joiningDateFilter: {
          startDate: $('#joiningDateStart').val(),
          endDate: $('#joiningDateEnd').val(),
        },
      });
      startDate = moment($('#joiningDateStart').val(), 'YYYY-MM-DD');
      endDate = moment($('#joiningDateEnd').val(), 'YYYY-MM-DD');
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
        } else if (keys[0] === 'memberTypeFilter') {
          if (member.values['Member Type'] !== filters[i][keys[0]].memberType) {
            match = false;
          }
        } else if (keys[0] === 'billingMemberFilter') {
          if (!member.values['Billing Customer Reference']) {
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
                    <legend className="scheduler-border">Joining Date</legend>
                    <div className="form-group form-inline">
                      <label htmlFor="joiningDateStart">Start Date&nbsp;</label>
                      <input
                        id="joiningDateStart"
                        name="joiningDateStart"
                        type="date"
                        ref={input => (this.input = input)}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="form-group form-inline">
                      <label htmlFor="joiningDateEnd">End Date&nbsp;</label>
                      <input
                        id="joiningDateEnd"
                        name="joiningDateEnd"
                        type="date"
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
                    style={{ borderRadius: '0' }}
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

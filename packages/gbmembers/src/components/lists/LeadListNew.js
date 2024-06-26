import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/leads';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/scss/bootstrap.scss';
import ReactTable from 'react-table';
import { actions as appActions } from '../../redux/modules/memberApp';
import uuid from 'uuid';
import { StatusMessagesContainer } from '../StatusMessages';
import { matchesLeadFilter } from '../../utils/utils';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';
import '../helpers/jquery.multiselect.js';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { KappNavLink as NavLink } from 'common';

<script src="../helpers/jquery.multiselect.js" />;

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  allLeads: state.member.leads.allLeads,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  membershipTypes: state.member.app.membershipTypes,
  leadLists: state.member.app.leadLists,
  belts: state.member.app.belts,
  leadStatusValues: state.member.app.leadStatusValues,
  leadSourceValues: state.member.app.leadSourceValues,
  profile: state.member.app.profile,
  space: state.member.app.space,
});

const mapDispatchToProps = {
  addLeadsList: appActions.addLeadsList,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
var compThis = undefined;

export const ListNewView = ({
  allLeads,
  programs,
  additionalPrograms,
  membershipTypes,
  belts,
  leadLists,
  addNewList,
  leadStatusValues,
  leadSourceValues,
  profile,
  space,
}) => (
  <div>
    <StatusMessagesContainer />
    <ListNewHome
      allLeads={allLeads}
      programs={programs}
      additionalPrograms={additionalPrograms}
      membershipTypes={membershipTypes}
      belts={belts}
      leadLists={leadLists}
      addNewList={addNewList}
      leadStatusValues={leadStatusValues}
      leadSourceValues={leadSourceValues}
      profile={profile}
      space={space}
    />
  </div>
);

export const LeadListNewContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(() => {
    return {};
  }),
  withHandlers({
    addNewList: ({ addLeadsList, history }) => newList => {
      addLeadsList({
        newList,
        history: history,
      });
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {},
    UNSAFE_componentWillReceiveProps(nextProps) {},
    componentDidMount() {
      this.props.setSidebarDisplayType('leads');
    },
    componentWillUnmount() {},
  }),
)(ListNewView);

export class ListNewHome extends Component {
  constructor(props) {
    super(props);
    compThis = this;
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this._columns = this.getColumns();
    this.getExcluded = this.getExcluded.bind(this);
    this.state = {
      data: [],
      createdDateStart: undefined,
      createdDateEnd: undefined,
      excluded: [],
      count: 0,
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
    this.refs.leadReferredDiv &&
      $(this.refs.leadReferredDiv)
        .find('select')
        .multiselect({
          texts: { placeholder: 'Select Lead Referred' },
        });
    this.refs.specificLeadsDiv &&
      $(this.refs.specificLeadsDiv)
        .find('select')
        .multiselect({
          texts: { placeholder: 'Select Leads' },
          search: true,
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
        accessor: 'First Name',
        Header: props => {
          return (
            <span>
              <span>
                Name({this.state !== undefined ? this.state.count : '0'})
              </span>
            </span>
          );
        },
        Cell: props => {
          return (
            <NavLink to={`/LeadDetail/${props.original._id}`} className="">
              {props.original['First Name']} {props.original['Last Name']}
            </NavLink>
          );
        },
      },
      { accessor: 'Status', Header: 'Status' },
      { accessor: 'Source', Header: 'Referred via' },
      { accessor: 'Gender', Header: 'Gender' },
      { accessor: 'Interest in Program', Header: 'Program' },
      { accessor: 'Source Reference 1', Header: 'Source 1' },
      { accessor: 'Source Reference 2', Header: 'Source 2' },
      { accessor: 'Source Reference 3', Header: 'Source 3' },
      { accessor: 'Source Reference 4', Header: 'Source 4' },
    ];
  };

  getData(leads) {
    if (!leads) {
      return [];
    }

    let data = [];
    leads.forEach(lead => {
      data.push({
        _id: lead['id'],
        ...lead.values,
      });
    });

    return data;
  }

  applyFilters() {
    let filters = [];

    if (
      this.state.createdDateStart !== undefined &&
      this.state.createdDateEnd !== undefined
    ) {
      filters.push({
        createdDateFilter: {
          startDate: this.state.createdDateStart,
          endDate: this.state.createdDateEnd,
        },
      });
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

    if ($('#leadReferred').val() && $('#leadReferred').val().length > 0) {
      filters.push({
        leadReferredFilter: { leadReferred: $('#leadReferred').val() },
      });
    }

    if ($('#sourceReference1').val()) {
      filters.push({
        sourceReference1Filter: {
          sourceReference1: $('#sourceReference1').val(),
        },
      });
    }

    if ($('#sourceReference2').val()) {
      filters.push({
        sourceReference2Filter: {
          sourceReference2: $('#sourceReference2').val(),
        },
      });
    }

    if ($('#sourceReference3').val()) {
      filters.push({
        sourceReference3Filter: {
          sourceReference3: $('#sourceReference3').val(),
        },
      });
    }

    if ($('#sourceReference4').val()) {
      filters.push({
        sourceReference4Filter: {
          sourceReference4: $('#sourceReference4').val(),
        },
      });
    }

    if ($('#specificLeads').val() && $('#specificLeads').val().length > 0) {
      filters.push({
        specificLeadsFilter: { specificLeads: $('#specificLeads').val() },
      });
    }

    let leads = matchesLeadFilter(this.props.allLeads, filters);

    var data = this.getData(leads);
    this.setState({
      data: data,
      count: data.length,
      filters: filters,
    });
  }
  getReferenceMap(leads, sourceField) {
    let sourceMap = new Map();

    leads.forEach(lead => {
      if (
        lead.values[sourceField] !== undefined &&
        lead.values[sourceField] !== ''
      ) {
        sourceMap.set(lead.values[sourceField], lead.values[sourceField]);
      }
    });
    let data = [];
    sourceMap.forEach((value, key, map) => {
      data.push(value);
    });
    return data;
  }
  render() {
    return (
      <div className="container-fluid leadLists">
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
                            this.props.leadStatusValues.map(
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
                    <legend className="scheduler-border">Created Date</legend>
                    <div className="form-group form-inline">
                      <label htmlFor="createdDateStart">From Date&nbsp;</label>
                      <DayPickerInput
                        name="createdDateStart"
                        id="createdDateStart"
                        placeholder={moment(new Date())
                          .locale(
                            getLocalePreference(
                              this.props.space,
                              this.props.profile,
                            ),
                          )
                          .localeData()
                          .longDateFormat('L')
                          .toLowerCase()}
                        formatDate={formatDate}
                        parseDate={parseDate}
                        value={
                          this.state.createdDateStart !== undefined
                            ? moment(
                                this.state.createdDateStart,
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
                            createdDateStart: moment(selectedDay).format(
                              'YYYY-MM-DD',
                            ),
                          });
                        }}
                        dayPickerProps={{
                          locale: getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </div>
                    <div className="form-group form-inline">
                      <label htmlFor="createdDateEnd">To Date&nbsp;</label>
                      <DayPickerInput
                        name="createdDateEnd"
                        id="createdDateEnd"
                        placeholder={moment(new Date())
                          .locale(
                            getLocalePreference(
                              this.props.space,
                              this.props.profile,
                            ),
                          )
                          .localeData()
                          .longDateFormat('L')
                          .toLowerCase()}
                        formatDate={formatDate}
                        parseDate={parseDate}
                        value={
                          this.state.createdDateEnd !== undefined
                            ? moment(
                                this.state.createdDateEnd,
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
                            createdDateEnd: moment(selectedDay).format(
                              'YYYY-MM-DD',
                            ),
                          });
                        }}
                        dayPickerProps={{
                          locale: getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
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
                          type="checkbox"
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
                          type="checkbox"
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
                            type="checkbox"
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
                            type="checkbox"
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
                      Interest in Program
                    </legend>
                    <div className="form-group form-inline" ref="programsDiv">
                      <label htmlFor="program">Interest in Program&nbsp;</label>
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
                    <legend className="scheduler-border">
                      Lead referred via
                    </legend>
                    <div
                      className="form-group form-inline"
                      ref="leadReferredDiv"
                    >
                      <label htmlFor="leadReferred">
                        Lead referred via&nbsp;
                      </label>
                      <select
                        className="form-control"
                        multiple
                        id="leadReferred"
                        ref={input => (this.input = input)}
                        style={{ height: 'auto' }}
                      >
                        {this.props.leadSourceValues.map((value, index) => {
                          return (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          );
                        })}
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
                      Source References
                    </legend>
                    <div className="form-group form-inline">
                      <label htmlFor="sourceReference1">
                        Source Reference 1&nbsp;
                      </label>
                      <select
                        className="form-control"
                        id="sourceReference1"
                        ref={input => (this.input = input)}
                      >
                        <option value="" />
                        {this.getReferenceMap(
                          this.props.allLeads,
                          'Source Reference 1',
                        ).map(value => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                    <div className="form-group form-inline">
                      <label htmlFor="sourceReference2">
                        Source Reference 2&nbsp;
                      </label>
                      <select
                        className="form-control"
                        id="sourceReference2"
                        ref={input => (this.input = input)}
                      >
                        <option value="" />
                        {this.getReferenceMap(
                          this.props.allLeads,
                          'Source Reference 2',
                        ).map(value => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                    <div className="form-group form-inline">
                      <label htmlFor="sourceReference3">
                        Source Reference 3&nbsp;
                      </label>
                      <select
                        className="form-control"
                        id="sourceReference3"
                        ref={input => (this.input = input)}
                      >
                        <option value="" />
                        {this.getReferenceMap(
                          this.props.allLeads,
                          'Source Reference 3',
                        ).map(value => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                    <div className="form-group form-inline">
                      <label htmlFor="sourceReference4">
                        Source Reference 4&nbsp;
                      </label>
                      <select
                        className="form-control"
                        id="sourceReference4"
                        ref={input => (this.input = input)}
                      >
                        <option value="" />
                        {this.getReferenceMap(
                          this.props.allLeads,
                          'Source Reference 4',
                        ).map(value => (
                          <option key={value} value={value}>
                            {value}
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
                    <legend className="scheduler-border">Specific Leads</legend>
                    <div
                      className="form-group form-inline"
                      ref="specificLeadsDiv"
                    >
                      <label htmlFor="specificLeads">
                        Specific Leads&nbsp;
                      </label>
                      <select
                        className="form-control"
                        multiple
                        id="specificLeads"
                        ref={input => (this.input = input)}
                        style={{ height: 'auto' }}
                      >
                        {this.props.allLeads
                          .filter(lead => lead.values['Status'] === 'Open')
                          .map(lead => (
                            <option key={lead.id} value={lead.id}>
                              {lead.values['First Name'] +
                                ' ' +
                                lead.values['Last Name']}
                            </option>
                          ))}
                      </select>
                      <div className="droparrow" />
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

import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson, memberStatusInDates } from '../Member/MemberUtils';
import $ from 'jquery';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import helpIcon from '../../images/help.svg?raw';

export class Statistics extends Component {
  handleClose = () => {
    var lastActive = this.state.lastActive;
    $('.dateSettings button[active=true]').attr('active', 'false');
    $(lastActive).attr('active', 'true');
    this.setState({
      isShowCustom: false,
      dateRange: this.state.lastDateRange,
    });
  };
  constructor(props) {
    super(props);
    this._getLeadRowTableColumns = this.getLeadRowTableColumns();
    this._getMemberRowTableColumns = this.getMemberRowTableColumns();

    this.setIsAssigning = this.props.setIsAssigning;
    this.datesChanged = this.props.datesChanged;
    this.setFromDate = this.props.setFromDate;
    this.setToDate = this.props.setToDate;

    let fromDate = this.props.fromDate;
    let toDate = this.props.toDate;

    let leads = this.props.leadsByDate;
    let leadData = this.getData(
      leads,
      this.props.allMembers,
      fromDate,
      toDate,
      false,
    );
    let memberData = this.getMemberData(
      this.props.allMembers,
      fromDate,
      toDate,
    );
    this.state = {
      leads,
      leadData,
      allMembers: this.props.allMembers,
      memberData,
      fromDate,
      toDate,
      LCTViewSwitch: false,
      showNewLeads: false,
      showScheduledLeads: false,
      showIntroLeads: false,
      showConvertedLeads: false,
      showCancellationsMembers: false,
      showPendingCancellationsMembers: false,
      showFrozenMembers: false,
      showPendingFrozenMembers: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    let leads = nextProps.leadsByDate;
    let leadData = this.getData(
      leads,
      this.state.allMembers,
      this.state.fromDate,
      this.state.toDate,
      this.state.LCTViewSwitch,
    );
    let memberData = this.getMemberData(
      nextProps.allMembers,
      this.state.fromDate,
      this.state.toDate,
    );
    this.setState({
      leads,
      allMembers: nextProps.allMembers,
      leadData,
      memberData,
    });
  }

  componentWillMount() {
    /*    if (this.props.leadsByDate.length===0){
      this.props.fetchLeadsByDate();
    }*/
  }

  getData(leads, allMembers, fromDate, toDate, LCTViewSwitch) {
    if (!leads || leads.length <= 0) {
      return {
        leadsTotal: [],
        introsTotal: [],
        attendedTotal: [],
        convertedTotal: [],
      };
    }

    let leadsTotal = [];
    let introsTotal = [];
    let attendedTotal = [];
    let noshowTotal = [];
    let convertedTotal = [];
    if (LCTViewSwitch) {
      leads.forEach(lead => {
        if (moment(lead['createdAt']).isBetween(fromDate, toDate)) {
          leadsTotal[leadsTotal.length] = lead;
          //      }
          //      if (moment(lead['updatedAt']).isBetween(fromDate, toDate)) {
          var history =
            lead.values['History'] !== undefined
              ? getJson(lead.values['History'])
              : {};
          for (var i = 0; i < history.length; i++) {
            if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'intro_class'
            ) {
              introsTotal[introsTotal.length] = lead;
            }
          }
          for (i = 0; i < history.length; i++) {
            if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'attended_class'
            ) {
              attendedTotal[attendedTotal.length] = lead;
            }
          }
          for (i = 0; i < history.length; i++) {
            if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'noshow_class'
            ) {
              noshowTotal[noshowTotal.length] = lead;
            }
          }
          if (lead.values['Lead State'] === 'Converted') {
            let memberIdx = allMembers.findIndex(
              member => member.values['Lead Submission ID'] === lead.id,
            );
            if (
              memberIdx !== -1 &&
              moment(allMembers[memberIdx]['createdAt']).isBetween(
                fromDate,
                toDate,
              )
            ) {
              convertedTotal[convertedTotal.length] = lead;
            }
          }
        }
      });
    } else {
      leads.forEach(lead => {
        if (moment(lead['createdAt']).isBetween(fromDate, toDate)) {
          leadsTotal[leadsTotal.length] = lead;
        }
        //        if (moment(lead['updatedAt']).isBetween(fromDate, toDate)) {
        var history =
          lead.values['History'] !== undefined
            ? getJson(lead.values['History'])
            : {};
        for (var i = 0; i < history.length; i++) {
          if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'intro_class'
          ) {
            introsTotal[introsTotal.length] = lead;
          }
        }
        for (i = 0; i < history.length; i++) {
          if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'attended_class'
          ) {
            attendedTotal[attendedTotal.length] = lead;
          }
        }
        for (i = 0; i < history.length; i++) {
          if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'noshow_class'
          ) {
            noshowTotal[noshowTotal.length] = lead;
          }
        }
        if (lead.values['Lead State'] === 'Converted') {
          let memberIdx = allMembers.findIndex(
            member => member.values['Lead Submission ID'] === lead.id,
          );
          if (
            memberIdx !== -1 &&
            moment(allMembers[memberIdx]['createdAt']).isBetween(
              fromDate,
              toDate,
            )
          ) {
            convertedTotal[convertedTotal.length] = lead;
          }
        }
      });
    }

    return {
      leadsTotal: leadsTotal,
      introsTotal: introsTotal,
      attendedTotal: attendedTotal,
      convertedTotal: convertedTotal,
    };
  }
  getMemberData(members, fromDate, toDate) {
    if (!members || members.length <= 0) {
      return {
        cancellations: [],
        pendingCancellations: [],
        frozen: [],
        pendingFrozen: [],
      };
    }

    let cancellations = [];
    let pendingCancellations = [];
    let frozen = [];
    let pendingFrozen = [];
    members.forEach(member => {
      let memberStatus = memberStatusInDates(member, fromDate, toDate);

      if (memberStatus === 'Inactive') {
        cancellations[cancellations.length] = member;
      }
      if (memberStatus === 'Pending Cancellation') {
        pendingCancellations[pendingCancellations.length] = member;
      }
      if (memberStatus === 'Frozen' || memberStatus === 'Suspended') {
        frozen[frozen.length] = member;
      }
      if (
        memberStatus === 'Pending Freeze' ||
        memberStatus === 'Pending Suspension'
      ) {
        pendingFrozen[pendingFrozen.length] = member;
      }
    });

    return {
      cancellations: cancellations,
      pendingCancellations: pendingCancellations,
      frozen: frozen,
      pendingFrozen: pendingFrozen,
    };
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: moment(event.target.value),
    });
  }

  handleSubmit(event) {
    if (!this.state.fromDate || !this.state.toDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.setState({
        isShowCustom: false,
        leadData: this.getData(
          this.state.leads,
          this.state.allMembers,
          this.state.fromDate.hour(0).minute(0),
          this.state.toDate.hour(23).minute(59),
          this.state.LCTViewSwitch,
        ),
        memberData: this.getMemberData(
          this.state.allMembers,
          this.state.fromDate,
          this.state.toDate,
        ),
      });
      this.datesChanged(
        this.setFromDate,
        this.setToDate,
        this.state.fromDate,
        this.state.toDate,
      );
    }
  }
  setStatisticDates(e, type) {
    if (type === 'today') {
      let fromDate = moment()
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let data = this.getData(
        this.state.leads,
        this.state.allMembers,
        fromDate,
        toDate,
        this.state.LCTViewSwitch,
      );
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      this.setState({
        isShowCustom: false,
        leadData: data,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.datesChanged(this.setFromDate, this.setToDate, fromDate, toDate);
    } else if (type === 'last_7_days') {
      let fromDate = moment()
        .subtract(7, 'days')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let data = this.getData(
        this.state.leads,
        this.state.allMembers,
        fromDate,
        toDate,
        this.state.LCTViewSwitch,
      );
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        leadData: data,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      this.datesChanged(this.setFromDate, this.setToDate, fromDate, toDate);
    } else if (type === 'last_30_days') {
      let fromDate = moment()
        .subtract(30, 'days')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let data = this.getData(
        this.state.leads,
        this.state.allMembers,
        fromDate,
        toDate,
        this.state.LCTViewSwitch,
      );
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        leadData: data,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      this.datesChanged(this.setFromDate, this.setToDate, fromDate, toDate);
    } else if (type === 'year') {
      let fromDate = moment()
        .subtract(1, 'years')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let data = this.getData(
        this.state.leads,
        this.state.allMembers,
        fromDate,
        toDate,
        this.state.LCTViewSwitch,
      );
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        leadData: data,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      this.datesChanged(this.setFromDate, this.setToDate, fromDate, toDate);
    } else if (type === 'custom') {
      var lastActive = $('.dateSettings button[active=true]');
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: true,
        lastDateRange: this.state.dateRange,
        lastActive: lastActive,
      });
    }
  }
  getLeads(leads, col) {
    var leads_col = [];

    for (var i = col - 1; i < leads.length; i = i + 4) {
      //if (i % (col-1) === 0){
      leads_col[leads_col.length] = {
        leadId: leads[i].id,
        name:
          leads[i].values['First Name'] + ' ' + leads[i].values['Last Name'],
      };
      //}
    }

    return leads_col;
  }

  getLeadTableData(leads) {
    let leads_col1 = this.getLeads(leads, 1);
    let leads_col2 = this.getLeads(leads, 2);
    let leads_col3 = this.getLeads(leads, 3);
    let leads_col4 = this.getLeads(leads, 4);

    return [
      {
        leads: {
          leads_col1: leads_col1,
          leads_col2: leads_col2,
          leads_col3: leads_col3,
          leads_col4: leads_col4,
        },
      },
    ];
  }
  getLeadRowTableColumns = () => {
    return [
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col1['leadId']}`}
              className=""
            >
              {props.original.leads_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col2['leadId']}`}
              className=""
            >
              {props.original.leads_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col3['leadId']}`}
              className=""
            >
              {props.original.leads_col3['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col4['leadId']}`}
              className=""
            >
              {props.original.leads_col4['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getLeadTableHeaderName() {
    if (this.state.showNewLeads) return 'Leads';
    if (this.state.showScheduledLeads) return 'Into Scheduled';
    if (this.state.showIntroLeads) return 'Actual Intros';
    if (this.state.showConvertedLeads) return 'New Students';
  }
  getLeadTableColumns(row) {
    return [
      {
        accessor: 'leads',
        Header: this.getLeadTableHeaderName(),
        headerClassName: 'leads_col',
        className: 'leads_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let leads_col1 = props.value.leads_col1;
          let leads_col2 = props.value.leads_col2;
          let leads_col3 = props.value.leads_col3;
          let leads_col4 = props.value.leads_col4;

          let leads = [];
          for (var i = 0; i < leads_col1.length; i++) {
            leads[leads.length] = {
              leads_col1: leads_col1[i],
              leads_col2: leads_col2.length > i ? leads_col2[i] : undefined,
              leads_col3: leads_col3.length > i ? leads_col3[i] : undefined,
              leads_col4: leads_col4.length > i ? leads_col4[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getLeadRowTableColumns}
              pageSize={leads_col1.length > 20 ? 20 : leads_col1.length}
              showPagination={leads_col1.length > 20 ? true : false}
              data={leads}
            />
          );
        },
      },
    ];
  }
  getMembers(members, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 4) {
      //if (i % (col-1) === 0){
      members_col[members_col.length] = {
        memberId: members[i].id,
        name:
          members[i].values['First Name'] +
          ' ' +
          members[i].values['Last Name'],
      };
      //}
    }

    return members_col;
  }

  getMemberTableData(members) {
    let members_col1 = this.getMembers(members, 1);
    let members_col2 = this.getMembers(members, 2);
    let members_col3 = this.getMembers(members, 3);
    let members_col4 = this.getMembers(members, 4);

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
          members_col3: members_col3,
          members_col4: members_col4,
        },
      },
    ];
  }
  getMemberRowTableColumns = () => {
    return [
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col1['memberId']}`}
              className=""
            >
              {props.original.members_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col2['memberId']}`}
              className=""
            >
              {props.original.members_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col3['memberId']}`}
              className=""
            >
              {props.original.members_col3['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col4['memberId']}`}
              className=""
            >
              {props.original.members_col4['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getMemberTableHeaderName() {
    if (this.state.showCancellationsMembers) return 'Cancellations';
    if (this.state.showPendingCancellationsMembers)
      return 'Pending Cancellations';
    if (this.state.showFrozenMembers) return 'Frozen';
    if (this.state.showPendingFrozenMembers) return 'Pending Frozen';
  }
  getMemberTableColumns(row) {
    return [
      {
        accessor: 'members',
        Header: this.getMemberTableHeaderName(),
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let members_col1 = props.value.members_col1;
          let members_col2 = props.value.members_col2;
          let members_col3 = props.value.members_col3;
          let members_col4 = props.value.members_col4;

          let members = [];
          for (var i = 0; i < members_col1.length; i++) {
            members[members.length] = {
              members_col1: members_col1[i],
              members_col2:
                members_col2.length > i ? members_col2[i] : undefined,
              members_col3:
                members_col3.length > i ? members_col3[i] : undefined,
              members_col4:
                members_col4.length > i ? members_col4[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getMemberRowTableColumns}
              pageSize={members_col1.length > 20 ? 20 : members_col1.length}
              showPagination={members_col1.length > 20 ? true : false}
              data={members}
            />
          );
        },
      },
    ];
  }
  render() {
    return this.props.leadsByDateLoading ? (
      <div style={{ margin: '10px' }}>
        <p>Loading Statistics ...</p>
        <ReactSpinner />{' '}
      </div>
    ) : (
      <span>
        <div className="page-header" style={{ textAlign: 'center' }}>
          <div className="dateSettings">
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => this.setStatisticDates(e, 'today')}
            >
              Today
            </button>
            <button
              type="button"
              active="true"
              className="btn btn-primary report-btn-default"
              /*  disabled={moment().isBetween(
                this.state.fromDate,
                this.state.toDate,
              )} */
              onClick={e => this.setStatisticDates(e, 'last_7_days')}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              /*  disabled={moment().isBetween(
                this.state.fromDate,
                this.state.toDate,
              )} */
              onClick={e => this.setStatisticDates(e, 'last_30_days')}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              /*    disabled={moment().isBetween(
                this.state.fromDate,
                this.state.toDate,
              )} */
              onClick={e => this.setStatisticDates(e, 'year')}
            >
              Year
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              /*  disabled={moment().isBetween(
                this.state.fromDate,
                this.state.toDate,
              )} */
              onClick={e => this.setStatisticDates(e, 'custom')}
            >
              Custom
            </button>
          </div>
          {this.state.isShowCustom && (
            <div
              className="stat_customDatesContainer"
              onClose={this.handleClose}
            >
              <div className="attendanceByDateDiv" onClose={this.handleClose}>
                <div className="col-md-8">
                  <div className="row">
                    <div className="form-group col-xs-2 mr-1">
                      <label htmlFor="fromDate" className="control-label">
                        From Date
                      </label>
                      <input
                        type="date"
                        name="fromDate"
                        id="fromDate"
                        className="form-control input-sm"
                        required
                        defaultValue={this.state.fromDate}
                        onChange={e => this.handleInputChange(e)}
                      />
                    </div>
                    <div className="form-group col-xs-2 mr-1">
                      <label htmlFor="toDate" className="control-label">
                        To Date
                      </label>
                      <input
                        type="date"
                        name="toDate"
                        id="toDate"
                        className="form-control input-sm"
                        required
                        defaultValue={this.state.toDate}
                        onChange={e => this.handleInputChange(e)}
                      />
                    </div>
                    <div className="form-group col-xs-2">
                      <label className="control-label">&nbsp;</label>
                      <button
                        className="btn btn-primary form-control input-sm"
                        onClick={e => this.handleClose()}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="form-group col-xs-2">
                      <label className="control-label">&nbsp;</label>
                      <button
                        className="btn btn-primary form-control input-sm"
                        onClick={e => this.handleSubmit()}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <span className="label">
            {this.state.fromDate.format('DD-MM-YYYY')} to{' '}
            {this.state.toDate.format('DD-MM-YYYY')}
          </span>
        </div>
        <div className="leadStatistics">
          <div className="statisticsHeader">Lead Conversion Tracker</div>
          <div className="lctView">
            <label htmlFor="lctMode">Switch LCT</label>
            <div className="checkboxFilter">
              <input
                id="lctMode"
                type="checkbox"
                value="1"
                onChange={e => {
                  this.setState({
                    LCTViewSwitch: !this.state.LCTViewSwitch,
                    leadData: this.getData(
                      this.state.leads,
                      this.state.allMembers,
                      this.state.fromDate.hour(0).minute(0),
                      this.state.toDate.hour(23).minute(59),
                      !this.state.LCTViewSwitch,
                    ),
                  });
                }}
              />
              <label htmlFor="lctMode"></label>
            </div>
            {}
          </div>
          <SVGInline
            svg={helpIcon}
            className="icon help"
            onClick={e => {
              $('.lctModeHelp').toggle('');
            }}
          />
          <span className="lctModeHelp">
            <ul>
              <li>
                No - Displays all Leads created in the period, and all Lead
                events created in the period for any Lead.
              </li>
              <li>
                Yes - Displays all Leads created in the period, but only Lead
                events created in the period for Leads created in the period.
              </li>
            </ul>
          </span>
          <div className="statItems">
            <div className="statItem">
              <div className="info">
                <div className="label">Leads</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: true,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.leadData.leadsTotal.length}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className="percent"
                    style={{
                      width: '100%',
                    }}
                  ></div>
                </div>
                <div className="value">100%</div>
              </div>
              {this.state.showNewLeads && (
                <div className="leads">
                  <span
                    className="closeLeads"
                    onClick={e =>
                      this.setState({
                        showNewLeads: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getLeadTableColumns()}
                    data={this.getLeadTableData(this.state.leadData.leadsTotal)}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Intro Scheduled</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showScheduledLeads: true,
                      showNewLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.leadData.introsTotal.length}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.introsTotal.length /
                        this.state.leadData.leadsTotal.length <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal.length !== 0
                          ? (
                              (this.state.leadData.introsTotal.length /
                                this.state.leadData.leadsTotal.length) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  ></div>
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal.length !== 0
                    ? (
                        (this.state.leadData.introsTotal.length /
                          this.state.leadData.leadsTotal.length) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
              {this.state.showScheduledLeads && (
                <div className="leads">
                  <span
                    className="closeLeads"
                    onClick={e =>
                      this.setState({
                        showScheduledLeads: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getLeadTableColumns()}
                    data={this.getLeadTableData(
                      this.state.leadData.introsTotal,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Actual Intros</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showIntroLeads: true,
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.leadData.attendedTotal.length}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.attendedTotal.length /
                        this.state.leadData.leadsTotal.length <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal.length !== 0
                          ? (
                              (this.state.leadData.attendedTotal.length /
                                this.state.leadData.leadsTotal.length) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  ></div>
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal.length !== 0
                    ? (
                        (this.state.leadData.attendedTotal.length /
                          this.state.leadData.leadsTotal.length) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
              {this.state.showIntroLeads && (
                <div className="leads">
                  <span
                    className="closeLeads"
                    onClick={e =>
                      this.setState({
                        showIntroLeads: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getLeadTableColumns()}
                    data={this.getLeadTableData(
                      this.state.leadData.attendedTotal,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">New Students</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showConvertedLeads: true,
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.leadData.convertedTotal.length}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.convertedTotal.length /
                        this.state.leadData.leadsTotal.length <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal.length !== 0
                          ? (
                              (this.state.leadData.convertedTotal.length /
                                this.state.leadData.leadsTotal.length) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  ></div>
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal.length !== 0
                    ? (
                        (this.state.leadData.convertedTotal.length /
                          this.state.leadData.leadsTotal.length) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
              {this.state.showConvertedLeads && (
                <div className="leads">
                  <span
                    className="closeLeads"
                    onClick={e =>
                      this.setState({
                        showConvertedLeads: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getLeadTableColumns()}
                    data={this.getLeadTableData(
                      this.state.leadData.convertedTotal,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="memberStatistics">
          <div className="statItems">
            <div className="statItem">
              <div className="info">
                <div className="label">Cancellations</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: true,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.cancellations.length}
                </div>
              </div>
              {this.state.showCancellationsMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showCancellationsMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.cancellations,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Pending cancellations</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: true,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.pendingCancellations.length}
                </div>
              </div>
              {this.state.showPendingCancellationsMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showPendingCancellationsMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.pendingCancellations,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Frozen</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: true,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.frozen.length}
                </div>
              </div>
              {this.state.showFrozenMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showFrozenMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(this.state.memberData.frozen)}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Pending frozen</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: true,
                    })
                  }
                >
                  {this.state.memberData.pendingFrozen.length}
                </div>
              </div>
              {this.state.showPendingFrozenMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showPendingFrozenMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.pendingFrozen,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </span>
    );
  }
}

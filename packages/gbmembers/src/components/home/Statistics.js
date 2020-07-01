import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import $ from 'jquery';

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
    this.setIsAssigning = this.props.setIsAssigning;
    this.datesChanged = this.props.datesChanged;
    this.setFromDate = this.props.setFromDate;
    this.setToDate = this.props.setToDate;

    let fromDate = this.props.fromDate;
    let toDate = this.props.toDate;

    let leads = this.props.leadsByDate;
    let leadData = this.getData(leads, fromDate, toDate);
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
    };
  }

  componentWillReceiveProps(nextProps) {
    let leads = nextProps.leadsByDate;
    let leadData = this.getData(leads, this.state.fromDate, this.state.toDate);
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

  getData(leads, fromDate, toDate) {
    if (!leads || leads.length <= 0) {
      return {
        leadsTotal: 0,
        introsTotal: 0,
        attendedTotal: 0,
        convertedTotal: 0,
      };
    }

    let leadsTotal = 0;
    let introsTotal = 0;
    let attendedTotal = 0;
    let convertedTotal = 0;
    leads.forEach(lead => {
      if (moment(lead['createdAt']).isBetween(fromDate, toDate)) {
        leadsTotal++;
      }
      if (moment(lead['updatedAt']).isBetween(fromDate, toDate)) {
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
            introsTotal++;
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
            attendedTotal++;
          }
        }
        if (
          moment(lead['updatedAt']).isBetween(fromDate, toDate) &&
          lead.values['Lead State'] === 'Converted'
        ) {
          convertedTotal++;
        }
      }
    });

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
        cancellations: 0,
        pendingCancellations: 0,
        frozen: 0,
        pendingFrozen: 0,
      };
    }

    let cancellations = 0;
    let pendingCancellations = 0;
    let frozen = 0;
    let pendingFrozen = 0;
    members.forEach(member => {
      var history =
        member.values['Status History'] !== undefined
          ? getJson(member.values['Status History'])
          : {};

      if (history.length > 0) {
        if (
          moment(new Date(history[history.length - 1]['date'])).isBetween(
            fromDate,
            toDate,
          )
        ) {
          if (history[history.length - 1]['status'] === 'Inactive') {
            cancellations++;
          }
          if (
            history[history.length - 1]['status'] === 'Pending Cancellation'
          ) {
            pendingCancellations++;
          }
          if (
            history[history.length - 1]['status'] === 'Frozen' ||
            history[history.length - 1]['status'] === 'Suspended'
          ) {
            frozen++;
          }
          if (
            history[history.length - 1]['status'] === 'Pending Freeze' ||
            history[history.length - 1]['status'] === 'Pending Suspension'
          ) {
            pendingFrozen++;
          }
        }
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
          this.state.fromDate,
          this.state.toDate,
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
      let data = this.getData(this.state.leads, fromDate, toDate);
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
      let data = this.getData(this.state.leads, fromDate, toDate);
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
      let data = this.getData(this.state.leads, fromDate, toDate);
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
      let data = this.getData(this.state.leads, fromDate, toDate);
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
          <div className="statItems">
            <div className="statItem">
              <div className="info">
                <div className="label">Leads</div>
                <div className="value">{this.state.leadData.leadsTotal}</div>
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
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Intro Scheduled</div>
                <div className="value">{this.state.leadData.introsTotal}</div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.introsTotal /
                        this.state.leadData.leadsTotal <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal !== 0
                          ? (
                              (this.state.leadData.introsTotal /
                                this.state.leadData.leadsTotal) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  ></div>
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal !== 0
                    ? (
                        (this.state.leadData.introsTotal /
                          this.state.leadData.leadsTotal) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Actual Intros</div>
                <div className="value">{this.state.leadData.attendedTotal}</div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.attendedTotal /
                        this.state.leadData.leadsTotal <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal !== 0
                          ? (
                              (this.state.leadData.attendedTotal /
                                this.state.leadData.leadsTotal) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  ></div>
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal !== 0
                    ? (
                        (this.state.leadData.attendedTotal /
                          this.state.leadData.leadsTotal) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">New Students</div>
                <div className="value">
                  {this.state.leadData.convertedTotal}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.convertedTotal /
                        this.state.leadData.leadsTotal <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal !== 0
                          ? (
                              (this.state.leadData.convertedTotal /
                                this.state.leadData.leadsTotal) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  ></div>
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal !== 0
                    ? (
                        (this.state.leadData.convertedTotal /
                          this.state.leadData.leadsTotal) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="memberStatistics">
          <div className="statItems">
            <div className="statItem">
              <div className="info">
                <div className="label">Cancellations</div>
                <div className="value">
                  {this.state.memberData.cancellations}
                </div>
              </div>
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Pending cancellations</div>
                <div className="value">
                  {this.state.memberData.pendingCancellations}
                </div>
              </div>
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Frozen</div>
                <div className="value">{this.state.memberData.frozen}</div>
              </div>
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Pending frozen</div>
                <div className="value">
                  {this.state.memberData.pendingFrozen}
                </div>
              </div>
            </div>
          </div>
        </div>
      </span>
    );
  }
}

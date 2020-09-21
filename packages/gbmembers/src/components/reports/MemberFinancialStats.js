import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson, memberStatusInDates } from '../Member/MemberUtils';
import $ from 'jquery';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

export class MemberFinancialStats extends Component {
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
    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';

    this.locale = this.props.space.defaultLocale.split('-')[0];

    this._getMemberRowTableColumns = this.getMemberRowTableColumns();

    this.setFromDate = moment().date(1);
    this.setToDate = moment()
      .date(1)
      .add(1, 'months')
      .subtract(1, 'days')
      .hour(23)
      .minute(59);

    let fromDate = this.setFromDate;
    let toDate = this.setToDate;

    let memberData = this.getMemberData(this.props.members, fromDate, toDate);
    this.state = {
      allMembers: this.props.members,
      memberData,
      fromDate,
      toDate,
      showActiveMembers: false,
      showAccountHolders: false,
      showCancellationsMembers: false,
      showPendingCancellationsMembers: false,
      showFrozenMembers: false,
      showPendingFrozenMembers: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    let memberData = this.getMemberData(
      nextProps.members,
      this.state.fromDate,
      this.state.toDate,
    );
    this.setState({
      allMembers: nextProps.members,
      memberData,
    });
  }

  componentWillMount() {}

  getMemberData(members, fromDate, toDate) {
    if (!members || members.length <= 0) {
      return {
        accountHolders: [],
        activeMembers: [],
        cancellations: [],
        pendingCancellations: [],
        frozen: [],
        pendingFrozen: [],
      };
    }

    let accountHolders = [];
    let accountHoldersValue = 0;
    let activeMembers = [];
    let activeMembersValue = 0;
    let cancellations = [];
    let cancellationsValue = 0;
    let pendingCancellations = [];
    let pendingCancellationsValue = 0;
    let frozen = [];
    let frozenValue = 0;
    let pendingFrozen = [];
    let pendingFrozenValue = 0;
    members.forEach(member => {
      let memberStatus = memberStatusInDates(member, fromDate, toDate);

      if (memberStatus === 'Active') {
        activeMembers[activeMembers.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        ) {
          activeMembersValue += parseFloat(
            member.values['Membership Cost'] !== undefined &&
              member.values['Membership Cost'] !== null
              ? member.values['Membership Cost']
              : '0',
          );
          //console.log("Active: "+member.values["First Name"]+" "+member.values["Last Name"]+" - "+member.values['Membership Cost']);
        }
      }
      if (memberStatus === 'Frozen') {
        frozen[frozen.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          frozenValue += parseFloat(
            member.values['Membership Cost'] !== undefined &&
              member.values['Membership Cost'] !== null
              ? member.values['Membership Cost']
              : '0',
          );
      }
      if (memberStatus === 'Pending Freeze') {
        pendingFrozen[pendingFrozen.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          pendingFrozenValue += parseFloat(
            member.values['Membership Cost'] !== undefined &&
              member.values['Membership Cost'] !== null
              ? member.values['Membership Cost']
              : '0',
          );
      }
      if (memberStatus === 'Inactive') {
        cancellations[cancellations.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          cancellationsValue += parseFloat(
            member.values['Membership Cost'] !== undefined &&
              member.values['Membership Cost'] !== null
              ? member.values['Membership Cost']
              : '0',
          );
      }
      if (memberStatus === 'Pending Cancellation') {
        pendingCancellations[pendingCancellations.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          pendingCancellationsValue += parseFloat(
            member.values['Membership Cost'] !== undefined &&
              member.values['Membership Cost'] !== null
              ? member.values['Membership Cost']
              : '0',
          );
      }
      if (
        (memberStatus === 'Active' ||
          memberStatus === 'Pending Freeze' ||
          memberStatus === 'Pending Cancellation') &&
        member.values['Billing User'] === 'YES'
      ) {
        accountHolders[accountHolders.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          accountHoldersValue += parseFloat(
            member.values['Membership Cost'] !== undefined &&
              member.values['Membership Cost'] !== null
              ? member.values['Membership Cost']
              : '0',
          );
      }
    });

    return {
      accountHolders: { members: accountHolders, value: accountHoldersValue },
      activeMembers: { members: activeMembers, value: activeMembersValue },
      cancellations: { members: cancellations, value: cancellationsValue },
      pendingCancellations: {
        members: pendingCancellations,
        value: pendingCancellationsValue,
      },
      frozen: { members: frozen, value: frozenValue },
      pendingFrozen: { members: pendingFrozen, value: pendingFrozenValue },
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
        memberData: this.getMemberData(
          this.state.allMembers,
          this.state.fromDate,
          this.state.toDate,
        ),
      });
    }
  }
  setStatisticDates(e, type) {
    if (type === 'this_month') {
      let fromDate = moment()
        .date(1)
        .hour(0)
        .minute(0);
      let toDate = moment()
        .date(1)
        .add(1, 'months')
        .subtract(1, 'days')
        .hour(23)
        .minute(59);
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
    } else if (type === 'next_month') {
      let fromDate = moment()
        .add(1, 'months')
        .date(1)
        .hour(0)
        .minute(0);
      let toDate = moment()
        .add(2, 'months')
        .date(1)
        .subtract(1, 'days')
        .hour(23)
        .minute(59);
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
    } else if (type === 'last_month') {
      let fromDate = moment()
        .subtract(1, 'months')
        .date(1)
        .hour(0)
        .minute(0);
      let toDate = moment()
        .date(1)
        .subtract(1, 'days')
        .hour(23)
        .minute(59);
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
    } else if (type === 'last_3_months') {
      let fromDate = moment()
        .subtract(3, 'months')
        .date(1)
        .hour(0)
        .minute(0);
      let toDate = moment()
        .subtract(3, 'months')
        .date(1)
        .add(3, 'months')
        .subtract(1, 'days')
        .hour(23)
        .minute(59);
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
    } else if (type === 'year') {
      let fromDate = moment()
        .subtract(1, 'years')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
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
  getMemberTableColumns(row) {
    return [
      {
        accessor: 'members',
        Header: 'Members',
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
    return (
      <span>
        <div className="page-header" style={{ textAlign: 'center' }}>
          <div className="dateSettings">
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => this.setStatisticDates(e, 'year')}
            >
              Last Year
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => this.setStatisticDates(e, 'last_3_months')}
            >
              Last 3 Months
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => this.setStatisticDates(e, 'last_month')}
            >
              Last Month
            </button>
            <button
              type="button"
              active="true"
              className="btn btn-primary report-btn-default"
              onClick={e => this.setStatisticDates(e, 'this_month')}
            >
              This Month
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => this.setStatisticDates(e, 'next_month')}
            >
              Next Month
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
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

        <div className="memberFinanceStatistics">
          <div className="statItems">
            <div className="statItem">
              <div className="info">
                <div className="label">Active Account Holders</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: true,
                      showActiveMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.accountHolders.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.accountHolders.value)}
              </div>
              {this.state.showAccountHolders && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showAccountHolders: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.accountHolders.members,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Active</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showActiveMembers: true,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.activeMembers.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.activeMembers.value)}
              </div>
              {this.state.showActiveMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showActiveMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.activeMembers.members,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Cancellations</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showCancellationsMembers: true,
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.cancellations.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.cancellations.value)}
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
                      this.state.memberData.cancellations.members,
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
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: true,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.pendingCancellations.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.pendingCancellations.value)}
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
                      this.state.memberData.pendingCancellations.members,
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
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: true,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.frozen.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.frozen.value)}
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
                    data={this.getMemberTableData(
                      this.state.memberData.frozen.members,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Pending freezes</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: true,
                    })
                  }
                >
                  {this.state.memberData.pendingFrozen.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.pendingFrozen.value)}
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
                      this.state.memberData.pendingFrozen.members,
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

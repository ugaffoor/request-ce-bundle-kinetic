import React, { Component } from 'react';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';
import ReactToPrint from 'react-to-print';
import printerIcon from '../../images/Print.svg?raw';
import SVGInline from 'react-svg-inline';

export class ResumingMembers extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allMembers, 0);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
      week: '0',
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}

  UNSAFE_componentWillMount() {}

  getData(allMembers, week) {
    if (!allMembers || allMembers.length <= 0) {
      return [];
    }

    var today = moment();
    var endDate;
    switch (week) {
      case 0:
        endDate = moment().endOf('week');
        break;
      default:
        endDate = moment()
          .endOf('week')
          .add(week, 'weeks');
    }
    let members = allMembers
      .filter(member => {
        return (member.values['Status'] === 'Frozen' ||
          member.values['Status'] === 'Pending Freeze') &&
          member.values['Resume Date'] !== undefined &&
          member.values['Resume Date'] !== null &&
          member.values['Resume Date'] !== 'Until Further Notice'
          ? true
          : false;
      })
      .filter(member => {
        var resumeDate = moment(member.values['Resume Date']);
        return resumeDate.isSameOrAfter(today) &&
          resumeDate.isSameOrBefore(endDate)
          ? true
          : false;
      });

    const data = members
      .sort((a, b) => {
        let aDt = moment(a.values['Resume Date']);
        let bDt = moment(b.values['Resume Date']);
        if (aDt.isBefore(bDt)) {
          return -1;
        } else if (aDt.isAfter(bDt)) {
          return 1;
        }
        return 0;
      })
      .map(member => {
        return {
          name: member.values['First Name'] + ' ' + member.values['Last Name'],
          memberID: member.id,
          resumeDate: moment(member.values['Resume Date'], 'YYYY-MM-DD').format(
            'L',
          ),
        };
      });
    return data;
  }

  getColumns(data) {
    const columns = [
      {
        accessor: 'name',
        Header: 'Name',
        width: 300,
        Cell: props => {
          return props.original.memberID === undefined ? (
            <div />
          ) : (
            <NavLink to={`/Member/${props.original.memberID}`} className="">
              {props.original.name}
            </NavLink>
          );
        },
      },
      {
        accessor: 'resumeDate',
        Header: 'Resuming Date',
        width: 200,
      },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Resuming Members</h6>
        </div>
        <div className="weeksOut">
          <label htmlFor="weeks">Weeks</label>
          <select
            name="weeks"
            id="weeks"
            ref={input => (this.input = input)}
            defaultValue={0}
            onChange={e => {
              let data = this.getData(
                this.props.allMembers,
                parseInt(e.target.value),
              );
              this.setState({
                week: e.target.value,
                data: data,
              });
            }}
          >
            <option value="0">This Week</option>
            <option value="1">Next Week</option>
            <option value="2">Next 2 Weeks</option>
            <option value="3">Next 3 Weeks</option>
            <option value="4">Next 4 Weeks</option>
          </select>
          <div className="droparrow" />
        </div>
        <ReactToPrint
          trigger={() => (
            <SVGInline svg={printerIcon} className="icon tablePrint" />
          )}
          content={() => this.tableComponentRef}
        />
        <ReactTable
          ref={el => (this.tableComponentRef = el)}
          columns={columns}
          data={data}
          className="-striped -highlight"
          defaultPageSize={data.length > 0 ? data.length : 2}
          pageSize={data.length > 0 ? data.length : 2}
          showPagination={false}
        />
        <br />
      </span>
    );
  }
}

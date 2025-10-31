import React, { Component } from 'react';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';
import ReactToPrint from 'react-to-print';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';
import { ReactComponent as DownloadIcon } from '../../images/download.svg';
import { CSVLink } from 'react-csv';

export class MemberBirthdays extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allMembers, 1);
    let columns = this.getColumns();

    this.tableComponentRef = React.createRef();

    this.state = {
      data,
      columns,
      week: '1',
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}

  UNSAFE_componentWillMount() {}

  getData(allMembers, week) {
    if (!allMembers || allMembers.length <= 0) {
      return [];
    }
    let year = moment().year();
    let now = moment().subtract(1, 'days');
    let toWeek = moment()
      .add(week, 'weeks')
      .add(1, 'days');
    let members = allMembers
      .filter(member => {
        return member.values['Status'] === 'Active' ||
          member.values['Status'] === 'Casual' ||
          member.values['Status'] === 'Pending Freeze' ||
          member.values['Status'] === 'Pending Cancellation'
          ? true
          : false;
      })
      .filter(member => {
        let dob = moment(member.values['DOB']).year(year);
        if (week === 0) {
          return dob.get('date') === moment().get('date') &&
            dob.month() === moment().month()
            ? true
            : false;
        }
        return dob.isBetween(now, toWeek) ? true : false;
      });
    const data = members
      .sort((a, b) => {
        let aDt = moment(a.values['DOB']).year(year);
        let bDt = moment(b.values['DOB']).year(year);
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
          dob: member.values['DOB'],
          status: member.values['Status'],
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
        accessor: 'dob',
        Header: 'Birthday',
        Cell: props => {
          return moment(props.original.dob).format('Do MMM');
        },
      },
      {
        accessor: 'dob',
        Header: 'Age',
        Cell: props => {
          return moment().year() - moment(props.original.dob).year();
        },
      },
      {
        accessor: 'status',
        Header: 'Status',
      },
    ];
    return columns;
  }

  getDownloadData() {
    let data = this.getData(this.props.allMembers, parseInt(this.state.week));

    let download = [['Name', 'Birthday', 'Age', 'Status']];

    data.forEach(element => {
      let row = [];
      row.push(
        element['name'],
        moment(element['dob']).format('Do MMM'),
        moment().year() - moment(element['dob']).year(),
        element['status'],
      );
      download.push(row);
    });

    return download;
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
          <h6>Member Birthdays</h6>
        </div>
        <div className="daysOut">
          <label htmlFor="days">Days Before</label>
          <select
            name="days"
            id="days"
            defaultValue={1}
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
            <option value="0">Today</option>
            <option value="1">1 Week</option>
            <option value="2">2 Week</option>
            <option value="3">3 Week</option>
            <option value="4">4 Week</option>
          </select>
          <div className="droparrow" />
        </div>
        <ReactToPrint
          trigger={() => <PrinterIcon className="icon icon-svg tablePrint" />}
          content={() => this.tableComponentRef.current}
          onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
        />
        <CSVLink
          className="downloadbtn"
          filename="birthdays.csv"
          data={this.getDownloadData()}
        >
          <DownloadIcon className="icon icon-svg tableDownload" />
        </CSVLink>
        <ReactTable
          ref={this.tableComponentRef}
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

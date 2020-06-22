import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/scss/bootstrap.scss';
import 'react-tabulator/lib/styles.css'; // default theme
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css'; // use Theme(s)
import { ReactTabulator } from 'react-tabulator';
import Select from 'react-select';
import Datetime from 'react-datetime';
import { confirm } from '../helpers/Confirmation';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

var yesterday = Datetime.moment().subtract(1, 'day');
var valid = function(current) {
  return current.isAfter(yesterday);
};

export class ManageBookings extends Component {
  constructor(props) {
    super(props);
    this.getGridData = this.getGridData.bind(this);
    this.classBookings = this.getGridData(this.props.classBookings);
    this.deleteBooking = this.props.deleteBooking.bind(this);
    this.updateBooking = this.props.updateBooking.bind(this);
    this.addBooking = this.props.addBooking.bind(this);
    this.space = this.props.space;

    this.columns = [
      { title: 'Class Date', field: 'classDate', headerFilter: 'input' },
      { title: 'Class Time', field: 'classTime', headerFilter: 'input' },
      { title: 'Program', field: 'program', headerFilter: 'input' },
      { title: 'Name', field: 'name', headerFilter: 'input' },
      { title: 'Status', field: 'status', headerFilter: 'input' },
    ];
    this.state = {
      classDate: undefined,
      classTime: undefined,
      program: undefined,
      memberGUID: undefined,
      selectedID: undefined,
      selectedStatus: undefined,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.addedBooking.id !== undefined &&
      (this.state.addedBooking === undefined ||
        this.state.addedBooking.id !== nextProps.addedBooking.id)
    ) {
      this.classBookings.push({
        id: nextProps.addedBooking.id,
        status: nextProps.addedBooking.status,
        program: nextProps.addedBooking.program,
        classDate: moment(nextProps.addedBooking.classDate).format('ll'),
        classTime: moment(
          nextProps.addedBooking.classDate +
            ' ' +
            nextProps.addedBooking.classTime,
        ).format('LT'),
        name: nextProps.addedBooking.name,
        memberGUID: nextProps.addedBooking.memberGUID,
      });
      this.setState({
        addedBooking: nextProps.addedBooking,
      });
    } else if (
      this.state.addedBooking === undefined &&
      nextProps.classBookings.length !== this.classBookings.length
    ) {
      this.classBookings = this.getGridData(nextProps.classBookings);
    }
  }
  componentWillUnmount() {}
  changeStatus(event, id) {
    console.log(('changed to ': event.target.value));
  }
  getAllMembers() {
    let membersVals = [];
    this.props.allMembers.forEach(member => {
      if (member.values['Status'] !== 'Inactive') {
        membersVals.push({
          label: member.values['Last Name'] + ' ' + member.values['First Name'],
          value: member.id,
        });
      }
    });
    return membersVals;
  }
  getGridData(bookings) {
    if (!bookings || bookings.length < 0) {
      return [];
    }
    let bookingsData = [];

    bookings.forEach(booking => {
      bookingsData.push({
        id: booking['id'],
        status: booking.status,
        program: booking.program,
        classDate: moment(booking.classDate).format('ll'),
        classTime: moment(booking.classDate + ' ' + booking.classTime).format(
          'LT',
        ),
        name: booking.memberName,
        memberGUID: booking.memberGUID,
      });
    });

    return bookingsData;
  }
  rowClick = (e, row) => {
    console.log('Row Clicked');
    //row.getTable().deselectRow();
    //row.getTable().selectRow(row.getIndex());
    //$(row.getElement()).attr("row-selected", true);
    this.setState({
      selectedID: row.getData().id,
      selectedStatus: row.getData().status,
      selectedName: row.getData().name,
      selectedClassDate: row.getData().classDate,
      selectedClassTime: row.getData().classTime,
    });
  };
  render() {
    const options = {
      height: 450,
      width: '100%',
      pagination: 'local',
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
      tooltipsHeader: true,
      layout: 'fitColumns',
      selectable: true,
    };
    return (
      <span className="bookingsContent">
        <div className="header">
          <h6>Member Class Bookings</h6>
        </div>
        <div className="table-controls">
          <div className="newBookingSection">
            <span className="line1">
              <div className="sessionDate">
                <label htmlFor="sessionDate">DATE</label>
                <Datetime
                  className=""
                  dateFormat="DD/MM/YYYY"
                  isValidDate={valid}
                  timeConstraints={{
                    minutes: {
                      step: parseInt(
                        getAttributeValue(
                          this.space,
                          'Calendar Time Slots',
                          '15',
                        ),
                      ),
                    },
                  }}
                  onBlur={dt => {
                    if (dt !== '') {
                      this.setState({
                        classDate: dt.format('YYYY-MM-DD'),
                        classTime: dt.format('HH:mm'),
                      });
                    }
                  }}
                />
              </div>
              <div className="class">
                <label htmlFor="programClass">CLASS</label>
                <select
                  name="programClass"
                  id="programClass"
                  onChange={e => {
                    this.setState({
                      program: e.target.value,
                    });
                  }}
                >
                  <option value="" />
                  {this.props.programs
                    .concat(this.props.additionalPrograms)
                    .map(program => (
                      <option key={program.program} value={program.program}>
                        {program.program}
                      </option>
                    ))}
                </select>
                <div className="droparrow" />
              </div>
              <div className="membersSelect">
                <Select
                  closeMenuOnSelect={true}
                  options={this.getAllMembers()}
                  placeholder="Select Member"
                  onChange={e => {
                    let id = e.value;

                    for (let i = 0; i < this.props.allMembers.length; i++) {
                      if (this.props.allMembers[i].id === id) {
                        var member = this.props.allMembers[i];
                        this.setState({
                          memberGUID: member.id,
                          memberID: member.values['Member ID'],
                          memberName:
                            member.values['First Name'] +
                            ' ' +
                            member.values['Last Name'],
                        });
                        break;
                      }
                    }
                  }}
                  style={{ width: '300px' }}
                />
              </div>
              <button
                type="button"
                id="addClassBooking"
                disabled={
                  this.state.classDate === undefined ||
                  this.state.classTime === undefined ||
                  this.state.program === undefined ||
                  this.state.memberGUID === undefined
                }
                className="btn btn-primary btn-block"
                onClick={e => {
                  let id = this.state.memberGUID;
                  let bookingExists = false;
                  let userAccountExists = true;
                  var existingBooking;

                  $('.noUserAccount').addClass('hide');
                  $('.bookingAlreadyExists').addClass('hide');
                  for (let i = 0; i < this.classBookings.length; i++) {
                    var booking = this.classBookings[i];
                    if (
                      booking.memberGUID === id &&
                      booking.status === 'Booked'
                    ) {
                      bookingExists = true;
                      existingBooking = booking;
                      break;
                    }
                  }

                  for (let i = 0; i < this.props.allMembers.length; i++) {
                    if (this.props.allMembers[i].id === id) {
                      var member = this.props.allMembers[i];
                      if (member.user === undefined) {
                        userAccountExists = false;
                        break;
                      }
                    }
                  }
                  if (!userAccountExists) {
                    $('.noUserAccount').removeClass('hide');
                  }
                  if (bookingExists) {
                    $('.bookingAlreadyExists').removeClass('hide');
                  } else {
                    // Add Class Booking
                    let values = {};
                    values['Status'] = 'Booked';
                    values['Program'] = this.state.program;
                    values['Class Date'] = this.state.classDate;
                    values['Class Time'] = this.state.classTime;
                    values['Member ID'] = this.state.memberID;
                    values['Member GUID'] = this.state.memberGUID;
                    values['Member Name'] = this.state.memberName;

                    this.props.addBooking({
                      values,
                    });
                  }
                }}
              >
                Add Booking
              </button>
            </span>
            <div className="line2">
              <span className="noUserAccount hide">
                Please not this Member will not receive emails, since and User
                Account has not been created.
              </span>
              <span className="bookingAlreadyExists hide">
                A booking for this Member has already been made.
              </span>
            </div>
          </div>
        </div>
        <div className="tableSection">
          <div className="row tableData">
            <ReactTabulator
              columns={this.columns}
              data={this.classBookings}
              options={options}
              ref={ref => (this.classBookingGridref = ref)}
              rowClick={this.rowClick}
              layout="fitColumns"
              initialSort={[
                { column: 'classDate', dir: 'asc' }, //sort by this first
              ]}
            />
          </div>
          <div className="actionSection">
            <div className="selectedBooking">
              <p>Selected Booking</p>
              <table>
                <tbody>
                  <tr>
                    <td>Name:</td>
                    <td>{this.state.selectedName}</td>
                  </tr>
                  <tr>
                    <td>State:</td>
                    <td>{this.state.selectedStatus}</td>
                  </tr>
                  <tr>
                    <td>Class Date:</td>
                    <td>{this.state.selectedClassDate}</td>
                  </tr>
                  <tr>
                    <td>Class Time:</td>
                    <td>{this.state.selectedClassTime}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              type="button"
              id="cancelBooking"
              className="btn btn-primary"
              disabled={!(this.state.selectedStatus === 'Booked')}
              onClick={async e => {
                if (
                  await confirm(
                    'Are your sure you want to CANCEL this booking?',
                  )
                ) {
                  let values = {};
                  values['Status'] = 'Cancelled';
                  this.updateBooking({
                    id: this.state.selectedID,
                    values: values,
                  });
                  var idx = this.classBookings.findIndex(
                    element => element.id === this.state.selectedID,
                  );
                  this.classBookings[idx].status = 'Cancelled';
                  this.setState({
                    selectedStatus: 'Cancelled',
                  });
                } else {
                }
              }}
            >
              Cancel Booking
            </button>
            <button
              type="button"
              id="deleteBooking"
              className="btn btn-primary"
              disabled={!(this.state.selectedID !== undefined)}
              onClick={async e => {
                if (
                  await confirm(
                    'Are your sure you want to DELETE this booking?',
                  )
                ) {
                  this.deleteBooking({
                    id: this.state.selectedID,
                  });
                  var idx = this.classBookings.findIndex(
                    element => element.id === this.state.selectedID,
                  );
                  this.classBookings.splice(idx, 1);
                  this.setState({
                    selectedID: undefined,
                    selectedStatus: undefined,
                    selectedName: undefined,
                    selectedClassDate: undefined,
                    selectedClassTime: undefined,
                  });
                } else {
                }
              }}
            >
              Delete Booking
            </button>
          </div>
        </div>
      </span>
    );
  }
}

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/scss/bootstrap.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import Select from 'react-select';
import Datetime from 'react-datetime';
import { confirm } from '../helpers/Confirmation';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { KappNavLink as NavLink } from 'common';

var yesterday = Datetime.moment().subtract(1, 'day');

export class ManageBookings extends Component {
  constructor(props) {
    super(props);
    this.getGridData = this.getGridData.bind(this);
    this.rawClassBookings = this.props.classBookings;
    this.classSchedules = this.props.classSchedules;
    this.classBookings = this.getGridData(
      this.rawClassBookings,
      this.classSchedules,
    );
    this.deleteBooking = this.props.deleteBooking.bind(this);
    this.updateBooking = this.props.updateBooking.bind(this);
    this.addBooking = this.props.addBooking.bind(this);
    this.renderStatusCell = this.renderStatusCell.bind(this);
    this.valid = this.valid.bind(this);
    this.classInfo = this.classInfo.bind(this);
    this.space = this.props.space;
    this.columns = [
      { Header: 'Class Date', accessor: 'classDate', width: 150 },
      { Header: 'Class Time', accessor: 'classTime' },
      {
        Header: 'Program',
        accessor: 'program',
        width: 400,
        Cell: props => {
          return (
            <span>
              {props.original['program']}-{props.original['title']}
            </span>
          );
        },
      },
    ];
    this.bookingColumns = [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: this.renderNameCell,
        Footer: info => {
          return (
            <span>
              <strong>Total: {info.data.length}</strong>
            </span>
          );
        },
      },
      { Header: 'Status', accessor: 'status', Cell: this.renderStatusCell },
    ];
    this.state = {
      classDate: undefined,
      classTime: undefined,
      program: undefined,
      memberGUID: undefined,
      selectedID: undefined,
      selectedStatus: undefined,
      expandedRows: [],
      expandSubRows: undefined,
      allowedPrograms: '',
      filterMemberGUID: undefined,
    };
  }
  valid(current) {
    if (current.isBefore(yesterday)) return false;
    var idx = this.classSchedules.findIndex(
      element => moment(element.start).day() === moment(current).day(),
    );
    return idx === -1 ? false : true;
  }
  getProgramBackgroundColor(program) {
    if (program === 'GB1') {
      return '#4472c4';
    } else if (program === 'GB2') {
      return '#7030a0';
    } else if (program === 'GB3') {
      return 'black';
    } else if (program === 'Tiny Champions') {
      return '#bdd7ee';
    } else if (program === 'Little Champions 1') {
      return '#ffc001';
    } else if (program === 'Little Champions 2') {
      return '#ed7d32';
    } else if (program === 'Juniors') {
      return '#a9d18d';
    } else if (program === 'Teens') {
      return '#70ad46';
    } else if (program === 'Advanced Kids') {
      return '#48d1cc';
    } else {
      return 'black';
    }
  }
  getClassBackgroundColor(classInfo, classSchedules) {
    var schedule = classSchedules.find(schedule => {
      return (
        schedule.program === classInfo.program &&
        moment(schedule.start).day() ===
          moment(classInfo.classDate, 'ddd Do MMM').day() &&
        moment(schedule.start).format('LT') === classInfo.classTime
      );
    });
    return schedule !== undefined &&
      schedule.colour !== undefined &&
      schedule.colour !== null
      ? schedule.colour
      : this.getProgramBackgroundColor(classInfo.program);
  }
  getClassColor(classInfo, classSchedules) {
    var schedule = classSchedules.find(
      schedule =>
        schedule.program === classInfo.program &&
        moment(schedule.start).day() ===
          moment(classInfo.classDate, 'ddd Do MMM').day() &&
        moment(schedule.start).format('LT') === classInfo.classTime,
    );
    return schedule !== undefined &&
      schedule.textColour !== undefined &&
      schedule.textColour !== null
      ? schedule.textColour
      : 'white';
  }
  classInfo(state, rowInfo, column) {
    if (rowInfo === undefined) {
      return {};
    }
    return {
      style: {
        background: this.getClassBackgroundColor(
          rowInfo.original,
          this.classSchedules,
        ),
        color: this.getClassColor(rowInfo.original, this.classSchedules),
      },
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      nextProps.addedBooking.id !== undefined &&
      (this.state.addedBooking === undefined ||
        this.state.addedBooking.id !== nextProps.addedBooking.id)
    ) {
      this.rawClassBookings = this.rawClassBookings.push(
        nextProps.addedBooking,
      );
      this.classBookings = this.getGridData(
        this.rawClassBookings,
        this.classSchedules,
      );

      var idx = this.classBookings.findIndex(element => {
        if (
          element.sortVal + '-' + element.program ===
          nextProps.addedBooking.classDate +
            '-' +
            nextProps.addedBooking.classTime +
            '-' +
            nextProps.addedBooking.program
        )
          return true;
        return false;
      });
      if (this.state.expandedRows[idx] === undefined) {
        var rows = this.state.expandedRows;
        rows[idx] = true;
        this.setState({
          expandedRows: rows,
        });
      } else {
        var rows = this.state.expandedRows;
        rows[idx] = true;
        this.setState({
          expandedRows: rows,
        });
      }
      this.setState({
        addedBooking: nextProps.addedBooking,
      });
    } else if (
      this.state.addedBooking === undefined &&
      nextProps.classBookings.length !== this.classBookings.length
    ) {
      this.rawClassBookings = nextProps.classBookings;
      this.classBookings = this.getGridData(
        this.rawClassBookings,
        this.classSchedules,
      );
    }
  }
  componentWillUnmount() {}
  changeStatus(event, id) {
    console.log(('changed to ': event.target.value));
  }
  getProgramMembers() {
    let membersVals = [];
    this.props.allMembers.forEach(member => {
      if (
        member.values['Status'] !== 'Inactive' &&
        (this.state.allowedPrograms === undefined ||
          this.state.allowedPrograms === null ||
          this.state.allowedPrograms === '[]' ||
          this.state.allowedPrograms === '' ||
          (this.state.allowedPrograms !== undefined &&
            this.state.allowedPrograms.includes(
              member.values['Ranking Program'],
            )))
      ) {
        membersVals.push({
          label: member.values['Last Name'] + ' ' + member.values['First Name'],
          value: member.id,
        });
      }
    });
    return membersVals;
  }
  getAllMembers() {
    let membersVals = [];
    membersVals[0] = {
      label: 'CLEAR',
      value: 'CLEAR',
    };
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

  addClassBooking(bookingsDataMap, booking) {
    var key =
      booking.classDate + '-' + booking.classTime + '-' + booking.program;
    var bookingsArray = [];
    if (bookingsDataMap.get(key) === undefined) {
      bookingsArray[0] = {
        id: booking['id'],
        status: booking.status,
        program: booking.program,
        title: booking.title,
        classDate: moment(booking.classDate).format('ddd Do MMM'),
        classTime: moment(booking.classDate + ' ' + booking.classTime).format(
          'LT',
        ),
        name: booking.memberName,
        memberGUID: booking.memberGUID,
      };
      bookingsDataMap.set(key, {
        sortVal: booking.classDate + '-' + booking.classTime,
        program: booking.program,
        classDate: moment(booking.classDate).format('ddd Do MMM'),
        classTime: moment(booking.classDate + ' ' + booking.classTime).format(
          'LT',
        ),
        bookings: bookingsArray,
      });
    } else {
      bookingsArray = bookingsDataMap.get(key).bookings;
      bookingsArray[bookingsArray.length] = {
        id: booking['id'],
        status: booking.status,
        program: booking.program,
        classDate: moment(booking.classDate).format('ddd Do MMM'),
        classTime: moment(booking.classDate + ' ' + booking.classTime).format(
          'LT',
        ),
        name: booking.memberName,
        memberGUID: booking.memberGUID,
      };
      bookingsDataMap.set(key, {
        sortVal: booking.classDate + '-' + booking.classTime,
        program: booking.program,
        classDate: moment(booking.classDate).format('ddd Do MMM'),
        classTime: moment(booking.classDate + ' ' + booking.classTime).format(
          'LT',
        ),
        bookings: bookingsArray,
      });
    }
  }
  getGridData(bookings, classSchedules, memberGUID) {
    if (!bookings || bookings.length < 0) {
      return [];
    }

    let bookingsDataMap = new Map();
    bookings.forEach(booking => {
      if (memberGUID !== undefined && booking.memberGUID === memberGUID) {
        this.addClassBooking(bookingsDataMap, booking);
      } else if (
        memberGUID === undefined ||
        (memberGUID !== undefined && memberGUID === '')
      ) {
        this.addClassBooking(bookingsDataMap, booking);
      }
    });
    let bookingsData = [];
    bookingsDataMap.forEach((value, key, map) => {
      let classSchedule = classSchedules.find(schedule => {
        return (
          moment(schedule.start).day() ===
            moment(value.classDate, 'ddd Do MMM').day() &&
          moment(schedule.start).format('LT') === value.classTime &&
          schedule.program === value.program
        );
      });
      bookingsData.push({
        sortVal: value.sortVal,
        program: value.program,
        title: classSchedule !== undefined ? classSchedule.title : undefined,
        classDate: value.classDate,
        classTime: value.classTime,
        bookings: value.bookings,
      });
    });
    bookingsData = bookingsData.sort(function(a, b) {
      return a['sortVal'] > b['sortVal']
        ? 1
        : b['sortVal'] > a['sortVal']
        ? -1
        : 0;
    });

    return bookingsData;
  }
  renderNameCell(cellInfo) {
    return (
      <NavLink
        to={`/Member/${cellInfo.original.memberGUID}`}
        className="nameValue"
      >
        {cellInfo.original.name}
      </NavLink>
    );
  }
  renderStatusCell(cellInfo) {
    return (
      <span className="statusCell">
        <p className="statusValue">{cellInfo.original.status}</p>
        {cellInfo.original.status === 'Booked' && (
          <button
            type="button"
            id="cancelBooking"
            className="btn btn-primary"
            onClick={async e => {
              var cancelButton = $(e.target);
              if (
                await confirm(
                  <span>
                    <span>Are your sure you want to CANCEL this booking?</span>
                    <table>
                      <tbody>
                        <tr>
                          <td>Member:</td>
                          <td>{cellInfo.original.name}</td>
                        </tr>
                        <tr>
                          <td>Date:</td>
                          <td>{cellInfo.original.classDate}</td>
                        </tr>
                        <tr>
                          <td>Time:</td>
                          <td>{cellInfo.original.classTime}</td>
                        </tr>
                        <tr>
                          <td>Program:</td>
                          <td>{cellInfo.original.program}</td>
                        </tr>
                      </tbody>
                    </table>
                  </span>,
                )
              ) {
                cancelButton.prop('disabled', true);
                cancelButton.html('Cancelling Booking');
                let values = {};
                values['Status'] = 'Cancelled';
                this.updateBooking({
                  id: cellInfo.original.id,
                  values: values,
                });
                var bookingThis = this;
                setTimeout(function() {
                  for (var i = 0; i < bookingThis.classBookings.length; i++) {
                    var idx = bookingThis.classBookings[i].bookings.findIndex(
                      element => {
                        if (element.id === cellInfo.original.id) return true;
                        return false;
                      },
                    );
                    if (idx !== -1) {
                      bookingThis.classBookings[i].bookings[idx].status =
                        'Cancelled';
                      bookingThis.setState({
                        selectedID: cellInfo.original.id,
                      });
                      break;
                    }
                  }
                }, 5000);
              } else {
                $(e.target).prop('disabled', false);
              }
            }}
          >
            Cancel Booking
          </button>
        )}
        {cellInfo.original.status === 'Cancelled' && (
          <button
            type="button"
            id="deleteBooking"
            className="btn btn-primary"
            onClick={async e => {
              if (
                await confirm(
                  <span>
                    <span>Are your sure you want to DELETE this booking?</span>
                    <table>
                      <tbody>
                        <tr>
                          <td>Member:</td>
                          <td>{cellInfo.original.name}</td>
                        </tr>
                        <tr>
                          <td>Date:</td>
                          <td>{cellInfo.original.classDate}</td>
                        </tr>
                        <tr>
                          <td>Time:</td>
                          <td>{cellInfo.original.classTime}</td>
                        </tr>
                        <tr>
                          <td>Program:</td>
                          <td>{cellInfo.original.program}</td>
                        </tr>
                      </tbody>
                    </table>
                  </span>,
                )
              ) {
                this.deleteBooking({
                  id: cellInfo.original.id,
                });
                for (var i = 0; i < this.classBookings.length; i++) {
                  var idx = this.classBookings[i].bookings.findIndex(
                    element => {
                      if (element.id === cellInfo.original.id) return true;
                      return false;
                    },
                  );
                  if (idx !== -1) {
                    this.classBookings[i].bookings = this.classBookings[
                      i
                    ].bookings.filter(element => {
                      if (element.id === cellInfo.original.id) return false;
                      return true;
                    });
                    this.rawClassBookings = this.rawClassBookings.filter(
                      element => {
                        if (element.id === cellInfo.original.id) return false;
                        return true;
                      },
                    );
                    this.setState({
                      selectedID: cellInfo.original.id,
                    });
                    break;
                  }
                }
              } else {
              }
            }}
          >
            Delete Booking
          </button>
        )}
      </span>
    );
  }
  render() {
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
                  isValidDate={this.valid}
                  timeFormat={false}
                  onBlur={dt => {
                    if (dt !== '') {
                      this.setState({
                        classDate: dt.format('YYYY-MM-DD'),
                      });
                    }
                  }}
                />
              </div>
              <div className="time">
                <label htmlFor="classTime">TIME</label>
                <select
                  name="classTime"
                  id="classTime"
                  onChange={e => {
                    this.setState({
                      classTime: e.target.value,
                    });
                  }}
                >
                  <option value="" />
                  {[
                    ...new Set(
                      Array.from(
                        this.classSchedules.filter(
                          schedule =>
                            moment(schedule.start).day() ===
                            moment(this.state.classDate).day(),
                        ),
                        schedule => moment(schedule.start).format('HH:mm'),
                      ),
                    ),
                  ]
                    .sort(function(a, b) {
                      return a > b ? 1 : b > a ? -1 : 0;
                    })
                    .map(time => (
                      <option key={time} value={time}>
                        {moment()
                          .hour(time.split(':')[0])
                          .minute(time.split(':')[1])
                          .format('LT')}
                      </option>
                    ))}
                </select>
                <div className="droparrow" />
              </div>
              <div className="class">
                <label htmlFor="programClass">CLASS</label>
                <select
                  name="programClass"
                  id="programClass"
                  onChange={e => {
                    var schedule = this.classSchedules.filter(schedule => {
                      return (
                        moment(schedule.start).day() ===
                          moment(this.state.classDate).day() &&
                        moment(schedule.start).format('HH:mm') ===
                          this.state.classTime &&
                        ((schedule.allowedPrograms !== undefined &&
                          schedule.allowedPrograms !== null &&
                          schedule.allowedPrograms.includes(e.target.value)) ||
                          schedule.program === e.target.value)
                      );
                    });
                    this.setState({
                      program: e.target.value,
                      allowedPrograms:
                        schedule.size !== 0
                          ? schedule.get(0).allowedPrograms
                          : '',
                      maxStudents: schedule.get(0).maxStudents,
                    });
                  }}
                >
                  <option value="" />
                  {[
                    ...new Set(
                      Array.from(
                        this.classSchedules.filter(
                          schedule =>
                            moment(schedule.start).day() ===
                              moment(this.state.classDate).day() &&
                            moment(schedule.start).format('HH:mm') ===
                              this.state.classTime,
                        ),
                        schedule => schedule.program + '::' + schedule.title,
                      ),
                    ),
                  ].map(program => (
                    <option
                      key={program.split('::')[0]}
                      value={program.split('::')[0]}
                    >
                      {program.split('::')[0] + ' - ' + program.split('::')[1]}
                    </option>
                  ))}
                </select>
                <div className="droparrow" />
              </div>
              <div className="membersSelect">
                <Select
                  closeMenuOnSelect={true}
                  options={this.getProgramMembers()}
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
                          maxWeeklyClasses: member.values['Max Weekly Classes'],
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
                  let maxWeeklyClassesBooked = false;
                  let maxClassCountReached = false;
                  var existingBooking;

                  $('.noUserAccount').addClass('hide');
                  $('.bookingAlreadyExists').addClass('hide');
                  $('.maxWeeklyClasses').addClass('hide');
                  $('.classMaxReached').addClass('hide');

                  var currentClassBookings = this.classBookings.filter(
                    booking =>
                      booking.sortVal ===
                      this.state.classDate + '-' + this.state.classTime,
                  );
                  var bookedStudents =
                    currentClassBookings.length > 0
                      ? currentClassBookings[0].bookings.filter(
                          booking => booking.status === 'Booked',
                        )
                      : [];
                  if (
                    this.state.maxStudents !== undefined &&
                    this.state.maxStudents !== '' &&
                    bookedStudents.length >= parseInt(this.state.maxStudents)
                  ) {
                    maxClassCountReached = true;
                  }
                  if (!maxClassCountReached) {
                    for (let i = 0; i < this.classBookings.length; i++) {
                      var bookingGroup = this.classBookings[i];
                      var bookings = bookingGroup.bookings;
                      for (let k = 0; k < bookings.length; k++) {
                        if (
                          bookings[k].memberGUID === id &&
                          bookings[k].status === 'Booked' &&
                          bookings[k].classDate ===
                            moment(this.state.classDate).format('ddd Do MMM') &&
                          bookings[k].classTime ===
                            moment(this.state.classTime, 'HH:mm').format('LT')
                        ) {
                          bookingExists = true;
                          existingBooking = bookings[k];
                          break;
                        }
                      }
                      if (bookingExists) break;
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

                    if (
                      !bookingExists &&
                      this.state.maxWeeklyClasses !== undefined &&
                      this.state.maxWeeklyClasses !== ''
                    ) {
                      var max = parseInt(this.state.maxWeeklyClasses);
                      var thisWeek = moment(
                        this.state.classDate,
                        'YYYY-MM-DD',
                      ).week();
                      var weekBookings = this.rawClassBookings.filter(
                        booking => {
                          return (
                            thisWeek === moment(booking.classDate).week() &&
                            booking.status === 'Booked' &&
                            booking.memberID === this.state.memberID
                          );
                        },
                      );
                      if (weekBookings.size >= max) {
                        maxWeeklyClassesBooked = true;
                        this.setState({
                          maxWeekStart: moment(
                            this.state.classDate,
                            'YYYY-MM-DD',
                          ).weekday(0),
                          maxWeekEnd: moment(
                            this.state.classDate,
                            'YYYY-MM-DD',
                          ).weekday(6),
                        });
                      }
                      console.log('weekBookings:' + weekBookings.length);
                    }
                  }
                  if (maxClassCountReached) {
                    $('.classMaxReached').removeClass('hide');
                  } else if (bookingExists) {
                    $('.bookingAlreadyExists').removeClass('hide');
                  } else if (maxWeeklyClassesBooked) {
                    $('.maxWeeklyClasses').removeClass('hide');
                  } else {
                    if (!userAccountExists) {
                      $('.noUserAccount').removeClass('hide');
                    }
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
                A booking for this Member at Date[
                {moment(this.state.classDate).format('ddd Do MMM')}] and Time[
                {moment(this.state.classTime, 'HH:mm').format('LT')}] has
                already been made.
              </span>
              <span className="maxWeeklyClasses hide">
                This member has reached their Weekly booking count of{' '}
                {this.state.maxWeeklyClasses} for week [
                {moment(this.state.maxWeekStart).format('ddd Do MMM')} and
                {moment(this.state.maxWeekEnd).format('ddd Do MMM')}].
              </span>
              <span className="classMaxReached hide">
                The Max Student count has been reached at{' '}
                <b>{this.state.maxStudents}</b> for Class {this.state.program}{' '}
                at {moment(this.state.classTime, 'HH:mm').format('LT')}
              </span>
            </div>
            <div className="line3">
              <label htmlFor="filterMembers">FILTER BY</label>
              <div className="membersFilterSelect">
                <Select
                  name="filterMembers"
                  closeMenuOnSelect={true}
                  options={this.getAllMembers()}
                  placeholder="Select Member"
                  onChange={e => {
                    this.classBookings = this.getGridData(
                      this.rawClassBookings,
                      this.classSchedules,
                      e.value === 'CLEAR' ? undefined : e.value,
                    );
                    var rows = [];
                    if (e.value !== 'CLEAR') {
                      for (var i = 0; i < this.classBookings.length; i++) {
                        rows[i] = true;
                      }
                    }
                    this.setState({
                      filterMemberGUID: e.value,
                      expandedRows: rows,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="tableSection">
          <div className="row tableData">
            <ReactTable
              columns={this.columns}
              data={this.classBookings}
              defaultPageSize={
                this.classBookings.length > 0 ? this.classBookings.length : 2
              }
              pageSize={
                this.classBookings.length > 0 ? this.classBookings.length : 2
              }
              showPagination={false}
              expanded={this.state.expandedRows}
              getTrProps={this.classInfo}
              onExpandedChange={(newExpanded, index) => {
                this.setState(oldState => {
                  const itemIndex = index[0];
                  const isExpanded = oldState.expandedRows[itemIndex];
                  const expandedList = [...this.state.expandedRows];
                  expandedList[itemIndex] = !isExpanded;
                  return {
                    expandedRows: expandedList,
                  };
                });
              }}
              ref={ref => (this.classBookingGridref = ref)}
              SubComponent={row => {
                return (
                  <ReactTable
                    data={row.original.bookings}
                    columns={this.bookingColumns}
                    TheadComponent={() => null}
                    defaultPageSize={
                      row.original.bookings.length > 0
                        ? row.original.bookings.length
                        : 2
                    }
                    pageSize={
                      row.original.bookings.length > 0
                        ? row.original.bookings.length
                        : 2
                    }
                    showPagination={false}
                  />
                );
              }}
            />
          </div>
        </div>
      </span>
    );
  }
}

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

export class RecurringBookings extends Component {
  constructor(props) {
    super(props);
    this.getGridData = this.getGridData.bind(this);
    this.rawRecurringBookings = this.props.recurringBookings;
    this.classSchedules = this.props.classSchedules;
    this.recurringBookings = this.getGridData(
      this.rawRecurringBookings,
      this.classSchedules,
    );
    this.updateRecurring = this.props.updateRecurring.bind(this);
    this.addRecurring = this.props.addRecurring.bind(this);
    this.renderStatusCell = this.renderStatusCell.bind(this);
    this.valid = this.valid.bind(this);
    this.classInfo = this.classInfo.bind(this);
    this.getDayInt = this.getDayInt.bind(this);
    this.space = this.props.space;
    this.columns = [
      { Header: 'Class Day', accessor: 'classDay', width: 150 },
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
      classDay: undefined,
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
  getWeekday(day) {
    if (day === 1) return 'Monday';
    else if (day === 2) return 'Tuesday';
    else if (day === 3) return 'Wednesday';
    else if (day === 4) return 'Thursday';
    else if (day === 5) return 'Friday';
    else if (day === 6) return 'Saturday';
    else if (day === 7 || day === 0) return 'Sunday';

    return '';
  }
  getDayInt(day) {
    return day === 7 ? 0 : day;
  }

  getClassBackgroundColor(classInfo, classSchedules) {
    var schedule = classSchedules.find(schedule => {
      return (
        schedule.program === classInfo.program &&
        moment(schedule.start).day() === classInfo.classDayInt &&
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
        moment(schedule.start).day() === classInfo.classDayInt &&
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
      nextProps.addedRecurring.id !== undefined &&
      (this.state.addedRecurring === undefined ||
        this.state.addedRecurring.id !== nextProps.addedRecurring.id)
    ) {
      this.rawRecurringBookings = this.rawRecurringBookings.push(
        nextProps.addedRecurring,
      );
      this.recurringBookings = this.getGridData(
        this.rawRecurringBookings,
        this.classSchedules,
      );

      var idx = this.recurringBookings.findIndex(element => {
        if (
          element.sortVal + '-' + element.program ===
          nextProps.addedRecurring.classDay +
            '-' +
            nextProps.addedRecurring.classTime +
            '-' +
            nextProps.addedRecurring.program
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
        addedRecurring: nextProps.addedRecurring,
      });
    } else if (
      this.state.addedRecurring === undefined &&
      nextProps.recurringBookings.length !== this.recurringBookings.length
    ) {
      this.rawRecurringBookings = nextProps.recurringBookings;
      this.recurringBookings = this.getGridData(
        this.rawRecurringBookings,
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

  addRecurringBooking(bookingsDataMap, booking) {
    var key =
      booking.classDay +
      '-' +
      booking.classTime +
      '-' +
      booking.program +
      '-' +
      booking.title;
    var bookingsArray = [];
    if (bookingsDataMap.get(key) === undefined) {
      bookingsArray[0] = {
        id: booking['id'],
        status: 'Active',
        program: booking.program,
        title: booking.title,
        classDay: booking.classDay,
        classTime: moment(
          moment().format('YYYY-MM-DD') + ' ' + booking.classTime,
        ).format('LT'),
        name: booking.memberName,
        memberGUID: booking.memberGUID,
      };
      bookingsDataMap.set(key, {
        sortVal: booking.classDay + '-' + booking.classTime,
        program: booking.program,
        title: booking.title,
        classDay: booking.classDay,
        classTime: moment(
          moment().format('YYYY-MM-DD') + ' ' + booking.classTime,
        ).format('LT'),
        bookings: bookingsArray,
      });
    } else {
      bookingsArray = bookingsDataMap.get(key).bookings;
      bookingsArray[bookingsArray.length] = {
        id: booking['id'],
        status: booking.status,
        program: booking.program,
        title: booking.title,
        classDay: booking.classDay,
        classTime: moment(
          moment().format('YYYY-MM-DD') + ' ' + booking.classTime,
        ).format('LT'),
        name: booking.memberName,
        memberGUID: booking.memberGUID,
      };
      bookingsDataMap.set(key, {
        sortVal: booking.classDay + '-' + booking.classTime,
        program: booking.program,
        title: booking.title,
        classDay: booking.classDay,
        classTime: moment(
          moment().format('YYYY-MM-DD') + ' ' + booking.classTime,
        ).format('LT'),
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
        this.addRecurringBooking(bookingsDataMap, booking);
      } else if (
        memberGUID === undefined ||
        (memberGUID !== undefined && memberGUID === '')
      ) {
        this.addRecurringBooking(bookingsDataMap, booking);
      }
    });
    let bookingsData = [];
    bookingsDataMap.forEach((value, key, map) => {
      bookingsData.push({
        sortVal: value.sortVal,
        program: value.program,
        title: value.title,
        classDayInt: this.getDayInt(parseInt(value.classDay)),
        classDay: this.getWeekday(parseInt(value.classDay)),
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
        {cellInfo.original.status === 'Active' && (
          <button
            type="button"
            id="deleteRecurring"
            className="btn btn-primary"
            onClick={async e => {
              if (
                await confirm(
                  <span>
                    <span>
                      Are your sure you want to DELETE this Recurring booking?
                    </span>
                    <table>
                      <tbody>
                        <tr>
                          <td>Member:</td>
                          <td>{cellInfo.original.name}</td>
                        </tr>
                        <tr>
                          <td>Day:</td>
                          <td>{this.getWeekday(cellInfo.original.classDay)}</td>
                        </tr>
                        <tr>
                          <td>Time:</td>
                          <td>{cellInfo.original.classTime}</td>
                        </tr>
                        <tr>
                          <td>Program:</td>
                          <td>{cellInfo.original.program}</td>
                        </tr>
                        <tr>
                          <td>Title:</td>
                          <td>{cellInfo.original.title}</td>
                        </tr>
                      </tbody>
                    </table>
                  </span>,
                )
              ) {
                this.props.deleteRecurring({
                  id: cellInfo.original.id,
                  recurringBookings: this.rawRecurringBookings,
                });
                for (var i = 0; i < this.recurringBookings.length; i++) {
                  var idx = this.recurringBookings[i].bookings.findIndex(
                    element => {
                      if (element.id === cellInfo.original.id) return true;
                      return false;
                    },
                  );
                  if (idx !== -1) {
                    this.recurringBookings[i].bookings = this.recurringBookings[
                      i
                    ].bookings.filter(element => {
                      if (element.id === cellInfo.original.id) return false;
                      return true;
                    });

                    this.rawRecurringBookings = this.rawRecurringBookings.filter(
                      element => {
                        if (element.id === cellInfo.original.id) return false;
                        return true;
                      },
                    );
                    this.setState({
                      selectedID: cellInfo.original.id,
                      addedRecurring: {},
                    });
                    break;
                  }
                }
              } else {
              }
            }}
          >
            Delete Recurring
          </button>
        )}
      </span>
    );
  }
  render() {
    return (
      <span className="bookingsContent">
        <div className="header">
          <h6>Member Recurring Bookings</h6>
        </div>
        <div className="table-controls">
          <div className="newBookingSection">
            <span className="line1">
              <div className="day">
                <label htmlFor="classDay">DAY</label>
                <select
                  name="classDay"
                  id="classDay"
                  onChange={e => {
                    this.setState({
                      classDay: e.target.value,
                      classDayInt: this.getDayInt(parseInt(e.target.value)),
                    });
                  }}
                >
                  <option value="" />
                  <option key="1" value="1">
                    Monday
                  </option>
                  <option key="2" value="2">
                    Tuesday
                  </option>
                  <option key="3" value="3">
                    Wednesday
                  </option>
                  <option key="4" value="4">
                    Thursday
                  </option>
                  <option key="5" value="5">
                    Friday
                  </option>
                  <option key="6" value="6">
                    Saturday
                  </option>
                  <option key="7" value="7">
                    Sunday
                  </option>
                </select>
                <div className="droparrow" />
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
                            this.state.classDayInt,
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
                          this.state.classDayInt &&
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
                      title: schedule.size !== 0 ? schedule.get(0).title : '',
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
                              this.state.classDayInt &&
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
                          recurringMaxWeeklyClasses:
                            member.values['Max Weekly Classes'],
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
                id="addRecurringBooking"
                disabled={
                  this.state.classDay === undefined ||
                  this.state.classTime === undefined ||
                  this.state.program === undefined ||
                  this.state.memberGUID === undefined
                }
                className="btn btn-primary btn-block"
                onClick={e => {
                  let id = this.state.memberGUID;
                  let bookingExists = false;
                  let userAccountExists = true;
                  let recurringMaxWeeklyClassesBooked = false;
                  let maxClassCountReached = false;
                  var existingBooking;

                  $('.noRecurringUserAccount').addClass('hide');
                  $('.recurringBookingAlreadyExists').addClass('hide');
                  $('.recurringMaxWeeklyClasses').addClass('hide');
                  $('.recurringClassMaxReached').addClass('hide');

                  var currentRecurringBookings = this.recurringBookings.filter(
                    booking =>
                      booking.sortVal ===
                      this.state.classDay + '-' + this.state.classTime,
                  );
                  var bookedStudents =
                    currentRecurringBookings.length > 0
                      ? currentRecurringBookings[0].bookings.filter(
                          booking => booking.status === 'Active',
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
                    for (let i = 0; i < this.recurringBookings.length; i++) {
                      var bookingGroup = this.recurringBookings[i];
                      var bookings = bookingGroup.bookings;
                      for (let k = 0; k < bookings.length; k++) {
                        if (
                          bookings[k].memberGUID === id &&
                          bookings[k].status === 'Active' &&
                          bookings[k].classDay ===
                            parseInt(this.state.classDay) &&
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
                  }
                  if (bookingExists) {
                    $('.recurringBookingAlreadyExists').removeClass('hide');
                  } else if (recurringMaxWeeklyClassesBooked) {
                    $('.recurringMaxWeeklyClasses').removeClass('hide');
                  } else {
                    if (!userAccountExists) {
                      $('.noRecurringUserAccount').removeClass('hide');
                    }
                    // Add Class Booking
                    let values = {};
                    values['Status'] = 'Active';
                    values['Program'] = this.state.program;
                    values['Title'] = this.state.title;
                    values['Class Day'] = this.state.classDay;
                    values['Class Time'] = this.state.classTime;
                    values['Member ID'] = this.state.memberID;
                    values['Member GUID'] = this.state.memberGUID;
                    values['Member Name'] = this.state.memberName;

                    this.props.addRecurring({
                      values,
                    });
                  }
                }}
              >
                Add Recurring Booking
              </button>
            </span>
            <div className="line2">
              <span className="noRecurringUserAccount hide">
                Please not this Member will not receive emails, since and User
                Account has not been created.
              </span>
              <span className="recurringBookingAlreadyExists hide">
                A Recurring booking for this Member at Date[
                {this.getWeekday(parseInt(this.state.classDay))}] and Time[
                {moment(this.state.classTime, 'HH:mm').format('LT')}] has
                already been made.
              </span>
              <span className="recurringMaxWeeklyClasses hide">
                This member has reached their Weekly booking count of{' '}
                {this.state.recurringMaxWeeklyClasses} for week [
                {moment(this.state.maxWeekStart).format('ddd Do MMM')} and
                {moment(this.state.maxWeekEnd).format('ddd Do MMM')}].
              </span>
              <span className="recurringClassMaxReached hide">
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
                    this.recurringBookings = this.getGridData(
                      this.rawRecurringBookings,
                      this.classSchedules,
                      e.value === 'CLEAR' ? undefined : e.value,
                    );
                    var rows = [];
                    if (e.value !== 'CLEAR') {
                      for (var i = 0; i < this.recurringBookings.length; i++) {
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
              data={this.recurringBookings}
              defaultPageSize={
                this.recurringBookings.length > 0
                  ? this.recurringBookings.length
                  : 2
              }
              pageSize={
                this.recurringBookings.length > 0
                  ? this.recurringBookings.length
                  : 2
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
              ref={ref => (this.recurringBookingsBookingGridref = ref)}
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

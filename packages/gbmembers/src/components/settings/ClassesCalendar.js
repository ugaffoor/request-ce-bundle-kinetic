import React, { Component } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { ClassDialogContainer } from './ClassDialog';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { v4 as uuidv4 } from 'uuid';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';
import {
  getAttributeValue,
  setAttributeValue,
} from '../../lib/react-kinops-components/src/utils';
import { I18n } from '../../../../app/src/I18nProvider';
import { StatusMessagesContainer } from '../StatusMessages';

const DragAndDropCalendar = withDragAndDrop(Calendar);

/*moment.locale('en_ca', {
  week: {
    dow: 1,
    doy: 1,
  },
});
*/
const localizer = momentLocalizer(moment); // or globalizeLocalizer
function convertCalendarDate(dateVal) {
  var dayOfWeek = dateVal.split('-')[0];
  var hour = dateVal.split('-')[1].split(':')[0];
  var minute = dateVal.split('-')[1].split(':')[1];

  var dt = moment()
    .day(dayOfWeek === '0' ? '7' : dayOfWeek)
    .hour(hour)
    .minute(minute)
    .second(0);
  if (moment().day() === 0 && dt.day() !== 0) {
    dt.add(-7, 'days');
  }
  return dt.toDate();
}

function EventWeek({ event }) {
  return (
    <span>
      <em>
        {event.program}
        {event.maxStudents === undefined ? '' : '-'}
        {event.maxStudents}
      </em>
      <p>{event.title}</p>
      <p>
        {event.acceptTrials === 'YES' ? 'Accept Trials' : ''}{' '}
        {event.acceptTrials === 'YES' && event.trialLimit !== ''
          ? '(' + event.trialLimit + ')'
          : ''}
      </p>
    </span>
  );
}
export class ClassesCalendar extends Component {
  constructor(props) {
    super(props);
    this.editClass = this.props.editClass.bind(this);
    this.deleteClass = this.props.deleteClass.bind(this);
    this.newClass = this.props.newClass.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
    this.applyDates = this.applyDates.bind(this);
    this.adjustSlotSize = this.adjustSlotSize.bind(this);

    this.programs = this.props.programs;
    this.additionalPrograms = this.props.additionalPrograms;
    this.space = this.props.space;
    console.log(
      'Calendar Time Slots',
      getAttributeValue(this.space, 'Calendar Time Slots', '15'),
    );
    this.state = {
      showClassDialog: false,
      events: this.props.classSchedules.toArray(),
      stepValue: parseInt(
        getAttributeValue(this.space, 'Calendar Time Slots', '15'),
      ),
      origStepValue: parseInt(
        getAttributeValue(this.space, 'Calendar Time Slots', '15'),
      ),
    };
    this.moveEvent = this.moveEvent.bind(this);
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {
    moment.locale(moment.locale(), {
      week: {
        dow: 1,
        doy: 1,
      },
    });

    console.log(moment);
  }
  cancelDialog = () => {
    this.setState({ showClassDialog: false });
  };

  deleteEvent = event => {
    this.setState((prevState, props) => {
      const events = [...prevState.events];
      const idx = events.indexOf(event);
      events.splice(idx, 1);
      return { events };
    });
    this.setState({
      showClassDialog: false,
    });

    this.deleteClass({
      id: event.classID,
    });
  };
  formatCalendarDate(date) {
    return (
      (moment(date).day() === 0 ? 7 : moment(date).day()) +
      '-' +
      moment(date).format('HH:mm')
    );
  }
  applyDates = (
    start,
    end,
    title,
    program,
    maxStudents,
    colour,
    textColour,
    allowedPrograms,
    cancellationCutoff,
    coaches,
    acceptTrials,
    trialLimit,
    studentType,
    ageInfo,
    event,
  ) => {
    if (event === undefined) {
      var id = uuidv4();

      let values = {};
      values['id'] = id;
      values['Title'] = title;
      values['Program'] = program;
      values['Max Students'] = maxStudents;
      values['Start'] = this.formatCalendarDate(start);
      values['End'] = this.formatCalendarDate(end);
      values['Colour'] = colour;
      values['Text Colour'] = textColour;
      values['Allowed Programs'] = allowedPrograms;
      values['Coaches'] = coaches;
      values['Cancellation Cutoff'] = cancellationCutoff;
      values['Accept Trial Bookings'] = acceptTrials;
      values['Trial Limit'] = trialLimit;
      values['Trial Type'] = studentType;
      values['Child Trial Ages'] = ageInfo;

      this.setState({
        events: [
          ...this.state.events,
          {
            id: id,
            start,
            end,
            title,
            maxStudents,
            program,
            colour,
            textColour,
            allowedPrograms,
            coaches,
            cancellationCutoff,
            acceptTrials,
            trialLimit,
            studentType,
            ageInfo,
          },
        ],
        showClassDialog: false,
      });

      this.newClass({
        values: values,
      });
    } else {
      this.setState((prevState, props) => {
        const events = [...prevState.events];
        const idx = events.indexOf(event);
        events[idx].title = title;
        events[idx].program = program;
        events[idx].maxStudents = maxStudents;
        events[idx].colour = colour;
        events[idx].textColour = textColour;
        events[idx].allowedPrograms = allowedPrograms;
        events[idx].coaches = coaches;
        events[idx].cancellationCutoff = cancellationCutoff;
        events[idx].acceptTrials = acceptTrials;
        events[idx].trialLimit = trialLimit;
        events[idx].studentType = studentType;
        events[idx].ageInfo = ageInfo;

        return { events };
      });
      this.setState({
        showClassDialog: false,
      });
      let values = {};
      values['id'] = event.id;
      values['Title'] = title;
      values['Program'] = program;
      values['Max Students'] = maxStudents;
      values['Start'] = this.formatCalendarDate(start);
      values['End'] = this.formatCalendarDate(end);
      values['Colour'] = colour;
      values['Text Colour'] = textColour;
      values['Allowed Programs'] = allowedPrograms;
      values['Coaches'] = coaches;
      values['Cancellation Cutoff'] = cancellationCutoff;
      values['Accept Trial Bookings'] = acceptTrials;
      values['Trial Limit'] = trialLimit;
      values['Trial Type'] = studentType;
      values['Child Trial Ages'] = ageInfo;

      this.editClass({
        id: event.classID,
        values: values,
      });
      var cidx = this.props.classSchedules.findIndex(
        schedule => schedule.classID === event.classID,
      );
      if (cidx !== -1) {
        var scheduledClass = this.props.classSchedules.get(cidx);

        scheduledClass.title = title;
        scheduledClass.program = program;
        scheduledClass.maxStudents = maxStudents;
        scheduledClass.start = convertCalendarDate(values['Start']);
        scheduledClass.end = convertCalendarDate(values['End']);
        scheduledClass.colour = colour;
        scheduledClass.textColour = textColour;
        scheduledClass.allowedPrograms = allowedPrograms;
        scheduledClass.coaches = coaches;
        scheduledClass.cancellationCutoff = cancellationCutoff;
        scheduledClass.acceptTrials = acceptTrials;
        scheduledClass.trialLimit = trialLimit;
        scheduledClass.studentType = studentType;
        scheduledClass.ageInfo = ageInfo;
      }
    }
  };
  handleSelect = ({ start, end }) => {
    this.setState({
      showClassDialog: true,
      addStart: start,
      addEnd: end,
      event: undefined,
    });
  };

  customEventPropGetter = ({
    program,
    start,
    end,
    colour,
    textColour,
    isSelected,
  }) => {
    if (colour !== undefined) {
      return {
        style: {
          backgroundColor: colour,
          color: textColour,
        },
      };
    }
    return { className: program.replace(/ /g, '_') };
  };
  handleSelectEvent = event => {
    this.setState({
      showClassDialog: true,
      event: event,
    });
  };
  moveEvent({ event, start, end, isAllDay: droppedOnAllDaySlot }) {
    const { events } = this.state;

    const idx = events.indexOf(event);

    const updatedEvent = { ...event, start, end };

    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);

    this.setState({
      events: nextEvents,
    });

    let values = {};
    values['Start'] = this.formatCalendarDate(start);
    values['End'] = this.formatCalendarDate(end);
    this.editClass({
      id: updatedEvent.classID,
      values: values,
    });

    var cidx = this.props.classSchedules.findIndex(
      schedule => schedule.classID === updatedEvent.classID,
    );
    if (cidx !== -1) {
      this.props.classSchedules.get(cidx).start = convertCalendarDate(
        values['Start'],
      );
      this.props.classSchedules.get(cidx).end = convertCalendarDate(
        values['End'],
      );
    }
  }
  resizeEvent = ({ event, start, end }) => {
    const { events } = this.state;

    const nextEvents = events.map(existingEvent => {
      return existingEvent.id === event.id
        ? { ...existingEvent, start, end }
        : existingEvent;
    });

    this.setState({
      events: nextEvents,
    });

    let values = {};
    values['Start'] = this.formatCalendarDate(start);
    values['End'] = this.formatCalendarDate(end);

    this.editClass({
      id: event.classID,
      values: values,
    });
    var cidx = this.props.classSchedules.findIndex(
      schedule => schedule.classID === event.classID,
    );
    if (cidx !== -1) {
      this.props.classSchedules.get(cidx).start = convertCalendarDate(
        values['Start'],
      );
      this.props.classSchedules.get(cidx).end = convertCalendarDate(
        values['End'],
      );
    }
  };
  adjustSlotSize(value) {
    this.setState({
      stepValue: parseInt(value),
    });
  }
  render() {
    let formats = {
      weekdayFormat: (date, culture, localizer) => {
        localizer.format(date, 'dddd', culture);
      },
      dayFormat: (date, culture, localizer) =>
        localizer.format(date, 'ddd', culture),
    };
    return (
      <span className="scheduleCalendar">
        <StatusMessagesContainer />
        {this.state.showClassDialog && (
          <ClassDialogContainer
            event={this.state.event}
            start={this.state.addStart}
            end={this.state.addEnd}
            programs={this.programs}
            additionalPrograms={this.additionalPrograms}
            colour={this.colour}
            textColour={this.textColour}
            allowedPrograms={this.allowedPrograms}
            coaches={this.coaches}
            cancellationCutoff={this.cancellationCutoff}
            acceptTrials={this.acceptTrials}
            trialLimit={this.trialLimit}
            studentType={this.studentType}
            ageInfo={this.ageInfo}
            cancelDialog={this.cancelDialog}
            applyDates={this.applyDates}
            deleteEvent={this.deleteEvent}
          />
        )}
        <div class="calendarSection">
          {
            <div class="gridSizes">
              <label htmlFor="5minutes">
                <input
                  type="radio"
                  id="5minutes"
                  value="5"
                  name="slotSize"
                  checked={this.state.stepValue === 5}
                  onChange={e => {
                    this.adjustSlotSize(e.target.value);
                  }}
                />
                <span class="value">
                  <I18n>5 Minutes</I18n>
                </span>
              </label>
              <label htmlFor="10minutes">
                <input
                  type="radio"
                  id="10minutes"
                  value="10"
                  name="slotSize"
                  checked={this.state.stepValue === 10}
                  onChange={e => {
                    this.adjustSlotSize(e.target.value);
                  }}
                />
                <span class="value">
                  <I18n>10 Minutes</I18n>
                </span>
              </label>
              <label htmlFor="15minutes">
                <input
                  type="radio"
                  id="15minutes"
                  value="15"
                  name="slotSize"
                  checked={this.state.stepValue === 15}
                  onChange={e => {
                    this.adjustSlotSize(e.target.value);
                  }}
                />
                <span class="value">
                  <I18n>15 Minutes</I18n>
                </span>
              </label>
              <button
                type="button"
                id="saveSlotChanges"
                disabled={this.state.stepValue === this.state.origStepValue}
                className="btn btn-primary"
                onClick={e => {
                  var values = {};
                  values['Status'] = 'New';
                  values['Attribute Name'] = 'Calendar Time Slots';
                  values['Original Value'] = this.state.origStepValue;
                  values['New Value'] = this.state.stepValue;
                  values['Updated By'] = this.props.profile.username;

                  this.setState({
                    origStepValue: this.state.stepValue,
                  });

                  this.props.updateSpaceAttribute({
                    values,
                  });
                  setAttributeValue(
                    this.space,
                    'Calendar Time Slots',
                    this.state.stepValue,
                  );
                }}
              >
                Save
              </button>
            </div>
          }
          <DragAndDropCalendar
            selectable
            localizer={localizer}
            events={this.state.events}
            step={this.state.stepValue}
            defaultView={Views.WEEK}
            views={['week']}
            onDoubleClickEvent={event => this.handleSelectEvent(event)}
            onSelectSlot={this.handleSelect}
            eventPropGetter={this.customEventPropGetter}
            components={{
              event: Event,
              week: {
                event: EventWeek,
              },
            }}
            onEventDrop={this.moveEvent}
            resizable
            onEventResize={this.resizeEvent}
            onDragStart={console.log}
            formats={formats}
            min={moment()
              .hour(5)
              .minute(0)
              .second(0)
              .toDate()}
            max={moment()
              .hour(22)
              .minute(0)
              .second(0)
              .toDate()}
          />
        </div>
      </span>
    );
  }
}

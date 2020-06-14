import React, { Component } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { ClassDialogContainer } from './ClassDialog';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { v4 as uuidv4 } from 'uuid';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';

const DragAndDropCalendar = withDragAndDrop(Calendar);

const localizer = momentLocalizer(moment); // or globalizeLocalizer

function EventWeek({ event }) {
  return (
    <span>
      <em>
        {event.program}
        {event.maxStudents === undefined ? '' : '-'}
        {event.maxStudents}
      </em>
      <p>{event.title}</p>
    </span>
  );
}
export class ClassesCalendar extends Component {
  constructor(props) {
    super(props);
    this.editClass = this.props.editClass.bind(this);
    this.deleteClass = this.props.deleteClass.bind(this);
    this.newClass = this.props.newClass.bind(this);
    this.programs = this.props.programs;
    this.additionalPrograms = this.props.additionalPrograms;
    this.state = {
      showClassDialog: false,
      events: this.props.classSchedules.toArray(),
    };
    this.moveEvent = this.moveEvent.bind(this);
  }
  componentWillReceiveProps(nextProps) {}
  componentWillMount() {}
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
  applyDates = (start, end, title, program, maxStudents, colour, event) => {
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

      this.editClass({
        id: event.classID,
        values: values,
      });
    }
  };

  getData(data) {
    if (!data || data.size <= 0) {
      return [];
    }
    return data;
  }
  handleSelect = ({ start, end }) => {
    this.setState({
      showClassDialog: true,
      addStart: start,
      addEnd: end,
      event: undefined,
    });
  };

  customEventPropGetter = ({ program, start, end, colour, isSelected }) => {
    if (colour !== undefined) {
      return {
        style: {
          backgroundColor: colour,
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
  };
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
        {this.state.showClassDialog && (
          <ClassDialogContainer
            event={this.state.event}
            start={this.state.addStart}
            end={this.state.addEnd}
            programs={this.programs}
            additionalPrograms={this.additionalPrograms}
            colour={this.colour}
            cancelDialog={this.cancelDialog}
            applyDates={this.applyDates}
            deleteEvent={this.deleteEvent}
          />
        )}
        <DragAndDropCalendar
          selectable
          localizer={localizer}
          events={this.state.events}
          step={15}
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
      </span>
    );
  }
}

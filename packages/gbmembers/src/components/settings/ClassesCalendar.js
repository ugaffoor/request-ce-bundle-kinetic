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
    this.programs = this.props.programs;
    this.state = {
      showClassDialog: false,
      events: this.props.classSchedules,
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
  };
  applyDates = (start, end, title, program, maxStudents, event) => {
    if (event === undefined) {
      this.setState({
        events: [
          ...this.state.events,
          {
            id: uuidv4(),
            start,
            end,
            title,
            maxStudents,
            program,
          },
        ],
        showClassDialog: false,
      });
    } else {
      this.setState((prevState, props) => {
        const events = [...prevState.events];
        const idx = events.indexOf(event);
        events[idx].title = title;
        events[idx].program = program;
        events[idx].maxStudents = maxStudents;
        return { events };
      });
      this.setState({
        showClassDialog: false,
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

  customEventPropGetter = ({ program, start, end, isSelected }) => {
    //  console.log(this.state.events);
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
    let allDay = event.allDay;

    if (!event.allDay && droppedOnAllDaySlot) {
      allDay = true;
    } else if (event.allDay && !droppedOnAllDaySlot) {
      allDay = false;
    }

    const updatedEvent = { ...event, start, end, allDay };

    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);

    this.setState({
      events: nextEvents,
    });

    // alert(`${event.title} was dropped onto ${updatedEvent.start}`)
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

    //alert(`${event.title} was resized to ${start}-${end}`)
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
      <span>
        {this.state.showClassDialog && (
          <ClassDialogContainer
            event={this.state.event}
            start={this.state.addStart}
            end={this.state.addEnd}
            programs={this.programs}
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

import React, { Component } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

const localizer = momentLocalizer(moment); // or globalizeLocalizer
function Event({ event }) {
  return (
    <span>
      <strong>{event.title}</strong>
      {event.desc && ':  ' + event.desc}
    </span>
  );
}

function EventWeek({ event }) {
  return (
    <span>
      <em style={{ color: 'magenta' }}>{event.title}</em>
      <p>{event.desc}</p>
    </span>
  );
}
export class ClassesCalendar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: [],
    };
  }
  componentWillReceiveProps(nextProps) {}
  componentWillMount() {}

  getData(data) {
    if (!data || data.size <= 0) {
      return [];
    }
    return data;
  }
  handleSelect = ({ start, end }) => {
    const title = window.prompt('New Event name');
    if (title)
      this.setState({
        events: [
          ...this.state.events,
          {
            start,
            end,
            title,
            program: 'GB1',
          },
        ],
      });
  };

  customEventPropGetter = ({ event, start, end, isSelected }) => {
    console.log(this.state.events);
    return {};
  };
  handleSelectEvent = event => {
    console.log(event);
    alert(event.title);
  };
  render() {
    return (
      <Calendar
        selectable
        localizer={localizer}
        events={this.state.events}
        step={15}
        defaultView={Views.WEEK}
        onSelectEvent={event => this.handleSelectEvent(event)}
        onSelectSlot={this.handleSelect}
        eventPropGetter={event => this.customEventPropGetter(event)}
        components={{
          event: Event,
          week: {
            event: EventWeek,
          },
        }}
      />
    );
  }
}

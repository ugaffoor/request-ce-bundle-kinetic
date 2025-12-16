import React, { Component } from 'react';
import moment from 'moment';
import phone from '../../images/phone.png';
import mail from '../../images/mail.png';
import sms from '../../images/sms.png';
import in_person from '../../images/in_person.png';
import intro_class from '../../images/intro_class.png';
import free_class from '../../images/free_class.png';
import attended_class from '../../images/user-check.png';
import noshow_class from '../../images/no-show.png';
import note from '../../images/pencil.png';
import { ReactComponent as HelpIcon } from '../../images/help.svg';
import $ from 'jquery';
export const contact_date_format = 'YYYY-MM-DD HH:mm';

export class EventItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      event: this.props.event,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      event: nextProps.event,
    });
  }
  UNSAFE_componentWillMount() {}
  render() {
    return (
      <div
        className={'eventItem ' + this.state.event['Status']}
        title={
          moment(this.state.event['Date']).format('Do MMM YYYY h:MM A') +
          ' : ' +
          (this.state.event['Duration'] !== undefined
            ? this.state.event['Duration']
            : 'Manual')
        }
      >
        <span className="eventCell">
          {this.state.event['Contact Type'] === 'phone' ||
          this.state.event['Contact Type'] === 'Call' ? (
            <img src={phone} alt="Phone Call" />
          ) : this.state.event['Contact Type'] === 'email' ||
          this.state.event['Contact Type'] === 'Email' ? (
            <img src={mail} alt="Email" />
          ) : this.state.event['Contact Type'] === 'sms' ||
          this.state.event['Contact Type'] === 'SMS' ? (
            <img src={sms} alt="SMS" />
          ) : this.state.event['Contact Type'] === 'in_person' ? (
            <img src={in_person} alt="In Person" />
          ) : this.state.event['Contact Type'] === 'intro_class' ? (
            <img src={intro_class} alt="Intro Class" />
          ) : this.state.event['Contact Type'] === 'free_class' ? (
            <img src={free_class} alt="Free Class" />
          ) : this.state.event['Contact Type'] === 'attended_class' ? (
            <img src={attended_class} alt="Attended Class" />
          ) : this.state.event['Contact Type'] === 'noshow_class' ? (
            <img src={noshow_class} alt="Class No Show" />
          ) : (
            <img src={note} alt="Note" />
          )}
        </span>
        <div className="days">
          {moment(moment(this.state.event['Date'])).diff(
            moment(this.props.leadItem['createdAt']).format(
              contact_date_format,
            ),
            'days',
          )}
        </div>
      </div>
    );
  }
}

export class EventsBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: this.props.events,
      type: this.props.type,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      events: nextProps.events,
      type: nextProps.type,
    });
  }
  UNSAFE_componentWillMount() {}
  render() {
    return (
      <div className="eventsBar">
        <div className="title">{this.state.type}</div>
        <div className="section">
          {this.state.events.map((event, index) => {
            return (
              <EventItem
                key={index}
                event={event}
                leadItem={this.props.leadItem}
              />
            );
          })}
        </div>
      </div>
    );
  }
}
export class LeadEvents extends Component {
  constructor(props) {
    super(props);
    /*    let events=[];
    props.events.forEach((key, value) => {
      events[events.length]={key:key, value:value};
    });*/
    this.state = {
      events: this.props.events,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    let events = nextProps.events;
    this.setState({
      events,
    });
  }
  UNSAFE_componentWillMount() {}
  render() {
    return (
      <div className="Events">
        <div className="helpSection">
          <HelpIcon
            className="icon icon-svg help"
            onClick={e => {
              $('.eventModeHelp').toggle('');
            }}
          />
          <span className="eventModeHelp">
            <div className="infoRow">
              <div className="color Website" />
              <div className="info">Lead generated from Website.</div>
            </div>
            <div className="infoRow">
              <div className="color Defined" />
              <div className="info">
                Journey Event defined as a future trigger.
              </div>
            </div>
            <div className="infoRow">
              <div className="color New" />
              <div className="info">New Journey Event, yet to be managed.</div>
            </div>
            <div className="infoRow">
              <div className="color Delete" />
              <div className="info">Journey Event deleted.</div>
            </div>
            <div className="infoRow">
              <div className="color Completed" />
              <div className="info">Journey Event completed.</div>
            </div>
            <div className="infoRow">
              <div className="color Manual" />
              <div className="info">Note captured manually.</div>
            </div>
          </span>
        </div>
        {this.state.events.get('On Create') === undefined ? (
          <div />
        ) : (
          <EventsBar
            type="On Create"
            events={this.state.events.get('On Create')}
            leadItem={this.props.leadItem}
          />
        )}
        {this.state.events.get('Intro Class Scheduled') === undefined ? (
          <div />
        ) : (
          <EventsBar
            type="Intro Class Scheduled"
            events={this.state.events.get('Intro Class Scheduled')}
            leadItem={this.props.leadItem}
          />
        )}
        {this.state.events.get('Day of Intro') === undefined ? (
          <div />
        ) : (
          <EventsBar
            type="Day of Intro"
            events={this.state.events.get('Day of Intro')}
            leadItem={this.props.leadItem}
          />
        )}
        {this.state.events.get('Intro Attended') === undefined ? (
          <div />
        ) : (
          <EventsBar
            type="Intro Attended"
            events={this.state.events.get('Intro Attended')}
            leadItem={this.props.leadItem}
          />
        )}
        {this.state.events.get('Intro No Show') === undefined ? (
          <div />
        ) : (
          <EventsBar
            type="Intro No Show"
            events={this.state.events.get('Intro No Show')}
            leadItem={this.props.leadItem}
          />
        )}
      </div>
    );
  }
}

export default LeadEvents;

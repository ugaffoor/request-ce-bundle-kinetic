import React, { Component } from 'react';
import moment from 'moment';
import reviewIcon from '../../images/review.svg?raw';
import SVGInline from 'react-svg-inline';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import phone from '../../images/phone.png';
import mail from '../../images/mail.png';
import sms from '../../images/sms.png';
import in_person from '../../images/in_person.png';
import intro_class from '../../images/intro_class.png';
import free_class from '../../images/free_class.png';
import attended_class from '../../images/user-check.png';
import noshow_class from '../../images/no-show.png';

export class HistoryInfo extends Component {
  constructor(props) {
    super(props);
    this.history = [];
    this.history[this.history.length] =
      this.props.history.length > 0
        ? this.props.history[0]
        : { contactMethod: '', contactDate: '', note: '', submitter: '' };
    //      this.history=this.props.history;
    this.state = {
      showall: false,
      history: this.history,
    };
  }
  componentWillReceiveProps(nextProps) {}
  componentWillMount() {}
  setShowPromotionReviewDialog(show) {}
  render() {
    return (
      <tr className="lastContactInfo">
        <td className="label">Last Contact:</td>
        <td className="value">
          <table>
            <tbody>
              {this.state.history.map((item, i) => {
                return (
                  <tr key={i}>
                    <td>
                      {item.contactMethod === 'phone' ? (
                        <img src={phone} alt="Phone Call" />
                      ) : item.contactMethod === 'email' ? (
                        <img src={mail} alt="Email" />
                      ) : item.contactMethod === 'sms' ? (
                        <img src={sms} alt="SMS" />
                      ) : item.contactMethod === 'in_person' ? (
                        <img src={in_person} alt="In Person" />
                      ) : item.contactMethod === 'intro_class' ? (
                        <img src={intro_class} alt="Intro Class" />
                      ) : item.contactMethod === 'free_class' ? (
                        <img src={free_class} alt="Free Class" />
                      ) : item.contactMethod === 'attended_class' ? (
                        <img src={attended_class} alt="Attended Class" />
                      ) : item.contactMethod === 'noshow_class' ? (
                        <img src={noshow_class} alt="Class No Show" />
                      ) : (
                        <span className="notesCell"></span>
                      )}
                      <span className="date">
                        {item['contactDate'] !== ''
                          ? moment(item['contactDate']).format(
                              'DD-MM-YYYY h:mm A',
                            )
                          : ''}
                      </span>
                      <span className="lastContact">
                        {item['note'].length > 60
                          ? item['note'].substring(0, 60) + '...'
                          : item['note']}
                      </span>
                      <span className="submitter">{item['submitter']}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            type="button"
            id="showAll"
            className="btn btn-primary send"
            onClick={e => {
              let history = [];
              if (!this.state.showall) {
                history = this.props.history;
              } else {
                history[history.length] =
                  this.props.history.length > 0
                    ? this.props.history[0]
                    : {
                        contactMethod: '',
                        contactDate: '',
                        note: '',
                        submitter: '',
                      };
              }
              this.setState({
                showall: !this.state.showall,
                history: history,
              });
            }}
          >
            {this.state.showall ? 'Show First' : 'Show All'}
          </button>
        </td>
      </tr>
    );
  }
}

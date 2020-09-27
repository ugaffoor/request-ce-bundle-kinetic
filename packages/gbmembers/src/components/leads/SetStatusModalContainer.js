import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { getJson } from '../Member/MemberUtils';
import moment from 'moment';
import { compose } from 'recompose';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};

export class SetStatusModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowSetStatusModal(false);
  };
  applyStatus = () => {
    var statusValue = $('.statusOptions input:checked').val();
    this.props.submission.values['Status'] = statusValue;
    let history = getJson(this.props.submission.values['Status History']);
    let newHistory = {
      submitter: this.props.profile.displayName,
      date: moment().toString(),
      status: statusValue,
    };
    history.push(newHistory);
    this.props.submission.values['Status History'] = history;
    this.props.setLeadStatus({
      id: this.props.submission['id'],
      status: $('.statusOptions input:checked').val(),
    });
    this.handleClose();
  };
  constructor(props) {
    super(props);
    this.statusValues = props.leadStatusValues;
    this.statusHistory = getJson(props.submission.values['Status History']);
    this.state = {};
  }
  componentWillReceiveProps(nextProps) {}
  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog className="setStatusDialog" onClose={this.handleClose}>
            <div className="statusOptions">
              <form>
                {this.statusValues.map((value, index) => {
                  return (
                    <label htmlFor={value}>
                      <input
                        type="radio"
                        id={value}
                        name="status"
                        value={value}
                      />{' '}
                      {value}
                    </label>
                  );
                })}
              </form>
              <button
                type="button"
                id="applyStatus"
                className="btn btn-primary btn-block"
                disabled={$('.statusOptions input:checked').length === 0}
                onClick={e => this.applyStatus()}
              >
                Apply Status
              </button>
              <table className="statusHistory">
                <tbody>
                  {this.statusHistory
                    .sort(function(a, b) {
                      let aDt = moment(a.date);
                      let bDt = moment(b.date);
                      if (aDt.isBefore(bDt)) {
                        return 1;
                      } else if (aDt.isAfter(bDt)) {
                        return -1;
                      }
                      return 0;
                    })
                    .map(history => (
                      <tr>
                        <td>{history.status}</td>
                        <td>{moment(history.date).format('L LT')}</td>
                        <td>{history.submitter}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const SetStatusModalContainer = enhance(SetStatusModal);

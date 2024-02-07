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
    this.props.setIsDirty(true);
    this.handleClose();
  };
  constructor(props) {
    super(props);
    this.statusValues = props.memberStatusValues;
    this.statusHistory = getJson(props.submission.values['Status History']);
    this.state = {};
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {
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
                <span>
                  <span>
                    Are you sure you want to continue setting the Status?
                  </span>
                  <br></br>
                  <span>
                    Please note that setting a Member's status directly will not
                    affect Billing.
                  </span>
                  <br></br>
                  <span>
                    If you wish to adjust the Billing status or value, please
                    submit the appropriate billing form.
                  </span>
                </span>
              </form>
              <button
                type="button"
                id="applyStatus"
                className="btn btn-primary btn-block"
                disabled={$('.statusOptions input:checked').length === 0}
                onClick={async e => {
                  this.applyStatus();
                }}
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

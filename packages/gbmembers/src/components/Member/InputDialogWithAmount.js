import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { confirmable } from 'react-confirm';
import $ from 'jquery';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';

class InputDialogWithAmount extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
  };
  constructor(props) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.originalAmount = this.props.amount;

    this.state = {
      changeReason: this.props.changeReason,
      amount: this.props.amount,
      isShowingModal: false,
      drawerWidth: '0px',
    };
  }
  UNSAFE_componentWillMount() {}

  componentDidMount() {
    this.setState({
      drawerWidth:
        $('#mainContent')
          .parent('div')
          .css('left') !== '0px'
          ? parseInt(
              $('.sidebar-content')
                .css('width')
                .replace('px', ''),
            ) +
            50 +
            'px'
          : '60px',
    });
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value,
    });
  }

  handleSubmit() {
    if (!this.state.amount) {
      alert('Amount is required');
      return;
    }
    if (!this.state.changeReason) {
      alert('Billing change reason is required');
      return;
    }
    if (isNaN(this.state.amount)) {
      alert('Amount must be valid');
      return;
    }
    if (
      Number.parseFloat(this.state.amount) >
      Number.parseFloat(this.originalAmount)
    ) {
      alert(
        'Amount must not be greater than original amount [Refund Amount:' +
          this.state.amount +
          ', Amount:' +
          this.originalAmount +
          ']',
      );
      return;
    }

    const { proceed } = this.props;
    proceed({
      reason: this.state.changeReason,
      amount: this.state.amount,
    });
  }

  render() {
    const { show, proceed, dismiss, cancel, message } = this.props;
    return (
      <div>
        {
          <ModalContainer onClose={dismiss}>
            <ModalDialog
              className="changeReason"
              style={{ left: this.state.drawerWidth }}
              onClose={dismiss}
            >
              <div className="card-title">
                <h3>Billing Change Reason</h3>
              </div>
              <div className="container">
                <div className="form-group row">
                  <label htmlFor="amount" className="col-sm-1 col-form-label">
                    Amount
                  </label>
                  <div className="col-sm-10">
                    <input
                      name="amount"
                      id="amount"
                      className="form-control"
                      value={this.state.amount}
                      onChange={this.handleInputChange}
                    ></input>
                  </div>
                </div>
                <div className="form-group row">
                  <label
                    className="col-sm-1 col-form-label"
                    htmlFor="changeReason"
                  >
                    Reason
                  </label>
                  <div className="col-sm-10">
                    <textarea
                      className="form-control"
                      name="changeReason"
                      id="changeReason"
                      rows="5"
                      onChange={this.handleInputChange}
                      value={this.state.changeReason}
                      placeholder="Please enter a reason for this billing change. Not entering a valid reason could cause you pain later."
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={this.state.changeReason === ''}
                    onClick={e => this.handleSubmit()}
                    style={{ backgroundColor: '#991B1E' }}
                  >
                    Proceed
                  </button>
                  &nbsp;
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={cancel}
                    style={{ backgroundColor: '#991B1E' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </ModalDialog>
          </ModalContainer>
        }
      </div>
    );
  }
}

export default confirmable(InputDialogWithAmount);

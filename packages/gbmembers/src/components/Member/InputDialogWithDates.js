import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { confirmable } from 'react-confirm';
import $ from 'jquery';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';

class InputDialogWithDates extends Component {
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

    this.state = {
      changeReason: '',
      startDate: '',
      resumeDate: '',
      isShowingModal: false,
      drawerWidth: '0px',
    };
  }
  componentWillMount() {}

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
    if (!this.state.startDate) {
      console.log('Start date is required');
      return;
    } else if (
      this.state.resumeDate &&
      moment(this.state.startDate, 'DD-MM-YYYY').isSameOrAfter(
        moment(this.state.resumeDate, 'DD-MM-YYYY'),
      )
    ) {
      console.log('Resume date must be after start date');
      return;
    }
    if (!this.state.changeReason) {
      console.log('Billing change reason is required');
      return;
    }
    const { proceed } = this.props;
    proceed({
      reason: this.state.changeReason,
      startDate: this.state.startDate,
      resumeDate: this.state.resumeDate,
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
                <div className="row">
                  <div className="col-sm-1">&nbsp;</div>
                  <div className="col-md-5">
                    <label htmlFor="startDate" className="control-label">
                      Start Date
                    </label>
                    <select
                      name="startDate"
                      id="startDate"
                      className="form-control"
                      value={this.state.startDate}
                      onChange={this.handleInputChange}
                    >
                      <option key="" value="">
                        --
                      </option>
                      {this.props.startDates.map((startDate, index) => (
                        <option key={index} value={startDate}>
                          {startDate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-5">
                    <label htmlFor="resumeDate" className="control-label">
                      Resume Date
                    </label>
                    <select
                      name="resumeDate"
                      id="resumeDate"
                      className="form-control"
                      value={this.state.resumeDate}
                      onChange={this.handleInputChange}
                    >
                      <option key="" value="">
                        --
                      </option>
                      {this.props.resumeDates.map((startDate, index) => (
                        <option key={index} value={startDate}>
                          {startDate}
                        </option>
                      ))}
                    </select>
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

export default confirmable(InputDialogWithDates);

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { confirmable } from 'react-confirm';
import $ from 'jquery';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';

class InputDialog extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    //this.props.setReason(null);
    console.log('### handleClose');
    this.setState({ isShowingModal: false });
    //this.props.showBillingChangeReasonModal(false);
  };
  constructor(props) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      changeReason: '',
      isShowingModal: false,
      drawerWidth: '0px',
    };
  }
  UNSAFE_componentWillMount() {
    //this.setState({isShowingModal:this.props.isShowingModal})
  }

  componentDidMount() {
    //this.setState({isShowingModal:this.props.isShowingModal})
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
    console.log('### handleInputChange');
    const target = event.target;
    const value = target.value;
    const name = target.name;
    //console.log(" name = " + name + " , val = " + value);
    this.setState({
      [name]: value,
    });
  }

  handleSubmit() {
    console.log('### setReason: ' + this.state.changeReason);
    const { proceed } = this.props;
    proceed({
      reason: this.state.changeReason,
    });
    /*return () => {
        console.log('### returning ...');
        proceed({
          reason: this.state.changeReason
        });
      }*/
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
                <form className="form-horizontal" role="form" id="ccForm">
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
                </form>
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

export default confirmable(InputDialog);

import React, { Component, Fragment } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { CoreForm } from 'react-kinetic-core';
import { Loading } from 'common';
import ReactDOM from 'react-dom';
import EmailEditor from 'react-email-editor';

const globals = import('common/globals');

export const handleLoaded = props => form => {
  compThis.setState({
    loadingForm: false,
  });
};
export const handleUpdated = props => response => {
  if (response.submission.id) {
    props.updateTriggerDetails(
      'smsTemplate',
      response.submission,
      props.journeyTriggers,
    );
    props.setShowSMSDialog(false);
  }
};
export const handleError = props => response => {
  props.addError(response.error, 'Error');
};
export const handleCreated = props => (response, actions) => {
  props.updateTriggerDetails(
    'smsTemplate',
    response.submission,
    props.journeyTriggers,
    true,
  );
  props.setShowSMSDialog(false);
};

const mapStateToProps = state => ({});
const mapDispatchToProps = {};
var compThis = undefined;
export class SMSTemplate extends Component {
  handleClick = () => {};
  handleClose = () => {
    this.props.setShowSMSDialog(false);
  };

  constructor(props) {
    super(props);
    compThis = this;

    this.handleLoaded = this.props.handleLoaded.bind(this);
    this.handleUpdated = this.props.handleUpdated.bind(this);
    this.handleCreated = this.props.handleCreated.bind(this);
    this.handleError = this.props.handleError.bind(this);

    this.state = {
      loadingForm: true,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}

  render() {
    return (
      <div>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="smsEditingDialog"
            onClose={this.handleClose}
            style={inlineStyle}
            dismissOnBackgroundClick={false}
          >
            {this.state.loadingForm && <Loading text="Loading ..." />}
            <Fragment>
              {this.props.smsTemplateID !== undefined ? (
                <CoreForm
                  datastore
                  review={false}
                  submission={this.props.smsTemplateID}
                  onLoaded={this.handleLoaded}
                  updated={this.handleUpdated}
                  error={this.handleError}
                  globals={globals}
                />
              ) : (
                <CoreForm
                  datastore
                  form="sms-templates"
                  onLoaded={this.handleLoaded}
                  onCreated={this.handleCreated}
                  error={this.handleError}
                  globals={globals}
                />
              )}
            </Fragment>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({
    handleUpdated,
    handleCreated,
    handleError,
    handleLoaded,
  }),
);
const inlineStyle = {
  width: '1200px',
  top: '5%',
  left: '5%',
};

export const SMSTemplateContainer = enhance(SMSTemplate);

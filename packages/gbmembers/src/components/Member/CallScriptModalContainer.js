import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import ReactSpinner from 'react16-spinjs';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import Select from 'react-select';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';

const mapStateToProps = state => ({
  callScripts: state.member.datastore.callScripts,
  callScriptsLoading: state.member.datastore.callScriptsLoading,
});
const mapDispatchToProps = {
  fetchCallScripts: dataStoreActions.fetchCallScripts,
};

const util = require('util');
export class CallScriptModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowCallScriptModal(false);
  };
  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);

    this.state = {
      selectedOption: null,
      options: this.getOptions(this.props.callScripts),
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.callScripts.length !== nextProps.callScripts.length) {
      this.setState({
        options: this.getOptions(nextProps.callScripts),
      });
    }
  }
  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
    this.props.fetchCallScripts();
  }

  getOptions(callScripts) {
    let options = [];
    if (!callScripts || callScripts.length <= 0) {
      return [];
    } else {
      callScripts.forEach(script => {
        if (script.values['Target'] === this.props.scriptTarget) {
          options.push({
            value: script['id'],
            label: script.values['Script Name'],
          });
        }
      });
      return options;
    }
  }

  handleOptionChange = selectedOption => {
    let selectedScript = null;
    if (selectedOption) {
      selectedScript = this.props.callScripts.find(
        script => script['id'] === selectedOption.value,
      );
    }

    this.setState({
      selectedOption: selectedOption,
      selectedScript: selectedScript,
    });
  };

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog
            className="call-scripts-modal"
            onClose={this.handleClose}
          >
            {this.props.callScriptsLoading ? (
              <div>
                Loading ... <ReactSpinner />
              </div>
            ) : (
              <div>
                <div className="row">
                  <div className="col-md-12" style={{ margin: '10px' }}>
                    <Select
                      value={this.state.selectedOption}
                      onChange={this.handleOptionChange}
                      options={this.state.options}
                      isClearable={true}
                      className="script-dropdown"
                      placeholder="Select script"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <span className="services-color-bar services-color-bar__blue-slate" />
                    {this.state.selectedOption && this.state.selectedScript && (
                      <div className="page-container page-container--services-form">
                        <div className="embedded-core-form--wrapper">
                          <div className="form-group col-xs-4 col-md-12">
                            <label htmlFor="name" className="control-label">
                              Target
                            </label>
                            <span className="form-control">
                              {this.state.selectedScript.values['Target']}
                            </span>
                          </div>
                          <div className="form-group col-xs-4 col-md-12">
                            <label htmlFor="name" className="control-label">
                              Script Name
                            </label>
                            <span className="form-control">
                              {this.state.selectedScript.values['Script Name']}
                            </span>
                          </div>
                          <div className="form-group col-xs-4 col-md-12">
                            <label htmlFor="name" className="control-label">
                              Script
                            </label>
                            <div
                              className="form-control"
                              style={{ overflowY: 'scroll', height: '400px' }}
                              dangerouslySetInnerHTML={{
                                __html: this.state.selectedScript.values[
                                  'Script'
                                ],
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const CallScriptModalContainer = enhance(CallScriptModal);

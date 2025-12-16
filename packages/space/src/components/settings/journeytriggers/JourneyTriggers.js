import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { PageTitle, Loading } from 'common';
import { I18n } from '@kineticdata/react';
import { actions } from '../../../redux/modules/journeyTriggers';
import { CoreForm } from '@kineticdata/react';
import { EmailTemplateContainer } from './EmailTemplate';
import { SMSTemplateContainer } from './SMSTemplate';
import { ScriptTemplateContainer } from './ScriptTemplate';
import { TriggerEventActivityContainer } from './TriggerEventActivity';
import { PopConfirm } from '../../shared/PopConfirm';
import { Button } from 'reactstrap';
import { actions as leadActions } from 'gbmembers/src/redux/modules/leads';
import { actions as memberActions } from 'gbmembers/src/redux/modules/members';
import { Utils } from 'common';
import { getAttributeValue } from 'gbmembers/src/lib/react-kinops-components/src/utils';

const globals = import('common/globals');
var triggerFormThis = undefined;
var newTriggerFormThis = undefined;
var blockTriggerThis = undefined;

export const handleLoaded = props => form => {
  form.getFieldByName('Status').hide();
  form.getFieldByName('Record Type').hide();

  $('#triggerFormLoading').hide();
};
export const handleUpdated = props => response => {
  if (response.submission.id) {
    let trigger;
    trigger = blockTriggerThis.props.journeyTriggers.find(
      trigger => trigger.id === response.submission.id,
    );

    if (trigger !== undefined) {
      trigger.values['Template Name'] =
        response.submission.values['Template Name'];
      trigger.values['Action'] = response.submission.values['Action'];
      trigger.values['Contact Type'] =
        response.submission.values['Contact Type'];
      trigger.values['Member Condition Duration'] =
        response.submission.values['Member Condition Duration'];
      trigger.values['Lead Condition Duration'] =
        response.submission.values['Lead Condition Duration'];

      $(K('form').element()).remove();
      blockTriggerThis.setState({
        editingTrigger: false,
        showBlock: true,
      });
    }
  }
};
export const handleError = props => response => {
  props.addError(response.error, 'Error');
};
export const handleCreated = props => (response, actions) => {
  var triggerCondition = '';
  if (response.submission.values['Record Type'] === 'Member') {
    triggerCondition = response.submission.values['Member Condition'];
  } else {
    triggerCondition = response.submission.values['Lead Condition'];
  }
  let triggers = blockTriggerThis.state.triggerEvents.get(triggerCondition);
  triggers.push(response.submission);

  blockTriggerThis.props.journeyTriggers.push(response.submission);

  $(K('form').element()).remove();
  blockTriggerThis.setState({
    newTrigger: false,
    showBlock: true,
  });
};
export const handleNewLoaded = props => form => {
  form.getFieldByName('Embedded Dirty').value('YES');
  form.getFieldByName('Status').value('Active');
  form.getFieldByName('Status').hide();
  form.getFieldByName('Record Type').value(blockTriggerThis.props.type);
  form.getFieldByName('Record Type').hide();

  if (blockTriggerThis.props.type === 'Member') {
    let newOptions = [
      {
        label: blockTriggerThis.state.newTriggerRecordCondition,
        value: blockTriggerThis.state.newTriggerRecordCondition,
      },
    ];
    form.getFieldByName('Member Condition').options(newOptions);
    form
      .getFieldByName('Member Condition')
      .value(blockTriggerThis.state.newTriggerRecordCondition);
    form.getFieldByName('Member Condition').disable();
  } else {
    let newOptions = [
      {
        label: blockTriggerThis.state.newTriggerRecordCondition,
        value: blockTriggerThis.state.newTriggerRecordCondition,
      },
    ];
    form.getFieldByName('Lead Condition').options(newOptions);
    form
      .getFieldByName('Lead Condition')
      .value(blockTriggerThis.state.newTriggerRecordCondition);
    form.getFieldByName('Lead Condition').disable();
  }

  $('#triggerFormLoading').hide();
};

export const editEmailTemplateJourneyTriggers = id => id => {
  alert(id);
};

export class TriggerStatus extends Component {
  constructor(props) {
    super(props);

    this.triggerUpdateCompleted = this.triggerUpdateCompleted.bind(this);
    this.state = {
      status: this.props.status === 'Active' ? true : false,
    };
  }

  triggerUpdateCompleted(submission) {
    $('#' + submission.id)
      .parent()
      .removeClass('disabled');
    $('#' + submission.id).removeAttr('disabled');

    this.props.trigger.values['Status'] = submission.values['Status'];
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  render() {
    return (
      <div className="triggerStatusFilter">
        <input
          id={this.props.trigger.id}
          type="checkbox"
          checked={this.state.status}
          value={this.state.status ? 1 : 0}
          onChange={e => {
            this.setState({
              status: e.target.checked,
            });
            $(e.target)
              .parent()
              .addClass('disabled');
            $(e.target).attr('disabled', 'disabled');
            let values = {
              Status: e.target.checked ? 'Active' : 'Inactive',
            };

            this.props.updateJourneyTrigger({
              id: this.props.trigger.id,
              values: values,
              triggerUpdateCompleted: this.triggerUpdateCompleted,
            });
          }}
        />
        <label htmlFor={this.props.trigger.id} />
      </div>
    );
  }
}
export class TriggerDelete extends Component {
  constructor(props) {
    super(props);

    this.completeTriggerDelete = this.completeTriggerDelete.bind(this);
    this.state = {};
  }
  completeTriggerDelete(id) {
    this.props.journeyTriggers;
    let idx = this.props.journeyTriggers.findIndex(
      trigger => trigger.id === id,
    );
    this.props.journeyTriggers.splice(idx, 1);

    let itr = this.props.triggerEvents.entries();
    while (true) {
      let triggers = itr.next()['value'];
      console.log(triggers);
      if (triggers === undefined) break;
      let tIdx = triggers[1].findIndex(trigger => trigger.id === id);
      if (tIdx !== -1) {
        triggers[1].splice(tIdx, 1);
      }
    }

    this.setState({
      triggerDeleteID: undefined,
    });
  }
  render() {
    return (
      <span>
        <span
          className="trash fa fa-fw fa-trash"
          id={this.props.id}
          onClick={e => {
            this.setState({
              triggerDeleteID: $(e.target).prop('id'),
            });
          }}
        />
        <PopConfirm
          target={this.props.id}
          placement="left"
          isOpen={this.props.id === this.state.triggerDeleteID}
        >
          <p>
            <I18n>
              Do you wish to delete trigger with template (
              {this.props.trigger.values['Template Name']})?
            </I18n>
          </p>
          <Button
            color="primary"
            onClick={() => {
              this.props.deleteTrigger({
                id: this.state.triggerDeleteID.replace('trash-', ''),
                completeTriggerDelete: this.completeTriggerDelete,
              });
            }}
          >
            <I18n>Yes</I18n>
          </Button>
          <Button
            color="link"
            onClick={() => {
              this.setState({
                triggerDeleteID: undefined,
              });
            }}
          >
            <I18n>No</I18n>
          </Button>
        </PopConfirm>
      </span>
    );
  }
}
export class TriggerForm extends Component {
  constructor(props) {
    super(props);
    triggerFormThis = this;

    this.setShowEmailDialog = this.setShowEmailDialog.bind(this);
    this.setShowSMSDialog = this.setShowSMSDialog.bind(this);
    this.setShowScriptDialog = this.setShowScriptDialog.bind(this);
    this.updateTriggerDetails = this.updateTriggerDetails.bind(this);

    this.handleLoaded = this.props.handleLoaded.bind(this);
    this.handleUpdated = this.props.handleUpdated.bind(this);
    this.handleError = this.props.handleError.bind(this);

    window.addEventListener('message', event => {
      if (event.data.action === 'triggerEmailTemplateEdit') {
        this.setState({
          showEmailDialog: true,
          emailTemplateID: event.data.id,
        });
      }
      if (event.data.action === 'triggerSMSTemplateEdit') {
        this.setState({
          showSMSDialog: true,
          smsTemplateID: event.data.id,
        });
      }
      if (event.data.action === 'triggerScriptTemplateEdit') {
        this.setState({
          showScriptDialog: true,
          scriptTemplateID: event.data.id,
        });
      }

      if (event.data.action === 'triggerEmailTemplateNew') {
        this.setState({
          showEmailDialog: true,
          emailTemplateID: undefined,
        });
      }
      if (event.data.action === 'triggerSMSTemplateNew') {
        this.setState({
          showSMSDialog: true,
          smsTemplateID: undefined,
        });
      }
      if (event.data.action === 'triggerScriptTemplateNew') {
        this.setState({
          showScriptDialog: true,
          scriptTemplateID: undefined,
        });
      }
    });

    this.state = {
      showEmailDialog: false,
      showSMSDialog: false,
      showScriptDialog: false,
    };
  }
  setShowEmailDialog(show) {
    this.setState({
      showEmailDialog: show,
    });
  }
  setShowSMSDialog(show) {
    this.setState({
      showSMSDialog: show,
    });
  }
  setShowScriptDialog(show) {
    this.setState({
      showScriptDialog: show,
    });
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  updateTriggerDetails(
    triggerType,
    templateDetails,
    journeyTriggers,
    newTemplate,
  ) {
    if (triggerType === 'emailTemplate') {
      if (newTemplate) {
        let options = K('field[Member Email]').options();
        options.push({
          label:
            templateDetails.values['Category'] +
            ' - ' +
            templateDetails.values['Template Name'],
          value: templateDetails.id,
        });
        K('field[Member Email]').options(options);
        K('field[Member Email]').value(templateDetails.id);
      } else {
        let idx = K('field[Member Email]')
          .options()
          .findIndex(option => option.value === templateDetails.id);
        $(K('field[Member Email]').element())[0].options[idx].label =
          templateDetails.values['Template Name'];
      }
      K('field[Template Name]').value(templateDetails.values['Template Name']);
      $(K('content[Content View]').element()).html(
        templateDetails.values['Email Content'],
      );

      K('field[Embedded Dirty]').value('YES');
    }
    if (triggerType === 'smsTemplate') {
      if (newTemplate) {
        var options = K('field[Member SMS]').options();
        options.push({
          label:
            templateDetails.values['Category'] +
            ' - ' +
            templateDetails.values['Template Name'],
          value: templateDetails.id,
        });
        K('field[Member SMS]').options(options);
        K('field[Member SMS]').value(templateDetails.id);
      } else {
        let idx = K('field[Member SMS]')
          .options()
          .findIndex(option => option.value === templateDetails.id);
        $(K('field[Member SMS]').element())[0].options[idx].label =
          templateDetails.values['Template Name'];
      }
      K('field[Template Name]').value(templateDetails.values['Template Name']);
      $(K('content[Content View]').element()).html(
        templateDetails.values['SMS Content'],
      );

      K('field[Embedded Dirty]').value('YES');
    }
    if (triggerType === 'scriptTemplate') {
      if (newTemplate) {
        let options = K('field[Member Call Script]').options();
        options.push({
          label: templateDetails.values['Script Name'],
          value: templateDetails.id,
        });
        K('field[Member Call Script]').options(options);
        K('field[Member Call Script]').value(templateDetails.id);
      } else {
        let idx = K('field[Member Call Script]')
          .options()
          .findIndex(option => option.value === templateDetails.id);
        $(K('field[Member Call Script]').element())[0].options[idx].label =
          templateDetails.values['Script Name'];
      }
      K('field[Template Name]').value(templateDetails.values['Script Name']);
      $(K('content[Content View]').element()).html(
        templateDetails.values['Script'],
      );

      K('field[Embedded Dirty]').value('YES');
    }
  }
  render() {
    return (
      <div>
        {this.state.showEmailDialog && (
          <EmailTemplateContainer
            setShowEmailDialog={this.setShowEmailDialog}
            emailTemplateID={this.state.emailTemplateID}
            updateTriggerDetails={this.updateTriggerDetails}
            journeyTriggers={this.props.journeyTriggers}
          />
        )}
        {this.state.showSMSDialog && (
          <SMSTemplateContainer
            setShowSMSDialog={this.setShowSMSDialog}
            smsTemplateID={this.state.smsTemplateID}
            updateTriggerDetails={this.updateTriggerDetails}
            journeyTriggers={this.props.journeyTriggers}
          />
        )}
        {this.state.showScriptDialog && (
          <ScriptTemplateContainer
            target={this.props.targetType}
            setShowScriptDialog={this.setShowScriptDialog}
            scriptTemplateID={this.state.scriptTemplateID}
            updateTriggerDetails={this.updateTriggerDetails}
            journeyTriggers={this.props.journeyTriggers}
          />
        )}
        <div id="triggerFormLoading">
          <Loading text="Loading ..." />
        </div>
        <div className="editing">
          <Fragment>
            <CoreForm
              datastore
              review={false}
              submission={this.props.id}
              onLoaded={this.handleLoaded}
              updated={this.handleUpdated}
              error={this.handleError}
              globals={globals}
            />
          </Fragment>
        </div>
      </div>
    );
  }
}
export class NewTriggerForm extends Component {
  constructor(props) {
    super(props);
    newTriggerFormThis = this;

    this.setShowEmailDialog = this.setShowEmailDialog.bind(this);
    this.setShowSMSDialog = this.setShowSMSDialog.bind(this);
    this.setShowScriptDialog = this.setShowScriptDialog.bind(this);
    this.updateTriggerDetails = this.updateTriggerDetails.bind(this);

    this.handleNewLoaded = this.props.handleNewLoaded.bind(this);
    this.handleCreated = this.props.handleCreated.bind(this);
    this.handleError = this.props.handleError.bind(this);

    window.addEventListener('message', event => {
      if (event.data.action === 'triggerEmailTemplateEdit') {
        this.setState({
          showEmailDialog: true,
          emailTemplateID: event.data.id,
        });
      }
      if (event.data.action === 'triggerSMSTemplateEdit') {
        this.setState({
          showSMSDialog: true,
          smsTemplateID: event.data.id,
        });
      }
      if (event.data.action === 'triggerScriptTemplateEdit') {
        this.setState({
          showScriptDialog: true,
          scriptTemplateID: event.data.id,
        });
      }

      if (event.data.action === 'triggerEmailTemplateNew') {
        this.setState({
          showEmailDialog: true,
          emailTemplateID: undefined,
        });
      }
      if (event.data.action === 'triggerSMSTemplateNew') {
        this.setState({
          showSMSDialog: true,
          smsTemplateID: undefined,
        });
      }
      if (event.data.action === 'triggerScriptTemplateNew') {
        this.setState({
          showScriptDialog: true,
          scriptTemplateID: undefined,
        });
      }
    });

    this.state = {
      showEmailDialog: false,
      showSMSDialog: false,
      showScriptDialog: false,
    };
  }
  setShowEmailDialog(show) {
    this.setState({
      showEmailDialog: show,
    });
  }
  setShowSMSDialog(show) {
    this.setState({
      showSMSDialog: show,
    });
  }
  setShowScriptDialog(show) {
    this.setState({
      showScriptDialog: show,
    });
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  updateTriggerDetails(
    triggerType,
    templateDetails,
    journeyTriggers,
    newTemplate,
  ) {
    if (triggerType === 'emailTemplate') {
      if (newTemplate) {
        let options = K('field[Member Email]').options();
        options.push({
          label:
            templateDetails.values['Category'] +
            ' - ' +
            templateDetails.values['Template Name'],
          value: templateDetails.id,
        });
        K('field[Member Email]').options(options);
        K('field[Member Email]').value(templateDetails.id);
      } else {
        let idx = K('field[Member Email]')
          .options()
          .findIndex(option => option.value === templateDetails.id);
        $(K('field[Member Email]').element())[0].options[idx].label =
          templateDetails.values['Template Name'];
      }
      K('field[Template Name]').value(templateDetails.values['Template Name']);
      $(K('content[Content View]').element()).html(
        templateDetails.values['Email Content'],
      );

      K('field[Embedded Dirty]').value('YES');
    }
    if (triggerType === 'smsTemplate') {
      if (newTemplate) {
        let options = K('field[Member SMS]').options();
        options.push({
          label:
            templateDetails.values['Category'] +
            ' - ' +
            templateDetails.values['Template Name'],
          value: templateDetails.id,
        });
        K('field[Member SMS]').options(options);
        K('field[Member SMS]').value(templateDetails.id);
      } else {
        let idx = K('field[Member SMS]')
          .options()
          .findIndex(option => option.value === templateDetails.id);
        $(K('field[Member SMS]').element())[0].options[idx].label =
          templateDetails.values['Template Name'];
      }
      K('field[Template Name]').value(templateDetails.values['Template Name']);
      $(K('content[Content View]').element()).html(
        templateDetails.values['SMS Content'],
      );

      K('field[Embedded Dirty]').value('YES');
    }
    if (triggerType === 'scriptTemplate') {
      if (newTemplate) {
        let options = K('field[Member Call Script]').options();
        options.push({
          label: templateDetails.values['Script Name'],
          value: templateDetails.id,
        });
        K('field[Member Call Script]').options(options);
        K('field[Member Call Script]').value(templateDetails.id);
      } else {
        let idx = K('field[Member Call Script]')
          .options()
          .findIndex(option => option.value === templateDetails.id);
        $(K('field[Member Call Script]').element())[0].options[idx].label =
          templateDetails.values['Script Name'];
      }
      K('field[Template Name]').value(templateDetails.values['Script Name']);
      $(K('content[Content View]').element()).html(
        templateDetails.values['Script'],
      );

      K('field[Embedded Dirty]').value('YES');
    }
  }
  render() {
    return (
      <div>
        {this.state.showEmailDialog && (
          <EmailTemplateContainer
            setShowEmailDialog={this.setShowEmailDialog}
            emailTemplateID={this.state.emailTemplateID}
            updateTriggerDetails={this.updateTriggerDetails}
            journeyTriggers={this.props.journeyTriggers}
          />
        )}
        {this.state.showSMSDialog && (
          <SMSTemplateContainer
            setShowSMSDialog={this.setShowSMSDialog}
            smsTemplateID={this.state.smsTemplateID}
            updateTriggerDetails={this.updateTriggerDetails}
            journeyTriggers={this.props.journeyTriggers}
          />
        )}
        {this.state.showScriptDialog && (
          <ScriptTemplateContainer
            target={this.props.targetType}
            setShowScriptDialog={this.setShowScriptDialog}
            scriptTemplateID={this.state.scriptTemplateID}
            updateTriggerDetails={this.updateTriggerDetails}
            journeyTriggers={this.props.journeyTriggers}
          />
        )}
        <div id="triggerFormLoading">
          <Loading text="Loading ..." />
        </div>
        <div className="new">
          <Fragment>
            <CoreForm
              form="journey-triggers"
              datastore
              onLoaded={this.handleNewLoaded}
              onCreated={this.handleCreated}
              error={this.handleError}
              globals={globals}
            />
          </Fragment>
        </div>
      </div>
    );
  }
}
export class BlockTriggers extends Component {
  constructor(props) {
    super(props);
    blockTriggerThis = this;

    var group = this.props.journeyGroups.find(
      group => group.id === this.props.id,
    );
    var triggerTypes = group.values['Trigger Events'].split(',');
    var triggerEvents = new Map();

    triggerTypes.forEach(eventName => {
      this.props.journeyTriggers.forEach(trigger => {
        if (
          this.props.type === 'Member' &&
          trigger.values['Member Condition'] === eventName
        ) {
          let triggers = triggerEvents.get(trigger.values['Member Condition']);
          if (triggers === undefined) {
            triggers = [];
            triggers.push(trigger);
            triggerEvents.set(trigger.values['Member Condition'], triggers);
          } else {
            triggers.push(trigger);
            triggerEvents.set(trigger.values['Member Condition'], triggers);
          }
        }
        if (
          this.props.type === 'Lead' &&
          trigger.values['Lead Condition'] === eventName
        ) {
          let triggers = triggerEvents.get(trigger.values['Lead Condition']);
          if (triggers === undefined) {
            triggers = [];
            triggers.push(trigger);
            triggerEvents.set(trigger.values['Lead Condition'], triggers);
          } else {
            triggers.push(trigger);
            triggerEvents.set(trigger.values['Lead Condition'], triggers);
          }
        }
      });
    });

    if (this.props.type === 'Member') {
      triggerEvents.forEach((value, key) => {
        value.sort(function(a, b) {
          if (
            parseInt(a.values['Member Condition Duration']) <
            parseInt(b.values['Member Condition Duration'])
          ) {
            return -1;
          } else if (
            parseInt(a.values['Member Condition Duration']) >
            parseInt(b.values['Member Condition Duration'])
          ) {
            return 1;
          }
          return 0;
        });
      });
    }
    if (this.props.type === 'Lead') {
      triggerEvents.forEach((value, key) => {
        value.sort(function(a, b) {
          if (
            parseInt(a.values['Lead Condition Duration']) <
            parseInt(b.values['Lead Condition Duration'])
          ) {
            return -1;
          } else if (
            parseInt(a.values['Lead Condition Duration']) >
            parseInt(b.values['Lead Condition Duration'])
          ) {
            return 1;
          }
          return 0;
        });
      });
    }

    this.state = {
      groupType: this.props.type,
      showBlock: true,
      editingTrigger: false,
      editingTriggerRecord: undefined,
      newTrigger: false,
      newTriggerRecordCondition: undefined,
      group: group,
      triggerTypes: triggerTypes,
      triggerEvents: triggerEvents,
      confirmClose: false,
    };
  }

  render() {
    return (
      <div className="blockTriggers">
        <div
          id={`block-${this.props.id}`}
          className="back fa fa-chevron-left"
          onClick={e => {
            if (this.state.editingTrigger) {
              if (K('field[Embedded Dirty]').value() === 'YES') {
                this.setState({
                  confirmClose: true,
                });
              } else {
                $(K('form').element()).remove();
                this.setState({
                  editingTrigger: false,
                  showBlock: true,
                });
              }
            } else if (this.state.newTrigger) {
              this.setState({
                confirmClose: true,
              });
            } else {
              this.props.closeBlockTriggers();
            }
          }}
        />
        <div className="header">
          <div className={`fa ${this.state.group.values['Icon']}`} />
          <div className="details">
            <div className="title">{this.state.group.values['Name']} </div>
            <div className="info">
              {this.state.group.values['Description']}{' '}
            </div>
          </div>
        </div>
        <PopConfirm
          target={`block-${this.props.id}`}
          placement="left"
          isOpen={this.state.confirmClose}
        >
          <p>
            <I18n>Close without saving changes?</I18n>
          </p>
          <Button
            color="primary"
            onClick={() => {
              $(K('form').element()).remove();
              this.setState({
                editingTrigger: false,
                newTrigger: false,
                showBlock: true,
                confirmClose: false,
              });
            }}
          >
            <I18n>Yes</I18n>
          </Button>
          <Button
            color="link"
            onClick={() => {
              this.setState({
                confirmClose: false,
              });
            }}
          >
            <I18n>No</I18n>
          </Button>
        </PopConfirm>
        {this.state.showBlock && (
          <div className="group">
            <div className="triggers">
              {this.state.triggerTypes.map((condition, idx) => (
                <span key={idx}>
                  <div className="triggerType">
                    <div className="typeName">{condition}</div>
                    <div
                      className="newTrigger"
                      onClick={e => {
                        this.setState({
                          showBlock: false,
                          editingTrigger: false,
                          editingTriggerRecord: undefined,
                          newTrigger: true,
                          newTriggerRecordCondition: condition,
                        });
                      }}
                    >
                      <span className="fa fa-fw fa-plus" />
                    </div>
                  </div>
                  <div className="triggerConditions">
                    <table>
                      <tbody>
                        {this.state.triggerEvents.get(condition) !==
                          undefined &&
                          this.state.triggerEvents
                            .get(condition)
                            .map((trigger, tIdx) => (
                              <tr
                                className={
                                  tIdx % 2 === 0
                                    ? 'eventRow even'
                                    : 'eventRow odd'
                                }
                                key={tIdx}
                              >
                                <td width="5%">
                                  {this.props.type === 'Member'
                                    ? trigger.values[
                                        'Member Condition Duration'
                                      ]
                                    : trigger.values['Lead Condition Duration']}
                                </td>
                                <td width="80%">
                                  {trigger.values['Template Name']}
                                </td>
                                <td width="40">
                                  <span
                                    className={
                                      trigger.values['Action'] === 'Alert'
                                        ? 'fa fa-fw fa-bell'
                                        : 'fa fa-fw fa-bolt'
                                    }
                                  />
                                </td>
                                <td width="40">
                                  <span
                                    className={
                                      trigger.values['Contact Type'] === 'Call'
                                        ? 'fa fa-fw fa-phone'
                                        : trigger.values['Contact Type'] ===
                                          'SMS'
                                          ? 'fa fa-fw fa-comment-o'
                                          : 'fa fa-fw fa-envelope-o'
                                    }
                                  />
                                </td>
                                <td>
                                  <TriggerStatus
                                    trigger={trigger}
                                    status={trigger.values['Status']}
                                    updateJourneyTrigger={
                                      this.props.updateJourneyTrigger
                                    }
                                  />
                                </td>
                                <td width="40">
                                  <TriggerDelete
                                    id={`trash-${trigger.id}`}
                                    trigger={trigger}
                                    deleteTrigger={this.props.deleteTrigger}
                                    journeyTriggers={this.props.journeyTriggers}
                                    triggerEvents={this.state.triggerEvents}
                                  />
                                </td>
                                <td width="40">
                                  <span
                                    className="edit fa fa-fw fa-edit"
                                    id={trigger.id}
                                    onClick={e => {
                                      this.setState({
                                        showBlock: false,
                                        editingTrigger: true,
                                        editingTriggerRecord: this.props.journeyTriggers.find(
                                          trigger =>
                                            trigger.id ===
                                            $(e.target).prop('id'),
                                        ),
                                        newTrigger: false,
                                        newTriggerRecordCondition: undefined,
                                      });
                                    }}
                                  />
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                </span>
              ))}
            </div>
          </div>
        )}
        {this.state.editingTrigger && (
          <TriggerForm
            id={this.state.editingTriggerRecord.id}
            targetType={this.props.type}
            journeyTriggers={this.props.journeyTriggers}
            handleLoaded={this.props.handleLoaded}
            handleUpdated={this.props.handleUpdated}
            handleError={this.props.handleError}
          />
        )}
        {this.state.newTrigger && (
          <NewTriggerForm
            targetType={this.props.type}
            journeyTriggers={this.props.journeyTriggers}
            handleNewLoaded={this.props.handleNewLoaded}
            handleCreated={this.props.handleCreated}
            handleError={this.props.handleError}
          />
        )}
      </div>
    );
  }
}
export class TriggerTypeBlocks extends Component {
  constructor(props) {
    super(props);
    this.closeBlockTriggers = this.closeBlockTriggers.bind(this);

    this.state = {
      groupType: this.props.type,
      showBlocks: false,
      showBlockTriggers: false,
    };
  }

  closeBlockTriggers() {
    this.setState({
      showBlocks: true,
      showBlockTriggers: false,
    });
  }
  render() {
    return (
      <div>
        {!this.state.showBlocks &&
          !this.state.showBlockTriggers && (
            <div
              className="block"
              onClick={e => {
                if (this.props.type === 'Member') {
                  this.props.setHideLeadBlock(true);
                  this.props.setHideActivityBlock(true);
                }
                if (this.props.type === 'Lead') {
                  this.props.setHideMemberBlock(true);
                  this.props.setHideActivityBlock(true);
                }
                this.props.setShowTriggerActivities(false);

                this.setState({
                  showBlocks: true,
                });
              }}
            >
              <div className="title">{this.props.title}</div>
              <div className="info">{this.props.info}</div>
            </div>
          )}
        {this.state.showBlocks && (
          <div className="blockGroups">
            <div
              className="back fa fa-chevron-left"
              onClick={e => {
                this.props.setHideMemberBlock(false);
                this.props.setHideLeadBlock(false);
                this.props.setHideActivityBlock(false);
                this.setState({
                  showBlocks: false,
                });
              }}
            />
            {this.props.journeyGroups
              .filter(
                group =>
                  group.values['Journey Type'] === this.props.type &&
                  (group.values['Name'] !== 'Meeting Calls' ||
                    (group.values['Name'] === 'Meeting Calls' &&
                      getAttributeValue(
                        this.props.space,
                        'Allow Meeting Calls',
                      ) === 'YES')),
              )
              .sort(function(a, b) {
                if (parseInt(a.values['Order']) < parseInt(b.values['Order'])) {
                  return -1;
                } else if (
                  parseInt(a.values['Order']) > parseInt(b.values['Order'])
                ) {
                  return 1;
                }
                return 0;
              })
              .map((group, idx) => (
                <div
                  className="group"
                  key={idx}
                  id={group.id}
                  onClick={e => {
                    let id = $(e.target)
                      .parents('.group')
                      .prop('id');
                    if (id === undefined) {
                      id = $(e.target).prop('id');
                    }
                    this.props.setShowTriggerActivities(false);
                    this.setState({
                      blockID: id,
                      showBlockTriggers: true,
                      showBlocks: false,
                    });
                  }}
                >
                  <div className={`fa ${group.values['Icon']}`} />
                  <div className="details">
                    <div className="title">{group.values['Name']} </div>
                    <div className="info">{group.values['Description']} </div>
                    <div className="eventTypes">
                      {group.values['Trigger Events']
                        .split(',')
                        .map((event, idx) => (
                          <span key={idx} className="event">
                            {event}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
        {this.state.showBlockTriggers && (
          <BlockTriggers
            id={this.state.blockID}
            type={this.props.type}
            journeyGroups={this.props.journeyGroups}
            journeyTriggers={this.props.journeyTriggers}
            updateJourneyTrigger={this.props.updateJourneyTrigger}
            deleteTrigger={this.props.deleteTrigger}
            closeBlockTriggers={this.closeBlockTriggers}
            handleLoaded={this.props.handleLoaded}
            handleNewLoaded={this.props.handleNewLoaded}
            handleCreated={this.props.handleCreated}
            handleUpdated={this.props.handleUpdated}
            handleError={this.props.handleError}
          />
        )}
      </div>
    );
  }
}

const JourneyTriggersComponent = ({
  space,
  journeyInfoLoading,
  journeyGroups,
  journeyTriggers,
  allLeads,
  leadsLoading,
  membersLoading,
  allMembers,
  handleLoaded,
  handleNewLoaded,
  handleCreated,
  handleUpdated,
  handleError,
  updateJourneyTrigger,
  deleteTrigger,
  isSpaceAdmin,
  hideMemberBlock,
  hideLeadBlock,
  hideActivityBlock,
  setHideMemberBlock,
  setHideLeadBlock,
  setHideActivityBlock,
  showTriggerActivities,
  setShowTriggerActivities,
}) =>
  journeyInfoLoading ? (
    <Loading text="Journey Triggers loading ..." />
  ) : (
    <div className="page-container page-container--space-profile">
      <PageTitle parts={['Journey Triggers']} />
      {!journeyInfoLoading && (
        <div className="page-panel page-panel--profile">
          <div className="page-title">
            <div className="page-title__wrapper">
              {isSpaceAdmin && (
                <h3>
                  <Link to="/">
                    <I18n>home</I18n>
                  </Link>{' '}
                  /
                </h3>
              )}
              <h1>
                <I18n>Journey Triggers</I18n>
              </h1>
            </div>
          </div>
          <div className="journeyTriggersContent">
            {!hideMemberBlock && (
              <TriggerTypeBlocks
                space={space}
                handleLoaded={handleLoaded}
                handleNewLoaded={handleNewLoaded}
                handleCreated={handleCreated}
                handleUpdated={handleUpdated}
                handleError={handleError}
                journeyGroups={journeyGroups}
                journeyTriggers={journeyTriggers}
                updateJourneyTrigger={updateJourneyTrigger}
                deleteTrigger={deleteTrigger}
                setHideMemberBlock={setHideMemberBlock}
                setHideLeadBlock={setHideLeadBlock}
                setHideActivityBlock={setHideActivityBlock}
                setShowTriggerActivities={setShowTriggerActivities}
                type={'Member'}
                title={'Members'}
                info={
                  'Edit and sms and email templates, de/activate, manage member journey triggers'
                }
              />
            )}
            {!hideLeadBlock && (
              <TriggerTypeBlocks
                space={space}
                handleLoaded={handleLoaded}
                handleNewLoaded={handleNewLoaded}
                handleCreated={handleCreated}
                handleUpdated={handleUpdated}
                handleError={handleError}
                journeyGroups={journeyGroups}
                journeyTriggers={journeyTriggers}
                updateJourneyTrigger={updateJourneyTrigger}
                deleteTrigger={deleteTrigger}
                setHideMemberBlock={setHideMemberBlock}
                setHideLeadBlock={setHideLeadBlock}
                setHideActivityBlock={setHideActivityBlock}
                setShowTriggerActivities={setShowTriggerActivities}
                type={'Lead'}
                title={'Leads'}
                info={
                  'Edit and sms and email templates, de/activate, manage lead journey triggers'
                }
              />
            )}
          </div>
          {!hideActivityBlock && (
            <div
              className="journeyTriggersContent"
              disabled={!leadsLoading && !membersLoading}
              onClick={e => {
                setHideMemberBlock(true);
                setHideLeadBlock(true);
                setHideActivityBlock(true);
                setShowTriggerActivities(true);
              }}
            >
              <div className="activity block">
                <div className="title">Journey Trigger Activity</div>
                <div className="info">
                  View all active Journey Triggers as well as all Journey
                  Triggers executed over a specified time period
                </div>
              </div>
            </div>
          )}
          {showTriggerActivities && (
            <TriggerEventActivityContainer
              journeyGroups={journeyGroups}
              journeyTriggers={journeyTriggers}
              allLeads={allLeads}
              allMembers={allMembers}
              setHideMemberBlock={setHideMemberBlock}
              setHideLeadBlock={setHideLeadBlock}
              setHideActivityBlock={setHideActivityBlock}
              setShowTriggerActivities={setShowTriggerActivities}
            />
          )}
        </div>
      )}
    </div>
  );

export const mapStateToProps = state => {
  return {
    space: state.member.app.space,
    journeyInfoLoading: state.space.journeyTriggers.journeyInfoLoading,
    journeyGroups: state.space.journeyTriggers.journeyGroups,
    journeyTriggers: state.space.journeyTriggers.journeyTriggers,
    allLeads: state.member.leads.allLeads,
    leadsLoading: state.member.leads.leadsLoading,
    allMembers: state.member.members.allMembers,
    membersLoading: state.member.members.membersLoading,
    memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
    membersNextPageToken: state.member.members.membersNextPageToken,
    memberLastFetchTime: state.member.members.memberLastFetchTime,
  };
};

export const mapDispatchToProps = {
  fetchJourneyInfo: actions.fetchJourneyInfo,
  updateJourneyTrigger: actions.updateJourneyTrigger,
  deleteTrigger: actions.deleteTrigger,
  fetchMembers: memberActions.fetchMembers,
  fetchLeads: leadActions.fetchLeads,
};

export const JourneyTriggers = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('hideMemberBlock', 'setHideMemberBlock', false),
  withState('hideLeadBlock', 'setHideLeadBlock', false),
  withState('hideActivityBlock', 'setHideActivityBlock', false),
  withState('showTriggerActivities', 'setShowTriggerActivities', false),
  withHandlers({
    handleUpdated,
    handleCreated,
    handleError,
    handleLoaded,
    handleNewLoaded,
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchJourneyInfo();
      this.props.fetchMembers({
        membersNextPageToken: this.props.membersNextPageToken,
        memberInitialLoadComplete: this.props.memberInitialLoadComplete,
        memberLastFetchTime: this.props.memberLastFetchTime,
      });
      if (this.props.allLeads.length === 0) {
        this.props.fetchLeads();
      }
    },
    UNSAFE_componentWillReceiveProps(nextProps) {},
  }),
)(JourneyTriggersComponent);

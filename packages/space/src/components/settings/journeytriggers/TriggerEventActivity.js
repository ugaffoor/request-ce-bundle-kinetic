import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import Select from 'react-select';

const globals = import('common/globals');

const mapStateToProps = state => ({});
const mapDispatchToProps = {};
var compThis = undefined;
const util = require('util');
export class TriggerEventActivity extends Component {
  constructor(props) {
    super(props);
    compThis = this;

    this.state = {};
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  getTriggerConditions(triggerEvents) {
    let conditions = [];

    triggerEvents
      .sort(function(a, b) {
        if (a.values['Record Type'] < b.values['Record Type']) {
          return -1;
        } else if (a.values['Record Type'] > b.values['Record Type']) {
          return 1;
        }
        return 0;
      })
      .map(trigger =>
        conditions.push({
          label: (
            <span>
              {trigger.values['Record Type']}
              {trigger.values['Contact Type'] === 'Call' ? (
                <span className="fa fa-fw fa-phone" />
              ) : trigger.values['Contact Type'] === 'SMS' ? (
                <span className="fa fa-fw fa-comment-o" />
              ) : (
                <span className="fa fa-fw fa-envelope-o" />
              )}
              {' - ' +
                (trigger.values['Record Type'] === 'Member'
                  ? trigger.values['Member Condition Duration'] +
                    ' ' +
                    trigger.values['Member Condition']
                  : trigger.values['Lead Condition Duration'] +
                    ' ' +
                    trigger.values['Lead Condition'])}
            </span>
          ),
          value: trigger.id,
          trigger: trigger,
        }),
      );

    return conditions;
  }
  render() {
    return (
      <div className="triggerActivity">
        <div
          className="back fa fa-chevron-left"
          onClick={e => {
            this.props.setHideMemberBlock(false);
            this.props.setHideLeadBlock(false);
            this.props.setHideActivityBlock(false);
            this.props.setShowTriggerActivities(false);
          }}
        />
        <div className="mainOptions">
          <div className="class">
            <label htmlFor="programClass">Trigger Conditions</label>
            <Select
              closeMenuOnSelect={true}
              options={this.getTriggerConditions(this.props.journeyTriggers)}
              styles={{
                option: base => ({
                  ...base,
                  width: '100%',
                }),
                input: base => ({
                  ...base,
                  width: '400px',
                }),
              }}
              className="triggerConditions"
              classNamePrefix="hide-columns"
              placeholder="Select Trigger Condition"
              onChange={e => {}}
            />
          </div>
        </div>
      </div>
    );
  }
}

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({}),
);

export const TriggerEventActivityContainer = enhance(TriggerEventActivity);

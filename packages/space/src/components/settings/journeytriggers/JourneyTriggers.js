import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { compose, lifecycle, withState } from 'recompose';
import { PageTitle } from 'common';
import { I18n } from '../../../../../app/src/I18nProvider';
import { actions } from '../../../redux/modules/journeyTriggers';
import phone from '../../../assets/images/phone.png';
import email from '../../../assets/images/mail.png';
import sms from '../../../assets/images/sms.png';

export class BlockTriggers extends Component {
  constructor(props) {
    super(props);

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
            a.values['Member Condition Duration'] <
            b.values['Member Condition Duration']
          ) {
            return -1;
          } else if (
            a.values['Member Condition Duration'] >
            b.values['Member Condition Duration']
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
            a.values['Lead Condition Duration'] <
            b.values['Lead Condition Duration']
          ) {
            return -1;
          } else if (
            a.values['Lead Condition Duration'] >
            b.values['Lead Condition Duration']
          ) {
            return 1;
          }
          return 0;
        });
      });
    }

    this.state = {
      groupType: this.props.type,
      showBlocks: false,
      group: group,
      triggerEvents: triggerEvents,
    };
  }

  render() {
    return (
      <div className="blockTriggers">
        <div
          className="back fa fa-chevron-left"
          onClick={e => {
            this.props.closeBlockTriggers();
          }}
        />
        <div className="group">
          <div className="header">
            <div className={`fa ${this.state.group.values['Icon']}`} />
            <div className="details">
              <div className="title">{this.state.group.values['Name']} </div>
              <div className="info">
                {this.state.group.values['Description']}{' '}
              </div>
            </div>
          </div>
          <div className="groupActions">
            <div className="actionCell">
              <img src={email} alt="Email" />
              <span>Email</span>
            </div>
            <div className="actionCell">
              <img src={sms} alt="SMS" />
              <span>SMS</span>
            </div>
            <div className="actionCell">
              <img src={phone} alt="Phone" />
              <span>Phone</span>
            </div>
          </div>
          <div className="triggers">
            {[...this.state.triggerEvents.keys()].map((condition, idx) => (
              <span key={idx}>
                <div className="triggerType">
                  <div className="typeName">{condition}</div>
                </div>
                <div className="triggerConditions">
                  {this.state.triggerEvents
                    .get(condition)
                    .map((trigger, tIdx) => (
                      <div className="eventRow" key={tIdx}>
                        {trigger.values['Template Name']}
                      </div>
                    ))}
                </div>
              </span>
            ))}
          </div>
        </div>
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
        {!this.state.showBlocks && !this.state.showBlockTriggers && (
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
              .filter(group => group.values['Journey Type'] === this.props.type)
              .map((group, idx) => (
                <div
                  className="group"
                  key={idx}
                  id={group.id}
                  onClick={e => {
                    this.setState({
                      blockID: $(e.target)
                        .parent()
                        .parent()
                        .prop('id'),
                      showBlockTriggers: true,
                      showBlocks: false,
                    });
                  }}
                >
                  <div className={`fa ${group.values['Icon']}`} />
                  <div className="details">
                    <div className="title">{group.values['Name']} </div>
                    <div className="info">{group.values['Description']} </div>
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
            closeBlockTriggers={this.closeBlockTriggers}
          />
        )}
      </div>
    );
  }
}

const JourneyTriggersComponent = ({
  journeyInfoLoading,
  journeyGroups,
  journeyTriggers,
  isSpaceAdmin,
  hideMemberBlock,
  hideLeadBlock,
  hideActivityBlock,
  setHideMemberBlock,
  setHideLeadBlock,
  setHideActivityBlock,
}) => (
  <div className="page-container page-container--space-profile">
    <PageTitle parts={['Profile']} />
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
              journeyGroups={journeyGroups}
              journeyTriggers={journeyTriggers}
              setHideMemberBlock={setHideMemberBlock}
              setHideLeadBlock={setHideLeadBlock}
              setHideActivityBlock={setHideActivityBlock}
              type={'Member'}
              title={'Members'}
              info={
                'Edit and sms and email templates, de/activate, manage member journey triggers'
              }
            />
          )}
          {!hideLeadBlock && (
            <TriggerTypeBlocks
              journeyGroups={journeyGroups}
              journeyTriggers={journeyTriggers}
              setHideMemberBlock={setHideMemberBlock}
              setHideLeadBlock={setHideLeadBlock}
              setHideActivityBlock={setHideActivityBlock}
              type={'Lead'}
              title={'Leads'}
              info={
                'Edit and sms and email templates, de/activate, manage lead journey triggers'
              }
            />
          )}
        </div>
        {!hideActivityBlock && (
          <div className="journeyTriggersContent">
            <div className="activity block">
              <div className="title">Journey Trigger Activity</div>
              <div className="info">
                View all active Journey Triggers as well as all Journey Triggers
                executed over a specified time period
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

export const mapStateToProps = state => {
  return {
    journeyInfoLoading: state.space.journeyTriggers.journeyInfoLoading,
    journeyGroups: state.space.journeyTriggers.journeyGroups,
    journeyTriggers: state.space.journeyTriggers.journeyTriggers,
  };
};

export const mapDispatchToProps = {
  fetchJourneyInfo: actions.fetchJourneyInfo,
  updateJourneyTrigger: actions.updateJourneyTrigger,
};

export const JourneyTriggers = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('hideMemberBlock', 'setHideMemberBlock', false),
  withState('hideLeadBlock', 'setHideLeadBlock', false),
  withState('hideActivityBlock', 'setHideActivityBlock', false),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchJourneyInfo();
    },
    UNSAFE_componentWillReceiveProps(nextProps) {},
  }),
)(JourneyTriggersComponent);

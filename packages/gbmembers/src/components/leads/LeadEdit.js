import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/leads';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';
import $ from 'jquery';
import NumberFormat from 'react-number-format';
import { handleChange, handleFormattedChange } from './LeadsUtils';
import { Confirm } from 'react-confirm-bootstrap';
import { StatusMessagesContainer } from '../StatusMessages';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  leadItem: state.member.leads.currentLead,
  currentLeadLoading: state.member.leads.currentLeadLoading,
});
const mapDispatchToProps = {
  fetchLead: actions.fetchCurrentLead,
  updateLead: actions.updateLead,
  fetchLeads: actions.fetchLeads,
  deleteLead: actions.deleteLead,
};

export class LeadEdit extends Component {
  constructor(props) {
    super(props);
    this.saveLead = this.props.saveLead;
    this.removeLead = this.props.removeLead;
    this.setIsDirty = this.props.setIsDirty;
  }

  componentWillReceiveProps(nextProps) {}

  render() {
    return (
      <div className="leadEditDetails memberEditDetails">
        <StatusMessagesContainer />
        <div className="general">
          <div className="userDetails">
            <div className="section1">
              <h3>Edit Lead</h3>
              <hr />
              <span className="line">
                <div
                  className="form-group form-inline"
                  style={{ width: 'auto' }}
                >
                  <label
                    htmlFor="source"
                    required={
                      this.props.leadItem.values['Source'] === undefined
                        ? true
                        : false
                    }
                  >
                    Lead referred via:
                  </label>
                  <select
                    name="source"
                    id="source"
                    className="form-group"
                    style={{ marginLeft: '10px' }}
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Source']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source',
                        e,
                        this.setIsDirty,
                      )
                    }
                  >
                    <option value="" />
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Google+">Google+</option>
                    <option value="Linkedin">Linkedin</option>
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Magazine">Magazine</option>
                    <option value="Newspaper">Newspaper</option>
                    <option value="Television">Television</option>
                    <option value="Brochure">Brochure</option>
                    <option value="Leaflet">Leaflet</option>
                    <option value="Poster">Poster</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Website">Website</option>
                    <option value="Word of Mouth">Word of Mouth</option>
                    <option value="Walk-In">Walk-In</option>
                    <option value="Other Advertising">Other Advertising</option>
                  </select>
                  <span className="droparrow" />
                </div>
                <div
                  className="form-group form-inline"
                  style={{ width: 'auto', margin: '15px 3px !important' }}
                >
                  <label
                    htmlFor="date"
                    required={
                      this.props.leadItem.values['Date'] === undefined
                        ? true
                        : false
                    }
                  >
                    On
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    style={{ marginLeft: '10px' }}
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Date']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Date',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="firstName"
                    required={
                      this.props.leadItem.values['First Name'] === undefined
                        ? true
                        : false
                    }
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['First Name']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'First Name',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    required={
                      this.props.leadItem.values['Last Name'] === undefined
                        ? true
                        : false
                    }
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastNames"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Last Name']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Last Name',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    required={
                      this.props.leadItem.values['Gender'] === undefined
                        ? true
                        : false
                    }
                  >
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Gender']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Gender',
                        e,
                        this.setIsDirty,
                      )
                    }
                  >
                    <option value="" />
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="address"
                    required={
                      this.props.leadItem.values['Address'] === undefined
                        ? true
                        : false
                    }
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    size="80"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Address']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Address',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="suburb"
                    required={
                      this.props.leadItem.values['Suburb'] === undefined
                        ? true
                        : false
                    }
                  >
                    Suburb
                  </label>
                  <input
                    type="text"
                    name="suburb"
                    id="suburb"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Suburb']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Suburb',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="State"
                    required={
                      this.props.leadItem.values['State'] === undefined
                        ? true
                        : false
                    }
                  >
                    State
                  </label>
                  <select
                    name="state"
                    id="state"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['State']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'State',
                        e,
                        this.setIsDirty,
                      )
                    }
                  >
                    <option value="" />
                    <option value="ACT">ACT</option>
                    <option value="NSW">NSW</option>
                    <option value="NT">NT</option>
                    <option value="QLD">QLD</option>
                    <option value="TAS">TAS</option>
                    <option value="VIC">VIC</option>
                    <option value="WA">WA</option>
                  </select>
                  <div className="droparrow" />
                </div>
                <div>
                  <label
                    htmlFor="postcode"
                    required={
                      this.props.leadItem.values['Postcode'] === undefined
                        ? true
                        : false
                    }
                  >
                    Postcode
                  </label>
                  <NumberFormat
                    format="####"
                    mask="_"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Postcode']}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        this.props.leadItem,
                        'Postcode',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div className="emailDiv">
                  <label
                    htmlFor="email"
                    required={
                      this.props.leadItem.values['Email'] === null
                        ? true
                        : false
                    }
                  >
                    Email
                  </label>
                  <input
                    type="text"
                    name="email"
                    id="email"
                    size="40"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Email']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Email',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    required={
                      this.props.leadItem.values['Phone'] === undefined
                        ? true
                        : false
                    }
                  >
                    Phone
                  </label>
                  <NumberFormat
                    format="+1 (###) ###-####"
                    mask="_"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Phone']}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        this.props.leadItem,
                        'Phone',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="birthday"
                    required={
                      this.props.leadItem.values['DOB'] === undefined
                        ? true
                        : false
                    }
                  >
                    Birthday
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    id="birthday"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['DOB']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'DOB',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="sourceReference1">Source Reference 1</label>
                  <input
                    type="text"
                    name="sourceReference1"
                    id="sourceReference1"
                    size="20"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['Source Reference 1']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source Reference 1',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
                <div>
                  <label htmlFor="sourceReference2">Source Reference 2</label>
                  <input
                    type="text"
                    name="sourceReference2"
                    id="sourceReference2"
                    size="20"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['Source Reference 2']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source Reference 2',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
                <div>
                  <label htmlFor="sourceReference3">Source Reference 3</label>
                  <select
                    name="sourceReference3"
                    id="sourceReference3"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['Source Reference 3']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source Reference 3',
                        e,
                        this.setIsDirty,
                      )
                    }
                  >
                    <option value="" />
                    <option value="Adult">Adult</option>
                    <option value="Kids">Kids</option>
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
            </div>
            <div className="section4">
              <span className="line">
                <br />
                <span className="leftButtons">
                  <Confirm
                    onConfirm={e => this.removeLead()}
                    body="Are you sure you want to delete this lead?"
                    confirmText="Confirm Delete"
                    title="Deleting Lead"
                  >
                    <button
                      type="button"
                      id="deleteButton"
                      className="btn btn-primary"
                    >
                      Delete
                    </button>
                  </Confirm>
                </span>
                <span className="rightButtons">
                  <NavLink
                    to={`/LeadDetail/${this.props.leadItem['id']}`}
                    className="btn btn-primary"
                  >
                    Cancel
                  </NavLink>
                  <button
                    type="button"
                    id="saveButton"
                    className={
                      this.props.isDirty
                        ? 'btn btn-primary dirty'
                        : 'btn btn-primary notDirty disabled'
                    }
                    onClick={e => this.saveLead(this.props.leadItem)}
                  >
                    Save
                  </button>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const LeadEditView = ({
  leadItem,
  saveLead,
  removeLead,
  currentLeadLoading,
  isDirty,
  setIsDirty,
}) =>
  currentLeadLoading ? (
    <div />
  ) : (
    <LeadEdit
      leadItem={leadItem}
      saveLead={saveLead}
      removeLead={removeLead}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
    />
  );

export const LeadEditContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(() => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({
    saveLead: ({ updateLead, fetchLeads, isDirty }) => leadItem => {
      if (!isDirty) {
        return;
      }
      if ($('label[required]').length > 0) {
        $('label[required]')
          .siblings('input[required]')
          .css('border-color', 'red');
        $('label[required]')
          .siblings('select[required]')
          .css('border-color', 'red');
        $('label[required]')
          .siblings('input[required]')
          .first()
          .focus();
      } else {
        updateLead({
          id: leadItem['id'],
          leadItem: leadItem,
          history: leadItem.history,
          fetchLeads: fetchLeads,
        });
      }
    },
    removeLead: ({ leadItem, deleteLead, fetchLeads }) => () => {
      leadItem.values['Status'] = 'Closed';
      deleteLead({
        leadItem: leadItem,
        history: leadItem.history,
        fetchLeads: fetchLeads,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchLead({
        id: this.props.match.params['id'],
        myThis: this,
        history: this.props.history,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchLead({
          id: this.props.match.params['id'],
          myThis: this,
          history: this.props.history,
        });
      }
      //$(".leadEditDetails input").val("");
      //$(".leadEditDetails select").val("");
      $(
        '.leadEditDetails input[required],.leadEditDetails select[required]',
      ).each(function() {
        if (
          $(this).val() === undefined ||
          $(this).val() === null ||
          $(this).val() === ''
        ) {
          $(this)
            .siblings('label')
            .attr('required', 'required');
        } else {
          $(this)
            .siblings('label')
            .removeAttr('required');
          $(this).css('border-color', '');
        }
      });
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(LeadEditView);

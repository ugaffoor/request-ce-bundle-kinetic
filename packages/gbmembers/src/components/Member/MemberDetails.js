import React from 'react';
import {
  getAttributeValue,
  setAttributeValue,
} from '../../lib/react-kinops-components/src/utils';
import { KappNavLink as NavLink } from 'common';
import { PhotoForm } from '../PhotoForm';
import $ from 'jquery';
import { StatusMessagesContainer } from '../StatusMessages';

export function handleChange(memberItem, key, event) {
  if (memberItem[key]) {
    memberItem[key] = event.target.value;
  } else {
    setAttributeValue(memberItem, key, event.target.value);
  }
  if ($(event.target).attr('required')) {
    var val = getAttributeValue(memberItem, key);
    if (val === undefined || val === null) {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
    }
  }
}

export class MemberDetails extends React.Component {
  constructor(props) {
    super(props);
    this.memberItem = props.memberItem;
    this.saveMember = props.saveMember;
    this.callback = props.callback;
    this.newMember = props.newMember;
  }
  render() {
    return (
      <div className="memberEditDetails">
        <StatusMessagesContainer />
        <div className="general">
          <div className="userDetails">
            <div className="section1">
              {getAttributeValue(this.memberItem, 'First Name') ===
              undefined ? (
                <h1> New Member Profile </h1>
              ) : (
                <h1>
                  Editing {getAttributeValue(this.memberItem, 'First Name')}
                  's Profile'
                </h1>
              )}
              <hr />
              <span className="line">
                <div>
                  <label
                    htmlFor="username"
                    required={
                      this.memberItem.username === undefined ? true : false
                    }
                  >
                    Member ID
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    disabled={!this.newMember}
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.memberItem.username}
                    onChange={e => handleChange(this.memberItem, 'username', e)}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="firstName"
                    required={
                      getAttributeValue(this.memberItem, 'First Name') ===
                      undefined
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
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'First Name',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'First Name', e)
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    required={
                      getAttributeValue(this.memberItem, 'Last Name') ===
                      undefined
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
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Last Name',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'Last Name', e)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="gender">Gender</label>
                  <select
                    name="gender"
                    id="gender"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(this.memberItem, 'Gender')}
                    onChange={e => handleChange(this.memberItem, 'Gender', e)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <div className="droparrow" />
                </div>
                <span id="photoForm">
                  <PhotoForm memberItem={this.memberItem} />
                </span>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="address"
                    required={
                      getAttributeValue(this.memberItem, 'Address') ===
                      undefined
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
                    defaultValue={getAttributeValue(this.memberItem, 'Address')}
                    onChange={e => handleChange(this.memberItem, 'Address', e)}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="suburb"
                    required={
                      getAttributeValue(this.memberItem, 'Suburb') === undefined
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
                    defaultValue={getAttributeValue(this.memberItem, 'Suburb')}
                    onChange={e => handleChange(this.memberItem, 'Suburb', e)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="State"
                    required={
                      getAttributeValue(this.memberItem, 'State') === undefined
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
                    defaultValue={getAttributeValue(this.memberItem, 'State')}
                    onChange={e => handleChange(this.memberItem, 'State', e)}
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
                      getAttributeValue(this.memberItem, 'Postcode') ===
                      undefined
                        ? true
                        : false
                    }
                  >
                    Postcode
                  </label>
                  <input
                    type="text"
                    name="postcode"
                    id="postcode"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Postcode',
                    )}
                    onChange={e => handleChange(this.memberItem, 'Postcode', e)}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="email"
                    hmm="jj"
                    required={this.memberItem.email === null ? true : false}
                  >
                    Email
                  </label>
                  <input
                    type="text"
                    name="email"
                    id="email"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.memberItem.email}
                    onChange={e => handleChange(this.memberItem, 'email', e)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    required={
                      getAttributeValue(this.memberItem, 'Phone Number') ===
                      undefined
                        ? true
                        : false
                    }
                  >
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Phone Number',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'Phone Number', e)
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="datejoined">Date Joined</label>
                  <input
                    type="date"
                    name="datejoined"
                    id="datejoined"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Date Joined',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'Date Joined', e)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="birthday">Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    id="birthday"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(this.memberItem, 'DOB')}
                    onChange={e => handleChange(this.memberItem, 'DOB', e)}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="membertype">Member Type:</label>
                  <select
                    name="membertype"
                    id="membertype"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Member Type',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'Member Type', e)
                    }
                  >
                    <option value="Student">Student</option>
                    <option value="Coach">Coach</option>
                    <option value="Trainee Coach">Trainee Coach</option>
                    <option value="Administration">Administration</option>
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
            </div>
            <div className="section2">
              <h1>Emergency Contact Information</h1>
              <hr />
              <span className="line">
                <div>
                  <label htmlFor="emergencyname">Name</label>
                  <input
                    type="text"
                    size="40"
                    name="emergencyname"
                    id="emergencyname"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Emergency Contact Name',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'Emergency Contact Name', e)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="relationship">Relationship</label>
                  <input
                    type="text"
                    size="40"
                    name="relationship"
                    id="relationship"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Emergency Contact Relationship',
                    )}
                    onChange={e =>
                      handleChange(
                        this.memberItem,
                        'Emergency Contact Relationship',
                        e,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="emergencyphone">Phone</label>
                  <input
                    type="text"
                    size="40"
                    name="emergencyphone"
                    id="emergencyphone"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Emergency Contact Phone',
                    )}
                    onChange={e =>
                      handleChange(
                        this.memberItem,
                        'Emergency Contact Phone',
                        e,
                      )
                    }
                  />
                </div>
                <div>
                  <label htmlFor="alergies">Medical / Allergies</label>
                  <input
                    type="text"
                    size="40"
                    name="alergies"
                    id="alergies"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Medical Allergies',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'Medical Allergies', e)
                    }
                  />
                </div>
              </span>
            </div>
            <div className="section3">
              <h1>Ranking</h1>
              <hr />
              <span className="line">
                <div>
                  <label htmlFor="program">Program</label>
                  <select
                    name="program"
                    id="program"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Ranking Program',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'Ranking Program', e)
                    }
                  >
                    <option value="Fundamentals">Fundamentals</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Black Belt Program">
                      Black Belt Program
                    </option>
                    <option value="GBK LC1">GBK LC1</option>
                    <option value="GBK LC2">GBK LC2</option>
                    <option value="GBK Juniors">GBK Juniors</option>
                  </select>
                  <div className="droparrow" />
                </div>
                <div>
                  <label htmlFor="belt">Belt</label>
                  <select
                    name="belt"
                    id="belt"
                    ref={input => (this.input = input)}
                    defaultValue={getAttributeValue(
                      this.memberItem,
                      'Ranking Belt',
                    )}
                    onChange={e =>
                      handleChange(this.memberItem, 'Ranking Belt', e)
                    }
                  >
                    <option value="White Belt">White Belt</option>
                    <option value="White Belt 1 Stripe">
                      White Belt 1 Stripe
                    </option>
                    <option value="White Belt 2 Stripe">
                      White Belt 2 Stripe
                    </option>
                    <option value="White Belt 3 Stripe">
                      White Belt 3 Stripe
                    </option>
                    <option value="White Belt 4 Stripe">
                      White Belt 4 Stripe
                    </option>
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
            </div>
            <div className="section4">
              <span className="line">
                <span className="buttons">
                  {this.newMember ? (
                    <NavLink to={`/Home`} className="btn btn-primary">
                      Cancel
                    </NavLink>
                  ) : (
                    <NavLink
                      to={`/Member/${this.memberItem.username}`}
                      className="btn btn-primary"
                    >
                      Cancel
                    </NavLink>
                  )}
                  <button
                    type="button"
                    id="saveButton"
                    className="btn btn-primary"
                    onClick={e =>
                      this.saveMember(this.memberItem, this.callback)
                    }
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

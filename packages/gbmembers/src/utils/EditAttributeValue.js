import React, { Component } from 'react';
import {
  getAttributeValue,
  setAttributeValue,
} from '../lib/react-kinops-components/src/utils';
import { ReactComponent as HelpIcon } from '../images/help.svg';
import NumberFormat from 'react-number-format';
import { I18n } from '@kineticdata/react';
import Creatable from 'react-select';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import DayPicker, { DateUtils } from 'react-day-picker/DayPicker';
import 'react-day-picker/lib/style.css';
import { getLocalePreference } from '../components/Member/MemberUtils';
import $ from 'jquery';

const components = {
  DropdownIndicator: null,
};

export class EditAttributeValue extends Component {
  constructor(props) {
    super(props);
    this.toggleArrayValue = this.toggleArrayValue.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDatesSelection = this.handleDatesSelection.bind(this);
    this.handleDateSelected = this.handleDateSelected.bind(this);

    var value =
      getAttributeValue(this.props.space, this.props.attributeName) !==
      undefined
        ? getAttributeValue(this.props.space, this.props.attributeName)
        : '';
    var origValue =
      getAttributeValue(this.props.space, this.props.attributeName) !==
      undefined
        ? getAttributeValue(this.props.space, this.props.attributeName)
        : '';

    var optionsValue = [];
    var percentageTextValue = '';
    var datesSelected = [];

    if (this.props.inputType === 'EditList') {
      let values =
        getAttributeValue(this.props.space, this.props.attributeName) !==
        undefined
          ? getAttributeValue(this.props.space, this.props.attributeName).split(
              ';',
            )
          : [];
      values.forEach(item => {
        if (item.trim() !== '')
          optionsValue.push({ label: item.trim(), value: item.trim() });
      });
      console.log(values);
    }
    if (this.props.inputType === 'PercentageText') {
      let value = getAttributeValue(this.props.space, this.props.attributeName);
      if (value !== undefined && value !== '') {
        value = value.replace('%', '');
        value = parseFloat(value) / 100;
        percentageTextValue = value;
      }
    }
    if (this.props.inputType === 'Date') {
      if (value === undefined || value === '') {
        value = '';
        origValue = '';
      } else {
        value = moment(value).format('YYYY-MM-DD');
        origValue = value;
      }
    }
    if (this.props.inputType === 'MultipleDates') {
      if (value === undefined) {
        value = '';
        origValue = '';
      } else {
        var valueItems = value.split(',');
        valueItems.forEach(date => {
          if (moment(date, 'YYYY-MM-DD').isAfter(moment())) {
            datesSelected.push(moment(date, 'YYYY-MM-DD').toDate());
          }
        });
        // Reset value and origValue
        value = '';
        datesSelected.forEach(date => {
          if (value.length > 0) {
            value = value + ',';
          }
          value = value + moment(date).format('YYYY-MM-DD');
        });
        origValue = value;
      }
    }
    this.state = {
      value: value,
      origValue: origValue,
      optionsValue,
      newValue: '',
      inputValue: '',
      percentageTextValue,
      datesSelected: datesSelected,
    };
  }
  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        let optionsValue = [
          ...this.state.optionsValue,
          { label: this.state.inputValue, value: this.state.inputValue },
        ];
        let value = '';
        optionsValue.forEach(item => {
          if (value !== '') {
            value = value + ';';
          }
          value = value + item.value;
        });
        this.setState({
          optionsValue: optionsValue,
          inputValue: '',
          value: value,
        });

        event.preventDefault();
    }
  }
  toggleArrayValue(attrValue, value) {
    if (attrValue.indexOf(value) === -1) {
      if (attrValue.length > 0) {
        attrValue = attrValue + ',' + value;
      } else {
        attrValue = value;
      }
    } else {
      var items = attrValue.split(',');
      attrValue = '';
      items.forEach(item => {
        if (item !== value) {
          if (attrValue.length > 0) {
            attrValue = attrValue + ',';
          }
          attrValue = attrValue + item;
        }
      });
    }
    this.setState({
      value: attrValue,
    });
  }
  handleDateSelected(selectedDay, modifiers, dayPickerInput) {
    var value = selectedDay;
    this.setState({
      value: value !== undefined ? moment(value).format('YYYY-MM-DD') : '',
    });
  }
  handleDatesSelection(day, { selected }) {
    const datesSelected = this.state.datesSelected.concat();
    if (selected) {
      const selectedIndex = datesSelected.findIndex(selectedDay =>
        DateUtils.isSameDay(selectedDay, day),
      );
      datesSelected.splice(selectedIndex, 1);
    } else {
      datesSelected.push(day);
    }
    var value = '';
    datesSelected.forEach(date => {
      if (value.length > 0) {
        value = value + ',';
      }
      value = value + moment(date).format('YYYY-MM-DD');
    });

    this.setState({
      datesSelected,
      value,
    });
  }
  render() {
    return (
      <div className="attributeLine">
        <div className="lineItems">
          <span className="value">
            <I18n>{this.props.labelName}</I18n>
          </span>
          <HelpIcon
            className="icon icon-svg help"
            onClick={e => {
              $('.' + this.props.attributeID + 'Help').toggle('');
            }}
          />
          {this.props.inputType === 'Text' && (
            <input
              type="text"
              id={this.props.attributeID + 'Attribute'}
              defaultValue={this.state.origValue}
              name={this.props.attributeID + 'Attribute'}
              style={{ width: `${this.props.width}` }}
              disabled={this.props.disabled ? true : false}
              onChange={e => {
                this.setState({
                  value: e.target.value,
                });
              }}
            />
          )}
          {this.props.inputType === 'Integer' && (
            <input
              type="number"
              id={this.props.attributeID + 'Attribute'}
              defaultValue={this.state.origValue}
              name={this.props.attributeID + 'Attribute'}
              style={{ width: `${this.props.width}` }}
              disabled={this.props.disabled ? true : false}
              onChange={e => {
                this.setState({
                  value: e.target.value,
                });
              }}
            />
          )}
          {this.props.inputType === 'Percentage' && (
            <NumberFormat
              id={this.props.attributeID + 'Attribute'}
              value={this.state.value != '' ? this.state.value * 100 : ''}
              style={{ width: `${this.props.width}` }}
              suffix="%"
              decimalScale={2}
              onChange={e => {
                this.setState({
                  value: parseFloat(e.target.value) / 100,
                });
              }}
            />
          )}
          {this.props.inputType === 'PercentageText' && (
            <NumberFormat
              id={this.props.attributeID + 'Attribute'}
              value={
                this.state.percentageTextValue != ''
                  ? this.state.percentageTextValue * 100
                  : ''
              }
              style={{ width: `${this.props.width}` }}
              suffix="%"
              decimalScale={2}
              onChange={e => {
                this.setState({
                  percentageTextValue: parseFloat(e.target.value) / 100,
                  value: e.target.value,
                });
              }}
            />
          )}
          {this.props.inputType === 'adminFee' && (
            <span className="ignoreAdminFee">
              <input
                type="checkbox"
                id={this.props.attributeID + 'Attribute'}
                value="YES"
                checked={this.state.value === 'YES' ? true : false}
                name={this.props.attributeID + 'Attribute'}
                onChange={e => {
                  this.setState({
                    value: e.target.checked ? 'YES' : undefined,
                  });
                  this.props.ignoreAdminFee(e.target.checked);
                }}
              />
              <label htmlFor={this.props.attributeID + 'Attribute'}>
                Ignore Admin Fee
              </label>
            </span>
          )}
          {this.props.inputType === 'yesToggleValue' && (
            <span className="yesToggleValue">
              <input
                type="checkbox"
                id={this.props.attributeID + 'Attribute'}
                value="YES"
                checked={this.state.value === 'YES' ? true : false}
                name={this.props.attributeID + 'Attribute'}
                onChange={e => {
                  this.setState({
                    value: e.target.checked ? 'YES' : undefined,
                  });
                }}
              />
            </span>
          )}
          {this.props.inputType === 'Phone' && (
            <NumberFormat
              id={this.props.attributeID + 'Attribute'}
              format={
                getAttributeValue(this.props.space, 'PhoneNumber Format') !==
                undefined
                  ? getAttributeValue(this.props.space, 'PhoneNumber Format')
                  : '####-###-###'
              }
              mask="_"
              value={this.state.value}
              disabled={this.props.disabled ? true : false}
              onChange={e => {
                this.setState({
                  value: e.target.value.replaceAll('-', ''),
                });
              }}
            />
          )}
          {this.props.inputType === 'paymentFrequencies' && (
            <span className="paymentFrequencies">
              <input
                type="checkbox"
                id={this.props.attributeID + 'Attribute' + 'Weekly'}
                value="Weekly"
                checked={
                  this.state.value.indexOf('Weekly') !== -1 ? true : false
                }
                name={this.props.attributeID + 'Attribute' + 'Weekly'}
                onChange={e => {
                  this.toggleArrayValue(this.state.value, e.target.value);
                }}
              />
              <label htmlFor={this.props.attributeID + 'Attribute' + 'Weekly'}>
                Weekly
              </label>
              <input
                type="checkbox"
                id={this.props.attributeID + 'Attribute' + 'Fortnightly'}
                value="Fortnightly"
                checked={
                  this.state.value.indexOf('Fortnightly') !== -1 ? true : false
                }
                name={this.props.attributeID + 'Attribute' + 'Fortnightly'}
                onChange={e => {
                  this.toggleArrayValue(this.state.value, e.target.value);
                }}
              />
              <label
                htmlFor={this.props.attributeID + 'Attribute' + 'Fortnightly'}
              >
                <I18n>Fortnightly</I18n>
              </label>
              <input
                type="checkbox"
                id={this.props.attributeID + 'Attribute' + 'Monthly'}
                value="Monthly"
                checked={
                  this.state.value.indexOf('Monthly') !== -1 ? true : false
                }
                name={this.props.attributeID + 'Attribute' + 'Monthly'}
                onChange={e => {
                  this.toggleArrayValue(this.state.value, e.target.value);
                }}
              />
              <label htmlFor={this.props.attributeID + 'Attribute' + 'Monthly'}>
                <I18n>Monthly</I18n>
              </label>
              <input
                type="checkbox"
                id={this.props.attributeID + 'Attribute' + 'Quarterly'}
                value="Quarterly"
                checked={
                  this.state.value.indexOf('Quarterly') !== -1 ? true : false
                }
                name={this.props.attributeID + 'Attribute' + 'Quarterly'}
                onChange={e => {
                  this.toggleArrayValue(this.state.value, e.target.value);
                }}
              />
              <label
                htmlFor={this.props.attributeID + 'Attribute' + 'Quarterly'}
              >
                <I18n>Quarterly</I18n>
              </label>
              {getAttributeValue(this.props.space, 'Billing Company') ===
                'Bambora' && (
                <span>
                  <input
                    type="checkbox"
                    id={this.props.attributeID + 'Attribute' + '4 Months'}
                    value="4 Months"
                    checked={
                      this.state.value.indexOf('4 Months') !== -1 ? true : false
                    }
                    name={this.props.attributeID + 'Attribute' + '4 Months'}
                    onChange={e => {
                      this.toggleArrayValue(this.state.value, e.target.value);
                    }}
                  />
                  <label
                    htmlFor={this.props.attributeID + 'Attribute' + '4 Months'}
                  >
                    <I18n>4 Months</I18n>
                  </label>
                </span>
              )}
              {getAttributeValue(this.props.space, 'Billing Company') ===
                'Bambora' && (
                <span>
                  <input
                    type="checkbox"
                    id={this.props.attributeID + 'Attribute' + '6 Months'}
                    value="6 Months"
                    checked={
                      this.state.value.indexOf('6 Months') !== -1 ? true : false
                    }
                    name={this.props.attributeID + 'Attribute' + '6 Months'}
                    onChange={e => {
                      this.toggleArrayValue(this.state.value, e.target.value);
                    }}
                  />
                  <label
                    htmlFor={this.props.attributeID + 'Attribute' + '6 Months'}
                  >
                    <I18n>6 Months</I18n>
                  </label>
                </span>
              )}
              {getAttributeValue(this.props.space, 'Billing Company') ===
                'Bambora' && (
                <span>
                  <input
                    type="checkbox"
                    id={this.props.attributeID + 'Attribute' + 'Yearly'}
                    value="Yearly"
                    checked={
                      this.state.value.indexOf('Yearly') !== -1 ? true : false
                    }
                    name={this.props.attributeID + 'Attribute' + 'Yearly'}
                    onChange={e => {
                      this.toggleArrayValue(this.state.value, e.target.value);
                    }}
                  />
                  <label
                    htmlFor={this.props.attributeID + 'Attribute' + 'Yearly'}
                  >
                    <I18n>Yearly</I18n>
                  </label>
                </span>
              )}
            </span>
          )}
          {this.props.inputType === 'EditList' && (
            <Creatable
              components={components}
              inputValue={this.state.inputValue}
              isClearable
              isMulti
              menuIsOpen={false}
              placeholder="Type something and press enter..."
              value={this.state.optionsValue}
              onChange={newValue => {
                let value = '';
                newValue.forEach(item => {
                  if (value !== '') {
                    value = value + ';';
                  }
                  value = value + item.value;
                });

                this.setState({
                  optionsValue: newValue,
                  value: value,
                });
              }}
              onInputChange={newValue =>
                this.setState({ inputValue: newValue })
              }
              onKeyDown={this.handleKeyDown}
              styles={{
                input: base => ({
                  ...base,
                  width: '400px',
                  maxWidth: '400px',
                }),
              }}
            />
          )}
          {this.props.inputType === 'Date' && (
            <DayPickerInput
              name={this.props.attributeID + 'Attribute'}
              id={this.props.attributeID + 'Attribute'}
              placeholder={moment(new Date())
                .locale(
                  getLocalePreference(this.props.space, this.props.profile),
                )
                .localeData()
                .longDateFormat('L')
                .toLowerCase()}
              formatDate={formatDate}
              parseDate={parseDate}
              value={this.state.value}
              onDayChange={this.handleDateSelected}
              dayPickerProps={{
                locale: getLocalePreference(
                  this.props.space,
                  this.props.profile,
                ),
                localeUtils: MomentLocaleUtils,
              }}
            />
          )}
          {this.props.inputType === 'MultipleDates' && (
            <DayPicker
              name={this.props.attributeID + 'Attribute'}
              id={this.props.attributeID + 'Attribute'}
              mode="multiple"
              selectedDays={this.state.datesSelected}
              onDayClick={this.handleDatesSelection}
              disabledDays={[
                {
                  before: new Date(),
                },
              ]}
            />
          )}
          {this.props.inputType === 'waiverHiddenItems' && (
            <span className="waiverHiddenItems">
              <span className="item">
                <input
                  type="checkbox"
                  id={this.props.attributeID + 'waiverHidden' + 'info_images'}
                  value="info_images"
                  checked={
                    this.state.value.indexOf('info_images') !== -1
                      ? true
                      : false
                  }
                  name={this.props.attributeID + 'waiverHidden' + 'info_images'}
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID + 'waiverHidden' + 'info_images'
                  }
                >
                  Information Head Images
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={this.props.attributeID + 'waiverHidden' + 'social_media'}
                  value="social_media"
                  checked={
                    this.state.value.indexOf('social_media') !== -1
                      ? true
                      : false
                  }
                  name={
                    this.props.attributeID + 'waiverHidden' + 'social_media'
                  }
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID + 'waiverHidden' + 'social_media'
                  }
                >
                  Social Media Names
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={
                    this.props.attributeID + 'waiverHidden' + 'report_aboutus'
                  }
                  value="report_aboutus"
                  checked={
                    this.state.value.indexOf('report_aboutus') !== -1
                      ? true
                      : false
                  }
                  name={
                    this.props.attributeID + 'waiverHidden' + 'report_aboutus'
                  }
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID + 'waiverHidden' + 'report_aboutus'
                  }
                >
                  Report Information - How did you find out about us?
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={
                    this.props.attributeID + 'waiverHidden' + 'report_many_days'
                  }
                  value="report_many_days"
                  checked={
                    this.state.value.indexOf('report_many_days') !== -1
                      ? true
                      : false
                  }
                  name={
                    this.props.attributeID + 'waiverHidden' + 'report_many_days'
                  }
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID + 'waiverHidden' + 'report_many_days'
                  }
                >
                  Report Information - How many days a week would you like to
                  train?
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={this.props.attributeID + 'waiverHidden' + 'health_info'}
                  value="health_info"
                  checked={
                    this.state.value.indexOf('health_info') !== -1
                      ? true
                      : false
                  }
                  name={this.props.attributeID + 'waiverHidden' + 'health_info'}
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID + 'waiverHidden' + 'health_info'
                  }
                >
                  Health Information
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_previous'
                  }
                  value="juijitsui_previous"
                  checked={
                    this.state.value.indexOf('juijitsui_previous') !== -1
                      ? true
                      : false
                  }
                  name={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_previous'
                  }
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_previous'
                  }
                >
                  Jiu Jitsu ObjectivesThis - Do you have any previous martial
                  arts experience?
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_current'
                  }
                  value="juijitsui_current"
                  checked={
                    this.state.value.indexOf('juijitsui_current') !== -1
                      ? true
                      : false
                  }
                  name={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_current'
                  }
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_current'
                  }
                >
                  Jiu Jitsu ObjectivesThis - Do you participate in any current
                  sport or activity?
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={
                    this.props.attributeID + 'waiverHidden' + 'juijitsui_long'
                  }
                  value="juijitsui_long"
                  checked={
                    this.state.value.indexOf('juijitsui_long') !== -1
                      ? true
                      : false
                  }
                  name={
                    this.props.attributeID + 'waiverHidden' + 'juijitsui_long'
                  }
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID + 'waiverHidden' + 'juijitsui_long'
                  }
                >
                  Jiu Jitsu ObjectivesThis - How long since you have been
                  involved in any sports activity?
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_benefits'
                  }
                  value="juijitsui_benefits"
                  checked={
                    this.state.value.indexOf('juijitsui_benefits') !== -1
                      ? true
                      : false
                  }
                  name={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_benefits'
                  }
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID +
                    'waiverHidden' +
                    'juijitsui_benefits'
                  }
                >
                  Jiu Jitsu ObjectivesThis - What are the three main benefits
                  you expect to get out of your Brazilian Jiu Jitsu training?
                </label>
              </span>
              <span className="item">
                <input
                  type="checkbox"
                  id={
                    this.props.attributeID +
                    'waiverHidden' +
                    'path_to_excellance'
                  }
                  value="path_to_excellance"
                  checked={
                    this.state.value.indexOf('path_to_excellance') !== -1
                      ? true
                      : false
                  }
                  name={
                    this.props.attributeID +
                    'waiverHidden' +
                    'path_to_excellance'
                  }
                  onChange={e => {
                    this.toggleArrayValue(this.state.value, e.target.value);
                  }}
                />
                <label
                  htmlFor={
                    this.props.attributeID +
                    'waiverHidden' +
                    'path_to_excellance'
                  }
                >
                  Path to Excellence
                </label>
              </span>
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={this.state.value === this.state.origValue}
          className="btn btn-primary"
          onClick={e => {
            var values = {};
            values['Status'] = 'New';
            values['Attribute Name'] = this.props.attributeName;
            values['Original Value'] = this.state.origValue;
            values['New Value'] = this.state.value;
            values['Updated By'] = this.props.profile.username;

            this.setState({
              origValue: this.state.value,
            });

            this.props.updateSpaceAttribute({
              space: this.props.space,
              values,
            });
            setAttributeValue(
              this.props.space,
              this.props.attributeName,
              this.state.value,
            );
            /*            setAttributeValue(
              this.props.appSpace,
              this.props.attributeName,
              this.state.value,
            ); */
          }}
        >
          Save
        </button>
        <br />
        <span
          className={this.props.attributeID + 'Help'}
          style={{ display: 'none' }}
        >
          <ul>
            <li
              dangerouslySetInnerHTML={{
                __html: this.props.helpText,
              }}
            />
          </ul>
        </span>
      </div>
    );
  }
}

export default EditAttributeValue;

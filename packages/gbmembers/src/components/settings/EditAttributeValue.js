import React, { Component } from 'react';
import {
  getAttributeValue,
  setAttributeValue,
} from '../../lib/react-kinops-components/src/utils';
import helpIcon from '../../images/help.svg?raw';
import SVGInline from 'react-svg-inline';
import NumberFormat from 'react-number-format';
import { I18n } from 'app/src/I18nProvider';

export class EditAttributeValue extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: getAttributeValue(this.props.space, this.props.attributeName),
      origValue: getAttributeValue(this.props.space, this.props.attributeName),
    };
  }
  render() {
    return (
      <div className="attributeLine">
        <label htmlFor={this.props.attributeID + 'Attribute'}>
          <span className="value">
            <I18n>{this.props.labelName}</I18n>
          </span>
          <SVGInline
            svg={helpIcon}
            className="icon help"
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
          {this.props.inputType === 'Percentage' && (
            <NumberFormat
              id={this.props.attributeID + 'Attribute'}
              value={this.state.value != '' ? this.state.value * 100 : ''}
              style={{ width: `${this.props.width}` }}
              ref={input => (this.input = input)}
              suffix="%"
              decimalScale={2}
              onChange={e => {
                this.setState({
                  value: parseFloat(e.target.value) / 100,
                });
              }}
            />
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
              ref={input => (this.input = input)}
              value={this.state.value}
              onChange={e => {
                this.setState({
                  value: e.target.value,
                });
              }}
            />
          )}
        </label>
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
              values,
            });
            setAttributeValue(
              this.props.space,
              this.props.attributeName,
              this.state.value,
            );
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
            ></li>
          </ul>
        </span>
      </div>
    );
  }
}

export default EditAttributeValue;

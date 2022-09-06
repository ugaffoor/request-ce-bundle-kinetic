import React from 'react';
import { I18n } from '../../../../app/src/I18nProvider';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import $ from 'jquery';

export class ReceiptToPrint extends React.Component {
  constructor(props) {
    super(props);

    var receiptFooter = this.props.snippets.find(function(el) {
      if (el.name === 'POS Receipt Footer') return el;
    });
    if (receiptFooter !== undefined) {
      receiptFooter = receiptFooter.value;
      var matches = receiptFooter.match(/\$\{.*?\('(.*?)'\)\}/g);
      var self = this;
      if (matches !== null) {
        matches.forEach(function(value, index) {
          console.log(value);
          var attrValue = value.split("'")[1];
          if (value.indexOf('spaceAttributes') !== -1) {
            if (
              self.props.space.attributes[value.split("'")[1]] !== undefined
            ) {
              receiptFooter = receiptFooter.replace(
                new RegExp(self.escapeRegExp('display_' + attrValue), 'g'),
                'block',
              );
              receiptFooter = receiptFooter.replace(
                new RegExp(self.escapeRegExp(value), 'g'),
                self.props.space.attributes[value.split("'")[1]][0],
              );
            } else {
              receiptFooter = receiptFooter.replace(
                new RegExp(self.escapeRegExp('display_' + attrValue), 'g'),
                'none',
              );
            }
          }
        });
      }
    } else {
      receiptFooter = undefined;
    }
    this.receiptFooter = receiptFooter;

    this.state = {
      posCheckout: this.props.posCheckout,
      status: this.props.status,
      total: this.props.total,
      number: '...' + this.props.number.substring(this.props.number.length - 4),
      auth_code: this.props.auth_code,
      transaction_id: this.props.transaction_id,
    };
  }
  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }
  render() {
    return (
      <span className="receiptPrint">
        <div className="header" style={{ display: 'none' }}>
          <img
            src="https://gbfms-files.s3-ap-southeast-2.amazonaws.com/GB+Name+Log.png"
            alt="GB Logo"
            className="GBLogo"
          />
        </div>
        <span className="soldTo">
          <span className="label">Membership: </span>
          <span className="name">{this.props.name}</span>
        </span>
        <span className="total">
          <span className="label">
            <I18n>TOTAL</I18n>
          </span>
          <span className="value">
            {new Intl.NumberFormat(this.props.locale, {
              style: 'currency',
              currency: this.props.currency,
            }).format(this.state.total)}
          </span>
        </span>
        <span className="transDetails">
          {this.state.transaction_id !== 'Cash' && (
            <span className="auth_code">
              <span className="label">Card Number:</span>
              <span className="value">{this.state.number}</span>
            </span>
          )}
          <span className="transaction_id">
            <span className="label">Transaction Id:</span>
            <span className="value">{this.state.transaction_id}</span>
          </span>
        </span>
        <span className="datetime">
          {this.props.datetime.format('Do MMM YYYY h:mmA')}
        </span>
        <div
          className="footer"
          style={{ display: 'none' }}
          dangerouslySetInnerHTML={{ __html: this.receiptFooter }}
        />
      </span>
    );
  }
}

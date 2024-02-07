import React from 'react';
import { I18n } from '../../../../app/src/I18nProvider';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import $ from 'jquery';
import { getJson } from './MemberUtils';

export class MembershipReceiptToPrint extends React.Component {
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

    this.datetime = this.props.datetime;
    this.state = {
      status: this.props.status,
      total: this.props.total,
      paymentID: this.props.paymentID,
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
        <span className="details">
          <span className="soldTo">
            <span className="label">Membership: </span>
            <span className="name">{this.props.name}</span>
          </span>
          <span className="datetime">
            <span className="label">Date: </span>
            {this.datetime.format('Do MMM YYYY h:mmA')}
          </span>
          {this.props.familyMembers !== undefined &&
            this.props.familyMembers.length > 0 && (
              <span className="familyMembers">
                <table style={{ border: 1, width: '100%' }}>
                  <thead>
                    <td>
                      <b>Member</b>
                    </td>
                    <td>
                      <b>Program</b>
                    </td>
                  </thead>
                  <tbody>
                    {getJson(
                      this.props.memberItem.values['Family Fee Details'],
                    ).map((member, index) => (
                      <tr>
                        <td>{member.Name}</td>
                        <td>{member.feeProgram}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </span>
            )}
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
        {this.state.status === 'Refunded' && (
          <span className="total refund">
            <span className="label">
              <I18n>Refunded</I18n>
            </span>
          </span>
        )}
        <span className="transDetails">
          <span className="transaction_id">
            <span className="label">Payment Id:</span>
            <span className="value">{this.props.paymentID}</span>
          </span>
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

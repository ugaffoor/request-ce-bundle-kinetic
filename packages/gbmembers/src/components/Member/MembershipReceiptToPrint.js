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
    var feeDetails = undefined;

    // Determine the Family Members relevant at the time of this receipt
    for (let i = 0; i < this.props.membershipServices.length; i++) {
      if (
        this.props.datetime.isAfter(
          this.props.membershipServices[i].submittedAtDate,
        ) &&
        this.props.datetime.isSameOrAfter(
          this.props.membershipServices[i].billingStartDate,
        )
      ) {
        feeDetails = getJson(this.props.membershipServices[i].feeJSON);
        break;
      }
    }

    if (this.props.paymentMethod === 'Cash') {
      for (let i = 0; i < this.props.cashRegistrations.length; i++) {
        if (
          this.props.datetime.isAfter(
            moment(
              this.props.cashRegistrations[i].submittedAt,
              'YYYY-MM-HHThh:mmZ',
            ),
          ) &&
          this.props.datetime.isSameOrAfter(
            moment(
              this.props.cashRegistrations[i]['values']['Term Date'],
              'YYYY-MM-DD',
            ),
          )
        ) {
          feeDetails = getJson(
            this.props.cashRegistrations[i]['values'].feesJSON,
          );
          break;
        }
      }
    }

    if (feeDetails === undefined) {
      if (this.props.membershipServices.length === 0) {
        feeDetails = getJson(
          this.props.memberItem.values['Family Fee Details'],
        );
      } else {
        feeDetails = getJson(
          this.props.membershipServices[
            this.props.membershipServices.length - 1
          ].feeJSON,
        );
      }
    }
    var subTotal = 0;
    var adminFee = 0;
    feeDetails.forEach(
      item => (subTotal = subTotal + Number.parseFloat(item.fee)),
    );

    if (getAttributeValue(this.props.space, 'Ignore Admin Fee') !== 'YES') {
      var adminFeePerc =
        Number.parseFloat(
          getAttributeValue(this.props.space, 'Admin Fee Charge', '').replace(
            '%',
            '',
          ),
        ) / 100;
      adminFee = subTotal * Number.parseFloat(adminFeePerc);
    }
    this.datetime = this.props.datetime;
    this.state = {
      status: this.props.status,
      subTotal: subTotal,
      adminFee: adminFee,
      total: this.props.total,
      paymentID: this.props.paymentID,
      feeDetails: feeDetails,
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
            this.props.familyMembers.length > 0 &&
            this.props.payment.paymentSource !== 'Member Registration Fee' && (
              <span className="familyMembers">
                <table style={{ border: 1, width: '100%' }}>
                  <thead>
                    <td>
                      <b>Member</b>
                    </td>
                    <td>
                      <b>Program</b>
                    </td>
                    <td>
                      <b>Cost</b>
                    </td>
                  </thead>
                  <tbody>
                    {this.state.feeDetails.map((member, index) => (
                      <tr>
                        <td>{member.Name}</td>
                        <td>{member.feeProgram}</td>
                        <td>
                          {new Intl.NumberFormat(this.props.locale, {
                            style: 'currency',
                            currency: this.props.currency,
                          }).format(member.fee)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </span>
            )}
          {this.props.familyMembers !== undefined &&
            this.props.familyMembers.length > 0 &&
            this.props.payment.paymentSource === 'Member Registration Fee' && (
              <span className="familyMembers">
                <table style={{ border: 1, width: '100%' }}>
                  <thead>
                    <td>
                      <b>Member</b>
                    </td>
                    <td></td>
                    <td>
                      <b>Fee</b>
                    </td>
                  </thead>
                  <tbody>
                    {this.state.feeDetails.map((member, index) => (
                      <tr>
                        <td>{member.Name}</td>
                        <td>Member Registration Fee</td>
                        <td>
                          {new Intl.NumberFormat(this.props.locale, {
                            style: 'currency',
                            currency: this.props.currency,
                          }).format(this.props.payment.paymentAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </span>
            )}
          {(this.props.familyMembers === undefined ||
            this.props.familyMembers.length === 0) &&
            this.props.paymentMethod === 'Cash' &&
            this.state.feeDetails !== undefined &&
            this.state.feeDetails.length > 0 && (
              <span className="familyMembers">
                <table style={{ border: 1, width: '100%' }}>
                  <thead>
                    <td>
                      <b>Member</b>
                    </td>
                    <td>
                      <b>Program</b>
                    </td>
                    <td>
                      <b>Cost</b>
                    </td>
                  </thead>
                  <tbody>
                    {this.state.feeDetails.map((member, index) => (
                      <tr>
                        <td>{member.Name}</td>
                        <td>{member.feeProgram}</td>
                        <td>
                          {new Intl.NumberFormat(this.props.locale, {
                            style: 'currency',
                            currency: this.props.currency,
                          }).format(member.fee)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </span>
            )}
        </span>
        {this.props.paymentMethod !== 'Cash' &&
          getAttributeValue(this.props.space, 'Billing Company') ===
            'Bambora' &&
          getAttributeValue(this.props.space, 'Ignore Admin Fee') !== 'YES' &&
          this.props.payment.paymentSource !== 'Member Registration Fee' && (
            <span className="total">
              <span className="label">
                <I18n>
                  {getAttributeValue(this.props.space, 'Admin Fee Label') !==
                    undefined &&
                  getAttributeValue(this.props.space, 'Admin Fee Label') !==
                    '' &&
                  getAttributeValue(this.props.space, 'Admin Fee Label') !==
                    null
                    ? getAttributeValue(this.props.space, 'Admin Fee Label')
                    : 'Admin Fee'}
                </I18n>
              </span>
              <span className="value">
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(this.state.adminFee)}
              </span>
            </span>
          )}
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
            {this.props.paymentMethod === 'Cash' && <span>Cash</span>}
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

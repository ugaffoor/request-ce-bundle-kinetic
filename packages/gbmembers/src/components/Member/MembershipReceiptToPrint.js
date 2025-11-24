import React from 'react';
import { I18n } from '@kineticdata/react';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import $ from 'jquery';
import { getJson, memberStatusAt } from './MemberUtils';

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
              getAttributeValue(self.props.space, value.split("'")[1]) !==
              undefined
            ) {
              receiptFooter = receiptFooter.replace(
                new RegExp(self.escapeRegExp('display_' + attrValue), 'g'),
                'block',
              );
              receiptFooter = receiptFooter.replace(
                new RegExp(self.escapeRegExp(value), 'g'),
                getAttributeValue(self.props.space, value.split("'")[1]),
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
    var memberStatus = memberStatusAt(
      this.props.memberItem,
      this.props.datetime,
    );
    memberStatus = memberStatus === '' ? 'Active' : memberStatus;

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
    var tax1 = 0;
    var tax2 = 0;
    feeDetails.forEach(
      item => (subTotal = subTotal + Number.parseFloat(item.fee)),
    );

    if (
      getAttributeValue(this.props.space, 'Ignore Admin Fee') !== 'YES' &&
      getAttributeValue(this.props.space, 'Admin Fee Charge') !== undefined &&
      getAttributeValue(this.props.space, 'Admin Fee Charge') !== null
    ) {
      if (
        this.props.memberItem.values['Admin Fee'] !== undefined &&
        this.props.memberItem.values['Admin Fee'] !== null &&
        this.props.memberItem.values['Admin Fee'] !== '' &&
        !this.props.memberItem.values['Admin Fee'].includes('%')
      ) {
        adminFee = this.props.memberItem.values['Admin Fee'];
      } else {
        var adminFeePerc =
          Number.parseFloat(
            getAttributeValue(this.props.space, 'Admin Fee Charge', '').replace(
              '%',
              '',
            ),
          ) / 100;
        adminFee = subTotal * Number.parseFloat(adminFeePerc);
      }
    }
    if (
      getAttributeValue(this.props.space, 'TAX 1 Value') !== '' &&
      getAttributeValue(this.props.space, 'TAX 1 Value') !== null &&
      getAttributeValue(this.props.space, 'TAX 1 Value') !== undefined
    ) {
      if (memberStatus === 'Frozen') {
        var taxPerc = Number.parseFloat(
          getAttributeValue(this.props.space, 'TAX 1 Value', ''),
        );
        tax1 = Number.parseFloat(this.props.total) * Number.parseFloat(taxPerc);
      } else if (
        this.props.memberItem.values['Membership TAX 1'] !== undefined &&
        this.props.memberItem.values['Membership TAX 1'] !== null &&
        this.props.memberItem.values['Membership TAX 1'] !== ''
      ) {
        tax1 = this.props.memberItem.values['Membership TAX 1'];
      } else {
        var taxPerc = Number.parseFloat(
          getAttributeValue(this.props.space, 'TAX 1 Value', ''),
        );
        tax1 = subTotal * Number.parseFloat(taxPerc);
      }
    }
    if (
      getAttributeValue(this.props.space, 'TAX 2 Value') !== '' &&
      getAttributeValue(this.props.space, 'TAX 2 Value') !== null &&
      getAttributeValue(this.props.space, 'TAX 2 Value') !== undefined
    ) {
      if (memberStatus === 'Frozen') {
        var taxPerc = Number.parseFloat(
          getAttributeValue(this.props.space, 'TAX 2 Value', ''),
        );
        tax2 = Number.parseFloat(this.props.total) * Number.parseFloat(taxPerc);
      } else if (
        this.props.memberItem.values['Membership TAX 2'] !== undefined &&
        this.props.memberItem.values['Membership TAX 2'] !== null &&
        this.props.memberItem.values['Membership TAX 2'] !== ''
      ) {
        tax2 = this.props.memberItem.values['Membership TAX 2'];
      } else {
        var taxPerc = Number.parseFloat(
          getAttributeValue(this.props.space, 'TAX 2 Value', ''),
        );
        tax2 = subTotal * Number.parseFloat(taxPerc);
      }
    }
    this.datetime = this.props.datetime;
    this.state = {
      status: this.props.status,
      memberStatus: memberStatus,
      subTotal: subTotal,
      adminFee: adminFee,
      tax1: tax1,
      tax2: tax2,
      total: this.props.total,
      refundValue: this.props.refundValue,
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
            this.props.payment.paymentSource !== 'Manual Registration Fee' &&
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
            (this.props.payment.paymentSource === 'Manual Registration Fee' ||
              this.props.payment.paymentSource ===
                'Member Registration Fee') && (
              <span className="familyMembers">
                <table style={{ border: 1, width: '100%' }}>
                  <thead>
                    <td>
                      <b>Member</b>
                    </td>
                    <td />
                  </thead>
                  <tbody>
                    {this.state.feeDetails.map((member, index) => (
                      <tr>
                        <td>{member.Name}</td>
                        <td>Member Registration Fee</td>
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
          this.props.payment.paymentSource !== 'Manual Registration Fee' &&
          this.props.payment.paymentSource !== 'Member Registration Fee' &&
          this.state.memberStatus !== 'Frozen' &&
          this.state.memberStatus !== 'Pending Freeze' && (
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
        {this.props.paymentMethod !== 'Cash' &&
          getAttributeValue(this.props.space, 'Billing Company') ===
            'Bambora' &&
          getAttributeValue(this.props.space, 'TAX 1 Value') !== '' &&
          getAttributeValue(this.props.space, 'TAX 1 Value') !== undefined &&
          getAttributeValue(this.props.space, 'TAX 1 Value') !== null &&
          this.props.payment.paymentSource !== 'Manual Registration Fee' &&
          this.props.payment.paymentSource !== 'Member Registration Fee' && (
            <span className="total">
              <span className="label">
                <I18n>
                  {getAttributeValue(this.props.space, 'TAX 1 Label') !==
                    undefined &&
                  getAttributeValue(this.props.space, 'TAX 1 Label') !== '' &&
                  getAttributeValue(this.props.space, 'TAX 1 Label') !== null
                    ? getAttributeValue(this.props.space, 'TAX 1 Label')
                    : 'Tax'}
                </I18n>
              </span>
              <span className="value">
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(this.state.tax1)}
              </span>
            </span>
          )}
        {this.props.paymentMethod !== 'Cash' &&
          getAttributeValue(this.props.space, 'Billing Company') ===
            'Bambora' &&
          getAttributeValue(this.props.space, 'TAX 2 Value') !== '' &&
          getAttributeValue(this.props.space, 'TAX 2 Value') !== undefined &&
          getAttributeValue(this.props.space, 'TAX 2 Value') !== null &&
          this.props.payment.paymentSource !== 'Manual Registration Fee' &&
          this.props.payment.paymentSource !== 'Member Registration Fee' && (
            <span className="total">
              <span className="label">
                <I18n>
                  {getAttributeValue(this.props.space, 'TAX 2 Label') !==
                    undefined &&
                  getAttributeValue(this.props.space, 'TAX 2 Label') !== '' &&
                  getAttributeValue(this.props.space, 'TAX 2 Label') !== null
                    ? getAttributeValue(this.props.space, 'TAX 2 Label')
                    : 'Tax'}
                </I18n>
              </span>
              <span className="value">
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(this.state.tax2)}
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
            <span className="value refund">
              {new Intl.NumberFormat(this.props.locale, {
                style: 'currency',
                currency: this.props.currency,
              }).format(this.state.refundValue)}
            </span>
          </span>
        )}
        <span className="transDetails">
          <span className="transaction_id">
            <span className="label">Payment Id:</span>
            <span className="">{this.props.paymentID}</span>
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

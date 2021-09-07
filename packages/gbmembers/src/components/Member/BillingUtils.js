import React, { Component } from 'react';
import { I18n } from '../../../../app/src/I18nProvider';

export class PaymentPeriod extends Component {
  render() {
    switch (this.props.period) {
      case 'M':
        return (
          <span>
            <I18n>Monthly</I18n>
          </span>
        );
      case 'W':
        return (
          <span>
            <I18n>Weekly</I18n>
          </span>
        );
      case 'F':
        return (
          <span>
            <I18n>Fortnightly</I18n>
          </span>
        );
      case '4':
        return (
          <span>
            <I18n>4 Weekly</I18n>
          </span>
        );
      case 'N':
        return (
          <span>
            <I18n>Weekday in a month</I18n>
          </span>
        );
      case 'Q':
        return (
          <span>
            <I18n>Quarterly</I18n>
          </span>
        );
      case 'H':
        return (
          <span>
            <I18n>Half Yearly</I18n>
          </span>
        );
      case 'Y':
        return (
          <span>
            <I18n>Yearly</I18n>
          </span>
        );
      default:
        return (
          <span>
            <I18n>{this.props.period}</I18n>
          </span>
        );
    }
  }
}
export class PaymentType extends Component {
  render() {
    switch (this.props.type) {
      case 'CR':
        return <span>Credit Card</span>;
      case 'DR':
        return <span>Direct Debit</span>;
      default:
        return <span>{this.props.type}</span>;
    }
  }
}

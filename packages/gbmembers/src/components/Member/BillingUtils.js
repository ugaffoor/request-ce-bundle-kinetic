import React, { Component } from 'react';

export class PaymentPeriod extends Component {
  render() {
    switch (this.props.period) {
      case 'M':
        return <span>Monthly</span>;
      case 'W':
        return <span>Weekly</span>;
      case 'F':
        return <span>Fortnightly</span>;
      case '4':
        return <span>4 Weekly</span>;
      case 'N':
        return <span>Weekday in a month</span>;
      case 'Q':
        return <span>Quarterly</span>;
      case 'H':
        return <span>Half Yearly</span>;
      case 'Y':
        return <span>Yearly</span>;
      default:
        return <span>{this.props.period}</span>;
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

import React from 'react';
import $ from 'jquery';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';
import SVGInline from 'react-svg-inline';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import axios from 'axios';
import gb1Icon from '../../images/GB1.svg?raw';
import gb2Icon from '../../images/GB2.svg?raw';
import gb3Icon from '../../images/GB3.svg?raw';
import gbkIcon from '../../images/GBk.svg?raw';
import White_Belt_No_StripesIcon from '../../images/White_Belt_No_Stripes.svg?raw';
import White_Belt_1_StripeIcon from '../../images/White_Belt_1_Stripe.svg?raw';
import White_Belt_2_StripesIcon from '../../images/White_Belt_2_Stripes.svg?raw';
import White_Belt_3_StripesIcon from '../../images/White_Belt_3_Stripes.svg?raw';
import White_Belt_4_StripesIcon from '../../images/White_Belt_4_Stripes.svg?raw';
import White_Belt_1_Red_StripeIcon from '../../images/White_Belt_1_Red_Stripe.svg?raw';
import Blue_Belt_No_StripesIcon from '../../images/Blue_Belt_No_Stripes.svg?raw';
import Blue_Belt_1_StripeIcon from '../../images/Blue_Belt_1_Stripe.svg?raw';
import Blue_Belt_2_StripesIcon from '../../images/Blue_Belt_2_Stripes.svg?raw';
import Blue_Belt_3_StripesIcon from '../../images/Blue_Belt_3_Stripes.svg?raw';
import Blue_Belt_4_StripesIcon from '../../images/Blue_Belt_4_Stripes.svg?raw';
import Purple_Belt_No_StripesIcon from '../../images/Purple_Belt_No_Stripes.svg?raw';
import Purple_Belt_1_StripeIcon from '../../images/Purple_Belt_1_Stripe.svg?raw';
import Purple_Belt_2_StripesIcon from '../../images/Purple_Belt_2_Stripes.svg?raw';
import Purple_Belt_3_StripesIcon from '../../images/Purple_Belt_3_Stripes.svg?raw';
import Purple_Belt_4_StripesIcon from '../../images/Purple_Belt_4_Stripes.svg?raw';
import Brown_Belt_No_StripesIcon from '../../images/Brown_Belt_No_Stripes.svg?raw';
import Brown_Belt_1_StripeIcon from '../../images/Brown_Belt_1_Stripe.svg?raw';
import Brown_Belt_2_StripesIcon from '../../images/Brown_Belt_2_Stripes.svg?raw';
import Brown_Belt_3_StripesIcon from '../../images/Brown_Belt_3_Stripes.svg?raw';
import Brown_Belt_4_StripesIcon from '../../images/Brown_Belt_4_Stripes.svg?raw';

import Grey_Belt_No_StripesIcon from '../../images/Grey_Belt_No_Stripes.svg?raw';
import Grey_Belt_1_Black_StripeIcon from '../../images/Grey_Belt_1_Black_Stripe.svg?raw';
import Grey_Belt_1_Red_StripeIcon from '../../images/Grey_Belt_1_Red_Stripe.svg?raw';
import Grey_Belt_1_White_StripeIcon from '../../images/Grey_Belt_1_White_Stripe.svg?raw';
import Grey_Belt_2_Black_StripesIcon from '../../images/Grey_Belt_2_Black_Stripes.svg?raw';
import Grey_Belt_2_Red_StripesIcon from '../../images/Grey_Belt_2_Red_Stripes.svg?raw';
import Grey_Belt_2_White_StripesIcon from '../../images/Grey_Belt_2_White_Stripes.svg?raw';
import Grey_Belt_3_Black_StripesIcon from '../../images/Grey_Belt_3_Black_Stripes.svg?raw';
import Grey_Belt_3_Red_StripesIcon from '../../images/Grey_Belt_3_Red_Stripes.svg?raw';
import Grey_Belt_3_White_StripesIcon from '../../images/Grey_Belt_3_White_Stripes.svg?raw';
import Grey_Belt_4_Red_StripesIcon from '../../images/Grey_Belt_4_Red_Stripes.svg?raw';
import Grey_Belt_4_White_StripesIcon from '../../images/Grey_Belt_4_White_Stripes.svg?raw';

import Grey_White_Belt_No_StripesIcon from '../../images/Grey_White_Belt_No_Stripes.svg?raw';
import Grey_White_Belt_1_Black_StripeIcon from '../../images/Grey_White_Belt_1_Black_Stripe.svg?raw';
import Grey_White_Belt_1_Red_StripeIcon from '../../images/Grey_White_Belt_1_Red_Stripe.svg?raw';
import Grey_White_Belt_1_White_StripeIcon from '../../images/Grey_White_Belt_1_White_Stripe.svg?raw';
import Grey_White_Belt_2_Black_StripesIcon from '../../images/Grey_White_Belt_2_Black_Stripes.svg?raw';
import Grey_White_Belt_2_Red_StripesIcon from '../../images/Grey_White_Belt_2_Red_Stripes.svg?raw';
import Grey_White_Belt_2_White_StripesIcon from '../../images/Grey_White_Belt_2_White_Stripes.svg?raw';
import Grey_White_Belt_3_Black_StripesIcon from '../../images/Grey_White_Belt_3_Black_Stripes.svg?raw';
import Grey_White_Belt_3_Red_StripesIcon from '../../images/Grey_White_Belt_3_Red_Stripes.svg?raw';
import Grey_White_Belt_3_White_StripesIcon from '../../images/Grey_White_Belt_3_White_Stripes.svg?raw';
import Grey_White_Belt_4_Red_StripesIcon from '../../images/Grey_White_Belt_4_Red_Stripes.svg?raw';
import Grey_White_Belt_4_White_StripesIcon from '../../images/Grey_White_Belt_4_White_Stripes.svg?raw';

import Grey_Black_Belt_No_StripesIcon from '../../images/Grey_Black_Belt_No_Stripes.svg?raw';
import Grey_Black_Belt_1_Black_StripeIcon from '../../images/Grey_Black_Belt_1_Black_Stripe.svg?raw';
import Grey_Black_Belt_1_Red_StripeIcon from '../../images/Grey_Black_Belt_1_Red_Stripe.svg?raw';
import Grey_Black_Belt_1_White_StripeIcon from '../../images/Grey_Black_Belt_1_White_Stripe.svg?raw';
import Grey_Black_Belt_2_Black_StripesIcon from '../../images/Grey_Black_Belt_2_Black_Stripes.svg?raw';
import Grey_Black_Belt_2_Red_StripesIcon from '../../images/Grey_Black_Belt_2_Red_Stripes.svg?raw';
import Grey_Black_Belt_2_White_StripesIcon from '../../images/Grey_Black_Belt_2_White_Stripes.svg?raw';
import Grey_Black_Belt_3_Black_StripesIcon from '../../images/Grey_Black_Belt_3_Black_Stripes.svg?raw';
import Grey_Black_Belt_3_Red_StripesIcon from '../../images/Grey_Black_Belt_3_Red_Stripes.svg?raw';
import Grey_Black_Belt_3_White_StripesIcon from '../../images/Grey_Black_Belt_3_White_Stripes.svg?raw';
import Grey_Black_Belt_4_Red_StripesIcon from '../../images/Grey_Black_Belt_4_Red_Stripes.svg?raw';
import Grey_Black_Belt_4_White_StripesIcon from '../../images/Grey_Black_Belt_4_White_Stripes.svg?raw';

import Yellow_Belt_No_StripesIcon from '../../images/Yellow_Belt_No_Stripes.svg?raw';
import Yellow_Belt_1_Black_StripeIcon from '../../images/Yellow_Belt_1_Black_Stripe.svg?raw';
import Yellow_Belt_1_Red_StripeIcon from '../../images/Yellow_Belt_1_Red_Stripe.svg?raw';
import Yellow_Belt_1_White_StripeIcon from '../../images/Yellow_Belt_1_White_Stripe.svg?raw';
import Yellow_Belt_2_Black_StripesIcon from '../../images/Yellow_Belt_2_Black_Stripes.svg?raw';
import Yellow_Belt_2_Red_StripesIcon from '../../images/Yellow_Belt_2_Red_Stripes.svg?raw';
import Yellow_Belt_2_White_StripesIcon from '../../images/Yellow_Belt_2_White_Stripes.svg?raw';
import Yellow_Belt_3_Black_StripesIcon from '../../images/Yellow_Belt_3_Black_Stripes.svg?raw';
import Yellow_Belt_3_Red_StripesIcon from '../../images/Yellow_Belt_3_Red_Stripes.svg?raw';
import Yellow_Belt_3_White_StripesIcon from '../../images/Yellow_Belt_3_White_Stripes.svg?raw';
import Yellow_Belt_4_Red_StripesIcon from '../../images/Yellow_Belt_4_Red_Stripes.svg?raw';
import Yellow_Belt_4_White_StripesIcon from '../../images/Yellow_Belt_4_White_Stripes.svg?raw';

import Yellow_White_Belt_No_StripesIcon from '../../images/Yellow_White_Belt_No_Stripes.svg?raw';
import Yellow_White_Belt_1_Black_StripeIcon from '../../images/Yellow_White_Belt_1_Black_Stripe.svg?raw';
import Yellow_White_Belt_1_Red_StripeIcon from '../../images/Yellow_White_Belt_1_Red_Stripe.svg?raw';
import Yellow_White_Belt_1_White_StripeIcon from '../../images/Yellow_White_Belt_1_White_Stripe.svg?raw';
import Yellow_White_Belt_2_Black_StripesIcon from '../../images/Yellow_White_Belt_2_Black_Stripes.svg?raw';
import Yellow_White_Belt_2_Red_StripesIcon from '../../images/Yellow_White_Belt_2_Red_Stripes.svg?raw';
import Yellow_White_Belt_2_White_StripesIcon from '../../images/Yellow_White_Belt_2_White_Stripes.svg?raw';
import Yellow_White_Belt_3_Black_StripesIcon from '../../images/Yellow_White_Belt_3_Black_Stripes.svg?raw';
import Yellow_White_Belt_3_Red_StripesIcon from '../../images/Yellow_White_Belt_3_Red_Stripes.svg?raw';
import Yellow_White_Belt_3_White_StripesIcon from '../../images/Yellow_White_Belt_3_White_Stripes.svg?raw';
import Yellow_White_Belt_4_Red_StripesIcon from '../../images/Yellow_White_Belt_4_Red_Stripes.svg?raw';
import Yellow_White_Belt_4_White_StripesIcon from '../../images/Yellow_White_Belt_4_White_Stripes.svg?raw';

import Yellow_Black_Belt_No_StripesIcon from '../../images/Yellow_Black_Belt_No_Stripes.svg?raw';
import Yellow_Black_Belt_1_Black_StripeIcon from '../../images/Yellow_Black_Belt_1_Black_Stripe.svg?raw';
import Yellow_Black_Belt_1_Red_StripeIcon from '../../images/Yellow_Black_Belt_1_Red_Stripe.svg?raw';
import Yellow_Black_Belt_1_White_StripeIcon from '../../images/Yellow_Black_Belt_1_White_Stripe.svg?raw';
import Yellow_Black_Belt_2_Black_StripesIcon from '../../images/Yellow_Black_Belt_2_Black_Stripes.svg?raw';
import Yellow_Black_Belt_2_Red_StripesIcon from '../../images/Yellow_Black_Belt_2_Red_Stripes.svg?raw';
import Yellow_Black_Belt_2_White_StripesIcon from '../../images/Yellow_Black_Belt_2_White_Stripes.svg?raw';
import Yellow_Black_Belt_3_Black_StripesIcon from '../../images/Yellow_Black_Belt_3_Black_Stripes.svg?raw';
import Yellow_Black_Belt_3_Red_StripesIcon from '../../images/Yellow_Black_Belt_3_Red_Stripes.svg?raw';
import Yellow_Black_Belt_3_White_StripesIcon from '../../images/Yellow_Black_Belt_3_White_Stripes.svg?raw';
import Yellow_Black_Belt_4_Red_StripesIcon from '../../images/Yellow_Black_Belt_4_Red_Stripes.svg?raw';
import Yellow_Black_Belt_4_White_StripesIcon from '../../images/Yellow_Black_Belt_4_White_Stripes.svg?raw';

import Orange_Belt_No_StripesIcon from '../../images/Orange_Belt_No_Stripes.svg?raw';
import Orange_Belt_1_Black_StripeIcon from '../../images/Orange_Belt_1_Black_Stripe.svg?raw';
import Orange_Belt_1_Red_StripeIcon from '../../images/Orange_Belt_1_Red_Stripe.svg?raw';
import Orange_Belt_1_White_StripeIcon from '../../images/Orange_Belt_1_White_Stripe.svg?raw';
import Orange_Belt_2_Black_StripesIcon from '../../images/Orange_Belt_2_Black_Stripes.svg?raw';
import Orange_Belt_2_Red_StripesIcon from '../../images/Orange_Belt_2_Red_Stripes.svg?raw';
import Orange_Belt_2_White_StripesIcon from '../../images/Orange_Belt_2_White_Stripes.svg?raw';
import Orange_Belt_3_Black_StripesIcon from '../../images/Orange_Belt_3_Black_Stripes.svg?raw';
import Orange_Belt_3_Red_StripesIcon from '../../images/Orange_Belt_3_Red_Stripes.svg?raw';
import Orange_Belt_3_White_StripesIcon from '../../images/Orange_Belt_3_White_Stripes.svg?raw';
import Orange_Belt_4_Red_StripesIcon from '../../images/Orange_Belt_4_Red_Stripes.svg?raw';
import Orange_Belt_4_White_StripesIcon from '../../images/Orange_Belt_4_White_Stripes.svg?raw';

import Orange_White_Belt_No_StripesIcon from '../../images/Orange_White_Belt_No_Stripes.svg?raw';
import Orange_White_Belt_1_Black_StripeIcon from '../../images/Orange_White_Belt_1_Black_Stripe.svg?raw';
import Orange_White_Belt_1_Red_StripeIcon from '../../images/Orange_White_Belt_1_Red_Stripe.svg?raw';
import Orange_White_Belt_1_White_StripeIcon from '../../images/Orange_White_Belt_1_White_Stripe.svg?raw';
import Orange_White_Belt_2_Black_StripesIcon from '../../images/Orange_White_Belt_2_Black_Stripes.svg?raw';
import Orange_White_Belt_2_Red_StripesIcon from '../../images/Orange_White_Belt_2_Red_Stripes.svg?raw';
import Orange_White_Belt_2_White_StripesIcon from '../../images/Orange_White_Belt_2_White_Stripes.svg?raw';
import Orange_White_Belt_3_Black_StripesIcon from '../../images/Orange_White_Belt_3_Black_Stripes.svg?raw';
import Orange_White_Belt_3_Red_StripesIcon from '../../images/Orange_White_Belt_3_Red_Stripes.svg?raw';
import Orange_White_Belt_3_White_StripesIcon from '../../images/Orange_White_Belt_3_White_Stripes.svg?raw';
import Orange_White_Belt_4_Red_StripesIcon from '../../images/Orange_White_Belt_4_Red_Stripes.svg?raw';
import Orange_White_Belt_4_White_StripesIcon from '../../images/Orange_White_Belt_4_White_Stripes.svg?raw';

import Orange_Black_Belt_No_StripesIcon from '../../images/Orange_Black_Belt_No_Stripes.svg?raw';
import Orange_Black_Belt_1_Black_StripeIcon from '../../images/Orange_Black_Belt_1_Black_Stripe.svg?raw';
import Orange_Black_Belt_1_Red_StripeIcon from '../../images/Orange_Black_Belt_1_Red_Stripe.svg?raw';
import Orange_Black_Belt_1_White_StripeIcon from '../../images/Orange_Black_Belt_1_White_Stripe.svg?raw';
import Orange_Black_Belt_2_Black_StripesIcon from '../../images/Orange_Black_Belt_2_Black_Stripes.svg?raw';
import Orange_Black_Belt_2_Red_StripesIcon from '../../images/Orange_Black_Belt_2_Red_Stripes.svg?raw';
import Orange_Black_Belt_2_White_StripesIcon from '../../images/Orange_Black_Belt_2_White_Stripes.svg?raw';
import Orange_Black_Belt_3_Black_StripesIcon from '../../images/Orange_Black_Belt_3_Black_Stripes.svg?raw';
import Orange_Black_Belt_3_Red_StripesIcon from '../../images/Orange_Black_Belt_3_Red_Stripes.svg?raw';
import Orange_Black_Belt_3_White_StripesIcon from '../../images/Orange_Black_Belt_3_White_Stripes.svg?raw';
import Orange_Black_Belt_4_Red_StripesIcon from '../../images/Orange_Black_Belt_4_Red_Stripes.svg?raw';
import Orange_Black_Belt_4_White_StripesIcon from '../../images/Orange_Black_Belt_4_White_Stripes.svg?raw';

import Green_Belt_No_StripesIcon from '../../images/Green_Belt_No_Stripes.svg?raw';
import Green_Belt_1_Black_StripeIcon from '../../images/Green_Belt_1_Black_Stripe.svg?raw';
import Green_Belt_1_Red_StripeIcon from '../../images/Green_Belt_1_Red_Stripe.svg?raw';
import Green_Belt_1_White_StripeIcon from '../../images/Green_Belt_1_White_Stripe.svg?raw';
import Green_Belt_2_Black_StripesIcon from '../../images/Green_Belt_2_Black_Stripes.svg?raw';
import Green_Belt_2_Red_StripesIcon from '../../images/Green_Belt_2_Red_Stripes.svg?raw';
import Green_Belt_2_White_StripesIcon from '../../images/Green_Belt_2_White_Stripes.svg?raw';
import Green_Belt_3_Black_StripesIcon from '../../images/Green_Belt_3_Black_Stripes.svg?raw';
import Green_Belt_3_Red_StripesIcon from '../../images/Green_Belt_3_Red_Stripes.svg?raw';
import Green_Belt_3_White_StripesIcon from '../../images/Green_Belt_3_White_Stripes.svg?raw';
import Green_Belt_4_Red_StripesIcon from '../../images/Green_Belt_4_Red_Stripes.svg?raw';
import Green_Belt_4_White_StripesIcon from '../../images/Green_Belt_4_White_Stripes.svg?raw';

import Green_White_Belt_No_StripesIcon from '../../images/Green_White_Belt_No_Stripes.svg?raw';
import Green_White_Belt_1_Black_StripeIcon from '../../images/Green_White_Belt_1_Black_Stripe.svg?raw';
import Green_White_Belt_1_Red_StripeIcon from '../../images/Green_White_Belt_1_Red_Stripe.svg?raw';
import Green_White_Belt_1_White_StripeIcon from '../../images/Green_White_Belt_1_White_Stripe.svg?raw';
import Green_White_Belt_2_Black_StripesIcon from '../../images/Green_White_Belt_2_Black_Stripes.svg?raw';
import Green_White_Belt_2_Red_StripesIcon from '../../images/Green_White_Belt_2_Red_Stripes.svg?raw';
import Green_White_Belt_2_White_StripesIcon from '../../images/Green_White_Belt_2_White_Stripes.svg?raw';
import Green_White_Belt_3_Black_StripesIcon from '../../images/Green_White_Belt_3_Black_Stripes.svg?raw';
import Green_White_Belt_3_Red_StripesIcon from '../../images/Green_White_Belt_3_Red_Stripes.svg?raw';
import Green_White_Belt_3_White_StripesIcon from '../../images/Green_White_Belt_3_White_Stripes.svg?raw';
import Green_White_Belt_4_Red_StripesIcon from '../../images/Green_White_Belt_4_Red_Stripes.svg?raw';
import Green_White_Belt_4_White_StripesIcon from '../../images/Green_White_Belt_4_White_Stripes.svg?raw';

import Green_Black_Belt_No_StripesIcon from '../../images/Green_Black_Belt_No_Stripes.svg?raw';
import Green_Black_Belt_1_Black_StripeIcon from '../../images/Green_Black_Belt_1_Black_Stripe.svg?raw';
import Green_Black_Belt_1_Red_StripeIcon from '../../images/Green_Black_Belt_1_Red_Stripe.svg?raw';
import Green_Black_Belt_1_White_StripeIcon from '../../images/Green_Black_Belt_1_White_Stripe.svg?raw';
import Green_Black_Belt_2_Black_StripesIcon from '../../images/Green_Black_Belt_2_Black_Stripes.svg?raw';
import Green_Black_Belt_2_Red_StripesIcon from '../../images/Green_Black_Belt_2_Red_Stripes.svg?raw';
import Green_Black_Belt_2_White_StripesIcon from '../../images/Green_Black_Belt_2_White_Stripes.svg?raw';
import Green_Black_Belt_3_Black_StripesIcon from '../../images/Green_Black_Belt_3_Black_Stripes.svg?raw';
import Green_Black_Belt_3_Red_StripesIcon from '../../images/Green_Black_Belt_3_Red_Stripes.svg?raw';
import Green_Black_Belt_3_White_StripesIcon from '../../images/Green_Black_Belt_3_White_Stripes.svg?raw';
import Green_Black_Belt_4_Red_StripesIcon from '../../images/Green_Black_Belt_4_Red_Stripes.svg?raw';
import Green_Black_Belt_4_White_StripesIcon from '../../images/Green_Black_Belt_4_White_Stripes.svg?raw';

import Black_Belt_No_StripesIcon from '../../images/Black_Belt_No_Stripes.svg?raw';
import Black_Belt_1_StripeIcon from '../../images/Black_Belt_1_Stripe.svg?raw';
import Black_Belt_2_StripesIcon from '../../images/Black_Belt_2_Stripes.svg?raw';
import Black_Belt_3_StripesIcon from '../../images/Black_Belt_3_Stripes.svg?raw';
import Black_Belt_4_StripesIcon from '../../images/Black_Belt_4_Stripes.svg?raw';
import Black_Belt_5_StripesIcon from '../../images/Black_Belt_5_Stripes.svg?raw';
import Black_Belt_6_StripesIcon from '../../images/Black_Belt_6_Stripes.svg?raw';

var currencies = {
  AUD: {
    symbol: '$',
    name: 'Australian Dollar',
    symbol_native: '$',
    decimal_digits: 2,
    rounding: 0,
    code: 'AUD',
    name_plural: 'Australian dollars',
  },
  NZD: {
    symbol: '$',
    name: 'New Zealand Dollar',
    symbol_native: '$',
    decimal_digits: 2,
    rounding: 0,
    code: 'NZD',
    name_plural: 'New Zealand dollars',
  },
  USD: {
    symbol: '$',
    name: 'US Dollar',
    symbol_native: '$',
    decimal_digits: 2,
    rounding: 0,
    code: 'USD',
    name_plural: 'US dollars',
  },
  CAD: {
    symbol: '$',
    name: 'CAD Dollar',
    symbol_native: '$',
    decimal_digits: 2,
    rounding: 0,
    code: 'CAD',
    name_plural: 'CAD dollars',
  },
  EUR: {
    symbol: '€',
    name: 'Euro',
    symbol_native: '€',
    decimal_digits: 2,
    rounding: 0,
    code: 'EUR',
    name_plural: 'euros',
  },
  GBP: {
    symbol: '£',
    name: 'British Pound Sterling',
    symbol_native: '£',
    decimal_digits: 2,
    rounding: 0,
    code: 'GBP',
    name_plural: 'British pounds sterling',
  },
};

export function isBamboraFailedPayment(payment) {
  return (
    (payment.paymentStatus === 'Transaction Declined' ||
      payment.paymentStatus === 'DECLINED' ||
      payment.paymentStatus === 'PIN RETRY EXCEEDED' ||
      payment.paymentStatus === 'SERV NOT ALLOWED' ||
      payment.paymentStatus === 'INV ACCT NUM' ||
      payment.paymentStatus === 'Invalid Card Number' ||
      payment.paymentStatus === 'Validation greater than maximum amount' ||
      payment.paymentStatus === 'BAD PROCESSING CODE' ||
      payment.paymentStatus === 'PLEASE RETRY' ||
      payment.paymentStatus === 'EXPIRED CARD') &&
    payment.paymentSource !== 'Manual Membership Payment'
  );
}
export function getCurrency(currency) {
  return currencies[currency];
}

export function getTimezoneOff() {
  var currentTime = new Date();
  var currentTimezone = currentTime.getTimezoneOffset();
  currentTimezone = (currentTimezone / 60) * -1;
  var offset = 'Z';
  if (currentTimezone !== 0) {
    offset = currentTimezone > 0 ? '+' : '';
    offset += currentTimezone;
  }
  return offset;
}

export function getProgramSVG(program) {
  switch (program) {
    case 'GB1':
      return <SVGInline svg={gb1Icon} className="icon" />;
    case 'GB2':
      return <SVGInline svg={gb2Icon} className="icon" />;
    case 'GB3':
      return <SVGInline svg={gb3Icon} className="icon" />;
    default:
      return <SVGInline svg={gbkIcon} className="icon" />;
  }
}
export function getBeltSVG(belt) {
  switch (belt) {
    case 'White Belt No Stripes':
      return <SVGInline svg={White_Belt_No_StripesIcon} className="icon" />;
    case 'White Belt 1 Stripe':
      return <SVGInline svg={White_Belt_1_StripeIcon} className="icon" />;
    case 'White Belt 2 Stripes':
      return <SVGInline svg={White_Belt_2_StripesIcon} className="icon" />;
    case 'White Belt 3 Stripes':
      return <SVGInline svg={White_Belt_3_StripesIcon} className="icon" />;
    case 'White Belt 4 Stripes':
      return <SVGInline svg={White_Belt_4_StripesIcon} className="icon" />;
    case 'White Belt 1 Red Stripe':
      return <SVGInline svg={White_Belt_1_Red_StripeIcon} className="icon" />;
    case 'Blue Belt No Stripes':
      return <SVGInline svg={Blue_Belt_No_StripesIcon} className="icon" />;
    case 'Blue Belt 1 Stripe':
      return <SVGInline svg={Blue_Belt_1_StripeIcon} className="icon" />;
    case 'Blue Belt 2 Stripes':
      return <SVGInline svg={Blue_Belt_2_StripesIcon} className="icon" />;
    case 'Blue Belt 3 Stripes':
      return <SVGInline svg={Blue_Belt_3_StripesIcon} className="icon" />;
    case 'Blue Belt 4 Stripes':
      return <SVGInline svg={Blue_Belt_4_StripesIcon} className="icon" />;
    case 'Purple Belt No Stripes':
      return <SVGInline svg={Purple_Belt_No_StripesIcon} className="icon" />;
    case 'Purple Belt 1 Stripe':
      return <SVGInline svg={Purple_Belt_1_StripeIcon} className="icon" />;
    case 'Purple Belt 2 Stripes':
      return <SVGInline svg={Purple_Belt_2_StripesIcon} className="icon" />;
    case 'Purple Belt 3 Stripes':
      return <SVGInline svg={Purple_Belt_3_StripesIcon} className="icon" />;
    case 'Purple Belt 4 Stripes':
      return <SVGInline svg={Purple_Belt_4_StripesIcon} className="icon" />;
    case 'Brown Belt No Stripes':
      return <SVGInline svg={Brown_Belt_No_StripesIcon} className="icon" />;
    case 'Brown Belt 1 Stripe':
      return <SVGInline svg={Brown_Belt_1_StripeIcon} className="icon" />;
    case 'Brown Belt 2 Stripes':
      return <SVGInline svg={Brown_Belt_2_StripesIcon} className="icon" />;
    case 'Brown Belt 3 Stripes':
      return <SVGInline svg={Brown_Belt_3_StripesIcon} className="icon" />;
    case 'Brown Belt 4 Stripes':
      return <SVGInline svg={Brown_Belt_4_StripesIcon} className="icon" />;
    case 'Grey Belt No Stripes':
      return <SVGInline svg={Grey_Belt_No_StripesIcon} className="icon" />;
    case 'Grey Belt 1 Black Stripe':
      return <SVGInline svg={Grey_Belt_1_Black_StripeIcon} className="icon" />;
    case 'Grey Belt 1 Red Stripe':
      return <SVGInline svg={Grey_Belt_1_Red_StripeIcon} className="icon" />;
    case 'Grey Belt 1 White Stripe':
      return <SVGInline svg={Grey_Belt_1_White_StripeIcon} className="icon" />;
    case 'Grey Belt 2 Black Stripes':
      return <SVGInline svg={Grey_Belt_2_Black_StripesIcon} className="icon" />;
    case 'Grey Belt 2 Red Stripes':
      return <SVGInline svg={Grey_Belt_2_Red_StripesIcon} className="icon" />;
    case 'Grey Belt 2 White Stripes':
      return <SVGInline svg={Grey_Belt_2_White_StripesIcon} className="icon" />;
    case 'Grey Belt 3 Black Stripes':
      return <SVGInline svg={Grey_Belt_3_Black_StripesIcon} className="icon" />;
    case 'Grey Belt 3 Red Stripes':
      return <SVGInline svg={Grey_Belt_3_Red_StripesIcon} className="icon" />;
    case 'Grey Belt 3 White Stripes':
      return <SVGInline svg={Grey_Belt_3_White_StripesIcon} className="icon" />;
    case 'Grey Belt 4 Red Stripes':
      return <SVGInline svg={Grey_Belt_4_Red_StripesIcon} className="icon" />;
    case 'Grey Belt 4 White Stripes':
      return <SVGInline svg={Grey_Belt_4_White_StripesIcon} className="icon" />;

    case 'Grey / White Belt No Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_No_StripesIcon} className="icon" />
      );
    case 'Grey / White Belt 1 Black Stripe':
      return (
        <SVGInline svg={Grey_White_Belt_1_Black_StripeIcon} className="icon" />
      );
    case 'Grey / White Belt 1 Red Stripe':
      return (
        <SVGInline svg={Grey_White_Belt_1_Red_StripeIcon} className="icon" />
      );
    case 'Grey / White Belt 1 White Stripe':
      return (
        <SVGInline svg={Grey_White_Belt_1_White_StripeIcon} className="icon" />
      );
    case 'Grey / White Belt 2 Black Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_2_Black_StripesIcon} className="icon" />
      );
    case 'Grey / White Belt 2 Red Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_2_Red_StripesIcon} className="icon" />
      );
    case 'Grey / White Belt 2 White Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_2_White_StripesIcon} className="icon" />
      );
    case 'Grey / White Belt 3 Black Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_3_Black_StripesIcon} className="icon" />
      );
    case 'Grey / White Belt 3 Red Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_3_Red_StripesIcon} className="icon" />
      );
    case 'Grey / White Belt 3 White Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_3_White_StripesIcon} className="icon" />
      );
    case 'Grey / White Belt 4 Red Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_4_Red_StripesIcon} className="icon" />
      );
    case 'Grey / White Belt 4 White Stripes':
      return (
        <SVGInline svg={Grey_White_Belt_4_White_StripesIcon} className="icon" />
      );

    case 'Grey / Black Belt Stripe':
      return (
        <SVGInline svg={Grey_Black_Belt_No_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt No Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_No_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt 1 Black Stripe':
      return (
        <SVGInline svg={Grey_Black_Belt_1_Black_StripeIcon} className="icon" />
      );
    case 'Grey / Black Belt 1 Red Stripe':
      return (
        <SVGInline svg={Grey_Black_Belt_1_Red_StripeIcon} className="icon" />
      );
    case 'Grey / Black Belt 1 White Stripe':
      return (
        <SVGInline svg={Grey_Black_Belt_1_White_StripeIcon} className="icon" />
      );
    case 'Grey / Black Belt 2 Black Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_2_Black_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt 2 Red Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_2_Red_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt 2 White Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_2_White_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt 3 Black Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_3_Black_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt 3 Red Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_3_Red_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt 3 White Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_3_White_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt 4 Red Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_4_Red_StripesIcon} className="icon" />
      );
    case 'Grey / Black Belt 4 White Stripes':
      return (
        <SVGInline svg={Grey_Black_Belt_4_White_StripesIcon} className="icon" />
      );

    case 'Yellow Belt No Stripes':
      return <SVGInline svg={Yellow_Belt_No_StripesIcon} className="icon" />;
    case 'Yellow Belt 1 Black Stripe':
      return (
        <SVGInline svg={Yellow_Belt_1_Black_StripeIcon} className="icon" />
      );
    case 'Yellow Belt 1 Red Stripe':
      return <SVGInline svg={Yellow_Belt_1_Red_StripeIcon} className="icon" />;
    case 'Yellow Belt 1 White Stripe':
      return (
        <SVGInline svg={Yellow_Belt_1_White_StripeIcon} className="icon" />
      );
    case 'Yellow Belt 2 Black Stripes':
      return (
        <SVGInline svg={Yellow_Belt_2_Black_StripesIcon} className="icon" />
      );
    case 'Yellow Belt 2 Red Stripes':
      return <SVGInline svg={Yellow_Belt_2_Red_StripesIcon} className="icon" />;
    case 'Yellow Belt 2 White Stripes':
      return (
        <SVGInline svg={Yellow_Belt_2_White_StripesIcon} className="icon" />
      );
    case 'Yellow Belt 3 Black Stripes':
      return (
        <SVGInline svg={Yellow_Belt_3_Black_StripesIcon} className="icon" />
      );
    case 'Yellow Belt 3 Red Stripes':
      return <SVGInline svg={Yellow_Belt_3_Red_StripesIcon} className="icon" />;
    case 'Yellow Belt 3 White Stripes':
      return (
        <SVGInline svg={Yellow_Belt_3_White_StripesIcon} className="icon" />
      );
    case 'Yellow Belt 4 Red Stripes':
      return <SVGInline svg={Yellow_Belt_4_Red_StripesIcon} className="icon" />;
    case 'Yellow Belt 4 White Stripes':
      return (
        <SVGInline svg={Yellow_Belt_4_White_StripesIcon} className="icon" />
      );

    case 'Yellow / White Belt No Stripes':
      return (
        <SVGInline svg={Yellow_White_Belt_No_StripesIcon} className="icon" />
      );
    case 'Yellow / White Belt 1 Black Stripe':
      return (
        <SVGInline
          svg={Yellow_White_Belt_1_Black_StripeIcon}
          className="icon"
        />
      );
    case 'Yellow / White Belt 1 Red Stripe':
      return (
        <SVGInline svg={Yellow_White_Belt_1_Red_StripeIcon} className="icon" />
      );
    case 'Yellow / White Belt 1 White Stripe':
      return (
        <SVGInline
          svg={Yellow_White_Belt_1_White_StripeIcon}
          className="icon"
        />
      );
    case 'Yellow / White Belt 2 Black Stripes':
      return (
        <SVGInline
          svg={Yellow_White_Belt_2_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Yellow / White Belt 2 Red Stripes':
      return (
        <SVGInline svg={Yellow_White_Belt_2_Red_StripesIcon} className="icon" />
      );
    case 'Yellow / White Belt 2 White Stripes':
      return (
        <SVGInline
          svg={Yellow_White_Belt_2_White_StripesIcon}
          className="icon"
        />
      );
    case 'Yellow / White Belt 3 Black Stripes':
      return (
        <SVGInline
          svg={Yellow_White_Belt_3_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Yellow / White Belt 3 Red Stripes':
      return (
        <SVGInline svg={Yellow_White_Belt_3_Red_StripesIcon} className="icon" />
      );
    case 'Yellow / White Belt 3 White Stripes':
      return (
        <SVGInline
          svg={Yellow_White_Belt_3_White_StripesIcon}
          className="icon"
        />
      );
    case 'Yellow / White Belt 4 Red Stripes':
      return (
        <SVGInline svg={Yellow_White_Belt_4_Red_StripesIcon} className="icon" />
      );
    case 'Yellow / White Belt 4 White Stripes':
      return (
        <SVGInline
          svg={Yellow_White_Belt_4_White_StripesIcon}
          className="icon"
        />
      );

    case 'Yellow / Black Belt No Stripes':
      return (
        <SVGInline svg={Yellow_Black_Belt_No_StripesIcon} className="icon" />
      );
    case 'Yellow / Black Belt 1 Black Stripe':
      return (
        <SVGInline
          svg={Yellow_Black_Belt_1_Black_StripeIcon}
          className="icon"
        />
      );
    case 'Yellow / Black Belt 1 Red Stripe':
      return (
        <SVGInline svg={Yellow_Black_Belt_1_Red_StripeIcon} className="icon" />
      );
    case 'Yellow / Black Belt 1 White Stripe':
      return (
        <SVGInline
          svg={Yellow_Black_Belt_1_White_StripeIcon}
          className="icon"
        />
      );
    case 'Yellow / Black Belt 2 Black Stripes':
      return (
        <SVGInline
          svg={Yellow_Black_Belt_2_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Yellow / Black Belt 2 Red Stripes':
      return (
        <SVGInline svg={Yellow_Black_Belt_2_Red_StripesIcon} className="icon" />
      );
    case 'Yellow / Black Belt 2 White Stripes':
      return (
        <SVGInline
          svg={Yellow_Black_Belt_2_White_StripesIcon}
          className="icon"
        />
      );
    case 'Yellow / Black Belt 3 Black Stripes':
      return (
        <SVGInline
          svg={Yellow_Black_Belt_3_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Yellow / Black Belt 3 Red Stripes':
      return (
        <SVGInline svg={Yellow_Black_Belt_3_Red_StripesIcon} className="icon" />
      );
    case 'Yellow / Black Belt 3 White Stripes':
      return (
        <SVGInline
          svg={Yellow_Black_Belt_3_White_StripesIcon}
          className="icon"
        />
      );
    case 'Yellow / Black Belt 4 Red Stripes':
      return (
        <SVGInline svg={Yellow_Black_Belt_4_Red_StripesIcon} className="icon" />
      );
    case 'Yellow / Black Belt 4 White Stripes':
      return (
        <SVGInline
          svg={Yellow_Black_Belt_4_White_StripesIcon}
          className="icon"
        />
      );

    case 'Orange Belt No Stripes':
      return <SVGInline svg={Orange_Belt_No_StripesIcon} className="icon" />;
    case 'Orange Belt 1 Black Stripe':
      return (
        <SVGInline svg={Orange_Belt_1_Black_StripeIcon} className="icon" />
      );
    case 'Orange Belt 1 Red Stripe':
      return <SVGInline svg={Orange_Belt_1_Red_StripeIcon} className="icon" />;
    case 'Orange Belt 1 White Stripe':
      return (
        <SVGInline svg={Orange_Belt_1_White_StripeIcon} className="icon" />
      );
    case 'Orange Belt 2 Black Stripes':
      return (
        <SVGInline svg={Orange_Belt_2_Black_StripesIcon} className="icon" />
      );
    case 'Orange Belt 2 Red Stripes':
      return <SVGInline svg={Orange_Belt_2_Red_StripesIcon} className="icon" />;
    case 'Orange Belt 2 White Stripes':
      return (
        <SVGInline svg={Orange_Belt_2_White_StripesIcon} className="icon" />
      );
    case 'Orange Belt 3 Black Stripes':
      return (
        <SVGInline svg={Orange_Belt_3_Black_StripesIcon} className="icon" />
      );
    case 'Orange Belt 3 Red Stripes':
      return <SVGInline svg={Orange_Belt_3_Red_StripesIcon} className="icon" />;
    case 'Orange Belt 3 White Stripes':
      return (
        <SVGInline svg={Orange_Belt_3_White_StripesIcon} className="icon" />
      );
    case 'Orange Belt 4 Red Stripes':
      return <SVGInline svg={Orange_Belt_4_Red_StripesIcon} className="icon" />;
    case 'Orange Belt 4 White Stripes':
      return (
        <SVGInline svg={Orange_Belt_4_White_StripesIcon} className="icon" />
      );

    case 'Orange / White Belt No Stripes':
      return (
        <SVGInline svg={Orange_White_Belt_No_StripesIcon} className="icon" />
      );
    case 'Orange / White Belt 1 Black Stripe':
      return (
        <SVGInline
          svg={Orange_White_Belt_1_Black_StripeIcon}
          className="icon"
        />
      );
    case 'Orange / White Belt 1 Red Stripe':
      return (
        <SVGInline svg={Orange_White_Belt_1_Red_StripeIcon} className="icon" />
      );
    case 'Orange / White Belt 1 White Stripe':
      return (
        <SVGInline
          svg={Orange_White_Belt_1_White_StripeIcon}
          className="icon"
        />
      );
    case 'Orange / White Belt 2 Black Stripes':
      return (
        <SVGInline
          svg={Orange_White_Belt_2_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Orange / White Belt 2 Red Stripes':
      return (
        <SVGInline svg={Orange_White_Belt_2_Red_StripesIcon} className="icon" />
      );
    case 'Orange / White Belt 2 White Stripes':
      return (
        <SVGInline
          svg={Orange_White_Belt_2_White_StripesIcon}
          className="icon"
        />
      );
    case 'Orange / White Belt 3 Black Stripes':
      return (
        <SVGInline
          svg={Orange_White_Belt_3_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Orange / White Belt 3 Red Stripes':
      return (
        <SVGInline svg={Orange_White_Belt_3_Red_StripesIcon} className="icon" />
      );
    case 'Orange / White Belt 3 White Stripes':
      return (
        <SVGInline
          svg={Orange_White_Belt_3_White_StripesIcon}
          className="icon"
        />
      );
    case 'Orange / White Belt 4 Red Stripes':
      return (
        <SVGInline svg={Orange_White_Belt_4_Red_StripesIcon} className="icon" />
      );
    case 'Orange / White Belt 4 White Stripes':
      return (
        <SVGInline
          svg={Orange_White_Belt_4_White_StripesIcon}
          className="icon"
        />
      );

    case 'Orange / Black Belt No Stripes':
      return (
        <SVGInline svg={Orange_Black_Belt_No_StripesIcon} className="icon" />
      );
    case 'Orange / Black Belt 1 Black Stripe':
      return (
        <SVGInline
          svg={Orange_Black_Belt_1_Black_StripeIcon}
          className="icon"
        />
      );
    case 'Orange / Black Belt 1 Red Stripe':
      return (
        <SVGInline svg={Orange_Black_Belt_1_Red_StripeIcon} className="icon" />
      );
    case 'Orange / Black Belt 1 White Stripe':
      return (
        <SVGInline
          svg={Orange_Black_Belt_1_White_StripeIcon}
          className="icon"
        />
      );
    case 'Orange / Black Belt 2 Black Stripes':
      return (
        <SVGInline
          svg={Orange_Black_Belt_2_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Orange / Black Belt 2 Red Stripes':
      return (
        <SVGInline svg={Orange_Black_Belt_2_Red_StripesIcon} className="icon" />
      );
    case 'Orange / Black Belt 2 White Stripes':
      return (
        <SVGInline
          svg={Orange_Black_Belt_2_White_StripesIcon}
          className="icon"
        />
      );
    case 'Orange / Black Belt 3 Black Stripes':
      return (
        <SVGInline
          svg={Orange_Black_Belt_3_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Orange / Black Belt 3 Red Stripes':
      return (
        <SVGInline svg={Orange_Black_Belt_3_Red_StripesIcon} className="icon" />
      );
    case 'Orange / Black Belt 3 White Stripes':
      return (
        <SVGInline
          svg={Orange_Black_Belt_3_White_StripesIcon}
          className="icon"
        />
      );
    case 'Orange / Black Belt 4 Red Stripes':
      return (
        <SVGInline svg={Orange_Black_Belt_4_Red_StripesIcon} className="icon" />
      );
    case 'Orange / Black Belt 4 White Stripes':
      return (
        <SVGInline
          svg={Orange_Black_Belt_4_White_StripesIcon}
          className="icon"
        />
      );

    case 'Green Belt No Stripes':
      return <SVGInline svg={Green_Belt_No_StripesIcon} className="icon" />;
    case 'Green Belt 1 Black Stripe':
      return <SVGInline svg={Green_Belt_1_Black_StripeIcon} className="icon" />;
    case 'Green Belt 1 Red Stripe':
      return <SVGInline svg={Green_Belt_1_Red_StripeIcon} className="icon" />;
    case 'Green Belt 1 White Stripe':
      return <SVGInline svg={Green_Belt_1_White_StripeIcon} className="icon" />;
    case 'Green Belt 2 Black Stripes':
      return (
        <SVGInline svg={Green_Belt_2_Black_StripesIcon} className="icon" />
      );
    case 'Green Belt 2 Red Stripes':
      return <SVGInline svg={Green_Belt_2_Red_StripesIcon} className="icon" />;
    case 'Green Belt 2 White Stripes':
      return (
        <SVGInline svg={Green_Belt_2_White_StripesIcon} className="icon" />
      );
    case 'Green Belt 3 Black Stripes':
      return (
        <SVGInline svg={Green_Belt_3_Black_StripesIcon} className="icon" />
      );
    case 'Green Belt 3 Red Stripes':
      return <SVGInline svg={Green_Belt_3_Red_StripesIcon} className="icon" />;
    case 'Green Belt 3 White Stripes':
      return (
        <SVGInline svg={Green_Belt_3_White_StripesIcon} className="icon" />
      );
    case 'Green Belt 4 Red Stripes':
      return <SVGInline svg={Green_Belt_4_Red_StripesIcon} className="icon" />;
    case 'Green Belt 4 White Stripes':
      return (
        <SVGInline svg={Green_Belt_4_White_StripesIcon} className="icon" />
      );

    case 'Green / White Belt No Stripes':
      return (
        <SVGInline svg={Green_White_Belt_No_StripesIcon} className="icon" />
      );
    case 'Green / White Belt 1 Black Stripe':
      return (
        <SVGInline svg={Green_White_Belt_1_Black_StripeIcon} className="icon" />
      );
    case 'Green / White Belt 1 Red Stripe':
      return (
        <SVGInline svg={Green_White_Belt_1_Red_StripeIcon} className="icon" />
      );
    case 'Green / White Belt 1 White Stripe':
      return (
        <SVGInline svg={Green_White_Belt_1_White_StripeIcon} className="icon" />
      );
    case 'Green / White Belt 2 Black Stripes':
      return (
        <SVGInline
          svg={Green_White_Belt_2_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Green / White Belt 2 Red Stripes':
      return (
        <SVGInline svg={Green_White_Belt_2_Red_StripesIcon} className="icon" />
      );
    case 'Green / White Belt 2 White Stripes':
      return (
        <SVGInline
          svg={Green_White_Belt_2_White_StripesIcon}
          className="icon"
        />
      );
    case 'Green / White Belt 3 Black Stripes':
      return (
        <SVGInline
          svg={Green_White_Belt_3_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Green / White Belt 3 Red Stripes':
      return (
        <SVGInline svg={Green_White_Belt_3_Red_StripesIcon} className="icon" />
      );
    case 'Green / White Belt 3 White Stripes':
      return (
        <SVGInline
          svg={Green_White_Belt_3_White_StripesIcon}
          className="icon"
        />
      );
    case 'Green / White Belt 4 Red Stripes':
      return (
        <SVGInline svg={Green_White_Belt_4_Red_StripesIcon} className="icon" />
      );
    case 'Green / White Belt 4 White Stripes':
      return (
        <SVGInline
          svg={Green_White_Belt_4_White_StripesIcon}
          className="icon"
        />
      );

    case 'Green / Black Belt No Stripes':
      return (
        <SVGInline svg={Green_Black_Belt_No_StripesIcon} className="icon" />
      );
    case 'Green / Black Belt 1 Black Stripe':
      return (
        <SVGInline svg={Green_Black_Belt_1_Black_StripeIcon} className="icon" />
      );
    case 'Green / Black Belt 1 Red Stripe':
      return (
        <SVGInline svg={Green_Black_Belt_1_Red_StripeIcon} className="icon" />
      );
    case 'Green / Black Belt 1 White Stripe':
      return (
        <SVGInline svg={Green_Black_Belt_1_White_StripeIcon} className="icon" />
      );
    case 'Green / Black Belt 2 Black Stripes':
      return (
        <SVGInline
          svg={Green_Black_Belt_2_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Green / Black Belt 2 Red Stripes':
      return (
        <SVGInline svg={Green_Black_Belt_2_Red_StripesIcon} className="icon" />
      );
    case 'Green / Black Belt 2 White Stripes':
      return (
        <SVGInline
          svg={Green_Black_Belt_2_White_StripesIcon}
          className="icon"
        />
      );
    case 'Green / Black Belt 3 Black Stripes':
      return (
        <SVGInline
          svg={Green_Black_Belt_3_Black_StripesIcon}
          className="icon"
        />
      );
    case 'Green / Black Belt 3 Red Stripes':
      return (
        <SVGInline svg={Green_Black_Belt_3_Red_StripesIcon} className="icon" />
      );
    case 'Green / Black Belt 3 White Stripes':
      return (
        <SVGInline
          svg={Green_Black_Belt_3_White_StripesIcon}
          className="icon"
        />
      );
    case 'Green / Black Belt 4 Red Stripes':
      return (
        <SVGInline svg={Green_Black_Belt_4_Red_StripesIcon} className="icon" />
      );
    case 'Green / Black Belt 4 White Stripes':
      return (
        <SVGInline
          svg={Green_Black_Belt_4_White_StripesIcon}
          className="icon"
        />
      );

    case 'Black Belt No Stripes':
      return <SVGInline svg={Black_Belt_No_StripesIcon} className="icon" />;
    case 'Black Belt 1 Stripe':
      return <SVGInline svg={Black_Belt_1_StripeIcon} className="icon" />;
    case 'Black Belt 2 Stripes':
      return <SVGInline svg={Black_Belt_2_StripesIcon} className="icon" />;
    case 'Black Belt 3 Stripes':
      return <SVGInline svg={Black_Belt_3_StripesIcon} className="icon" />;
    case 'Black Belt 4 Stripes':
      return <SVGInline svg={Black_Belt_4_StripesIcon} className="icon" />;
    case 'Black Belt 5 Stripes':
      return <SVGInline svg={Black_Belt_5_StripesIcon} className="icon" />;
    case 'Black Belt 6 Stripes':
      return <SVGInline svg={Black_Belt_6_StripesIcon} className="icon" />;
    default:
      return <div />;
  }
}
export function getLocalePreference(space, profile) {
  if (profile.preferredLocale !== null)
    return profile.preferredLocale.toLowerCase();
  if (space.defaultLocale !== null) return space.defaultLocale.toLowerCase();

  return 'en-au';
}
export function getDateValue(dateValue) {
  return dateValue === undefined || dateValue === ''
    ? ''
    : moment(dateValue, 'YYYY-MM-DD').toDate();
}
export function handleDateChange() {
  var value = $('#' + this.id)
    .siblings('.DayPickerInput')
    .find('input')
    .val();
  var input = $('#' + this.id)
    .siblings('.DayPickerInput')
    .find('input');
  console.log('Date value:' + value.trim());
  var dateValue =
    value.trim() === ''
      ? ''
      : moment(value, 'L', this.dayPickerProps.locale).format('YYYY-MM-DD');
  if (value.trim() !== '' && dateValue === 'Invalid date') return;
  if (value.trim() === '') dateValue = '';
  if (this.setIsDirty !== undefined) this.setIsDirty(true);
  if (this.memberChanges) {
    let memberChange = this.memberChanges.find(
      change => change.field === this.fieldName,
    );
    if (!memberChange) {
      memberChange = {
        field: this.fieldName,
        from: this.memberItem.values[this.fieldName],
      };
      this.memberChanges.push(memberChange);
    }
    memberChange.to = dateValue;
    memberChange.date = moment().format(contact_date_format);
  }
  //console.log("key = " + key + ", changes = " + JSON.stringify(memberChanges));

  this.memberItem.values[this.fieldName] = dateValue;

  if (this.required) {
    var val = this.memberItem.values[this.fieldName];
    if (val === undefined || val === null || val === '') {
      input
        .parent()
        .siblings('label')
        .attr('required', 'required');
    } else {
      input
        .parent()
        .siblings('label')
        .removeAttr('required');
      input.css('border-color', '');
    }
  }
  //Commenting out following code since we are using uncontrolled components calling setState on value change (and consequently on every keypress)
  //is not required and not desirable. It will result in lifecycle methods like componentWillReceiveProps, componentDidUpdate etc being called
  //on every keypress
  //A hack to for a redraw of Ranking Belts menu
  if (this.memberItem.myThis !== undefined)
    this.memberItem.myThis.setState({ test: 0 });
}

export function handleChange(
  memberItem,
  key,
  event,
  setIsDirty,
  memberChanges,
) {
  if (setIsDirty !== undefined) setIsDirty(true);
  if (memberChanges) {
    let memberChange = memberChanges.find(change => change.field === key);
    if (!memberChange) {
      memberChange = { field: key, from: memberItem.values[key] };
      memberChanges.push(memberChange);
    }
    memberChange.to = event.target.value;
    memberChange.date = moment().format(contact_date_format);
  }
  //console.log("key = " + key + ", changes = " + JSON.stringify(memberChanges));
  if (!Array.isArray(memberItem.values[key])) {
    memberItem.values[key] = event.target.value.trim();
  }
  if ($(event.target).attr('required')) {
    var val = memberItem.values[key].trim();
    if (val === undefined || val === null || val === '') {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
      $(event.target).css('border-color', '');
    }
  }
  //Commenting out following code since we are using uncontrolled components calling setState on value change (and consequently on every keypress)
  //is not required and not desirable. It will result in lifecycle methods like componentWillReceiveProps, componentDidUpdate etc being called
  //on every keypress
  //A hack to for a redraw of Ranking Belts menu
  if (memberItem.myThis !== undefined) memberItem.myThis.setState({ test: 0 });
}
export function handleNewChange(memberItem, key, event) {
  if (!Array.isArray(memberItem.values[key])) {
    memberItem.values[key] = event.target.value;
  }
  if ($(event.target).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null || val === '') {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
      $(event.target).css('border-color', '');
    }
  }
  //Commenting out following code since we are using uncontrolled components calling setState on value change (and consequently on every keypress)
  //is not required and not desirable. It will result in lifecycle methods like componentWillReceiveProps, componentDidUpdate etc being called
  //on every keypress
  //A hack to for a redraw of Ranking Belts menu
  if (memberItem.myThis !== undefined) memberItem.myThis.setState({ test: 0 });
}

export function handleProgramChange(memberItem, key, event) {
  memberItem.values[key] = event.target.value;

  if ($(event.target).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null || val === '') {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
      $(event.target).css('border-color', '');
    }
  }
  //Commenting out following code since we are using uncontrolled components calling setState on value change (and consequently on every keypress)
  //is not required and not desirable. It will result in lifecycle methods like componentWillReceiveProps, componentDidUpdate etc being called
  //on every keypress
  //A hack to for a redraw of Ranking Belts menu
  if (memberItem.myThis !== undefined) memberItem.myThis.setState({ test: 0 });
}
export function handleDynamicChange(memberItem, key, elementId, setIsDirty) {
  if (setIsDirty !== undefined) setIsDirty(true);
  if (!Array.isArray(memberItem.values[key])) {
    memberItem.values[key] = $('#' + elementId).val();
  }

  if ($('#' + elementId).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null || val === '') {
      $('#' + elementId)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $('#' + elementId)
        .siblings('label')
        .removeAttr('required');
      $('#' + elementId).css('border-color', '');
    }
  }
}

export function handleMultiSelectChange(memberItem, key, element, setIsDirty) {
  if (setIsDirty !== undefined) setIsDirty(true);

  memberItem.values[key] = [...element.options]
    .filter(option => option.selected)
    .map(option => option.value);

  if ($(element).attr('required')) {
    var val = memberItem.values[key];
    if (!val) {
      $(element)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(element)
        .siblings('label')
        .removeAttr('required');
      $(element).css('border-color', '');
    }
  }
}

export function handleFormattedChange(
  values,
  memberItem,
  key,
  event,
  setIsDirty,
  memberChanges,
) {
  if (setIsDirty !== undefined) setIsDirty(true);
  const { formattedValue, value } = values;

  if (memberChanges) {
    let memberChange = memberChanges.find(change => change.field === key);
    if (!memberChange) {
      memberChange = { field: key, from: memberItem.values[key] };
      memberChanges.push(memberChange);
    }
    memberChange.to = value;
    memberChange.date = moment().format(contact_date_format);
  }

  memberItem.values[key] = value;
  if ($(event.target).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null) {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
      $(event.target).css('border-color', '');
    }
  }
}

export function handleDynamicFormattedChange(
  value,
  memberItem,
  key,
  elementId,
  setIsDirty,
) {
  if (setIsDirty !== undefined) setIsDirty(true);
  //const {formattedValue, value} = values;
  memberItem.values[key] = value;
  if ($('#' + elementId).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null) {
      $('#' + elementId)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $('#' + elementId)
        .siblings('label')
        .removeAttr('required');
      $('#' + elementId).css('border-color', '');
    }
  }
}

export function getJson(input) {
  if (!input) {
    return [];
  }

  if (typeof input === 'string') {
    try {
      input = input
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '');
      return $.parseJSON(input);
    } catch (err) {
      return [input];
    }
  } else {
    return input;
  }
}

export function memberStatusInDates(member, fromDate, toDate, returnStatus) {
  var history =
    member.values['Status History'] !== undefined
      ? getJson(member.values['Status History'])
      : {};

  if (history.length > 0) {
    var statusHistorySorted = history.sort(function(stat1, stat2) {
      var date1 = moment(stat1.date);
      var date2 = moment(stat2.date);

      try {
        if (date1.isBefore(date2, 'day')) return -1;
        if (date1.isAfter(date2, 'day')) return 1;
      } catch (error) {
        return 0;
      }
      return 0;
    });

    let oldestDate = moment(
      statusHistorySorted[statusHistorySorted.length - 1].date,
      ['dd MMM DD YYYY hh:mm:ss Z', 'YYYY-MM-DD hh:mm:ss Z'],
    );
    let oldestStatus =
      statusHistorySorted[statusHistorySorted.length - 1].status;
    if (
      oldestDate.isSameOrAfter(fromDate, 'day') &&
      oldestDate.isSameOrBefore(toDate, 'day')
    ) {
      return oldestStatus;
    }

    for (var i = statusHistorySorted.length - 1; i >= 0; i--) {
      if (
        moment(statusHistorySorted[i]['date'], [
          'dd MMM DD YYYY hh:mm:ss Z',
          'YYYY-MM-DD hh:mm:ss Z',
        ]).isSameOrAfter(fromDate, 'day') &&
        moment(statusHistorySorted[i]['date'], [
          'dd MMM DD YYYY hh:mm:ss Z',
          'YYYY-MM-DD hh:mm:ss Z',
        ]).isSameOrBefore(
          toDate,
          'day',
        ) /* ||
        (fromDate.isSame(toDate, 'day') &&
          fromDate.isSameOrAfter(
            moment(new Date(statusHistorySorted[i]['date'])),
            'day',
          )) */
      ) {
        if (statusHistorySorted[i]['status'] === 'Active') {
          return 'Active';
        } else if (statusHistorySorted[i]['status'] === 'Inactive') {
          return 'Inactive';
        } else if (statusHistorySorted[i]['status'] === 'Casual') {
          return 'Casual';
        } else if (
          statusHistorySorted[i]['status'] === 'Pending Cancellation'
        ) {
          return 'Pending Cancellation';
        } else if (
          statusHistorySorted[i]['status'] === 'Frozen' ||
          statusHistorySorted[i]['status'] === 'Suspended'
        ) {
          return 'Frozen';
        } else if (
          statusHistorySorted[i]['status'] === 'Pending Freeze' ||
          statusHistorySorted[i]['status'] === 'Pending Suspension'
        ) {
          return 'Pending Freeze';
        }
      } else {
      }
    }
    if (
      member['values']['Date Joined'] !== undefined &&
      member['values']['Date Joined'] !== null &&
      member['values']['Date Joined'] !== ''
    ) {
      if (
        moment(member['values']['Date Joined'], 'YYYY-MM-DD').isSameOrAfter(
          fromDate,
          'day',
        ) &&
        moment(member['values']['Date Joined'], 'YYYY-MM-DD').isSameOrBefore(
          toDate,
          'day',
        )
      ) {
        return 'Active';
      }
    }

    return returnStatus ? member['values']['Status'] : '';
  } else {
    if (
      member['values']['Date Joined'] !== undefined &&
      member['values']['Date Joined'] !== null &&
      member['values']['Date Joined'] !== ''
    ) {
      if (
        moment(member['values']['Date Joined'], 'YYYY-MM-DD').isSameOrAfter(
          fromDate,
          'day',
        ) &&
        moment(member['values']['Date Joined'], 'YYYY-MM-DD').isSameOrBefore(
          toDate,
          'day',
        )
      ) {
        return 'Active';
      } else {
        return returnStatus
          ? member['values']['Status']
          : member.values['Status'] === 'Inactive'
          ? ''
          : 'Active';
      }
    }
  }
}
export function memberPreviousStatus(member, fromDate, toDate) {
  var history =
    member.values['Status History'] !== undefined
      ? getJson(member.values['Status History'])
      : {};

  if (history.length > 0) {
    var statusHistorySorted = history.sort(function(stat1, stat2) {
      var date1 = moment(stat1.date);
      var date2 = moment(stat2.date);

      try {
        if (date1.isBefore(date2, 'day')) return -1;
        if (date1.isAfter(date2, 'day')) return 1;
      } catch (error) {
        return 0;
      }
      return 0;
    });

    for (var i = statusHistorySorted.length - 1; i >= 0; i--) {
      if (
        moment(new Date(statusHistorySorted[i]['date'])).isSameOrAfter(
          fromDate,
          'day',
        ) &&
        moment(new Date(statusHistorySorted[i]['date'])).isSameOrBefore(
          toDate,
          'day',
        )
      ) {
        if (i > 0) {
          if (statusHistorySorted[i - 1]['status'] === 'Active') {
            return 'Active';
          } else if (statusHistorySorted[i - 1]['status'] === 'Inactive') {
            return 'Inactive';
          } else if (statusHistorySorted[i - 1]['status'] === 'Casual') {
            return 'Casual';
          } else if (
            statusHistorySorted[i - 1]['status'] === 'Pending Cancellation'
          ) {
            return 'Pending Cancellation';
          } else if (
            statusHistorySorted[i - 1]['status'] === 'Frozen' ||
            statusHistorySorted[i - 1]['status'] === 'Suspended'
          ) {
            return 'Frozen';
          } else if (
            statusHistorySorted[i - 1]['status'] === 'Pending Freeze' ||
            statusHistorySorted[i - 1]['status'] === 'Pending Suspension'
          ) {
            return 'Pending Freeze';
          }
        }
      } else {
      }
    }

    return '';
  } else {
    return '';
  }
}
export function isBillingParent(member) {
  var billingUser = member.values['Billing User'];
  if (billingUser === undefined || billingUser !== 'YES') return false;

  var dependants = member.values['Billing Family Members'];
  if (dependants === undefined || dependants === null) return false;
  dependants = JSON.parse(dependants);
  var isPrimary = false;
  dependants.forEach(id => {
    if (id !== member.id) {
      isPrimary = true;
    }
  });
  return isPrimary;
}
export function isNewMember(member) {
  var newMember = true;
  if (
    member.values['Billing User'] === 'YES' ||
    member.values['Billing Migrated'] === 'YES' ||
    (member.values['Billing Customer Reference'] !== null &&
      member.values['Billing Customer Reference'] !== undefined) ||
    (member.values['Billing Parent Member'] !== null &&
      member.values['Billing Parent Member'] !== undefined)
  ) {
    newMember = false;
  }
  return newMember;
}
export function validOverdue(member, successfulPayments, payment) {
  var valid = false;

  if (
    (member.values['Status'] === 'Active' ||
      member.values['Status'] === 'Pending Freeze' ||
      member.values['Status'] === 'Pending Cancellation') &&
    payment.debitDate !== null &&
    member.values['Non Paying'] !== 'YES' &&
    member.values['Billing Payment Type'] === 'Credit Card'
  ) {
    valid = true;
  }
  var billingStartDate = getLastBillingStartDate(member, successfulPayments);
  if (
    billingStartDate.isAfter(moment(payment.debitDate, 'YYYY-MM-DD HH:mm:SS'))
  ) {
    valid = false;
  }
  return valid;
}
export function getLastBillingStartDate(member, successfulPayments) {
  var resumeDate = moment(member.values['Resume Date'], 'YYYY-MM-DD');
  var billingStartDate = moment(
    member.values['Billing Start Date'],
    'YYYY-MM-DD',
  );
  if (
    /*member.values['Status'] !== 'Active' && */
    resumeDate.isAfter(billingStartDate)
  ) {
    billingStartDate = resumeDate;
  }
  var idx = successfulPayments.findIndex(successful => {
    return (
      (member.values['Member ID'] === successful.yourSystemReference ||
        member.values['Billing Customer Reference'] ===
          successful.yourSystemReference ||
        member.values['Billing Setup Fee Id'] ===
          successful.yourSystemReference) &&
      moment(successful.debitDate, 'YYYY-MM-DD HH:mm:SS').isAfter(
        billingStartDate,
      )
    );
  });

  if (idx !== -1) {
    billingStartDate = moment(
      successfulPayments[idx].debitDate,
      'YYYY-MM-DD HH:mm:SS',
    );
  }
  return billingStartDate;
}

export function setMemberPromotionValues(member, belts) {
  let statusIndicator = 'notready';
  let statusText = 'NOT READY';
  let programOrder = 100;
  let promotionSort = 2;
  let attendClasses = 0;
  let durationPeriod = 0;
  if (
    member.values !== undefined &&
    member.values['Ranking Program'] !== undefined &&
    member.values['Ranking Belt'] !== undefined
  ) {
    let belt = belts.find(
      obj =>
        obj['program'] === member.values['Ranking Program'] &&
        obj['belt'] === member.values['Ranking Belt'],
    );
    if (belt !== undefined) {
      attendClasses = belt.attendClasses;
      durationPeriod = belt.durationPeriod;
      programOrder = belt.programOrder;
    }
  }

  let attendanceVal =
    parseInt(member.values['Attendance Count']) / attendClasses;
  let daysElapsed = moment().diff(
    moment(member.values['Last Promotion']),
    'days',
  );
  let daysVal = daysElapsed / durationPeriod;

  if (attendanceVal <= 0.6 || daysVal <= 0.6) {
    statusIndicator = 'notready';
    statusText = 'NOT READY';
    promotionSort = 2;
  } else if (attendanceVal >= 1 && daysVal >= 1) {
    statusIndicator = 'ready';
    statusText = 'READY TO CHECK';
    promotionSort = 0;
  } /*  if (
    attendanceVal >= 0.8 &&
    parseInt(member.values['Attendance Count']) < attendClasses &&
    daysVal >= 0.8
  ) */ else {
    //console.log("attendanceVal:"+attendanceVal+" member.values['Attendance Count']:"+member.values['Attendance Count']+" attendClasses:"+attendClasses+" daysVal:"+daysVal);
    statusIndicator = 'almost';
    statusText = 'ALMOST READY';
    promotionSort = 1;
  }
  let attendancePerc = attendanceVal * 100;
  if (attendancePerc > 100) attendancePerc = 100;

  member.programOrder = programOrder;
  member.promotionSort = promotionSort;
  member.statusText = statusText;
  member.attendClasses = attendClasses;
  member.durationPeriod = durationPeriod;
  member.attendanceVal = attendanceVal;
  member.daysElapsed = daysElapsed;
  member.daysVal = daysVal;
  member.attendancePerc = attendancePerc;
  member.statusIndicator = statusIndicator;

  return member;
}
const handleErrors = error => {
  if (error instanceof Error && !error.response) {
    // When the error is an Error object an exception was thrown in the process.
    // so we'll just 'convert' it to a 400 error to be handled downstream.
    return { serverError: { status: 400, statusText: error.message } };
  }

  // Destructure out the information needed.
  const { data, status, statusText } = error.response;
  if (status === 400 && typeof data === 'object') {
    // If the errors returned are from server-side validations or constraints.
    return data.errors ? { errors: data.errors } : data;
  }

  // For all other server-side errors.
  return { serverError: { status, statusText, error: data && data.error } };
};

export function handleCountryChange(
  memberItem,
  key,
  event,
  setIsDirty,
  memberChanges,
) {
  if (setIsDirty !== undefined) setIsDirty(true);
  if (memberChanges) {
    let memberChange = memberChanges.find(change => change.field === key);
    if (!memberChange) {
      memberChange = { field: key, from: memberItem.values[key] };
      memberChanges.push(memberChange);
    }
    memberChange.to = event.target.value;
    memberChange.date = moment().format(contact_date_format);
  }
  //console.log("key = " + key + ", changes = " + JSON.stringify(memberChanges));
  if (!Array.isArray(memberItem.values[key])) {
    memberItem.values[key] = event.target.value;
  }

  if ($(event.target).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null || val === '') {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
      $(event.target).css('border-color', '');
    }
  }
  var billingSystem = getAttributeValue(
    memberItem.myThis.props.space,
    'Billing Company',
  );
  var states = '';
  let promise = axios.post(
    `https://countriesnow.space/api/v0.1/countries/states`,
    {
      country: event.target.value,
    },
  );

  promise = promise.then(response => {
    if (response.data.data.states) {
      response.data.data.states.forEach(state => {
        if (states.length > 0) {
          states = states + ',';
        }
        states =
          states +
          (billingSystem === 'Bambora' ? state.state_code : state.name);
      });
    }
    if (memberItem.myThis !== undefined)
      memberItem.myThis.setState({ states: states });
    return states;
  });

  promise = promise.catch(handleErrors);

  //Commenting out following code since we are using uncontrolled components calling setState on value change (and consequently on every keypress)
  //is not required and not desirable. It will result in lifecycle methods like componentWillReceiveProps, componentDidUpdate etc being called
  //on every keypress
  //A hack to for a redraw of Ranking Belts menu
}
export function getPhoneNumberFormat(record) {
  var country = record.values['Country'];
  var state = record.values['State'];
  var format = '';
  switch (country) {
    case 'France':
      format = '+33 # ## ## ## ##';
      break;
    case 'Germany':
      format = '+49 ### ### ####';
      break;
    case 'Spain':
      format = '+34 ### ### ###';
      break;
    case 'Portugal':
      format = '+351 ### ### ###';
      break;
    case 'Netherlands':
      format = '+31 ## #### ####';
      break;
    case 'Belgium':
      format = '+32 # ### ## ##';
      break;
    case 'Sweden':
      format = '+46 ### ### ####';
      break;
    case 'Norway':
      format = '+47 ### ## ###';
      break;
    case 'Switzerland':
      format = '+41 ## ### ## ##';
      break;
    case 'Austria':
      format = '+43 ### #####';
      break;
    case 'Denmark':
      format = '+45 ## ## ## ##';
      break;
    case 'Finland':
      format = '+358 # ### ####';
      break;
    case 'Iceland':
      format = '+354 ### ####';
      break;
    case 'Greece':
      format = '+30 ### ### ####';
      break;
    case 'Hungary':
      format = '+36 ## ### ###';
      break;
    case 'Poland':
      format = '+48 ### ### ###';
      break;
    case 'Romania':
      format = '+40 ### ### ###';
      break;
    case 'Czech Republic':
      format = '+420 ### ### ###';
      break;
    case 'Slovakia':
      format = '+421 ### ### ###';
      break;
    case 'Croatia':
      format = '+385 ## ### ####';
      break;
    case 'Bulgaria':
      format = '+359 ## ### ###';
      break;
    case 'Estonia':
      format = '+372 #### ####';
      break;
    case 'Latvia':
      format = '+371 ## ### ###';
      break;
    case 'Lithuania':
      format = '+370 ### #####';
      break;
    case 'Luxembourg':
      format = '+352 ### ###';
      break;
    case 'Malta':
      format = '+356 #### ####';
      break;
    case 'Slovenia':
      format = '+386 # #### ####';
      break;
    case 'United Kingdom':
      format = '## ### ######';
      break;
    case 'Ireland':
      format = '0## ### ####';
      break;
    default:
      format = '# ## ## ## ##';
  }
  if (
    state === 'Antrim' ||
    state === 'Armagh' ||
    state === 'Down' ||
    state === 'Fermanagh' ||
    state === 'Londonderry' ||
    state === 'Tyrone'
  ) {
    format = '0## ### ####';
  }
  return format;
}

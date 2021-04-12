import React from 'react';
import { KappLink as Link, Icon } from 'common';
import SVGInline from 'react-svg-inline';
import billingIcon from '../../assets/images/Billing.svg?raw';
import bookingIcon from '../../assets/images/booking.svg?raw';
import incidentIcon from '../../assets/images/Incidents.svg?raw';
import oceaniaIcon from '../../assets/images/Oceania.svg?raw';
import registrationIcon from '../../assets/images/Registration.svg?raw';

function getCategoryIcon(slug) {
  if (slug === 'billing-registration' || slug === 'payline-billing')
    return billingIcon;
  if (slug === 'class-bookings') return bookingIcon;
  if (slug === 'incidents') return incidentIcon;
  if (slug === 'oceania') return oceaniaIcon;
  if (slug === 'registrations') return registrationIcon;
  return registrationIcon;
}
export const CategoryCard = props => (
  <Link to={props.path} className="card card--category">
    <h1>
      <SVGInline svg={getCategoryIcon(props.category.slug)} className="icon" />
      {props.category.name}
    </h1>
    <p>{props.category.description}</p>
    {props.countOfMatchingForms && <p>{props.countOfMatchingForms} Services</p>}
  </Link>
);

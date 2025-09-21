import React from 'react';
import { KappLink as Link, Icon } from 'common';
import { ReactComponent as BillingIcon } from '../../assets/images/Billing.svg';
import { ReactComponent as BookingIcon } from '../../assets/images/booking.svg';
import { ReactComponent as IncidentIcon } from '../../assets/images/Incidents.svg';
import { ReactComponent as OceaniaIcon } from '../../assets/images/Oceania.svg';
import { ReactComponent as RegistrationIcon } from '../../assets/images/Registration.svg';

function getCategoryIcon(slug) {
  if (
    slug === 'billing-registration' ||
    slug === 'payline-billing' ||
    slug === 'bombara-billing'
  )
    return 'billingIcon';
  if (slug === 'class-bookings') return 'bookingIcon';
  if (slug === 'incidents') return 'incidentIcon';
  if (slug === 'oceania') return 'oceaniaIcon';
  if (slug === 'registrations') return 'registrationIcon';
  return 'registrationIcon';
}
export const CategoryCard = props => (
  <Link to={props.path} className="card card--category">
    <h1>
      <BillingIcon
        className={
          getCategoryIcon(props.category.slug) === 'billingIcon'
            ? 'icon icon-svg'
            : 'hide'
        }
      />
      <BookingIcon
        className={
          getCategoryIcon(props.category.slug) === 'bookingIcon'
            ? 'icon icon-svg'
            : 'hide'
        }
      />
      <IncidentIcon
        className={
          getCategoryIcon(props.category.slug) === 'incidentIcon'
            ? 'icon icon-svg'
            : 'hide'
        }
      />
      <OceaniaIcon
        className={
          getCategoryIcon(props.category.slug) === 'oceaniaIcon'
            ? 'icon icon-svg'
            : 'hide'
        }
      />
      <RegistrationIcon
        className={
          getCategoryIcon(props.category.slug) === 'registrationIcon'
            ? 'icon icon-svg'
            : 'hide'
        }
      />
      {props.category.name}
    </h1>
    <p>{props.category.description}</p>
    {props.countOfMatchingForms && <p>{props.countOfMatchingForms} Services</p>}
  </Link>
);

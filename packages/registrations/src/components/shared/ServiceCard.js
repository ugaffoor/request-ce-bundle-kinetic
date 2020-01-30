import React from 'react';
import { KappLink as Link, Icon } from 'common';

export const ServiceCard = ({ path, form }) => (
  <Link to={path} className="card card--service">
    <h1>
      <Icon image={form.icon} background="blueSlate" />
      {form.name}
    </h1>
    <p>{form.description}</p>
  </Link>
);

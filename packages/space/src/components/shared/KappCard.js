import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, Utils } from 'common';
import { I18n } from '../../../../app/src/I18nProvider';

export const KappCard = ({
  kapp,
  description = Utils.getAttributeValue(
    kapp,
    'Kapp Description',
    Utils.getAttributeValue(kapp, 'Description', ''),
  ),
  icon = Utils.getAttributeValue(kapp, 'Icon', 'fa-circle'),
}) => (
  <Link className="kapp-card" to={`/kapps/${kapp.slug}`}>
    <h1>
      <Icon image={icon} />
      <I18n>{kapp.name}</I18n>
    </h1>
    {description !== '' ? (
      <p>
        <I18n>{description}</I18n>
      </p>
    ) : (
      ''
    )}
  </Link>
);

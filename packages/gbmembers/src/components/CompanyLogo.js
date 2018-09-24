import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { getAttributeValue } from '../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  space: state.member.kinops.space,
});

const mapDispatchToProps = {};

export const CompanyLogo = ({ space }) => (
  <img
    src={getAttributeValue(space, 'Company Logo')}
    alt="Company Logo"
    className="companyLogo"
  />
);

export const CompanyLogoContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(CompanyLogo);

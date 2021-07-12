import React from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { PageTitle } from 'common';
import { Link } from 'react-router-dom';
import { FormCard } from './FormCard';
import wallyHappyImage from 'common/src/assets/images/wally-happy.svg';
import { actions as spaceFormActions } from '../../redux/modules/spaceForms';
import { I18n } from '../../../../app/src/I18nProvider';

const WallyEmptyMessage = () => {
  return (
    <div className="empty-state empty-state--wally">
      <h5>
        <I18n>No Forms To Display</I18n>
      </h5>
      <img src={wallyHappyImage} alt="Happy Wally" />
    </div>
  );
};

export const FormListComponent = ({ forms, loading, kapp }) =>
  !loading && (
    <div className="page-container">
      <PageTitle parts={['Forms']} />
      <div className="page-panel page-panel--space-alerts">
        <div className="page-title">
          <div className="page-title__wrapper">
            <h3>
              <Link to="/">
                <I18n>home</I18n>
              </Link>{' '}
              /
            </h3>
            <h1>
              <I18n
                render={translate =>
                  `${translate(kapp.name)} ${translate('Forms')}`
                }
              />
            </h1>
          </div>
        </div>
        {forms.length > 0 ? (
          <div className="cards__wrapper cards__wrapper--forms">
            {forms
              .map(form => ({
                form,
                path: `/forms/${form.slug}`,
                key: form.slug,
              }))
              .map(props => (
                <FormCard {...props} />
              ))}
          </div>
        ) : (
          <WallyEmptyMessage />
        )}
      </div>
    </div>
  );

const mapStateToProps = state => ({
  loading: state.space.spaceForms.loading,
  forms: state.space.spaceForms.data,
  kappSlug: state.app.config.kappSlug,
  kapp: state.app.kapps.find(kapp => kapp.slug === state.app.config.kappSlug),
});

const mapDispatchToProps = {
  fetchForms: spaceFormActions.fetchForms,
  resetForms: spaceFormActions.resetForms,
};

export const FormList = compose(
  connect(mapStateToProps, mapDispatchToProps),
  lifecycle({
    UNSAFE_componentWillMount(props) {
      this.props.fetchForms(this.props.kappSlug);
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.kappSlug !== nextProps.kappSlug) {
        this.props.fetchForms(nextProps.kappSlug);
      }
    },
    componentWillUnmount() {
      this.props.resetForms();
    },
  }),
)(FormListComponent);

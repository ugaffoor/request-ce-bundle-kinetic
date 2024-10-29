import React, { Fragment } from 'react';

import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { lifecycle, compose, withState } from 'recompose';
import { PageTitle } from 'common';
import {
  ButtonGroup,
  ButtonDropdown,
  DropdownItem,
  DropdownToggle,
  DropdownMenu,
} from 'reactstrap';

import { actions } from '../../../../redux/modules/settingsDatastore';
import { Searchbar } from './Searchbar';
import { SubmissionList } from './SubmissionList';
import { Paging } from './Paging';
import { DatastoreModal } from '../DatastoreModal';
import { I18n } from '../../../../../../app/src/I18nProvider';

const SubmissionSearchComponent = ({
  form,
  loading,
  match,
  openModal,
  optionsOpen,
  setOptionsOpen,
  isSpaceAdmin,
}) => (
  <I18n context={`datastore.forms.${form.slug}`}>
    {!loading ? (
      <div className="page-container page-container--datastore">
        <PageTitle parts={['Search', form.name, 'Datastore']} />
        <div className="page-panel page-panel--scrollable page-panel--datastore-content">
          <div className="page-title">
            <div className="page-title__wrapper">
              {isSpaceAdmin && (
                <h3>
                  <Link to="/">
                    <I18n>home</I18n>
                  </Link>{' '}
                  /{` `}
                  <Link to="/settings">
                    <I18n>settings</I18n>
                  </Link>{' '}
                  /{` `}
                  <Link to={`/settings/datastore/`}>
                    <I18n>datastore</I18n>
                  </Link>{' '}
                  /{` `}
                </h3>
              )}
              <h1>
                <I18n>{form.name}</I18n>
              </h1>
            </div>
            <div className="page-title__actions">
              <Link
                to={`/settings/datastore/${form.slug}/new`}
                className="btn btn-primary"
              >
                <I18n>New Record</I18n>
              </Link>
              <ButtonDropdown
                isOpen={optionsOpen}
                toggle={() => setOptionsOpen(!optionsOpen)}
              >
                <DropdownToggle
                  className="dropdown-toggle hide-caret"
                  color="link"
                >
                  <span className="fa fa-ellipsis-v fa-lg" />
                </DropdownToggle>
                <DropdownMenu>
                  <button
                    onClick={() => openModal('export')}
                    value="export"
                    className="dropdown-item"
                  >
                    <I18n>Export Records</I18n>
                  </button>
                  <button
                    onClick={() => openModal('import')}
                    value="import"
                    className="dropdown-item"
                  >
                    <I18n>Import Records</I18n>
                  </button>
                  {form.canManage && (
                    <Link
                      to={`/settings/datastore/${form.slug}/settings`}
                      className="dropdown-item"
                    >
                      <I18n>Configure Form</I18n>
                    </Link>
                  )}
                </DropdownMenu>
              </ButtonDropdown>
            </div>
          </div>
          <Searchbar formSlug={match.params.slug} />
          <Paging />
          <SubmissionList />
        </div>
      </div>
    ) : null}
    <DatastoreModal />
  </I18n>
);

export const mapStateToProps = state => ({
  loading: state.space.settingsDatastore.currentFormLoading,
  form: state.space.settingsDatastore.currentForm,
  simpleSearchActive: state.space.settingsDatastore.simpleSearchActive,
  submissions: state.space.settingsDatastore.submissions,
  isSpaceAdmin: state.app.profile.spaceAdmin,
});

export const mapDispatchToProps = {
  fetchForm: actions.fetchForm,
  clearForm: actions.clearForm,
  resetSearch: actions.resetSearchParams,
  openModal: actions.openModal,
};

export const SubmissionSearch = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('optionsOpen', 'setOptionsOpen', false),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchForm(this.props.match.params.slug);
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.match.params.slug !== nextProps.match.params.slug) {
        this.props.fetchForm(nextProps.match.params.slug);
        this.props.resetSearch();
      }
    },
    componentWillUnmount() {
      this.props.clearForm();
    },
  }),
)(SubmissionSearchComponent);

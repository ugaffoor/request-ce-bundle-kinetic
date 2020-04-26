import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { compose, withState, withHandlers } from 'recompose';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { TimeAgo } from 'common';
import wallyHappyImage from 'common/src/assets/images/wally-happy.svg';
import { actions } from '../../../redux/modules/forms';
import { I18n } from '../../../../../app/src/I18nProvider';

const WallyEmptyMessage = ({ filter }) => {
  return (
    <div className="empty-state empty-state--wally">
      <h5>
        <I18n>No Queue Forms Found</I18n>
      </h5>
      <img src={wallyHappyImage} alt="Happy Wally" />
    </div>
  );
};

const Timestamp = ({ slug, label, value }) =>
  value && (
    <span>
      <I18n>{label}</I18n>
      &nbsp;
      <TimeAgo timestamp={value} />
    </span>
  );

const FormListComponent = ({
  loading,
  kapp,
  match,
  toggleDropdown,
  openDropdown,
  currentPage,
  formsPerPage,
  setCurrentPage,
  isSpaceAdmin,
}) => {
  const forms = (kapp && kapp.forms) || [];
  const indexOfLastForm = currentPage * formsPerPage;
  const indexOfFirstForm = indexOfLastForm - formsPerPage;
  const currentForms = forms.slice(indexOfFirstForm, indexOfLastForm);
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(forms.length / formsPerPage); i++) {
    pageNumbers.push(i);
  }
  return (
    <div className="page-container page-container--datastore">
      <div className="page-panel page-panel--scrollable page-panel--datastore-content">
        <div className="page-title">
          <div className="page-title__wrapper">
            <h3>
              <Link to="/kapps/queue">
                <I18n>queue</I18n>
              </Link>{' '}
              /{` `}
              <Link to="/kapps/queue/settings">
                <I18n>settings</I18n>
              </Link>{' '}
              /{` `}
            </h3>
            <h1>
              <I18n>Forms</I18n>
            </h1>
          </div>
          {isSpaceAdmin && (
            <Link to={`${match.path}/new`} className="btn btn-primary">
              <I18n>Create Form</I18n>
            </Link>
          )}
        </div>

        <div className="forms-list-wrapper">
          {loading ? (
            <h3>
              <I18n>Loading</I18n>
            </h3>
          ) : forms && forms.length > 0 ? (
            <div>
              <table className="table table-sm table-striped settings-table">
                <thead className="header">
                  <tr>
                    <th>Form Name</th>
                    <th width="30%">
                      <I18n>Description</I18n>
                    </th>
                    <th width="10%">
                      <I18n>Type</I18n>
                    </th>
                    <th width="10%">
                      <I18n>Updated</I18n>
                    </th>
                    <th width="10%">
                      <I18n>Created</I18n>
                    </th>
                    <th width="10%">
                      <I18n>Status</I18n>
                    </th>
                    <th width="48px">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {currentForms.map(form => {
                    return (
                      <tr key={form.slug}>
                        <td>
                          <Link to={`${match.path}/${form.slug}`}>
                            <span>{form.name}</span>
                          </Link>
                          <br />
                          <small>{form.slug}</small>
                        </td>
                        <td>{form.description}</td>
                        <td>{form.type}</td>
                        <td>
                          <Timestamp
                            value={form.updatedAt ? form.updatedAt : null}
                            slug={form.slug}
                          />
                        </td>
                        <td>
                          <Timestamp
                            value={form.createdAt ? form.createdAt : null}
                            slug={form.slug}
                          />
                        </td>
                        <td>{form.status}</td>
                        <td>
                          {form.canManage && (
                            <Dropdown
                              toggle={toggleDropdown(form.slug)}
                              isOpen={openDropdown === form.slug}
                            >
                              <DropdownToggle color="link" className="btn-sm">
                                <span className="fa fa-ellipsis-h fa-2x" />
                              </DropdownToggle>
                              <DropdownMenu right>
                                <DropdownItem
                                  tag={Link}
                                  to={`${match.path}/${form.slug}/settings`}
                                >
                                  <I18n>Configure Form</I18n>
                                </DropdownItem>
                                <DropdownItem
                                  tag={Link}
                                  to={`${match.path}/clone/${form.slug}/`}
                                >
                                  <I18n>Clone Form</I18n>
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <nav aria-label="Page navigation">
                <ul className="pagination">
                  <li className="page-item disabled">
                    <a className="page-link" aria-label="Previous">
                      <span className="icon">
                        <span
                          className="fa fa-fw fa-caret-left"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="sr-only">
                        <I18n>Previous</I18n>
                      </span>
                    </a>
                  </li>
                  {pageNumbers.map(number => (
                    <li
                      key={number}
                      id={number}
                      onClick={() => setCurrentPage(number)}
                      className={
                        currentPage === number
                          ? 'page-item active'
                          : 'page-item'
                      }
                    >
                      <a className="page-link">{number}</a>
                    </li>
                  ))}
                  <li className="page-item disabled">
                    <a className="page-link" aria-label="next">
                      <span className="icon">
                        <span
                          className="fa fa-fw fa-caret-right"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="sr-only">
                        <I18n>Next</I18n>
                      </span>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          ) : (
            <WallyEmptyMessage />
          )}
        </div>
      </div>
    </div>
  );
};

export const mapStateToProps = state => ({
  loading: state.queue.queueSettings.loading,
  kapp: state.queue.queueSettings.queueSettingsKapp,
  formsPerPage: 10,
  isSpaceAdmin: state.app.profile.spaceAdmin,
});

export const mapDispatchToProps = {
  push,
  fetchForms: actions.fetchForms,
};

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? '' : dropdownSlug);

export const FormList = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('openDropdown', 'setOpenDropdown', ''),
  withState('currentPage', 'setCurrentPage', 1),
  withHandlers({ toggleDropdown }),
)(FormListComponent);

import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { push } from 'connected-react-router';
import { connect } from 'react-redux';
import { compose, withState, withHandlers } from 'recompose';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { getTeamColor, getTeamIcon } from '../../../utils';
import { I18n } from '../../../../../app/src/I18nProvider';

const TeamsListItemComponent = ({ team, openDropdown, toggleDropdown }) => {
  return (
    <tr key={team.slug}>
      <Fragment>
        <td scope="row" className="d-md-none d-table-cell">
          <div className="card card--team">
            <div
              className="card--team__header"
              style={{ backgroundColor: getTeamColor(team) }}
            >
              <i className={`fa fa-${getTeamIcon(team)} card-icon`} />
              <span />
            </div>
            <div className="card--team__body">
              <h1>
                <I18n>{team.name}</I18n>
              </h1>
              <pre className="text-truncate">
                <I18n>{team.description}</I18n>
              </pre>

              <div className="btn-group" role="group" aria-label="Actions">
                <Link
                  to={`/settings/teams/${team.slug}/edit`}
                  className="btn btn-info"
                >
                  <I18n>Edit</I18n>
                </Link>
              </div>
            </div>
          </div>
        </td>
      </Fragment>
      <td scope="row">
        <Link to={`/settings/teams/${team.slug}/edit`}>
          <I18n>{team.name}</I18n>
        </Link>
      </td>
      <td className="d-none d-md-table-cell">
        <I18n>{team.description}</I18n>
      </td>
    </tr>
  );
};

export const mapStateToProps = state => ({});

export const mapDispatchToProps = {
  push,
};

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? '' : dropdownSlug);

export const TeamsListItem = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('openDropdown', 'setOpenDropdown', ''),
  withHandlers({ toggleDropdown }),
)(TeamsListItemComponent);

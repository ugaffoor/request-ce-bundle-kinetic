import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { compose, withHandlers, withState } from 'recompose';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import moment from 'moment';
import { Constants } from 'common';
import { I18n } from '../../../../../../app/src/I18nProvider';

const DiscussionIcon = () => (
  <span className="icon">
    <span
      className="fa fa-fw fa-comments"
      style={{
        color: 'rgb(9, 84, 130)',
        fontSize: '16px',
      }}
    />
  </span>
);

const MobileSubmissionCard = ({ submission, columns, path }) => (
  <tr>
    <td
      scope="row"
      className="d-md-none d-table-cell"
      key={`tcol-0-${submission.id}`}
    >
      <div className="card">
        <div className="card-body">
          <strong className="card-title">
            {showDiscussionIcon(submission, columns.first()) ? (
              <DiscussionIcon />
            ) : (
              getSubmissionData(submission, columns.first())
            )}
          </strong>
          <p className="card-text">
            {columns.map((innerColumn, innerIndex) => {
              const innerRowData = getSubmissionData(submission, innerColumn);
              const isDiscussionIdField =
                innerColumn.name === 'Discussion Id' ? true : false;
              return (
                innerIndex !== 0 && (
                  <Fragment key={`tcol-mobile-${innerIndex}`}>
                    {isDiscussionIdField ? (
                      <DiscussionIcon />
                    ) : (
                      <span>
                        <strong>
                          <I18n>{innerColumn.label}</I18n>:
                        </strong>{' '}
                        {innerRowData}
                      </span>
                    )}
                    <br />
                  </Fragment>
                )
              );
            })}
          </p>
          <div className="btn-group" role="group" aria-label="Actions">
            <Link to={`${path}/${submission.id}`} className="btn btn-primary">
              <I18n>View</I18n>
            </Link>
            <Link to={`${path}/${submission.id}/edit`} className="btn btn-info">
              <I18n>Edit</I18n>
            </Link>
            <button
              type="button"
              onClick={handleClone(submission.id)}
              className="btn btn-success"
            >
              <I18n>Clone</I18n>
            </button>
            <div className="dropdown-divider" />
            <button
              type="button"
              onClick={handleDelete(submission.id)}
              className="btn btn-danger"
            >
              <I18n>Delete</I18n>
            </button>
          </div>
        </div>
      </div>
    </td>
  </tr>
);

const TableSubmissionColumn = ({ shouldLink, to, label, discussionIcon }) => (
  <td className="d-none d-md-table-cell">
    {shouldLink ? (
      <Link to={to}>{discussionIcon ? <DiscussionIcon /> : label}</Link>
    ) : discussionIcon ? (
      <DiscussionIcon />
    ) : (
      <span>{label}</span>
    )}
  </td>
);

const TableSubmissionRow = ({
  columns,
  submission,
  path,
  openDropdown,
  toggleDropdown,
  handleClone,
  handleDelete,
}) => (
  <tr>
    {columns.map((column, index) => (
      <TableSubmissionColumn
        key={`tcol-${index}-${submission.id}`}
        shouldLink={index === 0}
        to={`${path}/${submission.id}`}
        label={getSubmissionData(submission, column)}
        discussionIcon={showDiscussionIcon(submission, column)}
      />
    ))}
    <td>
      <Dropdown
        toggle={toggleDropdown(submission.id)}
        isOpen={openDropdown === submission.id}
      >
        <DropdownToggle color="link" className="btn-sm">
          <span className="fa fa-ellipsis-h fa-2x" />
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem tag={Link} to={`${path}/${submission.id}`}>
            <I18n>View</I18n>
          </DropdownItem>
          <DropdownItem tag={Link} to={`${path}/${submission.id}/edit`}>
            <I18n>Edit</I18n>
          </DropdownItem>
          <DropdownItem onClick={handleClone(submission.id)}>
            <I18n>Clone</I18n>
          </DropdownItem>
          <DropdownItem divider />
          <DropdownItem
            onClick={handleDelete(submission.id)}
            className="text-danger"
          >
            <I18n>Delete</I18n>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </td>
  </tr>
);

const SubmissionListItemComponent = ({
  submission,
  columns,
  form,
  handleClone,
  handleDelete,
  openDropdown,
  toggleDropdown,
  path,
  isMobile,
}) =>
  isMobile ? (
    <MobileSubmissionCard
      submission={submission}
      columns={columns}
      path={path}
    />
  ) : (
    <TableSubmissionRow
      columns={columns}
      submission={submission}
      path={path}
      openDropdown={openDropdown}
      toggleDropdown={toggleDropdown}
      handleClone={handleClone}
      handleDelete={handleDelete}
    />
  );

const showDiscussionIcon = (submission, column) =>
  column.type === 'value' &&
  column.name === 'Discussion Id' &&
  submission.values['Discussion Id']
    ? true
    : false;

const getSubmissionData = (submission, column) =>
  column.type === 'value'
    ? submission.values[column.name]
    : column.name.includes('At')
    ? moment(submission[column.name]).format(Constants.TIME_FORMAT)
    : submission[column.name];

const handleClone = ({ cloneSubmission, fetchSubmissions }) => id => () =>
  cloneSubmission({ id: id, callback: fetchSubmissions });

const handleDelete = ({ deleteSubmission, fetchSubmissions }) => id => () =>
  deleteSubmission({ id: id, callback: fetchSubmissions });

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? '' : dropdownSlug);

export const SubmissionListItem = compose(
  withState('openDropdown', 'setOpenDropdown', ''),
  withHandlers({
    toggleDropdown,
    handleClone,
    handleDelete,
  }),
)(SubmissionListItemComponent);

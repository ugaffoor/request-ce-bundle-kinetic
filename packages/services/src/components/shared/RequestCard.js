import React from 'react';
import { KappLink as Link, Icon, TimeAgo } from 'common';
import { StatusPill } from './StatusPill';
import * as helpers from '../../utils';
import * as constants from '../../constants';
import { Form } from '../../models';

const DisplayDateListItem = ({ submission }) => {
  const isDraft = submission.coreState === constants.CORE_STATE_DRAFT;
  return (
    <div className="item">
      <div className="label">{isDraft ? 'Created' : 'Submitted'}</div>
      <div className="value">
        <TimeAgo
          timestamp={isDraft ? submission.createdAt : submission.submittedAt}
        />
      </div>
    </div>
  );
};

const EstCompletionListItem = ({ submission }) => {
  const dueDate = helpers.getDueDate(
    submission,
    constants.ATTRIBUTE_SERVICE_DAYS_DUE,
  );
  return (
    submission.coreState === constants.CORE_STATE_SUBMITTED && (
      <div className="item">
        <div className="label">Est. Completion</div>
        <div className="value">
          <TimeAgo timestamp={dueDate} />
        </div>
      </div>
    )
  );
};

const ClosedDateListItem = ({ submission }) =>
  submission.coreState === constants.CORE_STATE_CLOSED && (
    <div className="item">
      <div className="label">Closed</div>
      <div className="value">
        <TimeAgo timestamp={submission.closedAt} />
      </div>
    </div>
  );

const SubmissionSummary = ({ submission }) => (
  <p>
    {submission.label === submission.id
      ? submission.form.description
      : submission.label}
  </p>
);

export const RequestCard = props => (
  <span>
    <Link to={props.path} className="card card--request">
      <h1>
        <span>{props.submission.form.name}</span>
        <StatusPill submission={props.submission} />
      </h1>
      <SubmissionSummary submission={props.submission} />
      <span className="info">
        <div className="item">
          <div className="label">Confirmation</div>
          <div className="value">{props.submission.handle}</div>
        </div>
        <DisplayDateListItem submission={props.submission} />
        {/*        <EstCompletionListItem submission={props.submission} /> */}
        <ClosedDateListItem submission={props.submission} />
      </span>
    </Link>
    <hr />
  </span>
);

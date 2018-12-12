import React from 'react';
import classNames from 'classnames';

export const AssignmentBadge = ({ queueItem, toggle, readOnly }) => (
  <div
    className={classNames('assignment-badge icon-wrapper', {
      'read-only': readOnly,
    })}
    onClick={toggle}
    role="button"
  >
    <span className="badge" tabIndex={0}>
      {(queueItem.values['Assigned Individual Display Name'] &&
        queueItem.values['Assigned Individual Display Name'].charAt(0)) ||
        (queueItem.values['Assigned Team Display Name'] &&
          queueItem.values['Assigned Team Display Name'].charAt(0))}
    </span>
    <div tabIndex={-1}>
      <div className="team">
        {queueItem.values['Assigned Team Display Name']}
      </div>
      <div className="individual text-truncate">
        {queueItem.values['Assigned Individual Display Name']}
      </div>
    </div>
    {!readOnly && (
      <span className="icon">
        <span className="fa fa-chevron-right icon" tabIndex={0} />
      </span>
    )}
  </div>
);

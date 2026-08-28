import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import moment from 'moment';

const parseNotes = val => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return [];
  }
};

const mergeHistories = (currentNotes, dupNotes) => {
  const combined = [...currentNotes];
  dupNotes.forEach(n => {
    const exists = combined.some(
      c => c.contactDate === n.contactDate && c.note === n.note,
    );
    if (!exists) combined.push(n);
  });
  return combined.sort((a, b) =>
    (b.contactDate || '').localeCompare(a.contactDate || ''),
  );
};

export class MergeLeadsModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedLeadId:
        props.duplicateLeads.length === 1 ? props.duplicateLeads[0].id : null,
    };
  }

  handleMerge = () => {
    const { selectedLeadId } = this.state;
    if (!selectedLeadId) return;

    const duplicate = this.props.duplicateLeads.find(
      l => l.id === selectedLeadId,
    );
    if (!duplicate) return;

    const currentNotes = parseNotes(this.props.currentLead.values['History']);
    const dupNotes = parseNotes(duplicate.values['History']);
    const mergedNotes = mergeHistories(currentNotes, dupNotes);

    let additionalPhone =
      this.props.currentLead.values['Additional Phone Number'] || '';
    const dupPhone = (duplicate.values['Phone Number'] || '').trim();
    const curPhone = (
      this.props.currentLead.values['Phone Number'] || ''
    ).trim();
    if (
      dupPhone &&
      dupPhone !== curPhone &&
      !additionalPhone.includes(dupPhone)
    ) {
      additionalPhone = additionalPhone
        ? `${additionalPhone}, ${dupPhone}`
        : dupPhone;
    }

    let additionalEmail =
      this.props.currentLead.values['Additional Email'] || '';
    const dupEmail = (duplicate.values['Email'] || '').trim();
    const curEmail = (this.props.currentLead.values['Email'] || '').trim();
    if (
      dupEmail &&
      dupEmail !== curEmail &&
      !additionalEmail.includes(dupEmail)
    ) {
      additionalEmail = additionalEmail
        ? `${additionalEmail}, ${dupEmail}`
        : dupEmail;
    }

    this.props.updateLead({
      id: this.props.currentLead.id,
      leadItem: {
        ...this.props.currentLead,
        values: {
          ...this.props.currentLead.values,
          History: JSON.stringify(mergedNotes),
          'Additional Phone Number': additionalPhone,
          'Additional Email': additionalEmail,
        },
      },
      allLeads: this.props.allLeads,
      addNotification: this.props.addNotification,
    });

    this.props.deleteLead({
      leadItem: duplicate,
      allLeads: this.props.allLeads,
      leadsByDate: this.props.leadsByDate,
    });

    this.props.onMergeComplete(duplicate.id);
    this.props.onClose();
  };

  render() {
    const { duplicateLeads, onClose } = this.props;
    const { selectedLeadId } = this.state;

    return (
      <ModalContainer onClose={onClose}>
        <ModalDialog className="mergeLeadsDialog" onClose={onClose}>
          <h4>Merge Leads</h4>
          <p style={{ marginBottom: '12px' }}>
            Select the duplicate lead to merge into the current lead. Its
            history will be combined, and any different phone or email will be
            added as additional. The duplicate will then be deleted.<br />
            Note, it is best to merge into the Lead that may have a
            Registration/Waiver added.
          </p>
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th />
                <th>Name</th>
                <th>Status</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {duplicateLeads.map(lead => (
                <tr
                  key={lead.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => this.setState({ selectedLeadId: lead.id })}
                >
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="radio"
                      readOnly
                      checked={selectedLeadId === lead.id}
                    />
                  </td>
                  <td>
                    {(lead.values['First Name'].trim() || '') +
                      ' ' +
                      (lead.values['Last Name'].trim() || '')}
                  </td>
                  <td>{lead.values['Status'] || ''}</td>
                  <td>{lead.values['Email'].trim() || ''}</td>
                  <td>{lead.values['Phone Number'] || ''}</td>
                  <td>
                    {lead.createdAt ? moment(lead.createdAt).format('L') : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button
              type="button"
              className="btn btn-default"
              onClick={onClose}
              style={{ marginRight: '8px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedLeadId}
              onClick={this.handleMerge}
            >
              Merge
            </button>
          </div>
        </ModalDialog>
      </ModalContainer>
    );
  }
}

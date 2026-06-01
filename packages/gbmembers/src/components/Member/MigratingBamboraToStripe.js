import React, { Component } from 'react';
import { compose, lifecycle } from 'recompose';
import $ from 'jquery';
import { connect } from 'react-redux';
import { withHandlers } from 'recompose';
import moment from 'moment';
import ReactTable from 'react-table';
import { KappNavLink as NavLink, Utils } from 'common';
import { getTimezone } from '../leads/LeadsUtils';
import { confirm } from '../helpers/Confirmation';
import NumberFormat from 'react-number-format';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import { actions } from '../../redux/modules/members';
import { actions as appActions } from '../../redux/modules/memberApp';
import { actions as errorActions } from '../../redux/modules/errors';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import {
  getAttributeValue,
  setAttributeValue,
} from '../../lib/react-kinops-components/src/utils';
import { bundle } from '@kineticdata/react';

const REGISTER_USER_URL = '/registerUser';

const globals = import('common/globals');

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  profile: state.member.app.profile,
  space: state.member.app.space,
  spaceSlug: state.member.app.spaceSlug,
  kineticBillingServerUrl: state.member.app.kineticBillingServerUrl,
  memberNotesLoaded: state.member.members.memberNotesLoaded,
  membersLoading: state.member.members.membersLoading,
  membersNextPageToken: state.member.members.membersNextPageToken,
  memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
  memberLastFetchTime: state.member.members.memberLastFetchTime,
});
const mapDispatchToProps = {
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  updateMember: actions.updateMember,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchMembers: actions.fetchMembers,
  updateSpaceAttribute: dataStoreActions.updateSpaceAttribute,
  fetchPaymentHistory: actions.fetchPaymentHistory,
};

const getNextBillingDate = m => {
  var resumeDate = moment(m.values['Resume Date'], 'YYYY-MM-DD');
  var billingStartDate = moment(m.values['Billing Start Date'], 'YYYY-MM-DD');
  if (
    m.values['Status'] !== 'Active' &&
    resumeDate.isValid() &&
    resumeDate.isAfter(billingStartDate)
  ) {
    billingStartDate = resumeDate;
  }
  if (!billingStartDate.isValid()) return '';

  var paymentPeriod = m.values['Billing Payment Period'];
  var period = 'months';
  var periodCount = 1;
  if (paymentPeriod === 'Daily') {
    period = 'days';
  } else if (paymentPeriod === 'Weekly') {
    period = 'weeks';
  } else if (paymentPeriod === 'Fortnightly') {
    period = 'weeks';
    periodCount = 2;
  } else if (paymentPeriod === '4 Weekly') {
    period = 'weeks';
    periodCount = 4;
  } else if (paymentPeriod === 'Monthly') {
    period = 'months';
  }

  var lastPayment = billingStartDate.clone();
  if (lastPayment.isAfter(moment())) {
    lastPayment = lastPayment.subtract(periodCount, period);
  }

  var nextBillingDate = lastPayment.add(periodCount, period);
  while (nextBillingDate.isBefore(moment())) {
    nextBillingDate = nextBillingDate.add(periodCount, period);
  }
  return nextBillingDate.format('DD MMM YYYY');
};

const getTableData = allMembers =>
  allMembers
    .filter(
      m =>
        m.values['Billing User'] === 'YES' &&
        m.values['Archive Billing Id'] &&
        m.values['Archive Billing Id'] !== '' &&
        (!m.values['Archive Billing Reference'] ||
          m.values['Archive Billing Reference'] === ''),
    )
    .map(m => ({
      id: m.id,
      name:
        (m.values['First Name'] || '') + ' ' + (m.values['Last Name'] || ''),
      status: m.values['Status'],
      archiveBillingId: m.values['Archive Billing Id'],
      nextBillingDate: getNextBillingDate(m),
      billingTomorrow: moment(getNextBillingDate(m), 'DD MMM YYYY').isSame(
        moment().add(1, 'days'),
        'day',
      ),
    }));

const getMigratedHistory = allMembers =>
  allMembers
    .filter(
      m =>
        m.values['Billing User'] === 'YES' &&
        m.values['Archive Billing Reference'] &&
        m.values['Archive Billing Reference'] !== '' &&
        m.values['Billing Customer Reference'] &&
        m.values['Billing Customer Reference'] !== '',
    )
    .map(m => {
      let completedDate = '';
      let completedDateSort = '';
      try {
        let notes = m.values['Notes History'];
        if (notes) {
          if (typeof notes !== 'object') notes = JSON.parse(notes);
          const migrationNote = [...notes]
            .reverse()
            .find(
              n =>
                n.note &&
                n.note.includes('Migrated billing from Bambora to Stripe'),
            );
          if (migrationNote && migrationNote.contactDate) {
            completedDateSort = migrationNote.contactDate;
            const d = moment(migrationNote.contactDate, 'YYYY-MM-DD HH:mm');
            completedDate = d.isValid()
              ? d.format('L hh:mm A')
              : migrationNote.contactDate;
          }
        }
      } catch (e) {}
      return {
        id: m.id,
        name:
          (m.values['First Name'] || '') + ' ' + (m.values['Last Name'] || ''),
        completedDate,
        completedDateSort,
        bamboraReference: m.values['Archive Billing Reference'],
        stripeReference: m.values['Billing Customer Reference'],
      };
    })
    .sort((a, b) =>
      (b.completedDateSort || '').localeCompare(a.completedDateSort || ''),
    );

const LS_PREFIX = 'migrationStripe_';

const getSpaceAttr = (space, key) => Utils.getAttributeValue(space, key) || '';

export class MigratingBamboraToStripe extends Component {
  constructor(props) {
    super(props);
    const { space } = props;

    const ls = key =>
      localStorage.getItem(LS_PREFIX + key) !== null
        ? localStorage.getItem(LS_PREFIX + key)
        : getSpaceAttr(space, key);

    this.state = {
      selected: {},
      nameFilter: '',
      billingSettingsApplied: false,
      stripeSettingsConfirmed:
        localStorage.getItem(LS_PREFIX + 'stripeSettingsConfirmed') === 'true',
      confirmedCheckbox:
        localStorage.getItem(LS_PREFIX + 'stripeSettingsConfirmed') === 'true',
      migratedMembers: [],
      migratingIds: [],
      cancelling: false,
      showMigrationHistory: false,
      archivingBambora: false,
      migrationComplete: false,
      bamboraCutoffDate: getAttributeValue(space, 'Bambora Cutoff Date') || '',
      // Billing & Tax settings
      ignoreAdminFee:
        localStorage.getItem(LS_PREFIX + 'Ignore Admin Fee') !== null
          ? localStorage.getItem(LS_PREFIX + 'Ignore Admin Fee') === 'YES'
          : getSpaceAttr(space, 'Ignore Admin Fee') === 'YES',
      adminFeeLabel: ls('Admin Fee Label'),
      adminFeeCharge: (() => {
        const raw = ls('Admin Fee Charge');
        if (!raw || raw === '') return '';
        const stripped = parseFloat(raw.toString().replace('%', ''));
        return isNaN(stripped) ? '' : stripped / 100;
      })(),
      tax1Label: ls('TAX 1 Label'),
      tax1Value: (() => {
        const raw = ls('TAX 1 Value');
        const parsed = parseFloat(raw);
        return isNaN(parsed) ? '' : parsed;
      })(),
      tax2Label: ls('TAX 2 Label'),
      tax2Value: (() => {
        const raw = ls('TAX 2 Value');
        const parsed = parseFloat(raw);
        return isNaN(parsed) ? '' : parsed;
      })(),
    };
  }

  toggleRow(id) {
    this.setState(prev => ({
      selected: {
        ...prev.selected,
        [id]: !prev.selected[id],
      },
    }));
  }

  toggleAll(data) {
    const eligible = data.filter(row => !row.billingTomorrow);
    const allSelected =
      eligible.length > 0 && eligible.every(row => this.state.selected[row.id]);
    const selected = {};
    if (!allSelected) {
      eligible.forEach(row => {
        selected[row.id] = true;
      });
    }
    this.setState({ selected });
  }

  applyBillingSettings() {
    const {
      ignoreAdminFee,
      adminFeeLabel,
      adminFeeCharge,
      tax1Label,
      tax1Value,
      tax2Label,
      tax2Value,
    } = this.state;
    localStorage.setItem(
      LS_PREFIX + 'Ignore Admin Fee',
      ignoreAdminFee ? 'YES' : 'NO',
    );
    localStorage.setItem(LS_PREFIX + 'Admin Fee Label', adminFeeLabel);
    localStorage.setItem(
      LS_PREFIX + 'Admin Fee Charge',
      adminFeeCharge !== '' ? adminFeeCharge * 100 + '%' : '',
    );
    localStorage.setItem(LS_PREFIX + 'TAX 1 Label', tax1Label);
    localStorage.setItem(LS_PREFIX + 'TAX 1 Value', tax1Value);
    localStorage.setItem(LS_PREFIX + 'TAX 2 Label', tax2Label);
    localStorage.setItem(LS_PREFIX + 'TAX 2 Value', tax2Value);
    const confirmed = this.state.confirmedCheckbox;
    localStorage.setItem(
      LS_PREFIX + 'stripeSettingsConfirmed',
      confirmed ? 'true' : 'false',
    );
    this.setState({
      billingSettingsApplied: true,
      stripeSettingsConfirmed: confirmed,
    });
    setTimeout(() => this.setState({ billingSettingsApplied: false }), 3000);
  }

  cancelMigration() {
    this._cancelled = true;
    this.setState({ cancelling: true });
  }

  setMigratedDate() {
    const {
      space,
      spaceSlug,
      kineticBillingServerUrl,
      profile,
      addNotification,
      setSystemError,
    } = this.props;
    const cutoverDate = moment().format('YYYY-MM-DD');
    const timezone = space.defaultTimezone || 'UTC';

    this.setState({ archivingBambora: true });

    axios
      .post(kineticBillingServerUrl + '/archiveBambora', {
        space: spaceSlug,
        cutoverDate,
        timezone,
      })
      .then(result => {
        if (result.data.error && result.data.error > 0) {
          this.setState({ archivingBambora: false });
          addNotification(
            'ERROR',
            result.data.errorMessage || 'Failed to archive Bambora',
            'Set Migrated Date',
          );
        } else {
          this.props.updateSpaceAttribute({
            space,
            values: {
              Status: 'New',
              'Attribute Name': 'Bambora Cutoff Date',
              'Original Value':
                getAttributeValue(space, 'Bambora Cutoff Date') || '',
              'New Value': cutoverDate,
              'Updated By': profile.username,
            },
          });
          this.setState({
            archivingBambora: false,
            bamboraCutoffDate: cutoverDate,
          });
          addNotification(
            'SUCCESS',
            'Bambora cutover date set to ' + cutoverDate,
            'Set Migrated Date',
          );
        }
      })
      .catch(error => {
        console.error('archiveBambora error', error);
        this.setState({ archivingBambora: false });
        setSystemError(error);
      });
  }

  checkKineticConnectivity() {
    return axios
      .get(bundle.apiLocation() + '/me', { timeout: 10000 })
      .then(() => true)
      .catch(() => false);
  }

  migrateMembers() {
    this._cancelled = false;
    const {
      allMembers,
      updateMember,
      addNotification,
      space,
      spaceSlug,
      kineticBillingServerUrl,
      profile,
    } = this.props;

    const selectedIds = Object.entries(this.state.selected)
      .filter(([, checked]) => checked)
      .map(([id]) => id);

    this.setState({ migratingIds: selectedIds });

    const currency = getAttributeValue(space, 'Currency') || 'USD';

    selectedIds.forEach(id => {
      if (this._cancelled) {
        this.setState(prev => {
          const newIds = prev.migratingIds.filter(mid => mid !== id);
          return {
            migratingIds: newIds,
            cancelling: newIds.length > 0,
          };
        });
        return;
      }
      const memberItem = allMembers.find(m => m.id === id);
      if (!memberItem) return;

      const nextBillingDate = getNextBillingDate(memberItem);
      const startDate = nextBillingDate
        ? moment(nextBillingDate, 'DD MMM YYYY').format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD');

      const args = {
        space: spaceSlug,
        billingService: 'Stripe',
        customerId: memberItem.values['Member ID'],
        paymentMethod: 'Credit Card',
        firstName: memberItem.values['First Name'],
        lastName: memberItem.values['Last Name'],
        dob: memberItem.values['DOB'],
        address: memberItem.values['Address'],
        suburb: memberItem.values['Suburb'],
        state: memberItem.values['State'],
        postCode: memberItem.values['Postcode'],
        email: memberItem.values['Email'],
        mobile: memberItem.values['Mobile'],
        billingPeriod: memberItem.values['Billing Payment Period'],
        payment: memberItem.values['Membership Cost'],
        contractStartDate: startDate,
        cardToken: memberItem.values['Archive Billing Id'],
        currency,
      };

      // Verify Kinetic connectivity before calling registerUser
      this.checkKineticConnectivity().then(connected => {
        if (!connected) {
          addNotification(
            'ERROR',
            'Lost connection to Kinetic — skipping ' +
              (memberItem.values['First Name'] || '') +
              ' ' +
              (memberItem.values['Last Name'] || '') +
              '. Please retry when the connection is restored.',
            'Migration Skipped',
          );
          this.setState(prev => {
            const newIds = prev.migratingIds.filter(mid => mid !== id);
            return {
              migratingIds: newIds,
              cancelling: newIds.length > 0 ? prev.cancelling : false,
            };
          });
          return;
        }

        axios
          .post(kineticBillingServerUrl + REGISTER_USER_URL, args)
          .then(result => {
            if (result.data.error && result.data.error > 0) {
              addNotification(
                'ERROR',
                result.data.errorMessage,
                'Migration Failed: ' +
                  memberItem.values['First Name'] +
                  ' ' +
                  memberItem.values['Last Name'],
              );
              this.setState(prev => {
                const newIds = prev.migratingIds.filter(mid => mid !== id);
                return {
                  migratingIds: newIds,
                  cancelling: newIds.length > 0 ? prev.cancelling : false,
                };
              });
            } else {
              const customerBillingId = result.data.data.customerBillingId;
              const bamboraCustomerIdRef =
                memberItem.values['Billing Customer Id'];
              const bamboraRef =
                memberItem.values['Billing Customer Reference'];
              const archiveBillingId = memberItem.values['Archive Billing Id'];
              const migratedAt = moment().format('DD MMM YYYY HH:mm');

              // Step 1: Add Stripe migration note only (no billing field changes yet)
              let notesHistory = memberItem.values['Notes History'];
              if (!notesHistory) {
                notesHistory = [];
              } else if (typeof notesHistory !== 'object') {
                notesHistory = JSON.parse(notesHistory);
              }
              notesHistory.push({
                note:
                  'Migrated billing from Bambora to Stripe. New Stripe Customer Reference: ' +
                  customerBillingId,
                contactDate: moment().format('YYYY-MM-DD HH:mm'),
                contactMethod: 'System',
                submitter: profile.displayName,
              });
              memberItem.values['Notes History'] = notesHistory;
              updateMember({
                id: memberItem.id,
                memberItem,
                values: { 'Notes History': notesHistory },
                allMembers,
              });

              // Step 2: Cancel Bambora billing
              axios
                .post(kineticBillingServerUrl + '/customerStatusChange', {
                  customerId: bamboraRef,
                  billingService: 'Bambora',
                  space: spaceSlug,
                  newStatus: 'Inactive',
                })
                .then(cancelResult => {
                  const bamboraCancelled =
                    !cancelResult.data.error || cancelResult.data.error === 0;

                  // Step 3: Add cancellation note
                  notesHistory.push({
                    note: bamboraCancelled
                      ? 'Cancelled Bambora billing. Customer Reference: ' +
                        bamboraRef
                      : 'Failed to cancel Bambora billing. Customer Reference: ' +
                        bamboraRef +
                        '. Error: ' +
                        (cancelResult.data.errorMessage || 'Unknown error'),
                    contactDate: moment().format('YYYY-MM-DD HH:mm'),
                    contactMethod: 'System',
                    submitter: profile.displayName,
                  });

                  // Step 3b: Fetch Stripe payment history to migrate records
                  this.props.fetchPaymentHistory({
                    billingService: 'Stripe',
                    billingRef: customerBillingId,
                    paymentType: 'ALL',
                    paymentMethod: 'ALL',
                    paymentSource: 'ALL',
                    dateField: 'PAYMENT',
                    dateFrom: moment
                      .utc()
                      .subtract(2, 'years')
                      .format('YYYY-MM-DD'),
                    dateTo: moment
                      .utc()
                      .add(1, 'days')
                      .format('YYYY-MM-DD'),
                    internalPaymentType: 'customer',
                    addNotification,
                    setSystemError: this.props.setSystemError,
                    timezone: getTimezone(
                      profile.timezone,
                      space.defaultTimezone,
                    ),
                    useSubAccount:
                      memberItem.values['useSubAccount'] === 'YES' ||
                      (getAttributeValue(space, 'Billing Company') ===
                        'Bambora' &&
                        getAttributeValue(space, 'PaySmart SubAccount') ===
                          'YES'),
                    bamboraCutoverDate: moment().format('YYYY-MM-DD'),
                    bamboraCustomerId: bamboraCustomerIdRef,
                  });

                  // Step 4: Update billing/archive fields
                  memberItem.values['Archive Billing Id'] =
                    memberItem.values['Billing Customer Id'];
                  memberItem.values['Archive Billing Reference'] = bamboraRef;
                  memberItem.values['Billing Customer Id'] = archiveBillingId;
                  memberItem.values[
                    'Billing Customer Reference'
                  ] = customerBillingId;
                  memberItem.values['Notes History'] = notesHistory;
                  updateMember({
                    id: memberItem.id,
                    memberItem,
                    values: {
                      'Archive Billing Id':
                        memberItem.values['Archive Billing Id'],
                      'Archive Billing Reference':
                        memberItem.values['Archive Billing Reference'],
                      'Billing Customer Id':
                        memberItem.values['Billing Customer Id'],
                      'Billing Customer Reference': customerBillingId,
                      'Notes History': notesHistory,
                    },
                    allMembers,
                  });

                  // Step 5: Record result with cancellation status
                  this.setState(prev => ({
                    migratedMembers: [
                      ...prev.migratedMembers,
                      {
                        id: memberItem.id,
                        name:
                          (memberItem.values['First Name'] || '') +
                          ' ' +
                          (memberItem.values['Last Name'] || ''),
                        bamboraReference: bamboraRef,
                        stripeCustomerId: archiveBillingId,
                        stripeReference: customerBillingId,
                        migratedAt,
                        bamboraCancelled: bamboraCancelled ? 'Yes' : 'No',
                        kineticUpdated: 'Yes',
                      },
                    ],
                    selected: { ...prev.selected, [id]: false },
                    migratingIds: prev.migratingIds.filter(mid => mid !== id),
                    cancelling:
                      prev.migratingIds.filter(mid => mid !== id).length > 0
                        ? prev.cancelling
                        : false,
                  }));
                })
                .catch(cancelError => {
                  console.error(
                    'Bambora cancellation error for member ' + id,
                    cancelError,
                  );

                  // Still update billing fields even if cancellation call failed
                  notesHistory.push({
                    note:
                      'Failed to cancel Bambora billing (network error). Customer Reference: ' +
                      bamboraRef,
                    contactDate: moment().format('YYYY-MM-DD HH:mm'),
                    contactMethod: 'System',
                    submitter: profile.displayName,
                  });
                  memberItem.values['Archive Billing Id'] =
                    memberItem.values['Billing Customer Id'];
                  memberItem.values['Archive Billing Reference'] = bamboraRef;
                  memberItem.values['Billing Customer Id'] = archiveBillingId;
                  memberItem.values[
                    'Billing Customer Reference'
                  ] = customerBillingId;
                  memberItem.values['Notes History'] = notesHistory;
                  updateMember({
                    id: memberItem.id,
                    memberItem,
                    values: {
                      'Archive Billing Id':
                        memberItem.values['Archive Billing Id'],
                      'Archive Billing Reference':
                        memberItem.values['Archive Billing Reference'],
                      'Billing Customer Id':
                        memberItem.values['Billing Customer Id'],
                      'Billing Customer Reference': customerBillingId,
                      'Notes History': notesHistory,
                    },
                    allMembers,
                  });

                  this.setState(prev => ({
                    migratedMembers: [
                      ...prev.migratedMembers,
                      {
                        id: memberItem.id,
                        name:
                          (memberItem.values['First Name'] || '') +
                          ' ' +
                          (memberItem.values['Last Name'] || ''),
                        bamboraReference: bamboraRef,
                        stripeCustomerId: archiveBillingId,
                        stripeReference: customerBillingId,
                        migratedAt,
                        bamboraCancelled: 'Error',
                        kineticUpdated: 'Yes',
                      },
                    ],
                    selected: { ...prev.selected, [id]: false },
                    migratingIds: prev.migratingIds.filter(mid => mid !== id),
                    cancelling:
                      prev.migratingIds.filter(mid => mid !== id).length > 0
                        ? prev.cancelling
                        : false,
                  }));
                });
            }
          })
          .catch(error => {
            console.error('Migration error for member ' + id, error);
            addNotification(
              'ERROR',
              'Migration failed for ' +
                memberItem.values['First Name'] +
                ' ' +
                memberItem.values['Last Name'],
            );
            this.setState(prev => {
              const newIds = prev.migratingIds.filter(mid => mid !== id);
              return {
                migratingIds: newIds,
                cancelling: newIds.length > 0 ? prev.cancelling : false,
              };
            });
          });
      });
    });
  }

  getColumns(data) {
    const eligible = data.filter(row => !row.billingTomorrow);
    const allSelected =
      eligible.length > 0 && eligible.every(row => this.state.selected[row.id]);
    return [
      {
        id: 'checkbox',
        accessor: '',
        Header: () => (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => this.toggleAll(data)}
          />
        ),
        Cell: props => {
          const restricted = props.original.billingTomorrow;
          return restricted ? (
            <span
              title="Migration not allowed — billing is due tomorrow"
              style={{ color: '#c0392b', fontSize: '12px', cursor: 'default' }}
            >
              ✕
            </span>
          ) : (
            <input
              type="checkbox"
              checked={!!this.state.selected[props.original.id]}
              onChange={() => this.toggleRow(props.original.id)}
            />
          );
        },
        width: 40,
        sortable: false,
        filterable: false,
      },
      {
        accessor: 'name',
        Header: 'Name',
        Cell: props => (
          <NavLink to={`/Member/${props.original.id}`}>{props.value}</NavLink>
        ),
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 120,
      },
      {
        accessor: 'archiveBillingId',
        Header: 'Stripe Customer ID',
      },
      {
        accessor: 'nextBillingDate',
        Header: 'Next Billing Date',
        width: 140,
      },
    ];
  }

  render() {
    const { allMembers } = this.props;
    const { nameFilter } = this.state;
    const reviewMode =
      this.state.migrationComplete ||
      new URLSearchParams(
        this.props.location ? this.props.location.search : '',
      ).has('review');
    const allData = getTableData(allMembers);
    const data = nameFilter
      ? allData.filter(row =>
          row.name.toLowerCase().includes(nameFilter.toLowerCase()),
        )
      : allData;
    const columns = this.getColumns(data);
    const selectedCount = Object.values(this.state.selected).filter(Boolean)
      .length;

    return (
      <div className="migratingBamboraToStripe">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1>Bambora to Stripe Migration</h1>
          {!reviewMode && (
            <ul style={{ textAlign: 'left' }}>
              <li>
                Step 1: Configure and apply the Stripe settings that will be
                used to create the Stripe Billing accounts.
              </li>

              <li>
                Step 2: All billing members ready to be promoted will be listed.
                You can select all members, but it is recommended to migrate a
                few members first to ensure everything is working as expected.
                <br />
                Note: If a member’s billing payment is due today or tomorrow,
                they cannot be selected. You must migrate that member after the
                due date.
              </li>

              <li>
                Step 3: Once all members have been migrated, the "Set Migrated
                Date" option will be enabled.
                <br />
                This should be clicked to mark the completion date, which will
                also allow the system to store all Bambora transactions for
                historical purposes.
              </li>

              <li>
                Step 4: Once you are satisfied with the migration, click the
                "Complete Migration" button.
                <br />
                Note: To review the migration history, a new button called "View
                Migration Details" will appear on the Reports tab.
              </li>
            </ul>
          )}
          <span style={{ fontWeight: 600 }}>
            {data.length} member{data.length !== 1 ? 's' : ''} to migrate
            {selectedCount > 0 && ` — ${selectedCount} selected`}
          </span>
        </div>

        <fieldset
          disabled={reviewMode}
          style={{ border: 'none', padding: 0, margin: 0 }}
        >
          <div
            className="migrationBillingSettings"
            style={{
              marginBottom: '20px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              opacity: reviewMode ? 0.6 : 1,
            }}
          >
            <h5 style={{ marginTop: 0 }}>Billing and Taxes for Stripe</h5>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={this.state.ignoreAdminFee}
                  onChange={e =>
                    this.setState({ ignoreAdminFee: e.target.checked })
                  }
                  style={{ marginRight: '6px' }}
                />
                Ignore Admin Fee
              </label>
            </div>
            {!this.state.ignoreAdminFee && (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="form-group">
                  <label className="control-label">Admin Fee Label</label>
                  <input
                    type="text"
                    className="form-control input-sm"
                    value={this.state.adminFeeLabel}
                    onChange={e =>
                      this.setState({ adminFeeLabel: e.target.value })
                    }
                    style={{ width: '180px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="control-label">Admin Fee Charge (%)</label>
                  <NumberFormat
                    value={
                      this.state.adminFeeCharge !== ''
                        ? this.state.adminFeeCharge * 100
                        : ''
                    }
                    suffix="%"
                    decimalScale={4}
                    style={{ width: '100px' }}
                    className="form-control input-sm"
                    onChange={e => {
                      const parsed = parseFloat(e.target.value) / 100;
                      this.setState({
                        adminFeeCharge: isNaN(parsed) ? '' : parsed,
                      });
                    }}
                  />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div className="form-group">
                <label className="control-label">Membership Tax Label</label>
                <input
                  type="text"
                  className="form-control input-sm"
                  value={this.state.tax1Label}
                  onChange={e => this.setState({ tax1Label: e.target.value })}
                  style={{ width: '180px' }}
                />
              </div>
              <div className="form-group">
                <label className="control-label">
                  Membership Tax Percentage (%)
                </label>
                <NumberFormat
                  value={
                    this.state.tax1Value !== ''
                      ? this.state.tax1Value * 100
                      : ''
                  }
                  suffix="%"
                  decimalScale={4}
                  className="form-control input-sm"
                  style={{ width: '100px' }}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value) / 100;
                    this.setState({ tax1Value: isNaN(parsed) ? '' : parsed });
                  }}
                />
              </div>
              <div className="form-group">
                <label className="control-label">Membership Tax 2 Label</label>
                <input
                  type="text"
                  className="form-control input-sm"
                  value={this.state.tax2Label}
                  onChange={e => this.setState({ tax2Label: e.target.value })}
                  style={{ width: '180px' }}
                />
              </div>
              <div className="form-group">
                <label className="control-label">
                  Membership Tax 2 Percentage (%)
                </label>
                <NumberFormat
                  value={
                    this.state.tax2Value !== ''
                      ? this.state.tax2Value * 100
                      : ''
                  }
                  suffix="%"
                  decimalScale={4}
                  className="form-control input-sm"
                  style={{ width: '100px' }}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value) / 100;
                    this.setState({ tax2Value: isNaN(parsed) ? '' : parsed });
                  }}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={this.state.confirmedCheckbox}
                  onChange={e =>
                    this.setState({ confirmedCheckbox: e.target.checked })
                  }
                  style={{ marginRight: '6px' }}
                />
                Confirmed Stripe Settings
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-default"
                onClick={() => this.applyBillingSettings()}
              >
                Apply
              </button>
              {this.state.billingSettingsApplied && (
                <span style={{ color: '#27ae60', fontWeight: 600 }}>
                  ✓ Settings applied
                </span>
              )}
            </div>
          </div>
        </fieldset>
        {this.state.stripeSettingsConfirmed ? (
          <div>
            {!reviewMode && (
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by name..."
                  value={nameFilter}
                  onChange={e => this.setState({ nameFilter: e.target.value })}
                  style={{ maxWidth: '300px' }}
                />
              </div>
            )}
            {!reviewMode && (
              <>
                <ReactTable
                  columns={columns}
                  data={data}
                  className="-striped -highlight"
                  defaultPageSize={data.length > 0 ? data.length : 2}
                  pageSize={data.length > 0 ? data.length : 2}
                  showPagination={false}
                  defaultSorted={[{ id: 'name', desc: false }]}
                />
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      selectedCount === 0 || this.state.migratingIds.length > 0
                    }
                    onClick={() => this.migrateMembers()}
                  >
                    {this.state.migratingIds.length > 0
                      ? this.state.cancelling
                        ? `Cancelling... (${
                            this.state.migratingIds.length
                          } in progress)`
                        : `Migrating... (${
                            this.state.migratingIds.length
                          } remaining)`
                      : `Migrate Members${
                          selectedCount > 0 ? ` (${selectedCount})` : ''
                        }`}
                  </button>
                  {this.state.migratingIds.length > 0 &&
                    !this.state.cancelling && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => this.cancelMigration()}
                      >
                        Cancel Migration
                      </button>
                    )}
                  {this.state.cancelling && (
                    <span
                      style={{
                        color: '#c0392b',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      Cancellation requested — waiting for in-progress
                      migrations to complete.
                    </span>
                  )}
                </div>
              </>
            )}
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className="btn btn-default"
                onClick={() =>
                  this.setState(prev => ({
                    showMigrationHistory: !prev.showMigrationHistory,
                  }))
                }
              >
                {this.state.showMigrationHistory
                  ? 'Hide Migration History'
                  : 'View Migration History'}
              </button>
              {!reviewMode && (
                <button
                  type="button"
                  className="btn btn-default"
                  disabled={allData.length > 0 || this.state.archivingBambora}
                  onClick={async () => {
                    if (
                      await confirm(
                        'Are you sure you want to set the Bambora cutover date to today?',
                      )
                    ) {
                      this.setMigratedDate();
                    }
                  }}
                >
                  {this.state.archivingBambora
                    ? 'Processing...'
                    : 'Set Migrated Date'}
                </button>
              )}
              {!reviewMode &&
                this.state.archivingBambora && (
                  <span className="text-muted" style={{ fontSize: '13px' }}>
                    Archiving Bambora records, please wait...
                  </span>
                )}
              {!this.state.archivingBambora &&
                (() => {
                  const displayDate =
                    this.state.bamboraCutoffDate ||
                    getAttributeValue(
                      this.props.space,
                      'Bambora Cutoff Date',
                    ) ||
                    '';
                  return displayDate ? (
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#27ae60',
                        fontWeight: 600,
                      }}
                    >
                      Cutoff Date: {displayDate}
                    </span>
                  ) : null;
                })()}
              {!reviewMode && (
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={
                    !(
                      this.state.bamboraCutoffDate ||
                      getAttributeValue(this.props.space, 'Bambora Cutoff Date')
                    )
                  }
                  onClick={async () => {
                    if (
                      await confirm(
                        'Are you sure you have completed the Migration?',
                      )
                    ) {
                      this.props.updateSpaceAttribute({
                        space: this.props.space,
                        values: {
                          Status: 'New',
                          'Attribute Name': 'Bambora Stripe Migration',
                          'Original Value':
                            getAttributeValue(
                              this.props.space,
                              'Bambora Stripe Migration',
                            ) || '',
                          'New Value': 'Migrated',
                          'Updated By': this.props.profile.username,
                        },
                      });
                      setAttributeValue(
                        this.props.space,
                        'Bambora Stripe Migration',
                        'Migrated',
                      );

                      this.setState({ migrationComplete: true });
                      const loc = this.props.location;
                      if (loc && !loc.search.includes('review')) {
                        this.props.history.replace(loc.pathname + '?review');
                      }
                    }
                  }}
                >
                  Complete Migration
                </button>
              )}
            </div>

            {this.state.showMigrationHistory &&
              (() => {
                const { memberNotesLoaded, membersLoading } = this.props;
                const history = getMigratedHistory(this.props.allMembers);
                return (
                  <div style={{ marginTop: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '8px',
                      }}
                    >
                      <h5 style={{ margin: 0 }}>
                        Migration History{' '}
                        {memberNotesLoaded ? `(${history.length})` : ''}
                      </h5>
                      {!memberNotesLoaded && (
                        <span
                          className="text-muted"
                          style={{ fontSize: '13px' }}
                        >
                          {membersLoading
                            ? 'Loading member notes...'
                            : 'Loading...'}
                        </span>
                      )}
                      {memberNotesLoaded &&
                        history.length > 0 && (
                          <CSVLink
                            data={history.map(m => ({
                              Name: m.name,
                              'Date Completed': m.completedDate,
                              'Bambora Reference': m.bamboraReference,
                              'Stripe Reference': m.stripeReference,
                            }))}
                            filename={`migration-history-${moment().format(
                              'YYYY-MM-DD',
                            )}.csv`}
                            className="btn btn-default btn-sm"
                          >
                            Export CSV
                          </CSVLink>
                        )}
                    </div>
                    {!memberNotesLoaded ? null : history.length === 0 ? (
                      <p className="text-muted">
                        No completed migrations found.
                      </p>
                    ) : (
                      <ReactTable
                        columns={[
                          {
                            accessor: 'name',
                            Header: 'Name',
                            Cell: props => (
                              <NavLink to={`/Member/${props.original.id}`}>
                                {props.value}
                              </NavLink>
                            ),
                          },
                          {
                            accessor: 'completedDate',
                            Header: 'Date Completed',
                            width: 160,
                          },
                          {
                            accessor: 'bamboraReference',
                            Header: 'Bambora ID',
                          },
                          {
                            accessor: 'stripeReference',
                            Header: 'Stripe ID',
                          },
                        ]}
                        data={history}
                        className="-striped -highlight"
                        defaultPageSize={history.length}
                        pageSize={history.length}
                        showPagination={false}
                      />
                    )}
                  </div>
                );
              })()}

            {this.state.migratedMembers.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '8px',
                  }}
                >
                  <h5 style={{ margin: 0 }}>
                    Migrated Members ({this.state.migratedMembers.length})
                  </h5>
                  <CSVLink
                    data={this.state.migratedMembers.map(m => ({
                      Name: m.name,
                      'Bambora Reference': m.bamboraReference,
                      'Stripe Customer ID': m.stripeCustomerId,
                      'Stripe Reference': m.stripeReference,
                      'Migrated At': m.migratedAt,
                      'Bambora Cancelled': m.bamboraCancelled,
                      'Kinetic Updated': m.kineticUpdated,
                    }))}
                    filename={`bambora-to-stripe-migration-${moment().format(
                      'YYYY-MM-DD',
                    )}.csv`}
                    className="btn btn-default btn-sm"
                  >
                    Export CSV
                  </CSVLink>
                </div>
                <ReactTable
                  columns={[
                    {
                      accessor: 'name',
                      Header: 'Name',
                      Cell: props => (
                        <NavLink to={`/Member/${props.original.id}`}>
                          {props.value}
                        </NavLink>
                      ),
                    },
                    {
                      accessor: 'bamboraReference',
                      Header: 'Bambora Reference',
                    },
                    {
                      accessor: 'stripeCustomerId',
                      Header: 'Stripe Customer ID',
                    },
                    { accessor: 'stripeReference', Header: 'Stripe Reference' },
                    {
                      accessor: 'migratedAt',
                      Header: 'Migrated At',
                      width: 160,
                    },
                    {
                      accessor: 'bamboraCancelled',
                      Header: 'Bambora Cancelled',
                      width: 140,
                      Cell: props => (
                        <span
                          style={{
                            color:
                              props.value === 'Yes'
                                ? '#27ae60'
                                : props.value === 'No'
                                  ? '#c0392b'
                                  : '#e67e22',
                            fontWeight: 600,
                          }}
                        >
                          {props.value}
                        </span>
                      ),
                    },
                    {
                      accessor: 'kineticUpdated',
                      Header: 'Kinetic Updated',
                      width: 130,
                      Cell: props => (
                        <span
                          style={{
                            color:
                              props.value === 'Yes' ? '#27ae60' : '#c0392b',
                            fontWeight: 600,
                          }}
                        >
                          {props.value}
                        </span>
                      ),
                    },
                  ]}
                  data={this.state.migratedMembers}
                  className="-striped -highlight"
                  defaultPageSize={this.state.migratedMembers.length}
                  pageSize={this.state.migratedMembers.length}
                  showPagination={false}
                  defaultSorted={[{ id: 'name', desc: false }]}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="alert alert-warning" style={{ marginTop: '20px' }}>
            Please confirm the Stripe settings above and click{' '}
            <strong>Apply</strong> before proceeding with the migration.
          </div>
        )}
      </div>
    );
  }
}

export const MigratingBamboraToStripeContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({}),
  lifecycle({
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (!nextProps.memberNotesLoaded && !nextProps.membersLoading) {
        this.props.fetchMembers({
          membersNextPageToken: nextProps.membersNextPageToken,
          memberInitialLoadComplete: nextProps.memberInitialLoadComplete,
          memberLastFetchTime: nextProps.memberLastFetchTime,
          loadMemberNotes: true,
        });
      }
    },
    componentDidMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );

      if (!this.props.memberNotesLoaded && !this.props.membersLoading) {
        this.props.fetchMembers({
          membersNextPageToken: this.props.membersNextPageToken,
          memberInitialLoadComplete: this.props.memberInitialLoadComplete,
          memberLastFetchTime: this.props.memberLastFetchTime,
          loadMemberNotes: true,
        });
      }

      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
  }),
)(MigratingBamboraToStripe);

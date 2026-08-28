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
import {
  updateKapp,
  fetchForms,
  updateForm,
  searchSubmissions,
  updateSubmission,
  createSubmission,
  SubmissionSearch,
} from '@kineticdata/react';

const REGISTER_USER_URL = '/registerUser';

const globals = import('common/globals');

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  profile: state.member.app.profile,
  space: state.member.app.space,
  kapp: state.member.app.kapp,
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
        (m.values['Status'] === 'Active' ||
          m.values['Status'] === 'Pending Freeze' ||
          m.values['Status'] === 'Frozen') &&
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
      billingToday: moment(getNextBillingDate(m), 'DD MMM YYYY').isSame(
        moment(),
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

const getMigratedAdditionalServices = allMembers => {
  const results = [];
  allMembers.forEach(m => {
    let notes = m.values['Notes History'];
    if (!notes) return;
    try {
      if (typeof notes !== 'object') notes = JSON.parse(notes);
    } catch (e) {
      return;
    }
    notes.forEach(n => {
      if (!n.note || !n.note.includes('Migrated additional service')) return;
      const nameMatch = n.note.match(/Migrated additional service "([^"]+)"/);
      const refMatch = n.note.match(/New Stripe Reference:\s*(\S+)/);
      const serviceName = nameMatch ? nameMatch[1] : '';
      // Find the corresponding Bambora cancellation note to get the Billing ID
      const cancelNote = notes.find(
        cn =>
          cn.note &&
          cn.note.includes('Cancelled Bambora additional service') &&
          cn.note.includes(`"${serviceName}"`),
      );
      const billingIdMatch =
        cancelNote && cancelNote.note.match(/Billing ID:\s*(\S+)/);
      const d = moment(n.contactDate, 'YYYY-MM-DD HH:mm');
      results.push({
        memberId: m.id,
        memberName:
          (m.values['First Name'] || '') + ' ' + (m.values['Last Name'] || ''),
        serviceName,
        bamboraReference: billingIdMatch ? billingIdMatch[1] : '',
        stripeReference: refMatch ? refMatch[1] : '',
        completedDate: d.isValid()
          ? d.format('L hh:mm A')
          : n.contactDate || '',
        completedDateSort: n.contactDate || '',
      });
    });
  });
  return results.sort((a, b) =>
    (b.completedDateSort || '').localeCompare(a.completedDateSort || ''),
  );
};

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
      migrationLog: '',
      pendingPaymentHistory: 0,
      showMigrationHistory: false,
      historyNameFilter: '',
      archivingBambora: false,
      migrationComplete: false,
      migrationCompleteMessage: false,
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
    const eligible = data.filter(row => !row.billingToday);
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
    const { space, profile } = this.props;

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

    // Update billing/tax space attributes to Stripe migration settings
    this.props.updateSpaceAttribute({
      space,
      values: {
        Status: 'New',
        'Attribute Name': 'Ignore Admin Fee',
        'Original Value': getAttributeValue(space, 'Ignore Admin Fee') || '',
        'New Value': ignoreAdminFee ? 'YES' : '',
        'Updated By': profile.username,
      },
    });
    setAttributeValue(space, 'Ignore Admin Fee', ignoreAdminFee ? 'YES' : '');
    this.props.updateSpaceAttribute({
      space,
      values: {
        Status: 'New',
        'Attribute Name': 'Admin Fee Label',
        'Original Value': getAttributeValue(space, 'Admin Fee Label') || '',
        'New Value': adminFeeLabel || '',
        'Updated By': profile.username,
      },
    });
    setAttributeValue(space, 'Admin Fee Label', adminFeeLabel || '');
    this.props.updateSpaceAttribute({
      space,
      values: {
        Status: 'New',
        'Attribute Name': 'Admin Fee Charge',
        'Original Value': getAttributeValue(space, 'Admin Fee Charge') || '',
        'New Value':
          adminFeeCharge !== '' && adminFeeCharge !== null
            ? adminFeeCharge * 100 + '%'
            : '',
        'Updated By': profile.username,
      },
    });
    setAttributeValue(
      space,
      'Admin Fee Charge',
      adminFeeCharge !== '' && adminFeeCharge !== null
        ? adminFeeCharge * 100 + '%'
        : '',
    );
    this.props.updateSpaceAttribute({
      space,
      values: {
        Status: 'New',
        'Attribute Name': 'TAX 1 Label',
        'Original Value': getAttributeValue(space, 'TAX 1 Label') || '',
        'New Value': tax1Label || '',
        'Updated By': profile.username,
      },
    });
    setAttributeValue(space, 'TAX 1 Label', tax1Label || '');
    this.props.updateSpaceAttribute({
      space,
      values: {
        Status: 'New',
        'Attribute Name': 'TAX 1 Value',
        'Original Value': getAttributeValue(space, 'TAX 1 Value') || '',
        'New Value': tax1Value !== '' ? String(tax1Value) : '',
        'Updated By': profile.username,
      },
    });
    setAttributeValue(
      space,
      'TAX 1 Value',
      tax1Value !== '' ? String(tax1Value) : '',
    );
    this.props.updateSpaceAttribute({
      space,
      values: {
        Status: 'New',
        'Attribute Name': 'TAX 2 Label',
        'Original Value': getAttributeValue(space, 'TAX 2 Label') || '',
        'New Value': tax2Label || '',
        'Updated By': profile.username,
      },
    });
    setAttributeValue(space, 'TAX 2 Label', tax2Label || '');
    this.props.updateSpaceAttribute({
      space,
      values: {
        Status: 'New',
        'Attribute Name': 'TAX 2 Value',
        'Original Value': getAttributeValue(space, 'TAX 2 Value') || '',
        'New Value': tax2Value !== '' ? String(tax2Value) : '',
        'Updated By': profile.username,
      },
    });
    setAttributeValue(
      space,
      'TAX 2 Value',
      tax2Value !== '' ? String(tax2Value) : '',
    );
    setTimeout(() => this.setState({ billingSettingsApplied: false }), 3000);
  }

  cancelMigration() {
    this._cancelled = true;
    this.setState({ cancelling: true });
  }

  migrateInactiveMembers() {
    this._cancelled = false;

    const { allMembers, updateMember, addNotification, profile } = this.props;

    const inactiveMembers = allMembers.filter(
      m =>
        m.values['Status'] === 'Inactive' &&
        m.values['Billing User'] === 'YES' &&
        m.values['Billing Customer Id'] &&
        m.values['Billing Customer Id'] !== '' &&
        m.values['Billing Customer Id'] !== 'Deleted',
    );

    if (inactiveMembers.length === 0) {
      return;
    }

    const ids = inactiveMembers.map(m => m.id);
    this.setState({
      migratingIds: ids,
      migrationLog: 'Archiving inactive members...',
    });

    inactiveMembers.forEach(memberItem => {
      const id = memberItem.id;

      const archiveBillingId = memberItem.values['Billing Customer Id'] || '';
      const archiveBillingReference =
        memberItem.values['Billing Customer Reference'] || '';
      const memberName =
        (memberItem.values['First Name'] || '') +
        ' ' +
        (memberItem.values['Last Name'] || '');

      this.setState({
        migrationLog: `Archiving inactive member ${memberName}...`,
      });

      memberItem.values['Archive Billing Id'] = archiveBillingId;
      memberItem.values['Archive Billing Reference'] = archiveBillingReference;
      memberItem.values['Billing Customer Id'] = 'Deleted';
      memberItem.values['Billing Customer Reference'] = 'Deleted';

      let notesHistory = memberItem.values['Notes History'];
      if (!notesHistory) {
        notesHistory = [];
      } else if (typeof notesHistory !== 'object') {
        notesHistory = JSON.parse(notesHistory);
      }
      notesHistory.push({
        note:
          'Archived Bambora billing during migration. Bambora Customer Id: ' +
          archiveBillingId +
          ', Reference: ' +
          archiveBillingReference,
        contactDate: moment().format('YYYY-MM-DD HH:mm'),
        contactMethod: 'System',
        submitter: profile.displayName,
      });
      memberItem.values['Notes History'] = notesHistory;

      updateMember({
        id,
        memberItem,
        values: {
          'Archive Billing Id': archiveBillingId,
          'Archive Billing Reference': archiveBillingReference,
          'Billing Customer Id': 'Deleted',
          'Billing Customer Reference': 'Deleted',
          'Notes History': notesHistory,
        },
        allMembers,
        addNotification,
      });

      this.setState(prev => {
        const newIds = prev.migratingIds.filter(mid => mid !== id);
        return {
          migratingIds: newIds,
          migrationLog:
            newIds.length === 0
              ? `Archived ${ids.length} inactive member${
                  ids.length !== 1 ? 's' : ''
                }.`
              : prev.migrationLog,
        };
      });
    });
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
            'error',
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
          setAttributeValue(space, 'Bambora Cutoff Date', cutoverDate);
          this.setState({
            archivingBambora: false,
            bamboraCutoffDate: cutoverDate,
          });
          addNotification(
            'success',
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

    // Parse old Bambora fee rates from space attributes
    const spaceIgnoreAdminFee =
      getAttributeValue(space, 'Ignore Admin Fee') === 'YES';
    const spaceAdminFeeRaw = getAttributeValue(space, 'Admin Fee Charge') || '';
    const spaceAdminFee = spaceAdminFeeRaw
      ? parseFloat(spaceAdminFeeRaw.toString().replace('%', '')) / 100
      : 0;
    const spaceTax1 =
      parseFloat(getAttributeValue(space, 'TAX 1 Value') || 0) || 0;
    const spaceTax2 =
      parseFloat(getAttributeValue(space, 'TAX 2 Value') || 0) || 0;
    const oldMultiplier = spaceIgnoreAdminFee
      ? 1
      : 1 + spaceAdminFee + spaceTax1 + spaceTax2;

    // Stripe migration rates from confirmed settings
    const migrAdminFee = this.state.ignoreAdminFee
      ? 0
      : this.state.adminFeeCharge || 0;
    const migrTax1 = this.state.tax1Value || 0;
    const migrTax2 = this.state.tax2Value || 0;
    const newMultiplier = 1 + migrAdminFee + migrTax1 + migrTax2;

    // Stagger requests by 40ms each (max 25/second) to stay within Stripe's rate limit
    const RATE_LIMIT_DELAY_MS = 200;

    selectedIds.forEach((id, index) => {
      setTimeout(() => {
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

        const memberName =
          (memberItem.values['First Name'] || '') +
          ' ' +
          (memberItem.values['Last Name'] || '');
        this.setState({
          migrationLog: `Registering ${memberName} with Stripe...`,
        });

        const nextBillingDate = getNextBillingDate(memberItem);
        const startDate = nextBillingDate
          ? moment(nextBillingDate, 'DD MMM YYYY').format('YYYY-MM-DD')
          : moment().format('YYYY-MM-DD');

        const grossCost = parseFloat(memberItem.values['Membership Cost']) || 0;
        const baseCost = grossCost / oldMultiplier;
        const payment = Math.round(baseCost * newMultiplier * 100) / 100;

        const isFrozen =
          memberItem.values['Status'] === 'Frozen' ||
          memberItem.values['Status'] === 'Pending Freeze';

        const resolvePayment = isFrozen
          ? searchSubmissions({
              get: true,
              form: 'bambora-membership-freeze',
              kapp: 'services',
              search: new SubmissionSearch()
                .eq('values[Members]', memberItem.id)
                .include(['details', 'values'])
                .sortDirection('DESC')
                .limit(1)
                .build(),
            }).then(({ submissions }) => {
              const freeze = submissions && submissions[0];
              if (freeze && freeze.values['Freeze Charge']) {
                return (
                  parseFloat(freeze.values['Freeze Charge'].replace('$', '')) ||
                  payment
                );
              }
              return 0;
            })
          : Promise.resolve(payment);

        resolvePayment.then(finalPayment => {
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
            payment: finalPayment,
            contractStartDate: startDate,
            cardToken: memberItem.values['Archive Billing Id'],
            currency,
          };

          axios
            .post(kineticBillingServerUrl + REGISTER_USER_URL, args)
            .then(result => {
              if (result.data.error && result.data.error > 0) {
                addNotification(
                  'error',
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
                const archiveBillingId =
                  memberItem.values['Archive Billing Id'];
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

                if (isFrozen) {
                  axios
                    .post(kineticBillingServerUrl + '/freezeSchedule', {
                      customerId: customerBillingId,
                      billingService: 'Stripe',
                      space: spaceSlug,
                      freezeCharge: finalPayment,
                    })
                    .catch(err => {
                      console.error(
                        'freezeSchedule error for member ' + id,
                        err,
                      );
                    });
                }

                this.setState({
                  migrationLog: `Cancelling Bambora billing for ${memberName}...`,
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
                    this.setState(prev => ({
                      migrationLog: `Generating Bambora billing history for ${memberName}...`,
                      pendingPaymentHistory: prev.pendingPaymentHistory + 1,
                    }));
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
                      setPaymentHistory: ({ data }) => {
                        this.setState(prev => {
                          const pending = prev.pendingPaymentHistory - 1;
                          return {
                            pendingPaymentHistory: pending,
                            migrationLog:
                              pending > 0
                                ? `Payment history loaded for ${memberName} (${
                                    (data || []).length
                                  } records)`
                                : '',
                          };
                        });
                      },
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

                // Migrate active bambora additional services
                searchSubmissions({
                  form: 'bambora-member-additional-services',
                  datastore: true,
                  search: new SubmissionSearch(true)
                    .includes(['details', 'values'])
                    .index('values[Member GUID]')
                    .eq('values[Member GUID]', memberItem.id)
                    .limit(100)
                    .build(),
                })
                  .then(({ submissions }) => {
                    const activeServices = (submissions || []).filter(
                      s => s.values['Status'] === 'Active',
                    );
                    if (activeServices.length > 0) {
                      this.setState({
                        migrationLog: `Migrating ${
                          activeServices.length
                        } additional service${
                          activeServices.length !== 1 ? 's' : ''
                        } for ${memberName}...`,
                      });
                    }
                    activeServices.forEach(service => {
                      const serviceFee = parseFloat(service.values['Fee']);

                      const serviceArgs = {
                        space: spaceSlug,
                        billingService: 'Stripe',
                        customerId: service.values['Member ID'],
                        paymentMethod: 'Credit Card',
                        firstName: service.values['Student First Name'],
                        lastName: service.values['Student Last Name'],
                        dob: service.values['DOB'],
                        address: service.values['Address'],
                        suburb: service.values['Suburb'],
                        state: service.values['State'],
                        postCode: service.values['Postcode'],
                        email: service.values['Email'],
                        mobile: service.values['Mobile'],
                        billingPeriod:
                          service.values['Display Payment Frequency'],
                        payment: serviceFee,
                        contractStartDate: moment(
                          getNextBillingDate({
                            values: {
                              'Resume Date': null,
                              'Billing Start Date':
                                service.values['Start Date'],
                              Status: 'Active',
                              'Billing Payment Period':
                                service.values['Display Payment Frequency'],
                            },
                          }),
                          'DD MMM YYYY',
                        ).format('YYYY-MM-DD'),
                        contractEndDate: service.values['End Date'],
                        cardToken: archiveBillingId,
                        ref1: 'AdditionalService',
                        ref2: service.values['Name'],
                        currency,
                      };

                      this.setState({
                        migrationLog: `Registering additional service "${service
                          .values['Name'] ||
                          service.values[
                            'Member ID'
                          ]}" with Stripe for ${memberName}...`,
                      });
                      axios
                        .post(
                          kineticBillingServerUrl + REGISTER_USER_URL,
                          serviceArgs,
                        )
                        .then(serviceResult => {
                          if (
                            serviceResult.data.error &&
                            serviceResult.data.error > 0
                          ) {
                            console.error(
                              'Additional service registerUser failed:',
                              serviceResult.data.errorMessage,
                            );
                            return;
                          }

                          // Record migration in member Notes History
                          const serviceCustomerBillingId =
                            serviceResult.data.data &&
                            serviceResult.data.data.customerBillingId;
                          notesHistory.push({
                            note:
                              'Migrated additional service "' +
                              (service.values['Name'] ||
                                service.values['Member ID']) +
                              '" from Bambora to Stripe.' +
                              (serviceCustomerBillingId
                                ? ' New Stripe Reference: ' +
                                  serviceCustomerBillingId
                                : ''),
                            contactDate: moment().format('YYYY-MM-DD HH:mm'),
                            contactMethod: 'System',
                            submitter: profile.displayName,
                          });
                          updateMember({
                            id: memberItem.id,
                            memberItem,
                            values: { 'Notes History': notesHistory },
                            allMembers,
                          });

                          // Create stripe-member-additional-services record
                          createSubmission({
                            datastore: true,
                            formSlug: 'stripe-member-additional-services',
                            values: {
                              ...service.values,
                              Status: 'Active',
                              'Billing ID': serviceCustomerBillingId || '',
                              'POS Profile ID': archiveBillingId || '',
                            },
                          }).catch(err =>
                            console.error(
                              'Failed to create stripe additional service record',
                              err,
                            ),
                          );

                          // Cancel Bambora service
                          const bamboraServiceId = service.values['Billing ID'];
                          if (bamboraServiceId) {
                            this.setState({
                              migrationLog: `Cancelling Bambora additional service "${service
                                .values['Name'] ||
                                service.values[
                                  'Member ID'
                                ]}" for ${memberName}...`,
                            });
                            axios
                              .post(
                                kineticBillingServerUrl +
                                  '/customerStatusChange',
                                {
                                  customerId: bamboraServiceId,
                                  billingService: 'Bambora',
                                  space: spaceSlug,
                                  newStatus: 'Inactive',
                                },
                              )
                              .then(cancelServiceResult => {
                                const serviceCancelled =
                                  !cancelServiceResult.data.error ||
                                  cancelServiceResult.data.error === 0;
                                notesHistory.push({
                                  note: serviceCancelled
                                    ? 'Cancelled Bambora additional service "' +
                                      (service.values['Name'] ||
                                        service.values['Member ID']) +
                                      '". Billing ID: ' +
                                      bamboraServiceId
                                    : 'Failed to cancel Bambora additional service "' +
                                      (service.values['Name'] ||
                                        service.values['Member ID']) +
                                      '". Billing ID: ' +
                                      bamboraServiceId +
                                      '. Error: ' +
                                      (cancelServiceResult.data.errorMessage ||
                                        'Unknown error'),
                                  contactDate: moment().format(
                                    'YYYY-MM-DD HH:mm',
                                  ),
                                  contactMethod: 'System',
                                  submitter: profile.displayName,
                                });
                                updateMember({
                                  id: memberItem.id,
                                  memberItem,
                                  values: { 'Notes History': notesHistory },
                                  allMembers,
                                });
                              })
                              .catch(err => {
                                console.error(
                                  'Failed to cancel Bambora service',
                                  err,
                                );
                                notesHistory.push({
                                  note:
                                    'Failed to cancel Bambora additional service "' +
                                    (service.values['Name'] ||
                                      service.values['Member ID']) +
                                    '" (network error). Billing ID: ' +
                                    bamboraServiceId,
                                  contactDate: moment().format(
                                    'YYYY-MM-DD HH:mm',
                                  ),
                                  contactMethod: 'System',
                                  submitter: profile.displayName,
                                });
                                updateMember({
                                  id: memberItem.id,
                                  memberItem,
                                  values: { 'Notes History': notesHistory },
                                  allMembers,
                                });
                              });
                          }

                          // Set status to Migrated
                          updateSubmission({
                            id: service.id,
                            values: { Status: 'Migrated' },
                            datastore: true,
                          }).catch(err =>
                            console.error(
                              'Failed to update additional service status',
                              err,
                            ),
                          );
                        })
                        .catch(err =>
                          console.error(
                            'Additional service migration error',
                            err,
                          ),
                        );
                    });
                  })
                  .catch(err =>
                    console.error('Failed to fetch additional services', err),
                  );
              }
            })
            .catch(error => {
              console.error('Migration error for member ' + id, error);
              addNotification(
                'error',
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
        }); // resolvePayment.then
      }, index * RATE_LIMIT_DELAY_MS);
    });
  }

  getColumns(data) {
    const eligible = data.filter(row => !row.billingToday);
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
          const restricted = props.original.billingToday;
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
    const activeMigrationDone =
      this.state.migratingIds.length === 0 &&
      allData.filter(row => row.status === 'Active').length === 0;
    const inactiveMigrationDone =
      allMembers.filter(
        m =>
          m.values['Billing User'] === 'YES' &&
          m.values['Status'] === 'Inactive' &&
          m.values['Billing Customer Id'] &&
          m.values['Billing Customer Id'] !== '' &&
          m.values['Billing Customer Id'] !== 'Deleted',
      ).length === 0;
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
                <ul>
                  These values will now be used for any new Registrations and
                  against any changes for migrated members.<br />
                  Members yet to be migrated will not be allow to be
                  changed/frozen or cancelled.
                </ul>
              </li>

              <li>
                Step 2: All Active/Frozen billing members ready to be promoted
                will be listed.
                <ul>
                  You can select all members, but it is recommended to migrate a
                  few members first to ensure everything is working as expected.
                  <br />
                  Note: If a member’s billing payment is due today, they cannot
                  be selected. You must migrate that member after the due date.
                </ul>
              </li>
              <li>
                Step 3: Once all Active/Frozen members have been migrated, you
                now Migrate the Inactive Members.
                <ul>
                  This will ensure that the Billing history is still viewable
                  after the migration.
                </ul>
              </li>
              <li>
                Step 4: Once all Active/Inactive members have been migrated, the
                "Set Migrated Date" option will be enabled.
                <ul>
                  This should be clicked to mark the completion date, which will
                  also allow the system to store all Bambora transactions for
                  historical purposes.
                </ul>
              </li>
              <li>
                Step 5: Once you are satisfied with the migration, click the
                "Complete Migration" button.
                <ul>
                  Note: To review the migration history, a new button called
                  "View Migration Details" will appear on the Reports tab.
                </ul>
              </li>
              <li>
                Important, during the Migration process, no billing changes will
                be allowed against the migrated members.<br />
                Ensure the migration is completed in the shortest timeframe.
              </li>
              <li style={{ color: 'red', fontWeight: 'bolder' }}>
                DO NOT MOVE AWAY FROM THIS PAGE DURING THE MIGRATION TO AVOID
                ANY INCOMPLETE PROCESSING.
              </li>
              <li>
                Once a Member is migrated, you can view the member's billing to
                ensure the migration was correct. <br />Viewing the Payment
                History should display Bambora records if they exist.
              </li>
              <li>
                Once the Migrated Date is set, the Financial report will display
                historical records.<br />
                Financial Report forecast will not be correct until the
                Migration is Completed, by clicking the "Complete Migration".
              </li>
            </ul>
          )}
          <span style={{ fontWeight: 600 }}>
            {data.length} member{data.length !== 1 ? 's' : ''} to migrate
            {selectedCount > 0 && ` — ${selectedCount} selected`}
          </span>
        </div>

        {this.state.migrationCompleteMessage && (
          <div
            className="alert alert-success"
            style={{ marginBottom: '20px', fontSize: '15px' }}
          >
            <strong>
              Congratulations on your Bambora to Stripe Migration.
            </strong>{' '}
            To review the migration details, you can use the new Report "View
            Migration Details" on the Reports tab.
          </div>
        )}

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
            <p>
              These values will be applied for each migrated member. <br />Also
              when the Migration is Completed, these vallues will be used going
              forward replacing the previous values used for Bambora.
            </p>
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
                  getTrProps={(_state, rowInfo) => {
                    if (rowInfo && rowInfo.original.status === 'Frozen') {
                      return {
                        style: { backgroundColor: '#dbeafe', color: '#1e40af' },
                      };
                    }
                    return {};
                  }}
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
                    onClick={async () => {
                      if (
                        await confirm(
                          <span>
                            Are you sure you want to migrate{' '}
                            <strong>{selectedCount}</strong> member
                            {selectedCount !== 1 ? 's' : ''} from Bambora to
                            Stripe?
                          </span>,
                        )
                      ) {
                        this.migrateMembers();
                      }
                    }}
                  >
                    {this.state.migratingIds.length > 0
                      ? this.state.cancelling
                        ? `Cancelling... (${
                            this.state.migratingIds.length
                          } in progress)`
                        : `Migrating... (${
                            this.state.migratingIds.length
                          } remaining)`
                      : `Migrate Active Members${
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
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      !activeMigrationDone ||
                      this.state.migratingIds.length > 0 ||
                      inactiveMigrationDone
                    }
                    onClick={async () => {
                      if (
                        await confirm(
                          "Are you sure you want to archive all Inactive members' Bambora billing data?",
                        )
                      ) {
                        this.migrateInactiveMembers();
                      }
                    }}
                  >
                    {this.state.migratingIds.length > 0 && activeMigrationDone
                      ? `Archiving... (${
                          this.state.migratingIds.length
                        } remaining)`
                      : inactiveMigrationDone
                        ? 'Inactive Members Archived'
                        : 'Migrate Inactive Members'}
                  </button>
                </div>
                {this.state.migrationLog !== '' && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      color: '#555',
                      fontStyle: 'italic',
                    }}
                  >
                    {this.state.migrationLog}
                  </div>
                )}
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
                className="btn btn-primary"
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
                  className="btn btn-primary"
                  disabled={
                    allData.length > 0 ||
                    this.state.archivingBambora ||
                    !inactiveMigrationDone
                  }
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
                      const { space, profile, kapp } = this.props;

                      // Mark migration complete
                      this.props.updateSpaceAttribute({
                        space,
                        values: {
                          Status: 'New',
                          'Attribute Name': 'Bambora Stripe Migration',
                          'Original Value':
                            getAttributeValue(
                              space,
                              'Bambora Stripe Migration',
                            ) || '',
                          'New Value': 'Migrated',
                          'Updated By': profile.username,
                        },
                      });
                      setAttributeValue(
                        space,
                        'Bambora Stripe Migration',
                        'Migrated',
                      );

                      // Update space Billing Company → Stripe
                      this.props.updateSpaceAttribute({
                        space,
                        values: {
                          Status: 'New',
                          'Attribute Name': 'Billing Company',
                          'Original Value':
                            getAttributeValue(space, 'Billing Company') || '',
                          'New Value': 'Stripe',
                          'Updated By': profile.username,
                        },
                      });
                      setAttributeValue(space, 'Billing Company', 'Stripe');

                      // Update space POS System → Stripe if currently Bambora
                      if (
                        getAttributeValue(space, 'POS System') === 'Bambora'
                      ) {
                        this.props.updateSpaceAttribute({
                          space,
                          values: {
                            Status: 'New',
                            'Attribute Name': 'POS System',
                            'Original Value': 'Bambora',
                            'New Value': 'Stripe',
                            'Updated By': profile.username,
                          },
                        });
                        setAttributeValue(space, 'POS System', 'Stripe');
                      }

                      // Update kapp Billing Company → Stripe
                      if (kapp) {
                        const kappAttributes = (kapp.attributes || []).map(
                          a => ({
                            ...a,
                            values: [...(a.values || [])],
                          }),
                        );
                        const billingAttr = kappAttributes.find(
                          a => a.name === 'Billing Company',
                        );
                        if (billingAttr) {
                          billingAttr.values = ['Stripe'];
                        } else {
                          kappAttributes.push({
                            name: 'Billing Company',
                            values: ['Stripe'],
                          });
                        }
                        updateKapp({
                          kapp: { ...kapp, attributes: kappAttributes },
                          kappSlug: kapp.slug || 'gbmembers',
                          include: 'attributes',
                        }).catch(err =>
                          console.error(
                            'Failed to update kapp Billing Company',
                            err,
                          ),
                        );
                      }

                      // Remove all categories from services forms whose slug starts with bambora-
                      fetchForms({
                        kappSlug: 'services',
                        include: 'categorizations',
                        limit: 1000,
                      })
                        .then(({ forms }) => {
                          const formsToUpdate = (forms || []).filter(
                            f => f.slug && f.slug.startsWith('bambora-'),
                          );
                          return Promise.all(
                            formsToUpdate.map(f =>
                              updateForm({
                                kappSlug: 'services',
                                formSlug: f.slug,
                                form: { ...f, categorizations: [] },
                              }),
                            ),
                          );
                        })
                        .then(results => {
                          if (results && results.length > 0) {
                            this.props.addNotification(
                              'success',
                              `Removed Bambora categories from ${
                                results.length
                              } service form${results.length !== 1 ? 's' : ''}`,
                              'Complete Migration',
                            );
                          }
                        })
                        .catch(err => {
                          console.error(
                            'Failed to remove Bambora form categories',
                            err,
                          );
                          this.props.addNotification(
                            'error',
                            'Could not remove Bambora categories from service forms',
                            'Complete Migration',
                          );
                        });

                      // Set cash-member-registration category to Stripe Billing
                      fetchForms({
                        kappSlug: 'services',
                        include: 'categorizations',
                        limit: 1000,
                      })
                        .then(({ forms }) => {
                          const cashForm = (forms || []).find(
                            f => f.slug === 'cash-member-registration',
                          );
                          if (cashForm) {
                            return updateForm({
                              kappSlug: 'services',
                              formSlug: cashForm.slug,
                              form: {
                                ...cashForm,
                                categorizations: [
                                  { category: { slug: 'stripe-billing' } },
                                ],
                              },
                            });
                          }
                        })
                        .catch(err =>
                          console.error(
                            'Failed to set cash-member-registration category',
                            err,
                          ),
                        );

                      // Update space Services Slugs → Bambora slugs to Stripe slugs
                      this.props.updateSpaceAttribute({
                        space,
                        values: {
                          Status: 'New',
                          'Attribute Name': 'Services Slugs',
                          'Original Value':
                            'bambora-payments-reschedule,bambora-change-payment-type,bambora-member-cancellation,bambora-member-registration,bambora-membership-freeze,bambora-resume-frozen-member,bambora-setup-biller-details,cash-member-registration,incident-report,kids-registration,mens-registration,pink-team-registration,member-self-sign-up,bambora-remote-registration,bambora-submit-billing-changes',
                          'New Value':
                            'stripe-remote-registration,stripe-submit-billing-changes,stripe-member-registration,stripe-member-cancellation,stripe-change-payment-type,stripe-extend-membership-freeze,stripe-membership-freeze,stripe-payments-reschedule,stripe-resume-frozen-member,cash-member-registration,incident-report,kids-registration,mens-registration',
                          'Updated By': profile.username,
                        },
                      });
                      setAttributeValue(space, 'POS System', 'Stripe');

                      this.setState({
                        migrationComplete: true,
                        migrationCompleteMessage: true,
                      });
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
                const additionalServiceHistory = getMigratedAdditionalServices(
                  this.props.allMembers,
                );
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
                      <input
                        type="text"
                        placeholder="Filter by name..."
                        value={this.state.historyNameFilter}
                        onChange={e =>
                          this.setState({ historyNameFilter: e.target.value })
                        }
                        style={{
                          padding: '4px 8px',
                          fontSize: '13px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          width: '200px',
                        }}
                      />
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
                        (history.length > 0 ||
                          additionalServiceHistory.length > 0) && (
                          <CSVLink
                            data={[
                              ...history.map(m => ({
                                Type: 'Member',
                                Name: m.name,
                                'Service Name': '',
                                'Date Completed': m.completedDate,
                                'Bambora Reference': m.bamboraReference,
                                'Stripe Reference': m.stripeReference,
                              })),
                              ...additionalServiceHistory.map(s => ({
                                Type: 'Additional Service',
                                Name: s.memberName,
                                'Service Name': s.serviceName,
                                'Date Completed': s.completedDate,
                                'Bambora Reference': s.bamboraReference,
                                'Stripe Reference': s.stripeReference,
                              })),
                            ]}
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
                        data={history.filter(
                          m =>
                            !this.state.historyNameFilter ||
                            m.name
                              .toLowerCase()
                              .includes(
                                this.state.historyNameFilter.toLowerCase(),
                              ),
                        )}
                        className="-striped -highlight"
                        defaultPageSize={history.length}
                        pageSize={history.length}
                        showPagination={false}
                      />
                    )}

                    {memberNotesLoaded &&
                      additionalServiceHistory.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                          <h5 style={{ margin: '0 0 8px 0' }}>
                            Additional Services Migration (
                            {additionalServiceHistory.length})
                          </h5>
                          <ReactTable
                            columns={[
                              {
                                accessor: 'memberName',
                                Header: 'Member',
                                Cell: props => (
                                  <NavLink
                                    to={`/Member/${props.original.memberId}`}
                                  >
                                    {props.value}
                                  </NavLink>
                                ),
                              },
                              {
                                accessor: 'serviceName',
                                Header: 'Service',
                              },
                              {
                                accessor: 'completedDate',
                                Header: 'Date Completed',
                                width: 160,
                              },
                              {
                                accessor: 'bamboraReference',
                                Header: 'Bambora Billing ID',
                              },
                              {
                                accessor: 'stripeReference',
                                Header: 'Stripe Reference',
                              },
                            ]}
                            data={additionalServiceHistory}
                            className="-striped -highlight"
                            defaultPageSize={additionalServiceHistory.length}
                            pageSize={additionalServiceHistory.length}
                            showPagination={false}
                          />
                        </div>
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
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={this.state.nameFilter}
                    onChange={e =>
                      this.setState({ nameFilter: e.target.value })
                    }
                    style={{
                      padding: '4px 8px',
                      fontSize: '13px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '200px',
                    }}
                  />
                  <CSVLink
                    data={this.state.migratedMembers.map(m => ({
                      Name: m.name,
                      'Bambora Reference': m.bamboraReference,
                      'Stripe Customer ID': m.stripeCustomerId,
                      'Stripe Reference': m.stripeReference,
                      'Migrated At': m.migratedAt,
                      'Bambora Cancelled': m.bamboraCancelled,
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
                  ]}
                  data={this.state.migratedMembers.filter(
                    m =>
                      !this.state.nameFilter ||
                      m.name
                        .toLowerCase()
                        .includes(this.state.nameFilter.toLowerCase()),
                  )}
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

      this.props.fetchMembers({
        membersNextPageToken: this.props.membersNextPageToken,
        memberInitialLoadComplete: this.props.memberInitialLoadComplete,
        memberLastFetchTime: this.props.memberLastFetchTime,
        loadMemberNotes: !this.props.memberNotesLoaded,
      });

      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
  }),
)(MigratingBamboraToStripe);

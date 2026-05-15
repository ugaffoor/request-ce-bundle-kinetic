import React, { Component } from 'react';
import { compose, lifecycle } from 'recompose';
import $ from 'jquery';
import { connect } from 'react-redux';
import { withHandlers } from 'recompose';
import moment from 'moment';
import ReactTable from 'react-table';
import { KappNavLink as NavLink, Utils } from 'common';
import NumberFormat from 'react-number-format';
import axios from 'axios';
import { actions } from '../../redux/modules/members';
import { actions as appActions } from '../../redux/modules/memberApp';
import { actions as errorActions } from '../../redux/modules/errors';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const REGISTER_USER_URL = '/registerUser';

const globals = import('common/globals');

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  profile: state.member.app.profile,
  space: state.member.app.space,
  spaceSlug: state.member.app.spaceSlug,
  kineticBillingServerUrl: state.member.app.kineticBillingServerUrl,
});
const mapDispatchToProps = {
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  updateMember: actions.updateMember,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
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

  migrateMembers() {
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
            this.setState(prev => ({
              migratingIds: prev.migratingIds.filter(mid => mid !== id),
            }));
          } else {
            const customerBillingId = result.data.data.customerBillingId;

            // Archive current billing fields, promote Archive Billing Id
            const archiveBillingId = memberItem.values['Archive Billing Id'];
            memberItem.values['Archive Billing Id'] =
              memberItem.values['Billing Customer Id'];
            memberItem.values['Archive Billing Reference'] =
              memberItem.values['Billing Customer Reference'];
            memberItem.values['Billing Customer Id'] = archiveBillingId;
            memberItem.values['Billing Customer Reference'] = customerBillingId;

            // Add note to history
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
              values: {
                'Archive Billing Id': memberItem.values['Archive Billing Id'],
                'Archive Billing Reference':
                  memberItem.values['Archive Billing Reference'],
                'Billing Customer Id': memberItem.values['Billing Customer Id'],
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
                  stripeCustomerId: memberItem.values['Billing Customer Id'],
                  stripeReference: customerBillingId,
                  migratedAt: moment().format('DD MMM YYYY HH:mm'),
                },
              ],
              selected: { ...prev.selected, [id]: false },
              migratingIds: prev.migratingIds.filter(mid => mid !== id),
            }));
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
          this.setState(prev => ({
            migratingIds: prev.migratingIds.filter(mid => mid !== id),
          }));
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

          <span style={{ fontWeight: 600 }}>
            {data.length} member{data.length !== 1 ? 's' : ''} to migrate
            {selectedCount > 0 && ` — ${selectedCount} selected`}
          </span>
        </div>

        <div
          className="migrationBillingSettings"
          style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
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
                  this.state.tax1Value !== '' ? this.state.tax1Value * 100 : ''
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
                  this.state.tax2Value !== '' ? this.state.tax2Value * 100 : ''
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
        {this.state.stripeSettingsConfirmed ? (
          <div>
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
            <ReactTable
              columns={columns}
              data={data}
              className="-striped -highlight"
              defaultPageSize={data.length > 0 ? data.length : 2}
              pageSize={data.length > 0 ? data.length : 2}
              showPagination={false}
              defaultSorted={[{ id: 'name', desc: false }]}
            />
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  selectedCount === 0 || this.state.migratingIds.length > 0
                }
                onClick={() => this.migrateMembers()}
              >
                {this.state.migratingIds.length > 0
                  ? `Migrating... (${this.state.migratingIds.length} remaining)`
                  : `Migrate Members${
                      selectedCount > 0 ? ` (${selectedCount})` : ''
                    }`}
              </button>
            </div>

            {this.state.migratedMembers.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h5>Migrated Members ({this.state.migratedMembers.length})</h5>
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
                      accessor: 'stripeCustomerId',
                      Header: 'Stripe Customer ID',
                    },
                    { accessor: 'stripeReference', Header: 'Stripe Reference' },
                    {
                      accessor: 'migratedAt',
                      Header: 'Migrated At',
                      width: 160,
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
    UNSAFE_componentWillReceiveProps(nextProps) {},
    componentDidMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );

      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
  }),
)(MigratingBamboraToStripe);

import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import axios from 'axios';
import { KappNavLink as NavLink } from 'common';
import { getCurrency } from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { getTimezone } from '../leads/LeadsUtils';

export class StripeDisputes extends Component {
  constructor(props) {
    super(props);

    this.currency = getAttributeValue(this.props.space, 'Currency') || 'USD';
    this.currencySymbol = getCurrency(this.currency)['symbol'];

    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.state = {
      disputes: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchDisputes();
  }

  fetchDisputes() {
    const { space, profile, kineticBillingServerUrl } = this.props;
    const spaceSlug = space.slug;
    const timezone = getTimezone(profile.timezone, space.defaultTimezone);

    this.setState({ loading: true, error: null });

    axios
      .post(kineticBillingServerUrl + '/disputes', {
        space: spaceSlug,
        billingService: 'Stripe',
        timezone,
      })
      .then(result => {
        const raw = result.data.data || result.data || [];
        const disputes = (Array.isArray(raw) ? raw : [])
          .map(d => {
            const member = (this.props.allMembers || []).find(
              m => m.values['Billing Customer Id'] === d.customerId,
            );
            return {
              id: d.id || d.disputeId,
              amount: d.amount,
              currency: d.currency || this.currency,
              reason: d.reason,
              status: d.status,
              created: d.created || d.createdDate,
              dueBy: d.evidenceDueBy || d.due_by,
              customerId: d.customerId,
              memberGUID: member ? member.id : null,
              name: member
                ? member.values['First Name'] + ' ' + member.values['Last Name']
                : d.customerId || '',
            };
          })
          .filter(d => d.status !== 'lost' && d.status !== 'won');
        this.setState({ disputes, loading: false });
      })
      .catch(error => {
        console.error('Failed to fetch Stripe disputes', error);
        this.setState({ loading: false, error: 'Failed to load disputes.' });
      });
  }

  getColumns() {
    const locale = this.props.locale;
    const currency = this.currency;
    return [
      {
        accessor: 'name',
        Header: 'Member',
        width: 200,
        Cell: props =>
          props.original.memberGUID ? (
            <NavLink to={`/Member/${props.original.memberGUID}`} className="">
              {props.value}
            </NavLink>
          ) : (
            <span>{props.value}</span>
          ),
      },
      {
        accessor: 'reason',
        Header: 'Reason',
        width: 220,
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 140,
      },
      {
        accessor: 'created',
        Header: 'Created',
        width: 130,
        Cell: props => (props.value ? moment(props.value).format('L') : ''),
      },
      {
        accessor: 'dueBy',
        Header: 'Evidence Due',
        width: 130,
        Cell: props => (props.value ? moment(props.value).format('L') : ''),
      },
      {
        accessor: 'amount',
        Header: 'Amount',
        width: 120,
        Cell: props =>
          props.value !== undefined && props.value !== null ? (
            <div className="dollarValue">
              {new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
              }).format(props.value / 100)}
            </div>
          ) : (
            <div />
          ),
      },
    ];
  }

  render() {
    const { disputes, loading, error } = this.state;

    if (loading) {
      return (
        <span>
          <hr />
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h6>Stripe Disputes</h6>
          </div>
          <div>Loading Disputes...</div>
        </span>
      );
    }

    if (!loading && !error && disputes.length === 0) {
      return null;
    }

    if (error) {
      return (
        <span>
          <hr />
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h6>Stripe Disputes</h6>
          </div>
          <div className="alert alert-danger">{error}</div>
        </span>
      );
    }

    return (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>
            Stripe Disputes{' '}
            {disputes.length > 0 && (
              <span
                className="badge"
                style={{
                  background: '#c0392b',
                  color: '#fff',
                  marginLeft: '6px',
                }}
              >
                {disputes.length}
              </span>
            )}
          </h6>
          <p>
            All Disputes must be managed directly via your Stripe Dashboard.
          </p>
        </div>
        {disputes.length === 0 ? (
          <div className="alert alert-success">No open disputes found.</div>
        ) : (
          <ReactTable
            columns={this.getColumns()}
            data={disputes}
            className="-striped -highlight"
            defaultPageSize={disputes.length > 0 ? disputes.length : 2}
            pageSize={disputes.length > 0 ? disputes.length : 2}
            showPagination={false}
            defaultSorted={[{ id: 'created', desc: true }]}
          />
        )}
      </span>
    );
  }
}

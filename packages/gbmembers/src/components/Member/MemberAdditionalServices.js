import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';
import crossIcon from '../../images/cross.svg?raw';
import { confirm } from '../helpers/Confirmation';
import { getJson } from '../Member/MemberUtils';
import SVGInline from 'react-svg-inline';
import { CoreForm } from 'react-kinetic-core';
import ReactSpinner from 'react16-spinjs';

export class MemberAdditionalServices extends Component {
  constructor(props) {
    super(props);
    this.formatDeleteCell = this.formatDeleteCell.bind(this);
    this.appliedEditForm = this.appliedEditForm.bind(this);
    this.handleLoaded = this.handleLoaded.bind(this);

    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();
    this.state = {
      data,
      memberIten: this.props.memberItem,
      addservice: false,
      loadingForm: true,
      defaultValues: {
        Status: 'Active',
        'Member ID': this.props.memberItem.values['Member ID'],
        'Member GUID': this.props.memberItem.id,
        'POS Profile ID': this.getPOSProfileID(
          this.props.memberItem,
          this.props.allMembers,
        ),
        'Student First Name': this.props.memberItem.values['First Name'],
        'Student Last Name': this.props.memberItem.values['Last Name'],
        'Requested For':
          this.props.memberItem.values['First Name'] +
          ' ' +
          this.props.memberItem.values['Last Name'],
        Address: this.props.memberItem.values['Address'],
        Suburb: this.props.memberItem.values['Suburb'],
        State: this.props.memberItem.values['State'],
        Postcode: this.props.memberItem.values['Postcode'],
        Email: this.props.memberItem.values['Email'],
        Mobile: this.props.memberItem.values['Mobile'],
        DOB: this.props.memberItem.values['DOB'],
      },
    };
  }

  getPOSProfileID(memberItem, allMembers) {
    var dependantBillerProfileID = undefined;
    if (
      memberItem.values['Billing Parent Member'] !== undefined &&
      memberItem.values['Billing Parent Member'] !== memberItem.id
    ) {
      var parentMember = undefined;
      for (let i = 0; i < allMembers.length; i++) {
        if (
          this.props.allMembers[i].id ===
          memberItem.values['Billing Parent Member']
        ) {
          parentMember = this.props.allMembers[i];
        }
      }
      if (parentMember !== undefined) {
        dependantBillerProfileID = parentMember.values['POS Profile ID'];
      }
    } else {
      dependantBillerProfileID = memberItem.values['POS Profile ID'];
    }
    return dependantBillerProfileID;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.memberItem) {
      this.setState({
        data: this.getData(nextProps.memberItem),
        memberItem: nextProps.memberItem,
        addservice: false,
        loadingForm: true,
        defaultValues: {
          Status: 'Active',
          'Member ID': nextProps.memberItem.values['Member ID'],
          'Member GUID': nextProps.memberItem.id,
          'POS Profile ID': this.getPOSProfileID(
            nextProps.memberItem,
            nextProps.allMembers,
          ),
          'Student First Name': nextProps.memberItem.values['First Name'],
          'Student Last Name': nextProps.memberItem.values['Last Name'],
          'Requested For':
            nextProps.memberItem.values['First Name'] +
            ' ' +
            this.props.memberItem.values['Last Name'],
          Address: nextProps.memberItem.values['Address'],
          Suburb: nextProps.memberItem.values['Suburb'],
          State: nextProps.memberItem.values['State'],
          Postcode: nextProps.memberItem.values['Postcode'],
          Email: nextProps.memberItem.values['Email'],
          Mobile: nextProps.memberItem.values['Mobile'],
          DOB: nextProps.memberItem.values['DOB'],
        },
      });
    }
  }

  UNSAFE_componentWillMount() {}

  getColumns() {
    return [
      {
        accessor: 'status',
        Header: 'Status',
        width: 100,
        Cell: props => props.original['Status'],
      },
      {
        accessor: 'name',
        Header: 'Name',
        width: 300,
        Cell: props => props.original['Name'],
      },
      {
        accessor: 'frequency',
        Header: 'Payment Frequency',
        width: 200,
        Cell: props => props.original['Display Payment Frequency'],
      },
      {
        accessor: 'fee',
        Header: 'Fee',
        width: 100,
        Cell: props =>
          new Intl.NumberFormat(this.props.locale, {
            style: 'currency',
            currency: this.props.currency,
          }).format(props.original['Fee']),
      },
      {
        accessor: 'start',
        Header: 'Start',
        width: 100,
        Cell: props =>
          moment(props.original['Start Date']).format('D MMM YYYY'),
      },
      {
        accessor: 'end',
        Header: 'End',
        width: 100,
        Cell: props => moment(props.original['End Date']).format('D MMM YYYY'),
      },
      {
        accessor: 'billingID',
        Header: 'Billing ID',
        width: 100,
        Cell: props => props.original['Billing ID'],
      },
      {
        accessor: 'delete',
        Header: '',
        width: 50,
        Cell: this.formatDeleteCell,
      },
    ];
  }
  getData(memberItem) {
    return memberItem.additionalServices;
  }

  cancelService(memberItem, submission) {
    memberItem.additionalServices.forEach((item, i) => {
      if (item.id === submission.id) {
        item['Status'] = 'Cancelled';
      }
    });

    return memberItem;
  }
  formatDeleteCell(cellInfo) {
    return cellInfo.original['Status'] === 'Active' ? (
      <span
        className="deleteFile"
        onClick={async e => {
          if (
            await confirm(
              <span>
                <span>Are you sure you want to CANCEL this Service?</span>
                <table>
                  <tbody>
                    <tr>
                      <td>Name:</td>
                      <td>{cellInfo.original['Name']}</td>
                    </tr>
                  </tbody>
                </table>
              </span>,
            )
          ) {
            this.props.cancelAdditionalService({
              id: cellInfo.original.id,
            });

            this.setState({
              data: this.getData(
                this.cancelService(this.props.memberItem, cellInfo.original),
              ),
            });
          }
        }}
      >
        <SVGInline svg={crossIcon} className="icon" />
      </span>
    ) : (
      <div />
    );
  }
  handleLoaded() {
    this.setState({
      loadingForm: false,
    });
  }
  appliedEditForm(response, actions) {
    var len = this.props.memberItem.additionalServices.length;
    this.props.memberItem.additionalServices[len] = response.submission.values;
    this.props.memberItem.additionalServices[len]['id'] =
      response.submission.id;
    this.setState({
      data: this.getData(this.props.memberItem),
      addservice: false,
      loadingForm: false,
    });
  }
  render() {
    return (
      <div className="row">
        <div className="col-sm-10">
          <span style={{ width: '100%' }}>
            <h3>Additional Services</h3>
            {!this.state.addservice ? (
              <button
                type="button"
                className={'btn btn-primary'}
                onClick={e => {
                  this.setState({
                    addservice: true,
                  });
                }}
              >
                Add Additional Service
              </button>
            ) : (
              <button
                type="button"
                className={'btn btn-primary'}
                onClick={e => {
                  this.setState({
                    addservice: false,
                    loadingForm: true,
                  });
                }}
              >
                Cancel Add Service
              </button>
            )}
            {this.state.addservice ? (
              <span>
                {this.state.loadingForm && (
                  <div>
                    Loading... <ReactSpinner />
                  </div>
                )}
                <CoreForm
                  datastore
                  form="bambora-member-additional-services"
                  values={this.state.defaultValues}
                  loaded={this.handleLoaded}
                  completed={this.appliedEditForm}
                />
              </span>
            ) : (
              <ReactTable
                columns={this._columns}
                data={this.state.data}
                defaultPageSize={this.state.data.length}
                pageSize={this.state.data.length}
                showPagination={false}
                width={500}
              />
            )}
          </span>
        </div>
      </div>
    );
  }
}

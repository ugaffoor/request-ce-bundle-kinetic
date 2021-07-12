import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';
import binIcon from '../../images/bin.svg?raw';
import { confirm } from '../helpers/Confirmation';
import { getJson } from '../Member/MemberUtils';
import SVGInline from 'react-svg-inline';
import { CoreForm } from 'react-kinetic-core';

export class MemberFiles extends Component {
  constructor(props) {
    super(props);
    this.formatFileCell = this.formatFileCell.bind(this);
    this.formatDateCell = this.formatDateCell.bind(this);
    this.formatSubmitterCell = this.formatSubmitterCell.bind(this);
    this.formatDeleteCell = this.formatDeleteCell.bind(this);
    this.appliedEditForm = this.appliedEditForm.bind(this);

    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();
    this.state = {
      data,
      memberIten: this.props.memberItem,
      addfile: false,
      defaultValues: {
        'Member ID': this.props.memberItem.id,
      },
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.memberItem) {
      this.setState({
        data: this.getData(nextProps.memberItem),
        memberItem: nextProps.memberItem,
        defaultValues: {
          'Member ID': nextProps.memberItem.id,
        },
      });
    }
  }

  UNSAFE_componentWillMount() {}

  getColumns() {
    return [
      {
        accessor: 'name',
        Header: 'File',
        width: 700,
        Cell: this.formatFileCell,
      },
      {
        accessor: 'date',
        Header: 'Updated',
        width: 200,
        Cell: this.formatDateCell,
      },
      {
        accessor: 'submitter',
        Header: 'Updated By',
        width: 300,
        Cell: this.formatSubmitterCell,
      },
      {
        accessor: 'delete',
        Header: '',
        width: 50,
        Cell: this.formatDeleteCell,
      },
    ];
  }
  formatFileCell(cellInfo) {
    return (
      <a
        href={cellInfo.original.values['File'][0]['link'].replace(
          '/' + this.props.space.slug,
          '',
        )}
        rel="nopener noreferrer"
        target="_blank"
      >
        {cellInfo.original.values['File'][0]['name']}
      </a>
    );
  }
  formatDateCell(cellInfo) {
    return (
      <span>
        {moment(cellInfo.original['updatedAt']).format('MMM D, YYYY HH:mm')}
      </span>
    );
  }
  formatSubmitterCell(cellInfo) {
    return <span>{cellInfo.original['updatedBy']}</span>;
  }
  getData(memberItem) {
    return memberItem.memberFiles;
  }

  removeMemberFile(memberItem, submission) {
    var memberFiles = [];

    memberItem.memberFiles.forEach((item, i) => {
      if (item.id !== submission.id) {
        memberFiles[memberFiles.length] = item;
      }
    });

    memberItem.memberFiles = memberFiles;
    return memberItem;
  }
  formatDeleteCell(cellInfo) {
    return (
      <span
        className="deleteFile"
        onClick={async e => {
          if (
            await confirm(
              <span>
                <span>Are you sure you want to DELETE this File?</span>
                <table>
                  <tbody>
                    <tr>
                      <td>File Name:</td>
                      <td>{cellInfo.original.values['File'][0]['name']}</td>
                    </tr>
                  </tbody>
                </table>
              </span>,
            )
          ) {
            this.props.deleteMemberFile({
              id: cellInfo.original.id,
            });

            this.setState({
              data: this.getData(
                this.removeMemberFile(this.props.memberItem, cellInfo.original),
              ),
            });
          }
        }}
      >
        <SVGInline svg={binIcon} className="icon" />
      </span>
    );
  }
  appliedEditForm(response, actions) {
    if (
      response.submission.values.File !== null &&
      response.submission.values.File.length > 0
    ) {
      this.props.memberItem.memberFiles[
        this.props.memberItem.memberFiles.length
      ] = response.submission;
    }
    this.setState({
      data: this.getData(this.props.memberItem),
      addfile: false,
    });
  }
  render() {
    return (
      <div className="row">
        <div className="col-sm-10">
          <span style={{ width: '100%' }}>
            <h3>Files</h3>
            {!this.state.addfile ? (
              <button
                type="button"
                className={'btn btn-primary'}
                onClick={e => {
                  this.setState({
                    addfile: true,
                  });
                }}
              >
                Add File
              </button>
            ) : (
              <button
                type="button"
                className={'btn btn-primary'}
                onClick={e => {
                  this.setState({
                    addfile: false,
                  });
                }}
              >
                Cancel Add File
              </button>
            )}
            {this.state.addfile ? (
              <CoreForm
                datastore
                form="member-files"
                values={this.state.defaultValues}
                completed={this.appliedEditForm}
              />
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

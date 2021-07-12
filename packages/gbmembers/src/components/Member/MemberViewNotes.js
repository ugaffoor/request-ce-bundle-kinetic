import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';
import binIcon from '../../images/bin.svg?raw';
import { confirm } from '../helpers/Confirmation';
import { getJson } from '../Member/MemberUtils';
import SVGInline from 'react-svg-inline';
import phone from '../../images/phone.png';
import mail from '../../images/mail.png';
import sms from '../../images/sms.png';

export class MemberViewNotes extends Component {
  constructor(props) {
    super(props);
    this.formatDeleteCell = this.formatDeleteCell.bind(this);

    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();
    this.state = {
      data,
      memberIten: this.props.memberItem,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.memberItem) {
      this.setState({
        data: this.getData(nextProps.memberItem),
        memberItem: nextProps.memberItem,
      });
    }
  }

  UNSAFE_componentWillMount() {}

  getColumns() {
    return [
      {
        accessor: 'note',
        Header: 'Note',
        width: 800,
        style: { whiteSpace: 'unset' },
      },
      {
        accessor: 'contactMethod',
        width: 150,
        Cell: row => this.formatContactMethodCell(row),
      },
      {
        accessor: 'contactDate',
        Header: 'Created Date',
        Cell: row => moment(row.original.contactDate).format('L h:mm A'),
      },
      {
        accessor: 'submitter',
        Header: 'Submitter',
        style: { whiteSpace: 'unset' },
      },
      {
        accessor: 'submitter',
        Header: '',
        width: 50,
        Cell: this.formatDeleteCell,
      },
    ];
  }

  getData(memberItem) {
    let histories = memberItem.values['Notes History'];
    if (!histories) {
      return [];
    } else if (typeof histories !== 'object') {
      histories = JSON.parse(histories);
    }

    return histories.sort(function(history1, history2) {
      if (
        moment(history1.contactDate, contact_date_format).isAfter(
          moment(history2.contactDate, contact_date_format),
        )
      ) {
        return -1;
      }
      if (
        moment(history1.contactDate, contact_date_format).isBefore(
          moment(history2.contactDate, contact_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }
  formatContactMethodCell(row) {
    if (row.original.contactMethod === 'phone') {
      return (
        <span className="notesCell phone">
          <img src={phone} alt="Phone Call" />
          Phone Call
        </span>
      );
    } else if (row.original.contactMethod === 'email') {
      return (
        <span className="notesCell email">
          <img src={mail} alt="Email" />
          Email
        </span>
      );
    } else if (row.original.contactMethod === 'sms') {
      return (
        <span className="notesCell sms">
          <img src={sms} alt="SMS" />
          SMS
        </span>
      );
    } else {
      return <span className="notesCell"></span>;
    }
  }

  formatDeleteCell(cellInfo) {
    return (
      <span
        className="deleteNote"
        onClick={async e => {
          console.log(
            e.currentTarget.getAttribute('noteDate') +
              ' ' +
              e.currentTarget.getAttribute('noteType'),
          );
          if (
            await confirm(
              <span>
                <span>Are your sure you want to DELETE this Note?</span>
                <table>
                  <tbody>
                    <tr>
                      <td>Date:</td>
                      <td>
                        {moment(
                          cellInfo.original.contactDate,
                          'YYYY-MM-DD HH:mm',
                        ).format('lll')}
                      </td>
                    </tr>
                    <tr>
                      <td>Note:</td>
                      <td>{cellInfo.original.note}</td>
                    </tr>
                  </tbody>
                </table>
              </span>,
            )
          ) {
            let history = getJson(
              this.state.memberItem.values['Notes History'],
            );
            history = history.filter(element => {
              return !(
                element.contactDate === cellInfo.original.contactDate &&
                element.contactMethod === cellInfo.original.contactMethod &&
                element.note === cellInfo.original.note
              );
            });
            console.log(history);
            this.props.saveRemoveMemberNote(history);
          }
        }}
      >
        <SVGInline svg={binIcon} className="icon" />
      </span>
    );
  }
  render() {
    return (
      <div className="row">
        <div className="col-sm-10 notesTable">
          <span style={{ width: '100%' }}>
            <h3>All Notes</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              width={500}
            />
          </span>
        </div>
      </div>
    );
  }
}

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import 'bootstrap/scss/bootstrap.scss';
import ReactTable from 'react-table';
import { actions as appActions } from '../../redux/modules/memberApp';
import { KappNavLink as NavLink } from 'common';
import { Confirm } from 'react-confirm-bootstrap';
import { StatusMessagesContainer } from '../StatusMessages';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  allMembers: state.member.members.allMembers,
  memberLists: state.member.app.memberLists,
});

const mapDispatchToProps = {
  fetchMembers: actions.fetchMembers,
  addMembersList: appActions.addMembersList,
  removeMembersList: appActions.removeMembersList,
};

export const ListView = ({
  allMembers,
  memberLists,
  addNewList,
  deleteMembersList,
}) => (
  <div>
    <StatusMessagesContainer />
    <ListHome
      allMembers={allMembers}
      memberLists={memberLists}
      addNewList={addNewList}
      deleteMembersList={deleteMembersList}
    />
  </div>
);

export const ListContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(() => {
    return {};
  }),
  withHandlers({
    addNewList: ({ addMembersList }) => newList => {
      addMembersList({ newList });
    },
    deleteMembersList: ({ removeMembersList }) => listName => {
      removeMembersList(listName);
    },
  }),
  lifecycle({
    componentWillMount() {},
    componentWillReceiveProps(nextProps) {},
    componentWillUnmount() {},
  }),
)(ListView);

export class ListHome extends Component {
  constructor(props) {
    super(props);
    this.showMembers = this.showMembers.bind(this);
    this._listColumns = this.getListColumns();
    let listData = this.getListData(this.props.memberLists);
    this._listMembersColumns = this.getListMembersColumns();

    this.state = {
      listData: listData,
      listMembersData: [],
      selected: null,
      selectedList: null,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.memberLists) {
      this.setState({
        listData: this.getListData(nextProps.memberLists),
      });
    }
  }

  getListColumns = () => {
    return [{ accessor: 'name', Header: 'List Name' }];
  };

  getListData(memberLists) {
    if (!memberLists) {
      return [];
    }

    let data = [];
    memberLists.forEach(list => {
      data.push({
        name: list.name,
        members: list.members,
      });
    });

    return data;
  }

  getListMembersColumns() {
    return [
      { accessor: 'Member ID', Header: 'Member Id' },
      { accessor: 'Gender', Header: 'Gender' },
      { accessor: 'Member Type', Header: 'Member Type' },
      { accessor: 'Ranking Program', Header: 'Program' },
      { accessor: 'Ranking Belt', Header: 'Belt' },
    ];
  }

  getListMembersData(memberIds) {
    if (!memberIds || $.isEmptyObject(memberIds)) {
      return [];
    }

    const members = this.props.allMembers.filter(member => {
      return memberIds.some(memberId => memberId === member['id']);
    });

    let data = [];
    members.forEach(member => {
      data.push({
        _id: member['id'],
        ...member.values,
      });
    });

    return data;
  }

  showMembers(state, rowInfo, column) {
    return {
      onClick: (e, handleOriginal) => {
        this.setState({
          listMembersData: this.getListMembersData(rowInfo.original.members),
          selected: rowInfo.index,
          selectedList: rowInfo.original.name,
        });

        if (handleOriginal) {
          handleOriginal();
        }
      },
      style: {
        cursor: 'pointer',
        background: rowInfo.index === this.state.selected ? '#991B1E' : 'white',
        color: rowInfo.index === this.state.selected ? 'white' : 'black',
      },
    };
  }

  removeList(name) {
    this.props.deleteMembersList(name);
    this.setState({
      selected: null,
      selectedList: null,
      listMembersData: [],
    });
  }

  render() {
    let selectedList = this.state.selectedList;
    return (
      <div className="container-fluid memberLists">
        <div className="row">
          <div
            className="col-md-3"
            style={{
              backgroundColor: '#F7F7F7',
              borderColor: '#D5D5D5',
              borderRight: 'solid 1px',
            }}
          >
            <ReactTable
              columns={this._listColumns}
              data={this.state.listData}
              defaultPageSize={this.state.listData.length}
              pageSize={this.state.listData.length}
              showPagination={false}
              getTrProps={this.showMembers}
            />
          </div>
          <div className="col-md-9">
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <NavLink
                    to={`/NewList`}
                    className="btn btn-primary"
                    style={{ borderRadius: '0', margin: '10px' }}
                  >
                    Create New List
                  </NavLink>
                  {this.state.selectedList && (
                    <NavLink
                      to={`/ListEdit/${selectedList}`}
                      className="btn btn-primary"
                      style={{ borderRadius: '0', margin: '10px' }}
                    >
                      Edit Selected List
                    </NavLink>
                  )}
                  {this.state.selectedList && (
                    <Confirm
                      onConfirm={e => this.removeList(selectedList)}
                      body="Are you sure you want to delete this list?"
                      confirmText="Confirm Delete"
                      title="Deleting List"
                    >
                      <button
                        type="button"
                        id="listDeleteButton"
                        className={'btn btn-primary'}
                      >
                        Delete Selected List
                      </button>
                    </Confirm>
                  )}
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <ReactTable
                  columns={this._listMembersColumns}
                  data={this.state.listMembersData}
                  defaultPageSize={this.state.listMembersData.length}
                  pageSize={this.state.listMembersData.length}
                  showPagination={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
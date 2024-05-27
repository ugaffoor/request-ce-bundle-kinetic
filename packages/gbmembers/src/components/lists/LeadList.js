import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/leads';
import $ from 'jquery';
import 'bootstrap/scss/bootstrap.scss';
import ReactTable from 'react-table';
import { actions as appActions } from '../../redux/modules/memberApp';
import { KappNavLink as NavLink } from 'common';
import { Confirm } from 'react-confirm-bootstrap';
import { StatusMessagesContainer } from '../StatusMessages';
import { matchesLeadFilter } from '../../utils/utils';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  allLeads: state.member.leads.allLeads,
  leadLists: state.member.app.leadLists,
});

const mapDispatchToProps = {
  addLeadsList: appActions.addLeadsList,
  removeLeadsList: appActions.removeLeadsList,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};

export const ListView = ({
  allLeads,
  leadLists,
  addNewList,
  deleteLeadsList,
}) => (
  <div>
    <StatusMessagesContainer />
    <ListHome
      allLeads={allLeads}
      leadLists={leadLists}
      addNewList={addNewList}
      deleteLeadsList={deleteLeadsList}
    />
  </div>
);

export const LeadListContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(() => {
    return {};
  }),
  withHandlers({
    addNewList: ({ addLeadsList }) => newList => {
      addLeadsList({ newList });
    },
    deleteLeadsList: ({ removeLeadsList }) => listName => {
      removeLeadsList(listName);
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {},
    UNSAFE_componentWillReceiveProps(nextProps) {},
    componentDidMount() {
      this.props.setSidebarDisplayType('leads');
    },
    componentWillUnmount() {},
  }),
)(ListView);

export class ListHome extends Component {
  constructor(props) {
    super(props);
    this.showLeads = this.showLeads.bind(this);
    this.getExcluded = this.getExcluded.bind(this);
    this._listColumns = this.getListColumns();
    let listData = this.getListData(this.props.allLeads, this.props.leadLists);
    this.allLeads = this.props.allLeads;

    this.state = {
      listData: listData,
      listLeadsData: [],
      selected: null,
      selectedList: null,
      count: 0,
    };
  }
  getExcluded() {
    return this.state.excluded;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.leadLists) {
      this.setState({
        listData: this.getListData(this.props.allLeads, nextProps.leadLists),
      });
    }
  }

  getListColumns = () => {
    return [{ accessor: 'name', Header: 'Lead List Name' }];
  };

  getListData(allLeads, leadLists) {
    if (!leadLists) {
      return [];
    }

    let data = [];
    leadLists.forEach(list => {
      data.push({
        name: list.name,
        leads: allLeads,
        filters: list.filters,
        excluded: list.excluded !== undefined ? list.excluded : [],
      });
    });

    return data;
  }

  getlistLeadsData(filters) {
    let leads = matchesLeadFilter(this.props.allLeads, filters);

    let data = [];
    leads.forEach(member => {
      data.push({
        _id: member['id'],
        ...member.values,
      });
    });

    return data;
  }

  showLeads(state, rowInfo, column) {
    return {
      onClick: (e, handleOriginal) => {
        var listLeadsData = this.getlistLeadsData(rowInfo.original.filters);
        this.setState({
          listLeadsData: listLeadsData,
          count: listLeadsData.length,
          selected: rowInfo.index,
          selectedList: rowInfo.original.name,
          excluded:
            rowInfo.original.excluded !== undefined
              ? rowInfo.original.excluded
              : [],
        });

        if (handleOriginal) {
          handleOriginal();
        }
      },
      style: {
        cursor: 'pointer',
        background:
          rowInfo !== undefined && rowInfo.index === this.state.selected
            ? '#991B1E'
            : 'white',
        color:
          rowInfo !== undefined && rowInfo.index === this.state.selected
            ? 'white'
            : 'black',
      },
    };
  }

  removeList(name) {
    this.props.deleteLeadsList(name);
    this.setState({
      selected: null,
      selectedList: null,
      listLeadsData: [],
    });
  }

  render() {
    let selectedList = this.state.selectedList;
    return (
      <div className="container-fluid leadLists">
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
              getTrProps={this.showLeads}
            />
          </div>
          <div className="col-md-9">
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <NavLink to={`/NewLeadList`} className="btn btn-primary">
                    Create New Lead List
                  </NavLink>
                  {this.state.selectedList && (
                    <NavLink
                      to={`/LeadListEdit/${selectedList}`}
                      className="btn btn-primary"
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
                  columns={[
                    {
                      id: 'selection',
                      Header: 'Exclude',
                      Cell: props => {
                        return (
                          <div>
                            <input
                              type="checkbox"
                              checked={
                                this.getExcluded() !== undefined
                                  ? this.getExcluded().find(
                                      id => id === props.original._id,
                                    )
                                  : false
                              }
                              onChange={e => {}}
                              disabled={true}
                            />
                          </div>
                        );
                      },
                    },
                    {
                      accessor: 'First Name',
                      Header: props => {
                        return (
                          <span>
                            <span>
                              Name(
                              {this.state !== undefined
                                ? this.state.count
                                : '0'}
                              )
                            </span>
                          </span>
                        );
                      },
                      Cell: props => {
                        return (
                          <NavLink
                            to={`/LeadDetail/${props.original._id}`}
                            className=""
                          >
                            {props.original['First Name']}{' '}
                            {props.original['Last Name']}
                          </NavLink>
                        );
                      },
                    },
                    { accessor: 'Status', Header: 'Status' },
                    { accessor: 'Source', Header: 'Referred via' },
                    { accessor: 'Gender', Header: 'Gender' },
                    { accessor: 'Interest in Program', Header: 'Program' },
                    { accessor: 'Source Reference 1', Header: 'Source 1' },
                    { accessor: 'Source Reference 2', Header: 'Source 2' },
                    { accessor: 'Source Reference 3', Header: 'Source 3' },
                    { accessor: 'Source Reference 4', Header: 'Source 4' },
                    {
                      accessor: 'Opt-Out',
                      Header: 'Opt-Out',
                    },
                  ]}
                  data={this.state.listLeadsData}
                  defaultPageSize={this.state.listLeadsData.length}
                  pageSize={this.state.listLeadsData.length}
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

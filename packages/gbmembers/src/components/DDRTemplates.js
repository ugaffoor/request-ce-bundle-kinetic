import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../redux/modules/memberApp';
import { NavLink } from 'react-router-dom';
import $ from 'jquery';
import NumberFormat from 'react-number-format';
import 'react-datetime/css/react-datetime.css';
import ReactTable from 'react-table';
import moment from 'moment';
import { StatusMessagesContainer } from './StatusMessages';
import { actions as errorActions } from '../redux/modules/errors';

const mapStateToProps = state => ({
  ddrTemplates: state.app.ddrTemplates,
});
const mapDispatchToProps = {
  addDDRTemplate: actions.addDDRTemplate,
  removeDDRTemplate: actions.removeDDRTemplate,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
};

const util = require('util');

export class DDRTemplates extends Component {
  constructor(props) {
    super(props);
    this.addTemplate = this.addTemplate.bind(this);
    this.deleteTemplate = this.deleteTemplate.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    let data = this.getData(this.props.ddrTemplates);
    this.columns = this.getColumns();

    this.state = {
      data,
      templateName: '',
      templateUrl: '',
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.ddrTemplates.size !== nextProps.ddrTemplates.size) {
      this.setState({
        data: this.getData(nextProps.ddrTemplates),
      });
    }
  }

  addTemplate() {
    if (
      !this.state.templateName ||
      this.state.templateName.length <= 0 ||
      !this.state.templateUrl ||
      this.state.templateUrl.length <= 0
    ) {
      console.log('Template name and URL are required');
      return;
    }
    this.props.addNewDDRTemplate({
      name: this.state.templateName,
      url: this.state.templateUrl,
    });
  }

  deleteTemplate(templateName) {
    if (!templateName || templateName.length <= 0) {
      console.log('Template name is required');
      return;
    }
    this.props.deleteDDRTemplate(templateName);
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  getData(ddrTemplates) {
    if (!ddrTemplates || ddrTemplates.size <= 0) {
      return [];
    }
    let data = [];

    ddrTemplates.forEach(template => {
      data.push({
        _id: template.name,
        name: template.name,
        url: template.url,
      });
    });
    return data;
  }

  getColumns(data) {
    const columns = [
      { accessor: 'name', Header: 'Name' },
      { accessor: 'url', Header: 'URL' },
      {
        accessor: '$delete',
        Cell: row => (
          <button
            type="button"
            className="btn btn-primary"
            onClick={e => this.deleteTemplate(row.original['name'])}
          >
            Delete
          </button>
        ),
      },
    ];
    return columns;
  }

  render() {
    return (
      <div className="container-fluid memberLists">
        <StatusMessagesContainer />
        <div className="row">
          <div
            className="col-md-4"
            style={{
              backgroundColor: '#F7F7F7',
              borderColor: '#D5D5D5',
              borderRight: 'solid 1px',
            }}
          >
            <form id="form" name="form">
              <div className="row">
                <div className="col">
                  <fieldset
                    className="scheduler-border"
                    style={{ position: 'relative' }}
                  >
                    <legend className="scheduler-border" />
                    <div className="form-group form-inline">
                      <label htmlFor="templateName">Template Name&nbsp;</label>
                      <input
                        id="templateName"
                        name="templateName"
                        type="text"
                        onChange={this.handleInputChange}
                        value={this.state.templateName}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="form-group form-inline">
                      <label htmlFor="templateUrl">Template URL</label>
                      <br />
                      <textarea
                        id="templateUrl"
                        name="templateUrl"
                        type="text"
                        onChange={this.handleInputChange}
                        value={this.state.templateUrl}
                        style={{ width: '100%' }}
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="form-group form-inline">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={e => this.addTemplate()}
                      >
                        Add Template
                      </button>
                    </div>
                  </fieldset>
                </div>
              </div>
            </form>
          </div>
          <div className="col-md-8">
            <div className="row">
              <div className="col">
                <div style={{ textAlign: 'center' }}>DDR Templates</div>
                <ReactTable
                  columns={this.columns}
                  data={this.state.data}
                  className="-striped -highlight"
                  defaultPageSize={this.state.data.length}
                  pageSize={this.state.data.length}
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

export const DDRTemplatesView = ({
  ddrTemplates,
  addNewDDRTemplate,
  deleteDDRTemplate,
}) => (
  <DDRTemplates
    ddrTemplates={ddrTemplates}
    addNewDDRTemplate={addNewDDRTemplate}
    deleteDDRTemplate={deleteDDRTemplate}
  />
);

export const DDRTemplatesContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({}) => {
    return {};
  }),
  withHandlers({
    addNewDDRTemplate: ({ addDDRTemplate, history }) => newTemplate => {
      addDDRTemplate({
        newTemplate,
        action: 'add',
        history,
      });
    },
    deleteDDRTemplate: ({ removeDDRTemplate }) => templateName => {
      removeDDRTemplate({ name: templateName, action: 'remove' });
    },
  }),
  lifecycle({
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
  }),
)(DDRTemplatesView);

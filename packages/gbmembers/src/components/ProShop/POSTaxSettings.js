import React, { Component } from 'react';
import moment from 'moment';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { EditAttributeValue } from '../../utils/EditAttributeValue';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import ReactTable from 'react-table';
import 'react-table/react-table.css';

const mapStateToProps = state => ({
  space: state.member.app.space,
  updatingAttribute: state.member.datastore.updatingAttribute,
  updateSpaceAttributes: state.member.datastore.updateSpaceAttributes,
  updateSpaceAttributesLoading:
    state.member.datastore.updateSpaceAttributesLoading,
});

const mapDispatchToProps = {
  updateSpaceAttribute: dataStoreActions.updateSpaceAttribute,
  fetchUpdateSpaceAttributes: dataStoreActions.fetchUpdateSpaceAttributes,
};

var compThis = undefined;

class SettingsAudit extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowSettingsAudit(false);
  };

  constructor(props) {
    super(props);
    const data = this.getData([]);
    this._columns = this.getColumns();

    this.state = {
      data,
    };
  }

  UNSAFE_componentWillMount() {}
  componentDidMount() {
    this.props.fetchUpdateSpaceAttributes({
      attributeNames: this.props.attributeNames,
    });
  }
  componentWillReceiveProps(nextProps) {
    if (!nextProps.updateSpaceAttributesLoading) {
      this.setState({
        data: this.getData(nextProps.updateSpaceAttributes.submissions),
      });
    }
  }
  getColumns() {
    return [
      { accessor: 'date', Header: 'Date' },
      { accessor: 'setting', Header: 'Setting' },
      { accessor: 'user', Header: 'User' },
      { accessor: 'from', Header: 'From' },
      { accessor: 'to', Header: 'To' },
    ];
  }

  getData(updateSpaceAttributes) {
    let data = [];
    updateSpaceAttributes.forEach(submission => {
      data.push({
        date: moment(submission.createdAt).format('L HH:mm'),
        setting: submission.values['Attribute Name'],
        user: submission.values['Updated By'],
        from: submission.values['Original Value'],
        to: submission.values['New Value'],
      });
    });

    return this.state !== undefined ? this.state.data.concat(data) : data;
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        {
          <ModalContainer onClose={this.handleClose} style={{ width: '90vw' }}>
            <ModalDialog className="settingsAudit" onClose={this.handleClose}>
              <h4>Settings Audit</h4>
              <ReactTable
                columns={this._columns}
                data={this.state.data}
                defaultPageSize={this.state.data.length}
                pageSize={this.state.data.length}
                showPagination={false}
                style={{
                  height: '60vh',
                }}
              />
              <a
                onClick={e => {
                  console.log('Show More..');
                  this.props.fetchUpdateSpaceAttributes({
                    nextPageToken: this.props.updateSpaceAttributes
                      .nextPageToken,
                    attributeNames: this.props.attributeNames,
                  });
                }}
                className="btn btn-primary showMore"
                disabled={
                  this.props.updateSpaceAttributes.nextPageToken ===
                    undefined ||
                  this.props.updateSpaceAttributes.nextPageToken === null
                }
                style={{ marginLeft: '10px', color: 'white' }}
              >
                Show More
              </a>
            </ModalDialog>
          </ModalContainer>
        }
      </div>
    );
  }
}
export class POSTaxSettings extends Component {
  constructor(props) {
    super(props);
    compThis = this;
    this.space = this.props.space;
    this.setShowSettingsAudit = this.setShowSettingsAudit.bind(this);
    let attributeNames = [
      'POS Sales Tax Label',
      'POS Sales Tax',
      'POS Sales Tax Label 2',
      'POS Sales Tax 2',
      'POS Sales Total Label',
    ];

    this.state = {
      attributeNames,
      showSettingsAudit: false,
      tax1LabelValue: getAttributeValue(this.space, 'POS Sales Tax Label'),
      origTax1LabelValue: getAttributeValue(this.space, 'POS Sales Tax Label'),
      tax1Value:
        getAttributeValue(this.space, 'POS Sales Tax') !== undefined
          ? parseFloat(getAttributeValue(this.space, 'POS Sales Tax'))
          : getAttributeValue(this.space, 'POS Sales Tax'),
      origTax1Value:
        getAttributeValue(this.space, 'POS Sales Tax') !== undefined
          ? parseFloat(getAttributeValue(this.space, 'POS Sales Tax'))
          : getAttributeValue(this.space, 'POS Sales Tax'),
      tax2LabelValue: getAttributeValue(this.space, 'POS Sales Tax Label 2'),
      origTax2LabelValue: getAttributeValue(
        this.space,
        'POS Sales Tax Label 2',
      ),
      tax2Value:
        getAttributeValue(this.space, 'POS Sales Tax 2') !== undefined
          ? parseFloat(getAttributeValue(this.space, 'POS Sales Tax 2'))
          : '',
      origTax2Value:
        getAttributeValue(this.space, 'POS Sales Tax 2') !== undefined
          ? parseFloat(getAttributeValue(this.space, 'POS Sales Tax 2'))
          : '',
      totalLabelValue: getAttributeValue(this.space, 'POS Sales Total Label'),
      origTotalLabelValue: getAttributeValue(
        this.space,
        'POS Sales Total Label',
      ),
    };
  }
  setShowSettingsAudit(val) {
    this.setState({ showSettingsAudit: val });
  }

  componentDidMount() {}

  render() {
    return (
      <span className="posTaxSettingsSection">
        <span className="settingsHeader">
          <h6>Taxes</h6>
          <span className="line">
            <div>
              <button
                type="button"
                className={'btn btn-primary'}
                onClick={e => this.setShowSettingsAudit(true)}
              >
                Settings Audit
              </button>
            </div>
            {this.state.showSettingsAudit && (
              <SettingsAudit
                setShowSettingsAudit={this.setShowSettingsAudit}
                fetchUpdateSpaceAttributes={
                  this.props.fetchUpdateSpaceAttributes
                }
                updateSpaceAttributes={this.props.updateSpaceAttributes}
                updateSpaceAttributesLoading={
                  this.props.updateSpaceAttributesLoading
                }
                nextPageToken={this.props.nextPageToken}
                attributeNames={this.state.attributeNames}
              />
            )}
          </span>
        </span>
        <EditAttributeValue
          attributeID="tax1Label"
          attributeName="POS Sales Tax Label"
          inputType="Text"
          labelName="Sales Tax Label"
          helpText="Label applied to the Sales Tax value (apply Sales Tax Percentage value also).<br/>Eg, GST 5%"
          updateSpaceAttribute={this.props.updateSpaceAttribute}
          space={this.space}
          profile={this.props.profile}
        />
        <EditAttributeValue
          attributeID="tax1Value"
          attributeName="POS Sales Tax"
          inputType="Percentage"
          labelName="Sales Tax Percentage"
          width="60px"
          helpText="Sales Tax percentage value applied for all products.<br>A new value will only be applied to new sales."
          updateSpaceAttribute={this.props.updateSpaceAttribute}
          space={this.space}
          profile={this.props.profile}
        />
        <EditAttributeValue
          attributeID="tax2Label"
          attributeName="POS Sales Tax Label 2"
          inputType="Text"
          labelName="Sales Tax 2 Label"
          helpText="Label applied to the Sales Tax 2 value (apply Sales Tax 2 Percentage value also).<br/>Eg, HST 7%"
          updateSpaceAttribute={this.props.updateSpaceAttribute}
          space={this.space}
          profile={this.props.profile}
        />
        <EditAttributeValue
          attributeID="tax2Value"
          attributeName="POS Sales Tax 2"
          inputType="Percentage"
          width="60px"
          labelName="Sales Tax 2 Percentage"
          helpText="Sales Tax 2 percentage value applied for all products.<br>A new value will only be applied to new sales."
          updateSpaceAttribute={this.props.updateSpaceAttribute}
          space={this.space}
          profile={this.props.profile}
        />
        <EditAttributeValue
          attributeID="totalLabel"
          attributeName="POS Sales Total Label"
          inputType="Text"
          labelName="Sales Total Label"
          helpText='Defaults to "TOTAL", but can be set as "Total (GST Included)"'
          updateSpaceAttribute={this.props.updateSpaceAttribute}
          space={this.space}
          profile={this.props.profile}
        />
      </span>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const POSTaxSettingsContainer = enhance(POSTaxSettings);

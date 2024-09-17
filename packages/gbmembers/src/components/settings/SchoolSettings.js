import React, { Component } from 'react';
import $ from 'jquery';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { EditAttributeValue } from './EditAttributeValue';
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
                    attributeNames: this.props.attributeNames,
                    nextPageToken: this.props.updateSpaceAttributes
                      .nextPageToken,
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

export class SchoolSettings extends Component {
  constructor(props) {
    super(props);
    this.space = this.props.space;
    this.ignoreAdminFee = this.ignoreAdminFee.bind(this);
    this.setShowSettingsAudit = this.setShowSettingsAudit.bind(this);
    let attributeNames = [
      'School Legal Name',
      'School Address',
      'ACN',
      'ABN',
      'School Website',
      'School Timetable URL',
      'School Email',
      'School From Alias',
      'Ignore Admin Fee',
      'School Telephone',
      'Admin Fee Label',
      'Admin Fee Charge',
      'Payment Frequencies',
      'TAX 1 Label',
      'TAX 1 Value',
      'TAX 2 Label',
      'TAX 2 Value',
      'About Us Choices',
      'Interested In Choices',
      'School Start Date',
      'School Closed Dates',
    ];

    this.state = {
      attributeNames,
      showSettingsAudit: false,
      ignoreAdminFee:
        getAttributeValue(this.props.space, this.props.attributeName) === 'YES'
          ? true
          : false,
    };
  }
  componentDidMount() {}
  ignoreAdminFee(ignore) {
    this.setState({
      ignoreAdminFee: ignore,
    });
  }
  setShowSettingsAudit(val) {
    this.setState({ showSettingsAudit: val });
  }
  render() {
    return (
      <span className="schoolSettingsSection">
        <span className="detailsSection">
          <span className="settingsHeader">
            <h6>School Details</h6>
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
            attributeID="legalName"
            attributeName="School Legal Name"
            inputType="Text"
            width="250px"
            labelName="School Legal Name"
            helpText="School Legal Name, this appears in the Member Registration agreement."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="schoolAddress"
            attributeName="School Address"
            inputType="Text"
            width="400px"
            labelName="School Address"
            helpText="School Address, this appears in emails and memberhip agreements."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="schoolTelephone"
            attributeName="School Telephone"
            inputType="Phone"
            width="100px"
            labelName="School Telephone"
            helpText="School Telephone, this appears in emails, SMS and memberhip agreements."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          {getAttributeValue(this.props.space, 'Billing Company') ===
            'PaySmart' && (
            <EditAttributeValue
              attributeID="schoolACN"
              attributeName="ACN"
              inputType="Text"
              width="120px"
              labelName="School Australian Company Number"
              helpText="School ACN, this appears in Terms and Conditions."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.space}
              profile={this.props.profile}
            />
          )}
          <EditAttributeValue
            attributeID="schoolWebsite"
            attributeName="School Website"
            inputType="Text"
            width="400px"
            labelName="School Website"
            helpText="School Website, this appears in emails if configured."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="schoolTimetable"
            attributeName="School Timetable URL"
            inputType="Text"
            width="400px"
            labelName="School Schedule URL"
            helpText="School Schedule URL, this appears in emails if configured."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          {getAttributeValue(this.props.space, 'Billing Company') ===
            'PaySmart' && (
            <EditAttributeValue
              attributeID="abn"
              attributeName="ABN"
              inputType="Text"
              width="120px"
              labelName="Australian Business Number(ABN)"
              helpText="School Australian Business Number(ABN), this appears in waivers and membership agreements."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.space}
              profile={this.props.profile}
            />
          )}
          {getAttributeValue(this.props.space, 'Billing Company') ===
            'PaySmart' && (
            <EditAttributeValue
              attributeID="abc"
              attributeName="ACN"
              inputType="Text"
              width="120px"
              labelName="Australian Company Number(ACN)"
              helpText="School Australian Company Number(ACN), this appears in waivers and membership agreements."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.space}
              profile={this.props.profile}
            />
          )}
        </span>
        <span className="detailsSection">
          <h6>Email</h6>
          <EditAttributeValue
            attributeID="schoolEmail"
            attributeName="School Email"
            inputType="Text"
            width="400px"
            labelName="School Email"
            disabled={true}
            helpText="School email used for all out going emailing and incoming email if configured.<br/>If this email needs to be changed, please contact support."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="fromAlias"
            attributeName="School From Alias"
            inputType="Text"
            width="400px"
            labelName="Email from name"
            helpText="Alias name used for the schools email, such as, Gracie Barra Scottsdale"
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
        </span>
        <span className="detailsSection">
          <h6>Billing</h6>
          {getAttributeValue(this.props.space, 'Billing Company') ===
            'Bambora' && (
            <span className="adminFee">
              <EditAttributeValue
                attributeID="ignoreAdminFee"
                attributeName="Ignore Admin Fee"
                inputType="adminFee"
                labelName="->"
                ignoreAdminFee={this.ignoreAdminFee}
                helpText="If checked no Admin Fee will be charged."
                updateSpaceAttribute={this.props.updateSpaceAttribute}
                space={this.space}
                profile={this.props.profile}
              />
              {!this.state.ignoreAdminFee && (
                <span>
                  <EditAttributeValue
                    attributeID="adminFeeLabel"
                    attributeName="Admin Fee Label"
                    inputType="Text"
                    labelName="Admin Fee Label"
                    helpText="Label applied to the Admin Fee being charged, if blank the default is 'Admin Fee'.<br>Note, this setting change will only affect new submissions, not existing acounts."
                    updateSpaceAttribute={this.props.updateSpaceAttribute}
                    space={this.space}
                    profile={this.props.profile}
                  />
                  <EditAttributeValue
                    attributeID="adminFeeCharge"
                    attributeName="Admin Fee Charge"
                    inputType="PercentageText"
                    width="120px"
                    labelName="Admin Fee Charge"
                    helpText="Membership School Admin Fee, this will be charged for all Membership fees."
                    updateSpaceAttribute={this.props.updateSpaceAttribute}
                    space={this.space}
                    profile={this.props.profile}
                  />
                </span>
              )}
            </span>
          )}
          <EditAttributeValue
            attributeID="paymentFrequencies"
            attributeName="Payment Frequencies"
            inputType="paymentFrequencies"
            width=""
            labelName="Payment Frequencies"
            helpText="Payment Frequencies used for Billing, these options allow the Program Fee configuration."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
        </span>
        {getAttributeValue(this.props.space, 'Billing Company') ===
          'Bambora' && (
          <span className="detailsSection">
            <h6>Membership Taxes</h6>
            <EditAttributeValue
              attributeID="tax1Label"
              attributeName="TAX 1 Label"
              inputType="Text"
              labelName="Membership Tax Label"
              helpText="Label applied to the Membership Tax value (apply Membership Tax Percentage value also).<br/>Eg, GST 5%"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.space}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="tax1Value"
              attributeName="TAX 1 Value"
              inputType="Percentage"
              width="60px"
              labelName="Membership Tax Percentage"
              helpText="Membership Tax percentage value applied for all Memberships.<br>A new value will only be applied to a new form submission."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.space}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="tax2Label"
              attributeName="TAX 2 Label"
              inputType="Text"
              labelName="Membership Tax 2 Label"
              helpText="Label applied to the Membership Tax 2 value (apply Membership Tax 2 Percentage value also).<br/>Eg, GST 5%, HST 7%"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.space}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="tax2Value"
              attributeName="TAX 2 Value"
              inputType="Percentage"
              width="60px"
              labelName="Membership Tax 2 Percentage"
              helpText="Membership Tax 2 percentage value applied for all Memberships.<br>A new value will only be applied to a new form submission."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.space}
              profile={this.props.profile}
            />
          </span>
        )}
        <span className="detailsSection">
          <h6>Website Contact Details</h6>
          <EditAttributeValue
            attributeID="schoolStartDate"
            attributeName="School Start Date"
            inputType="Date"
            width="400px"
            labelName="School Start Date"
            helpText="The School Start Date that trial bookings are allowed from, as part of the Calendar widget(Trial Bookings)."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="aboutUsChoices"
            attributeName="About Us Choices"
            inputType="EditList"
            width="400px"
            labelName="About Us Choices"
            helpText="About Us Choices are used in the 'Get in Touch' form as part of the Calendar widget.<br>To enter a new value, enter value then press the Enter or Tab key."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="interestedInChoices"
            attributeName="Interested In Choices"
            inputType="EditList"
            width="400px"
            labelName="Interested In Choices"
            helpText="Interested In Choices are used in the 'Get in Touch' form as part of the Calendar widget.<br>To enter a new value, enter value then press the Enter or Tab key."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="schoolClosedDates"
            attributeName="School Closed Dates"
            inputType="MultipleDates"
            width="400px"
            labelName="School Closed Dates"
            helpText="Dates to now allow Trial Bookings, as part of the Calendar widget(Trial Bookings)."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.space}
            profile={this.props.profile}
          />
        </span>
      </span>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const SchoolSettingsContainer = enhance(SchoolSettings);

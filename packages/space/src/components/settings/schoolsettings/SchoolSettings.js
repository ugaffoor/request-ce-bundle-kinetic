import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { StatusMessagesContainer } from 'gbmembers/src/components/StatusMessages';
import { Utils } from 'common';
import { confirm } from 'gbmembers/src/components/helpers/Confirmation';
import { actions } from 'gbmembers/src/redux/modules/members';
import { actions as appActions } from 'gbmembers/src/redux/modules/memberApp';
import { actions as errorActions } from '../../../redux/modules/errors';
import { actions as dataStoreActions } from 'gbmembers/src/redux/modules/settingsDatastore';
import moment from 'moment';
import { EditAttributeValue } from 'gbmembers/src/utils/EditAttributeValue';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { Loading } from 'common';

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
  UNSAFE_componentWillReceiveProps(nextProps) {
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

class SchoolAttributes extends Component {
  constructor(props) {
    super(props);
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
        Utils.getAttributeValue(this.props.space, this.props.attributeName) ===
        'YES'
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
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="schoolAddress"
            attributeName="School Address"
            inputType="Text"
            disabled={
              this.props.profile.username === 'unus@uniqconsulting.com.au' ||
              this.props.profile.username === 'software@graciebarra.com'
                ? false
                : true
            }
            width="400px"
            labelName="School Address"
            helpText="School Address, this appears in emails and memberhip agreements.<br>Please contact software@graciebarra.com to edit this value."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="schoolTelephone"
            attributeName="School Telephone"
            inputType="Phone"
            disabled={
              this.props.profile.username === 'unus@uniqconsulting.com.au' ||
              this.props.profile.username === 'software@graciebarra.com'
                ? false
                : true
            }
            width="100px"
            labelName="School Telephone"
            helpText="School Telephone, this appears in emails, SMS and memberhip agreements.<br>Please contact software@graciebarra.com to edit this value."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          {Utils.getAttributeValue(this.props.space, 'Billing Company') ===
            'PaySmart' && (
            <EditAttributeValue
              attributeID="schoolACN"
              attributeName="ACN"
              inputType="Text"
              width="120px"
              labelName="School Australian Company Number"
              helpText="School ACN, this appears in Terms and Conditions."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
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
            space={this.props.space}
            appSpace={this.props.appSpace}
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
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          {Utils.getAttributeValue(this.props.space, 'Billing Company') ===
            'PaySmart' && (
            <EditAttributeValue
              attributeID="abn"
              attributeName="ABN"
              inputType="Text"
              width="120px"
              labelName="Australian Business Number(ABN)"
              helpText="School Australian Business Number(ABN), this appears in waivers and membership agreements."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
          )}
          {Utils.getAttributeValue(this.props.space, 'Billing Company') ===
            'PaySmart' && (
            <EditAttributeValue
              attributeID="abc"
              attributeName="ACN"
              inputType="Text"
              width="120px"
              labelName="Australian Company Number(ACN)"
              helpText="School Australian Company Number(ACN), this appears in waivers and membership agreements."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
          )}
          <EditAttributeValue
            attributeID="waiverComplianceDate"
            attributeName="Member Waiver Compliance Date"
            inputType="Date"
            width="400px"
            labelName="Member Waiver Compliance Date"
            helpText="This date indicates the date which all members should have completed a waiver as a Lead or a Member.<br>
If a new waiver is generate and all members are required to complete, <br>this date is used to ensure a member has completed their waiver.
Indications in the application will identify members not compliant."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
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
            helpText="School email used for all out going emailing and incoming email if configured.<br>If this email needs to be changed, please contact support."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
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
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
        </span>
        <span className="detailsSection">
          <h6>Billing</h6>
          {(Utils.getAttributeValue(this.props.space, 'Billing Company') ===
            'Bambora' ||
            Utils.getAttributeValue(this.props.space, 'Billing Company') ===
              'Stripe') && (
            <span className="adminFee">
              <EditAttributeValue
                attributeID="ignoreAdminFee"
                attributeName="Ignore Admin Fee"
                inputType="adminFee"
                labelName="->"
                ignoreAdminFee={this.ignoreAdminFee}
                helpText="If checked no Admin Fee will be charged."
                updateSpaceAttribute={this.props.updateSpaceAttribute}
                space={this.props.space}
                appSpace={this.props.appSpace}
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
                    space={this.props.space}
                    appSpace={this.props.appSpace}
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
                    space={this.props.space}
                    appSpace={this.props.appSpace}
                    profile={this.props.profile}
                  />
                  <EditAttributeValue
                    attributeID="adminFeeApplyToPOS"
                    attributeName="Admin Fee Apply to POS"
                    inputType="yesToggleValue"
                    width="400px"
                    labelName="Apply Admin Fee to POS"
                    helpText="Check to allow the use of the Admin Fee to be applied for POS."
                    updateSpaceAttribute={this.props.updateSpaceAttribute}
                    space={this.props.space}
                    appSpace={this.props.appSpace}
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
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="cancellationDuration"
            attributeName="Cancellation Duration"
            inputType="Integer"
            width="40px"
            labelName="Cancellation Duration"
            helpText="Number of days a Cancellation notification is expected to be provided, this will display in the Terms and Conditions"
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          {Utils.getAttributeValue(this.props.space, 'Billing Company') ===
            'Stripe' && (
            <span className="memberTaxID">
              <EditAttributeValue
                attributeID="memberTaxID"
                attributeName="Member TAX ID"
                inputType="yesToggleValue"
                labelName="Capture Member Tax ID"
                helpText="Include the capture of the Members Tax ID."
                updateSpaceAttribute={this.props.updateSpaceAttribute}
                space={this.props.space}
                appSpace={this.props.appSpace}
                profile={this.props.profile}
              />
            </span>
          )}
        </span>
        {(Utils.getAttributeValue(this.props.space, 'Billing Company') ===
          'Bambora' ||
          Utils.getAttributeValue(this.props.space, 'Billing Company') ===
            'Stripe') && (
          <span className="detailsSection">
            <h6>Membership Taxes</h6>
            <EditAttributeValue
              attributeID="tax1Label"
              attributeName="TAX 1 Label"
              inputType="Text"
              labelName="Membership Tax Label"
              helpText="Label applied to the Membership Tax value (apply Membership Tax Percentage value also).<br/>Eg, GST 5%"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
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
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="tax2Label"
              attributeName="TAX 2 Label"
              inputType="Text"
              labelName="Membership Tax 2 Label"
              helpText="Label applied to the Membership Tax 2 value (apply Membership Tax 2 Percentage value also).<br>Eg, GST 5%, HST 7%"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
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
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
          </span>
        )}
        {(Utils.getAttributeValue(this.props.space, 'Billing Company') ===
          'Bambora' ||
          Utils.getAttributeValue(this.props.space, 'Billing Company') ===
            'Stripe') && (
          <span className="detailsSection">
            <h6>POS Taxes</h6>
            <EditAttributeValue
              attributeID="posTax1Label"
              attributeName="POS Sales Tax Label"
              inputType="Text"
              labelName="POS Tax Label"
              helpText="Label applied to the POS Tax value .<br/>Eg, GST 5%"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="posTax1Value"
              attributeName="POS Sales Tax"
              inputType="Percentage"
              width="60px"
              labelName="POS Tax Percentage"
              helpText="POS Tax percentage value applied to products."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="posTax2Label"
              attributeName="POS Sales Tax Label 2"
              inputType="Text"
              labelName="POS Tax Label 2"
              helpText="Label applied to the POS Tax value .<br/>Eg, HST 13%"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="posTax2Value"
              attributeName="POS Sales Tax 2"
              inputType="Percentage"
              width="60px"
              labelName="POS Tax 2 Percentage"
              helpText="POS Tax 2 percentage value applied to products."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
          </span>
        )}
        {Utils.getAttributeValue(this.props.space, 'POS System') ===
          'StripeTerminal' && (
          <span className="detailsSection">
            <h6>Stripe Terminal Location Values</h6>
            <EditAttributeValue
              attributeID="schoolStateLabel"
              attributeName="School State"
              inputType="Text"
              labelName="School State"
              helpText="Stripe Terminal State, required for US/CAD"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="schoolCityLabel"
              attributeName="School City"
              inputType="Text"
              labelName="School City"
              helpText="Stripe Terminal City, required for US/CAD"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
              profile={this.props.profile}
            />
            <EditAttributeValue
              attributeID="schoolPostcodeLabel"
              attributeName="School Postcode"
              inputType="Text"
              labelName="School Postcode/Zip"
              helpText="Stripe Terminal Postcode/Zip, required for US/CAD"
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.props.space}
              appSpace={this.props.appSpace}
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
            space={this.props.space}
            appSpace={this.props.appSpace}
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
            space={this.props.space}
            appSpace={this.props.appSpace}
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
            space={this.props.space}
            appSpace={this.props.appSpace}
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
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="switchTrialClassBookingOrder"
            attributeName="Switch Trial Class Booking Order"
            inputType="yesToggleValue"
            width="400px"
            labelName="Switch Trial Class Booking Order"
            helpText="Check to Switch the trial class booking order, to first select class then provide name details.<br>The default is to provide name details first then select a class."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="thankyouURL"
            attributeName="Trial Booking Thank you URL"
            inputType="Text"
            width="400px"
            labelName="Calendar Widget Thank you URL"
            helpText="A fully qualified URL for your website that is loading the Calendar widget.<br>This allows you to provide a custom thank you that may also contain Google(or other) tracking code."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="trialCalendarName"
            attributeName="Trial Calendar Name"
            inputType="Text"
            width="400px"
            labelName="Trial Calendar Name"
            helpText="This Trial Calendar Name an be used to seperate Trial Bookings from the Primary calendar events."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
          <EditAttributeValue
            attributeID="trialBookingCutOff"
            attributeName="Trial Booking Cut Off"
            inputType="Integer"
            width="40px"
            labelName="Trial Booking Cut Off"
            helpText="Number of hours before a Trial Booking is allowed to be made."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
        </span>
        <span className="detailsSection">
          <h6>Leads</h6>
          <EditAttributeValue
            attributeID="allowMeetingCalls"
            attributeName="Allow Meeting Calls"
            inputType="yesToggleValue"
            width="400px"
            labelName="Allow Meeting Calls"
            helpText="Check to allow the use of Meeting Calls for Leads."
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />

          <EditAttributeValue
            attributeID="waiverHiddenItems"
            attributeName="Waiver Hidden Items"
            inputType="waiverHiddenItems"
            width=""
            labelName="Waiver Hide Items"
            helpText="Select marketing display and questions to hide on the Lead Registration/Waiver forms"
            updateSpaceAttribute={this.props.updateSpaceAttribute}
            space={this.props.space}
            appSpace={this.props.appSpace}
            profile={this.props.profile}
          />
        </span>
      </span>
    );
  }
}
const SchoolSettingsComponent = ({
  allMembers,
  fetchBillingCustomers,
  setBillingCustomers,
  createBillingMembers,
  syncBillingMembers,
  billingCustomersLoading,
  importingBilling,
  synchingBilling,
  fetchMembers,
  memberInitialLoadComplete,
  membersNextPageToken,
  memberLastFetchTime,
  profile,
  billingPaymentsLoading,
  fetchBillingPayments,
  createBillingStatistics,
  createStatistic,
  addNotification,
  setSystemError,
  updateSpaceAttribute,
  fetchUpdateSpaceAttributes,
  updatingAttribute,
  updateSpaceAttributes,
  updateSpaceAttributesLoading,
  space,
  appSpace,
  loading,
}) => (
  <div>
    {loading ? (
      <Loading text="School Settings loading ..." />
    ) : (
      <div className="schoolSettingsPage">
        <StatusMessagesContainer />
        <div className="buttons column" style={{ marginLeft: '10px' }}>
          {!Utils.isMemberOf(profile, 'Role::Data Admin') ? (
            <div />
          ) : (
            <div className="schoolSettings">
              <SchoolAttributes
                space={space}
                appSpace={appSpace}
                profile={profile}
                updateSpaceAttribute={updateSpaceAttribute}
                fetchUpdateSpaceAttributes={fetchUpdateSpaceAttributes}
                updatingAttribute={updatingAttribute}
                updateSpaceAttributes={updateSpaceAttributes}
                updateSpaceAttributesLoading={updateSpaceAttributesLoading}
              />
            </div>
          )}
        </div>
        {!Utils.isMemberOf(profile, 'Billing') ||
        Utils.getAttributeValue(space, 'Billing Company') !== 'PaySmart' ? (
          <div />
        ) : (
          <div className="col-xs-3">
            <button
              type="button"
              id="loadBillingCustomers"
              className={'btn btn-primary'}
              onClick={async e => {
                if (
                  await confirm(
                    <span>
                      <span>
                        Are your sure you want to Import the Billing Member?
                      </span>
                    </span>,
                  )
                ) {
                  fetchBillingCustomers({
                    setBillingCustomers,
                    createBillingMembers,
                    fetchMembers,
                    membersNextPageToken,
                    memberInitialLoadComplete,
                    memberLastFetchTime,
                    allMembers,
                    useSubAccount:
                      Utils.getAttributeValue(space, 'PaySmart SubAccount') ===
                      'YES'
                        ? true
                        : false,
                  });
                }
              }}
            >
              Import Billing Members
            </button>
          </div>
        )}
        <div className="col-xs-3">
          {billingCustomersLoading && importingBilling ? (
            <p>Importing billing customers ....</p>
          ) : (
            <span />
          )}
        </div>
        {!Utils.isMemberOf(profile, 'Billing') ||
        Utils.getAttributeValue(space, 'Billing Company') !== 'PaySmart' ? (
          <div />
        ) : (
          <div className="col-xs-3">
            <button
              type="button"
              id="syncBillingCustomers"
              className={'btn btn-primary'}
              onClick={async e => {
                if (
                  await confirm(
                    <span>
                      <span>
                        Are your sure you want to Sync the Billing Members?
                      </span>
                    </span>,
                  )
                ) {
                  fetchBillingCustomers({
                    setBillingCustomers,
                    syncBillingMembers,
                    fetchMembers,
                    allMembers,
                    useSubAccount:
                      Utils.getAttributeValue(space, 'PaySmart SubAccount') ===
                      'YES'
                        ? true
                        : false,
                  });
                }
              }}
            >
              Sync Billing Members
            </button>
          </div>
        )}
        <div className="col-xs-3">
          {billingCustomersLoading && synchingBilling ? (
            <p>Synching billing customers ....</p>
          ) : (
            <span />
          )}
        </div>

        {profile.username !== 'unus.gaffoor@kineticdata.com' ? (
          <div />
        ) : (
          <div className="col-xs-3">
            <button
              type="button"
              id="loadBillingPayments"
              className={'btn btn-primary'}
              onClick={e => {
                let startDate, endDate;
                startDate = moment()
                  .subtract(12, 'months')
                  .startOf('month')
                  .format('YYYY-MM-DD');
                endDate = moment()
                  .subtract(1, 'months')
                  .endOf('month')
                  .format('YYYY-MM-DD');

                fetchBillingPayments({
                  paymentType: 'SUCCESSFUL',
                  paymentMethod: 'ALL',
                  paymentSource: 'ALL',
                  dateField: 'PAYMENT',
                  dateFrom: startDate,
                  dateTo: endDate,
                  createBillingStatistics: createBillingStatistics,
                  createStatistic: createStatistic,
                  internalPaymentType: 'client_successful',
                  addNotification: addNotification,
                  setSystemError: setSystemError,
                });
              }}
            >
              Import Billing History(1 year)
            </button>
          </div>
        )}
        <div className="col-xs-3">
          {billingPaymentsLoading ? (
            <p>Importing billing payments ....</p>
          ) : (
            <span />
          )}
        </div>
      </div>
    )}
  </div>
);

export const mapStateToProps = state => {
  return {
    loading: state.member.app.loading,
    memberItem: state.member.members.currentMember,
    allMembers: state.member.members.allMembers,
    billingCompany: state.member.app.billingCompany,
    billingCustomersLoading: state.member.members.billingCustomersLoading,
    importingBilling: state.member.members.importingBilling,
    synchingBilling: state.member.members.synchingBilling,
    profile: state.app.profile,
    belts: state.member.app.belts,
    programs: state.member.app.programs,
    additionalPrograms: state.member.app.additionalPrograms,
    space: state.member.app.space,
    appSpace: state.app.space,
    memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
    membersNextPageToken: state.member.members.membersNextPageToken,
    memberLastFetchTime: state.member.members.memberLastFetchTime,
    updatingAttribute: state.member.datastore.updatingAttribute,
    updatingAttribute: state.member.datastore.updatingAttribute,
    updateSpaceAttributes: state.member.datastore.updateSpaceAttributes,
    updateSpaceAttributesLoading:
      state.member.datastore.updateSpaceAttributesLoading,
  };
};

export const mapDispatchToProps = {
  loadAppSettings: appActions.loadAppSettings,
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchMembers: actions.fetchMembers,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchBillingCustomers: actions.fetchBillingCustomers,
  setBillingCustomers: actions.setBillingCustomers,
  createBillingMembers: actions.createBillingMembers,
  syncBillingMembers: actions.syncBillingMembers,
  fetchBillingPayments: actions.fetchBillingPayments,
  createBillingStatistics: actions.createBillingStatistics,
  createStatistic: actions.createStatistic,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  updateSpaceAttribute: dataStoreActions.updateSpaceAttribute,
  fetchUpdateSpaceAttributes: dataStoreActions.fetchUpdateSpaceAttributes,
};

export const SchoolSettings = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({}),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.loadAppSettings();
    },
    UNSAFE_componentWillReceiveProps(nextProps) {},
  }),
)(SchoolSettingsComponent);

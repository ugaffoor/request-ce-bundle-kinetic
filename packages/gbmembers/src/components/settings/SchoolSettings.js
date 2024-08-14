import React, { Component } from 'react';
import $ from 'jquery';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { EditAttributeValue } from './EditAttributeValue';

const mapStateToProps = state => ({
  space: state.member.app.space,
  updatingAttribute: state.member.datastore.updatingAttribute,
});

const mapDispatchToProps = {
  updateSpaceAttribute: dataStoreActions.updateSpaceAttribute,
};

export class SchoolSettings extends Component {
  constructor(props) {
    super(props);
    this.space = this.props.space;
  }
  componentDidMount() {}
  render() {
    return (
      <span className="schoolSettingsSection">
        <span className="schoolDetails">
          <h6>School Details</h6>
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
            labelName="School Timetable URL"
            helpText="School Timetable URL, this appears in emails if configured."
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
        {getAttributeValue(this.props.space, 'Billing Company') ===
          'Bambora' && (
          <span className="membershipTaxes">
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
              helpText="Membership Tax percentage value applied for all Memberships."
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
              helpText="Membership Tax 2 percentage value applied for all Memberships."
              updateSpaceAttribute={this.props.updateSpaceAttribute}
              space={this.space}
              profile={this.props.profile}
            />
          </span>
        )}
        <span className="schoolDetails">
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
      </span>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const SchoolSettingsContainer = enhance(SchoolSettings);

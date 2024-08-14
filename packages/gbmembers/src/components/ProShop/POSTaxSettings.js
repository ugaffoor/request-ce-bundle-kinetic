import React, { Component } from 'react';
import moment from 'moment';
import $ from 'jquery';
import { KappNavLink as NavLink } from 'common';
import { I18n } from '../../../../app/src/I18nProvider';
import { actions as posActions } from '../../redux/modules/pos';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import {
  getAttributeValue,
  setAttributeValue,
} from '../../lib/react-kinops-components/src/utils';
import helpIcon from '../../images/help.svg?raw';
import SVGInline from 'react-svg-inline';
import NumberFormat from 'react-number-format';
import { EditAttributeValue } from '../settings/EditAttributeValue';

const mapStateToProps = state => ({
  space: state.member.app.space,
  updatingAttribute: state.member.datastore.updatingAttribute,
});

const mapDispatchToProps = {
  updateSpaceAttribute: dataStoreActions.updateSpaceAttribute,
};

var compThis = undefined;

export class POSTaxSettings extends Component {
  constructor(props) {
    super(props);
    compThis = this;
    this.space = this.props.space;

    this.state = {
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

  componentDidMount() {}

  render() {
    return (
      <span className="posTaxSettingsSection">
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
          helpText="Sales Tax percentage value applied for all products."
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
          helpText="Sales Tax 2 percentage value applied for all products."
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

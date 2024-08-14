import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withState, withHandlers } from 'recompose';
import { actions as posActions } from '../../redux/modules/pos';
import { actions as errorActions } from '../../redux/modules/errors';
import { actions as leadsActions } from '../../redux/modules/leads';
import moment from 'moment';
import checkoutLeftArrowIcon from '../../images/checkoutLeftArrow.png?raw';
import { StockReport } from './StockReport';
import { PurchaseItemsReportContainer } from './PurchaseItemsReport';
import { OrdersReportContainer } from './OrdersReport';
import { POSTaxSettingsContainer } from './POSTaxSettings';
import { actions } from '../../redux/modules/pos';
import { CoreForm } from 'react-kinetic-core';
import { Utils } from 'common';

const mapStateToProps = state => ({
  members: state.member.members.allMembers,
  leads: state.member.leads.allLeads,
  leadsLoading: state.member.leads.leadsLoading,
  space: state.member.app.space,
  profile: state.member.kinops.profile,
});
const mapDispatchToProps = {
  fetchLeads: leadsActions.fetchLeads,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
};

export class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {}

  render() {
    return (
      <div className="settings">
        <span className="topRow">
          <div className="name">Settings/Reports</div>
          <div
            className="continueShopping"
            onClick={e => {
              this.props.setShowSettings(false);
            }}
          >
            <img src={checkoutLeftArrowIcon} alt="Continue Shopping" />
            <span className="keepShopping">Keep Shopping</span>
          </div>
        </span>
        <span className="details">
          <div style={{ margin: '20px 0px 0px 10px' }} id="stock-report">
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!this.props.dummyFormLoaded}
                onClick={e => {
                  this.props.setShowStockReport(
                    this.props.showStockReport ? false : true,
                  );
                }}
              >
                {this.props.showStockReport
                  ? 'Hide Stock Report'
                  : 'Show Stock Report'}
              </button>
            </div>
            {!this.props.showStockReport ? null : (
              <div className="row">
                <div className="stockReport">
                  <StockReport
                    posStock={this.props.posStock}
                    posProducts={this.props.posProducts}
                    space={this.props.space}
                    profile={this.props.profile}
                  />
                </div>
              </div>
            )}
          </div>
          <div
            style={{ margin: '20px 0px 0px 10px' }}
            id="purchaseitems-report"
          >
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!this.props.dummyFormLoaded}
                onClick={e => {
                  this.props.setShowPurchaseItemsReport(
                    this.props.showPurchaseItemsReport ? false : true,
                  );
                }}
              >
                {this.props.showPurchaseItemsReport
                  ? 'Hide Purchase Items Report'
                  : 'Show Purchase Items Report'}
              </button>
            </div>
            {!this.props.showPurchaseItemsReport ? null : (
              <div className="row">
                <div className="purchaseItemsReport">
                  <PurchaseItemsReportContainer
                    posProducts={this.props.posProducts}
                  />
                </div>
              </div>
            )}
          </div>
          <div style={{ margin: '20px 0px 0px 10px' }} id="orders-report">
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!this.props.dummyFormLoaded}
                onClick={e => {
                  this.props.setShowOrdersReport(
                    this.props.showOrdersReport ? false : true,
                  );
                }}
              >
                {this.props.showOrdersReport
                  ? 'Hide Orders Report'
                  : 'Show Orders Report'}
              </button>
            </div>
            {!this.props.showOrdersReport ? null : (
              <div className="row">
                <div className="ordersReport">
                  <OrdersReportContainer
                    posOrders={this.props.posOrders}
                    members={this.props.members}
                  />
                </div>
              </div>
            )}
          </div>
          {!Utils.isMemberOf(this.props.profile, 'Role::Data Admin') ? (
            <div />
          ) : (
            <div style={{ margin: '20px 0px 0px 10px' }} id="pos-tax-settings">
              <div className="row">
                <button
                  type="button"
                  className="btn btn-primary report-btn-default"
                  disabled={!this.props.dummyFormLoaded}
                  onClick={e => {
                    this.props.setShowPOSTaxSettings(
                      this.props.showPOSTaxSettings ? false : true,
                    );
                  }}
                >
                  {this.props.showPOSTaxSettings
                    ? 'Hide POS Tax Settings'
                    : 'Show POS Tax Settings'}
                </button>
              </div>
              {!this.props.showPOSTaxSettings ? null : (
                <div className="row">
                  <div className="posTaxSettings">
                    <POSTaxSettingsContainer profile={this.props.profile} />
                  </div>
                </div>
              )}
            </div>
          )}
        </span>
        <CoreForm
          kapp="gbmembers"
          form="dummy-form"
          loaded={this.props.singleSetDummyFormLoaded(
            this.props.dummyFormLoaded,
            this.props.setDummyFormLoaded,
          )}
        />
      </div>
    );
  }
}

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('showStockReport', 'setShowStockReport', false),
  withState('showPurchaseItemsReport', 'setShowPurchaseItemsReport', false),
  withState('showOrdersReport', 'setShowOrdersReport', false),
  withState('showPOSTaxSettings', 'setShowPOSTaxSettings', false),
  withState('dummyFormLoaded', 'setDummyFormLoaded', false),
  withHandlers({
    singleSetDummyFormLoaded: () => (dummyFormLoaded, setDummyFormLoaded) => {
      if (!dummyFormLoaded) {
        setTimeout(function() {
          setDummyFormLoaded(true);
        }, 2000);
      }
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {},
  }),
);
export const SettingsContainer = enhance(Settings);

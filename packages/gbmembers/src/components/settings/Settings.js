import React from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import ReactToPrint from 'react-to-print';
import Barcode from 'react-barcode';
import 'bootstrap/scss/bootstrap.scss';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { Utils } from 'common';
import moment from 'moment';

const mapStateToProps = state => ({
  memberItem: state.member.members.currentMember,
  allMembers: state.member.members.allMembers,
  billingCompany: state.member.app.billingCompany,
  billingCustomersLoading: state.member.members.billingCustomersLoading,
  profile: state.member.app.profile,
  belts: state.member.app.belts,
  billingPayments: state.member.members.billingPayments,
  billingPaymentsLoading: state.member.members.billingPaymentsLoading,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchMembers: actions.fetchMembers,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchBillingCustomers: actions.fetchBillingCustomers,
  setBillingCustomers: actions.setBillingCustomers,
  createBillingMembers: actions.createBillingMembers,
  fetchBillingPayments: actions.fetchBillingPayments,
  createBillingStatistics: actions.createBillingStatistics,
  createStatistic: actions.createStatistic,
};

class ComponentToPrint extends React.Component {
  render() {
    return (
      <div id="memberBarcodes">
        {this.props.allMembers.map((member, index) =>
          index !== 0 && index % 65 === 0 ? (
            <div className="barCode pageBreak" key={index}>
              <Barcode
                value={member.id.split('-')[4].substring(6, 12)}
                width={1.3}
                height={36}
                text={
                  member.values['Last Name'].substring(0, 1) +
                  ' ' +
                  member.values['Last Name']
                }
                type={'CODE128'}
                font={'monospace'}
                textAlign={'center'}
                textPosition={'bottom'}
                textMargin={2}
                fontSize={8}
              />
            </div>
          ) : (
            <span className="barCode" key={index}>
              <Barcode
                value={member.id.split('-')[4].substring(6, 12)}
                width={1.3}
                height={36}
                text={
                  member.values['Last Name'].substring(0, 1) +
                  ' ' +
                  member.values['Last Name']
                }
                type={'CODE128'}
                font={'monospace'}
                textAlign={'center'}
                textPosition={'bottom'}
                textMargin={2}
                fontSize={8}
              />
            </span>
          ),
        )}
      </div>
    );
  }
}

export const SettingsView = ({
  memberItem,
  allMembers,
  billingCompany,
  fetchBillingCustomers,
  setBillingCustomers,
  createBillingMembers,
  billingCustomersLoading,
  fetchMembers,
  printMemberBarcodes,
  printingBarcodes,
  setPrintingBarcodes,
  profile,
  belts,
  billingPayments,
  billingPaymentsLoading,
  fetchBillingPayments,
  createBillingStatistics,
  createStatistic,
  addNotification,
  setSystemError,
}) => (
  <div className="settings">
    <StatusMessagesContainer />
    <div className="buttons column" style={{ marginLeft: '10px' }}>
      {!Utils.isMemberOf(profile, 'Billing') ? (
        <div />
      ) : (
        <div className="col-xs-3">
          <button
            type="button"
            id="loadBillingCustomers"
            className={'btn btn-primary'}
            onClick={e =>
              fetchBillingCustomers({
                setBillingCustomers,
                createBillingMembers,
                fetchMembers,
                allMembers,
              })
            }
          >
            Import Billing Members
          </button>
        </div>
      )}
      <div className="col-xs-3">
        {billingCustomersLoading ? (
          <p>Importing billing customers ....</p>
        ) : (
          <span />
        )}
      </div>
      <div className="col-xs-3">
        <button
          type="button"
          id="printMemberbarcodes"
          className={'btn btn-primary'}
          onClick={e =>
            printMemberBarcodes({
              allMembers,
              setPrintingBarcodes,
            })
          }
        >
          Show Member barcodes
        </button>
      </div>
      {!printingBarcodes ? (
        <div />
      ) : (
        <div id="memberBarcodesSection" className="col-xs-3">
          <ReactToPrint
            trigger={() => <button>Print Barcodes!</button>}
            content={() => this.componentRef}
            copyStyles={true}
          />
          <ComponentToPrint
            ref={el => (this.componentRef = el)}
            allMembers={allMembers}
          />
        </div>
      )}
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
              startDate = moment
                .utc()
                .subtract(4, 'months')
                .startOf('month')
                .format('YYYY-MM-DD');
              endDate = moment
                .utc()
                .subtract(2, 'months')
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
    {/*
    <div>
      {belts.map(
        belt =>
              <span>
                <p>{belt.belt}</p>
                {getBeltSVG(belt.belt)}
            </span>
      )}
    </div>
  */}
  </div>
);

export const SettingsContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ memberItem }) => {
    return {};
  }),
  withState('printingBarcodes', 'setPrintingBarcodes', false),
  withHandlers({
    printMemberBarcodes: ({ allMembers, setPrintingBarcodes }) => () => {
      console.log('Printing:' + allMembers.length);
      setPrintingBarcodes(true);
      /*
      setTimeout(function() {
        const opt = {
          scale: 1,
        };
        var iframe = null;
        if ($('#printf').length > 0) {
          iframe = $('#printf')[0];
        } else {
          iframe = document.createElement('iframe');
        }
        iframe.name = 'printf';
        iframe.id = 'printf';
        //           iframe.height = '1100px';
        //           iframe.width = '2000px';
        document.body.appendChild(iframe);

        var newWin = window.frames['printf'];
        newWin.document.write(
          '<style> ' +
            '#memberBarcodes{margin-top: 50px;margin-left:10px;display: flow-root;width: 800px;} ' +
            '.pageBreak{page-break-before: always;background-color: red;} ' +
            '.barCode {position: relative;width: 160px; flex: 30 0 auto;} ' +
            '.barCode svg{width:160px;} ' +
            '</style><body onload="window.print()">' +
            $('#memberBarcodesSection').html() +
            '</body>',
        );
        newWin.document.close();
        setPrintingBarcodes(false);
      }, 1000);
*/
    },
  }),
  lifecycle({
    componentWillMount() {
      //      this.setState({ printingBarcodes: false });
    },
    componentWillReceiveProps(nextProps) {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(SettingsView);

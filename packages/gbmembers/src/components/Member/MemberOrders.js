import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { email_sent_date_format } from '../leads/LeadsUtils';
import NumberFormat from 'react-number-format';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { ReceiptToPrint } from '../ProShop/ReceiptToPrint';
import printerIcon from '../../images/Print.svg?raw';
import ReactToPrint from 'react-to-print';
import SVGInline from 'react-svg-inline';
import { I18n } from '../../../../app/src/I18nProvider';
import { confirmWithAmount } from './ConfirmWithAmount';

export class MemberOrders extends Component {
  constructor(props) {
    super(props);
    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns(
      getAttributeValue(this.props.space, 'POS System'),
    );
    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    this.locale =
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale;
    this.refundPayment = this.refundPayment.bind(this);

    this.state = {
      data,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.memberItem) {
      this.setState({
        data: this.getData(nextProps.memberItem),
      });
    }
  }

  UNSAFE_componentWillMount() {}

  isPaymentRefunded(order, id) {
    return order['Status'] === 'Refunded'
      ? true
      : order['id'] === id
      ? true
      : false;
  }

  refundPayment(orderid, paymentId, originalAmount) {
    confirmWithAmount({
      title: 'Refund POS',
      amount: originalAmount,
      changeReason: 'Refund for Order: ' + paymentId,
      placeholder:
        'Please enter a reason for this Refund. Not entering a valid reason could cause you pain later.',
    }).then(
      ({ amount, reason }) => {
        console.log('proceed! input:' + reason);
        this.props.refundPOSPayment(
          this.props.billingThis,
          orderid,
          paymentId,
          amount,
          reason,
        );
      },
      () => {
        console.log('cancel!');
      },
    );
  }

  getColumns(posSystem) {
    return [
      {
        accessor: 'Date time processed',
        Header: 'Date',
        Cell: row => (
          <span>
            {moment(
              row.original['Date time processed'],
              'YYYY-MM-DDTHH:mm:SSZ',
            ).format('MMM Do YYYY, h:mm:ss a')}
          </span>
        ),
      },
      { accessor: 'Payment Type', Header: 'Payment Type' },
      { accessor: 'Transaction ID', Header: 'Transaction ID' },
      {
        accessor: 'Total',
        Header: 'Total',
        Cell: row => (
          <span>
            {new Intl.NumberFormat(this.locale, {
              style: 'currency',
              currency: this.currency,
            }).format(row.original['Total'])}
          </span>
        ),
      },
      {
        accessor: '$refundPayment',
        Header: 'Refunds',
        show: posSystem === 'Bambora' ? true : false,
        Cell: row =>
          !this.isPaymentRefunded(
            row.original,
            this.props.refundPOSTransactionID.id,
          ) ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                this.props.refundPOSTransactionInProgress ? true : false
              }
              onClick={e => {
                this.refundPayment(
                  row.original['id'],
                  row.original['Transaction ID'],
                  row.original['Total'],
                );
              }}
            >
              {this.props.refundPOSTransactionInProgress
                ? 'Refunding...'
                : 'Refund Payment'}
            </button>
          ) : this.isPaymentRefunded(
              row.original,
              this.props.refundPOSTransactionID.id,
            ) ? (
            <span>
              Refunded{' '}
              <span className="refund">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(
                  this.props.refundPOSTransactionID.id === row.original['id']
                    ? this.props.refundPOSTransactionID.value
                    : row.original['Refund'],
                )}
              </span>
            </span>
          ) : (
            ''
          ),
      },
    ];
  }

  getData(memberItem) {
    let orders = memberItem.posOrders;
    if (!orders) {
      return [];
    } else if (typeof orders !== 'object') {
      orders = JSON.parse(orders);
    }

    return orders.sort(function(order1, order2) {
      if (
        moment(order1['Date time processed'], 'YYYY-MM-DDTHH:mm:SSZ').isAfter(
          moment(order2['Date time processed'], 'YYYY-MM-DDTHH:mm:SSZ'),
        )
      ) {
        return -1;
      } else if (
        moment(order1['Date time processed'], 'YYYY-MM-DDTHH:mm:SSZ').isBefore(
          moment(order2['Date time processed'], 'YYYY-MM-DDTHH:mm:SSZ'),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }
  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }

  render() {
    return (
      <div className="row posOrders">
        <div className="col-sm-12">
          <span style={{ width: '100%' }}>
            <h3>Purchases</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              width={500}
              expanded={this.state.expandedRows}
              onExpandedChange={(newExpanded, index) => {
                let rows = [];
                let order = {};
                let checkout = {};
                if (newExpanded[index]) {
                  rows[index] = true;
                  order = this.state.data[index];
                  checkout = JSON.parse(
                    this.state.data[index]['POS Checkout JSON'],
                  );
                }
                this.setState({
                  expandedRows: rows,
                  checkedOutBy:
                    checkout['Checkout Items'] !== undefined
                      ? checkout['User Name']
                      : '',
                  cardNumber: order['Card Number'],
                  products:
                    checkout['Checkout Items'] !== undefined
                      ? checkout['Checkout Items']['products']
                      : [],
                  posCheckout: checkout,
                  status: order['Status'],
                  total: order['Total'],
                  refund: order['Refund'],
                  subtotal: order['SubTotal'],
                  salestax: order['Sales Tax'],
                  discount: order['Discount'],
                  auth_code: order['Auth Code'],
                  transaction_id: order['Transaction ID'],
                  space: this.props.space,
                  snippets: this.props.snippets,
                  datetime: moment(
                    order['Date time processed'],
                    'YYYY-MM-DDTHH:mm:SSZ',
                  ),
                  name: order['Person Name'],
                });
              }}
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px', textAlign: 'left' }}>
                    <div style={{ border: 'solid 1px rgba(0,0,0,0.05)' }}>
                      <div className="row">
                        <div className="col-sm-2">
                          <label>Order taken by:</label>
                        </div>
                        <div className="col-sm-2">
                          {this.state.checkedOutBy}
                        </div>
                        <div className="col-sm-2">
                          <label>Card Number:</label>
                        </div>
                        <div className="col-sm-2">{this.state.cardNumber}</div>
                        {this.state.posCheckout !== undefined && (
                          <span className="col-sm-2 orderreceipt">
                            <span style={{ display: 'none' }}>
                              <ReceiptToPrint
                                locale={this.locale}
                                currency={this.currency}
                                posCheckout={this.state.posCheckout}
                                status={this.state.status}
                                total={this.state.total}
                                refund={this.state.refund}
                                subtotal={this.state.subtotal}
                                discount={this.state.discount}
                                salestax={this.state.salestax}
                                number={this.state.cardNumber}
                                auth_code={this.state.auth_code}
                                transaction_id={this.state.transaction_id}
                                space={this.props.space}
                                snippets={this.props.snippets}
                                datetime={this.state.datetime}
                                name={this.state.name}
                                ref={el => (this.componentRef = el)}
                              />
                            </span>
                            <span className="printReceipt">
                              <ReactToPrint
                                trigger={() => (
                                  <SVGInline
                                    svg={printerIcon}
                                    className="icon barcodePrint"
                                  />
                                )}
                                content={() => this.componentRef}
                                pageStyle="@page {size: a4 portrait;margin: 0;}"
                              />
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="products">
                      {this.state.products !== undefined &&
                        this.state.products.map(product => (
                          <div className="productInfo">
                            <div className="productLine">
                              <div className="quantity">
                                {product['quantity']}
                              </div>
                              <div className="name">
                                {product['name']} {product['colour']}{' '}
                                {product['size']}
                              </div>
                              <div className="price">
                                <span className="price">
                                  {new Intl.NumberFormat(this.locale, {
                                    style: 'currency',
                                    currency: this.currency,
                                  }).format(product['price'])}
                                </span>
                              </div>
                            </div>
                            {product['productType'] === 'Package' && (
                              <div className="stockItems">
                                {product.packageStock.map(stock => (
                                  <div className="stockItem">
                                    <div className="name">
                                      {stock['name']} {stock['colour']}{' '}
                                      {stock['size']}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      <div className="productInfo">
                        {this.state.discount !== undefined &&
                          this.state.discount > 0 && (
                            <div className="productLine">
                              <div className="quantity"></div>
                              <div className="name">
                                <I18n>DISCOUNT</I18n>
                              </div>
                              <div className="price">
                                <span className="price">
                                  {new Intl.NumberFormat(this.locale, {
                                    style: 'currency',
                                    currency: this.currency,
                                  }).format(this.state.discount)}
                                </span>
                              </div>
                            </div>
                          )}
                        {this.state.salestax !== undefined &&
                          this.state.salestax > 0 && (
                            <div className="productLine">
                              <div className="quantity"></div>
                              <div className="name">
                                {getAttributeValue(
                                  this.props.space,
                                  'POS Sales Tax Label',
                                ) === undefined ? (
                                  <I18n>SALES TAX</I18n>
                                ) : (
                                  getAttributeValue(
                                    this.props.space,
                                    'POS Sales Tax Label',
                                  )
                                )}
                              </div>
                              <div className="price">
                                <span className="price">
                                  {new Intl.NumberFormat(this.locale, {
                                    style: 'currency',
                                    currency: this.currency,
                                  }).format(this.state.salestax)}
                                </span>
                              </div>
                            </div>
                          )}
                        <div className="productLine">
                          <div className="quantity"></div>
                          <div className="name">
                            <I18n>TOTAL</I18n>
                          </div>
                          <div className="price">
                            <span className="price">
                              {new Intl.NumberFormat(this.locale, {
                                style: 'currency',
                                currency: this.currency,
                              }).format(this.state.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </span>
        </div>
      </div>
    );
  }
}

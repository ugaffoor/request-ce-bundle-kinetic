import React from 'react';
import { I18n } from '../../../../app/src/I18nProvider';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import $ from 'jquery';

export class ReceiptToPrint extends React.Component {
  constructor(props) {
    super(props);

    var receiptFooter = this.props.snippets.find(function(el) {
      if (el.name === 'POS Receipt Footer') return el;
    });
    if (receiptFooter !== undefined) {
      receiptFooter = receiptFooter.value;
      var matches = receiptFooter.match(/\$\{.*?\('(.*?)'\)\}/g);
      var self = this;
      if (matches !== null) {
        matches.forEach(function(value, index) {
          console.log(value);
          var attrValue = value.split("'")[1];
          if (value.indexOf('spaceAttributes') !== -1) {
            if (
              self.props.space.attributes[value.split("'")[1]] !== undefined
            ) {
              receiptFooter = receiptFooter.replace(
                new RegExp(self.escapeRegExp('display_' + attrValue), 'g'),
                'block',
              );
              receiptFooter = receiptFooter.replace(
                new RegExp(self.escapeRegExp(value), 'g'),
                self.props.space.attributes[value.split("'")[1]][0],
              );
            } else {
              receiptFooter = receiptFooter.replace(
                new RegExp(self.escapeRegExp('display_' + attrValue), 'g'),
                'none',
              );
            }
          }
        });
      }
    } else {
      receiptFooter = undefined;
    }
    this.receiptFooter = receiptFooter;

    this.state = {
      posCheckout: this.props.posCheckout,
      status: this.props.status,
      total: this.props.total,
      refund: this.props.refund,
      subtotal: this.props.subtotal,
      salestax: this.props.salestax,
      salestax2: this.props.salestax2,
      discount: this.props.discount,
      number: '...' + this.props.number.substring(this.props.number.length - 4),
      auth_code: this.props.auth_code,
      transaction_id: this.props.transaction_id,
    };
  }
  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }
  render() {
    return (
      <span className="receiptPrint">
        <div className="header" style={{ display: 'none' }}>
          <img
            src="https://gbfms-files.s3-ap-southeast-2.amazonaws.com/GB+Name+Log.png"
            alt="GB Logo"
            className="GBLogo"
          />
        </div>
        <span className="details">
          <span className="soldTo">
            <span className="label">Sold To: </span>
            <span className="name">{this.props.name}</span>
          </span>
          {this.state.posCheckout['Checkout Items']['products'] !== undefined &&
            this.state.posCheckout['Checkout Items']['products'].filter(
              product => product['productType'] === 'Apparel',
            ).length > 0 && (
              <span className="apparel">
                <span className="products">
                  {this.state.posCheckout['Checkout Items']['products'] !==
                    undefined &&
                    this.state.posCheckout['Checkout Items']['products']
                      .filter(product => product['productType'] === 'Apparel')
                      .map((product, index) => (
                        <span
                          className="lineItem"
                          product-id={product['productID']}
                          key={index}
                        >
                          <span className="quantity">
                            {product['quantity']}
                          </span>
                          <span className="name">
                            {product['name'] +
                              ' ' +
                              product['colour'] +
                              ' ' +
                              product['size']}
                          </span>
                          <span className="price">
                            {new Intl.NumberFormat(this.props.locale, {
                              style: 'currency',
                              currency: this.props.currency,
                            }).format(product['price'])}
                          </span>
                        </span>
                      ))}
                </span>
              </span>
            )}
          {this.state.posCheckout['Checkout Items']['products'] !== undefined &&
            this.state.posCheckout['Checkout Items']['products'].filter(
              product =>
                product['productType'] === 'Service' ||
                product['productType'] === 'Concession',
            ).length > 0 && (
              <span className="services">
                <span className="products">
                  {this.state.posCheckout['Checkout Items']['products'] !==
                    undefined &&
                    this.state.posCheckout['Checkout Items']['products']
                      .filter(
                        product =>
                          product['productType'] === 'Service' ||
                          product['productType'] === 'Concession',
                      )
                      .map((product, index) => (
                        <span
                          className="lineItem"
                          product-id={product['productID']}
                          key={index}
                        >
                          <span className="quantity">
                            {product['quantity']}
                          </span>
                          <span className="name">{product['name']}</span>
                          <span className="price">
                            {new Intl.NumberFormat(this.props.locale, {
                              style: 'currency',
                              currency: this.props.currency,
                            }).format(product['price'])}
                          </span>
                        </span>
                      ))}
                </span>
              </span>
            )}
          {this.state.posCheckout['Checkout Items']['products'] !== undefined &&
            this.state.posCheckout['Checkout Items']['products'].filter(
              product => product['productType'] === 'Package',
            ).length > 0 && (
              <span className="packages">
                <span className="products">
                  {this.state.posCheckout['Checkout Items']['products'] !==
                    undefined &&
                    this.state.posCheckout['Checkout Items']['products']
                      .filter(product => product['productType'] === 'Package')
                      .map((product, index) => (
                        <span className="packageInfo" key={index}>
                          <span
                            className="lineItem"
                            product-id={product['productID']}
                          >
                            <span className="quantity">
                              {product['quantity']}
                            </span>
                            <span className="name">{product['name']}</span>
                            <span className="price">
                              {new Intl.NumberFormat(this.props.locale, {
                                style: 'currency',
                                currency: this.props.currency,
                              }).format(product['price'])}
                            </span>
                          </span>
                          <div className="stockItems">
                            {product.packageStock.map((stock, index) => (
                              <div className="stockItem" key={index}>
                                <div className="name">{stock['name']}</div>
                                <div className="colour">{stock['colour']}</div>
                                <div className="size">{stock['size']}</div>
                              </div>
                            ))}
                          </div>
                        </span>
                      ))}
                </span>
              </span>
            )}
        </span>
        <span className="subtotal">
          <span className="label">
            <I18n>SUBTOTAL</I18n>
          </span>
          <span className="value">
            {new Intl.NumberFormat(this.props.locale, {
              style: 'currency',
              currency: this.props.currency,
            }).format(this.state.subtotal)}
          </span>
        </span>
        {this.state.posCheckout['Checkout Items']['discountType'] ===
        undefined ? (
          <span />
        ) : (
          <span className="discountLine">
            <span className="label">Discount |</span>
            <i className="percentageValue">
              <span className="type">
                {this.state.posCheckout['Checkout Items']['discountName']}
              </span>
            </i>
            <span className="value">
              {new Intl.NumberFormat(this.props.locale, {
                style: 'currency',
                currency: this.props.currency,
              }).format(this.state.discount)}
            </span>
          </span>
        )}
        {this.state.salestax === 0 ||
        this.state.salestax === '0' ||
        this.state.salestax === undefined ? (
          <div />
        ) : (
          <span className="salestax">
            <div className="label">
              {(this.state.salestax2 === undefined ||
                this.state.salestax2 === '0') &&
              getAttributeValue(this.props.space, 'POS Sales Tax Label') ===
                undefined ? (
                <I18n>SALES TAX</I18n>
              ) : (
                getAttributeValue(this.props.space, 'POS Sales Tax Label')
              )}
            </div>
            <div className="value">
              {new Intl.NumberFormat(this.props.locale, {
                style: 'currency',
                currency: this.props.currency,
              }).format(this.state.salestax)}
            </div>
          </span>
        )}
        {this.state.salestax2 === 0 ||
        this.state.salestax2 === '0' ||
        this.state.salestax2 === undefined ? (
          <div />
        ) : (
          <span className="salestax">
            <div className="label">
              {getAttributeValue(this.props.space, 'POS Sales Tax Label 2') ===
              undefined ? (
                <I18n>SALES TAX 2</I18n>
              ) : (
                getAttributeValue(this.props.space, 'POS Sales Tax Label 2')
              )}
            </div>
            <div className="value">
              {new Intl.NumberFormat(this.props.locale, {
                style: 'currency',
                currency: this.props.currency,
              }).format(this.state.salestax2)}
            </div>
          </span>
        )}
        <span className="total">
          <span className="label">
            {getAttributeValue(this.props.space, 'POS Sales Total Label') ===
            undefined ? (
              <I18n>TOTAL</I18n>
            ) : (
              getAttributeValue(this.props.space, 'POS Sales Total Label')
            )}
          </span>
          <span className="value">
            {new Intl.NumberFormat(this.props.locale, {
              style: 'currency',
              currency: this.props.currency,
            }).format(this.state.total)}
          </span>
        </span>
        {this.state.status === 'Refunded' && (
          <span className="refund">
            <span className="label">
              <I18n>REFUND</I18n>
            </span>
            <span className="value">
              {new Intl.NumberFormat(this.props.locale, {
                style: 'currency',
                currency: this.props.currency,
              }).format(this.state.refund)}
            </span>
          </span>
        )}
        <span className="transDetails">
          <span className="auth_code">
            <span className="label">Card Number:</span>
            <span className="value">{this.state.number}</span>
          </span>
          <span className="transaction_id">
            <span className="label">Transaction Id:</span>
            <span className="value">{this.state.transaction_id}</span>
          </span>
        </span>
        <span className="datetime">
          {this.props.datetime.format('Do MMM YYYY h:mmA')}
        </span>
        <div
          className="footer"
          style={{ display: 'none' }}
          dangerouslySetInnerHTML={{ __html: this.receiptFooter }}
        />
      </span>
    );
  }
}

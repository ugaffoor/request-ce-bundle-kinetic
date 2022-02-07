import React, { Component } from 'react';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';
import { getCurrency } from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import ReactToPrint from 'react-to-print';
import SVGInline from 'react-svg-inline';
import printerIcon from '../../images/Print.svg?raw';

export class StockReport extends Component {
  constructor(props) {
    super(props);
    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }

    this.locale =
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale;

    this.getColumns = this.getColumns.bind(this);
    let data = this.getData(this.props.posStock);
    var total = 0;
    this.props.posStock.forEach((stock, i) => {
      var idx = this.props.posProducts.findIndex(
        prod => prod['id'] === stock.values['Product ID'],
      );
      if (idx !== -1) {
        total +=
          Number.parseFloat(stock.values['Quantity']) *
          Number.parseFloat(this.props.posProducts[idx].values['Price']);
      }
    });

    data.forEach((stock, i) => {
      var idx = this.props.posProducts.findIndex(
        prod => prod['id'] === stock.productid,
      );
      if (idx !== -1) {
        stock['price'] = Number.parseFloat(
          this.props.posProducts[idx].values['Price'],
        );
      }
    });

    let columns = this.getColumns(total);
    this.state = {
      data,
      columns,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}

  UNSAFE_componentWillMount() {}

  getData(posStock) {
    if (!posStock || posStock.length <= 0) {
      return [];
    }

    const data = posStock
      .filter(stock => stock.values['Quantity'] !== '0')
      .sort((a, b) => {
        if (a.values['Product Name'] < b.values['Product Name']) {
          return -1;
        } else if (a.values['Product Name'] > b.values['Product Name']) {
          return 1;
        }
        return 0;
      })
      .sort((a, b) => {
        if (a.values['Colour'] < b.values['Colour']) {
          return -1;
        } else if (a.values['Colour'] > b.values['Colour']) {
          return 1;
        }
        return 0;
      })
      .sort((a, b) => {
        if (a.values['SKU'] < b.values['SKU']) {
          return -1;
        } else if (a.values['SKU'] > b.values['SKU']) {
          return 1;
        }
        return 0;
      })
      .map(stock => {
        return {
          productid: stock.values['Product ID'],
          name: stock.values['Product Name'],
          sku: stock.values['SKU'],
          size: stock.values['Size'],
          colour: stock.values['Colour'],
          quantity: stock.values['Quantity'],
        };
      });
    return data;
  }
  getColourLabel() {
    return K.translate('Colour');
  }
  getColumns(total) {
    const columns = [
      {
        accessor: 'name',
        Header: 'Name',
        width: 300,
        Footer: (
          <span>
            <strong>Total Retail: </strong>
            {new Intl.NumberFormat(this.locale, {
              style: 'currency',
              currency: this.currency,
            }).format(total)}
          </span>
        ),
      },
      {
        accessor: 'sku',
        Header: 'SKU',
        width: 100,
      },
      {
        accessor: 'size',
        Header: 'Size',
        width: 100,
      },
      {
        accessor: 'colour',
        Header: this.getColourLabel(),
        width: 100,
      },
      {
        accessor: 'quantity',
        Header: 'Quantity',
        width: 100,
        sortMethod: (a, b, desc) => {
          a = Number(a);
          b = Number(b);
          if (a > b) {
            return 1;
          }
          if (a < b) {
            return -1;
          }
          return 0;
        },
      },
      {
        accessor: 'price',
        Header: 'Unit Price',
        width: 100,
        Cell: props => {
          return new Intl.NumberFormat(this.locale, {
            style: 'currency',
            currency: this.currency,
          }).format(props.original.price);
        },
      },
      {
        accessor: 'price',
        Header: 'Total',
        width: 100,
        Cell: props => {
          return new Intl.NumberFormat(this.locale, {
            style: 'currency',
            currency: this.currency,
          }).format(props.original.price * props.original.quantity);
        },
      },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return (
      <span>
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        ></div>
        <ReactToPrint
          trigger={() => (
            <SVGInline svg={printerIcon} className="icon tablePrint" />
          )}
          content={() => this.tableComponentRef}
        />
        <ReactTable
          ref={el => (this.tableComponentRef = el)}
          columns={columns}
          data={data}
          className="-striped -highlight"
          defaultPageSize={data.length > 0 ? data.length : 2}
          pageSize={data.length > 0 ? data.length : 2}
          showPagination={false}
        />
        <br />
      </span>
    );
  }
}

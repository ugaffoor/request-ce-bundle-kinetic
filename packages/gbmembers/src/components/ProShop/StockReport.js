import React, { Component } from 'react';
import ReactTable from 'react-table';
import { getCurrency } from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import ReactToPrint from 'react-to-print';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';
import { ReactComponent as DownloadIcon } from '../../images/download.svg';
import { CSVLink } from 'react-csv';

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
    let data = this.getData(this.props.posStock, true);
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
    this.tableComponentRef = React.createRef();

    let columns = this.getColumns(total);
    this.state = {
      data,
      columns,
      stockViewMode: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}

  UNSAFE_componentWillMount() {}

  getData(posStock, onlyStocked) {
    if (!posStock || posStock.length <= 0) {
      return [];
    }

    var data = posStock;
    if (onlyStocked) {
      data = posStock.filter(stock => stock.values['Quantity'] !== '0');
    } else {
      data = posStock.filter(stock => stock.values['Quantity'] === '0');
    }

    data = data
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

  getDownloadData() {
    let data = this.state.data;

    let header = [];
    header.push('Name');
    header.push('Sku');
    header.push('Size');
    header.push('Colour');
    header.push('Quantity');
    header.push('Unit Price');
    header.push('Total');

    let download = [];
    download.push(header.flatten());

    data.forEach(element => {
      let row = [];
      row.push(element['name']);
      row.push(element['sku']);
      row.push(element['size']);
      row.push(element['colour']);
      row.push(element['quantity']);
      row.push(
        element['price'] !== undefined
          ? parseFloat(element['price']).toFixed(2)
          : '',
      );
      row.push(
        element['price'] !== undefined
          ? parseFloat(element['quantity'] * element['price']).toFixed(2)
          : '',
      );
      download.push(row.flatten());
    });

    return download;
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
          return props.original.price !== undefined
            ? new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.price)
            : '';
        },
      },
      {
        accessor: 'price',
        Header: 'Total',
        width: 100,
        Cell: props => {
          return props.original.price !== undefined
            ? new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.price * props.original.quantity)
            : '';
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
        >
          <div className="reportIcons">
            <ReactToPrint
              trigger={() => (
                <PrinterIcon className="icon icon-svg tablePrint" />
              )}
              content={() => this.tableComponentRef.current}
              onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
            />
            <CSVLink
              className="downloadbtn"
              filename="stock.csv"
              data={this.getDownloadData()}
            >
              <DownloadIcon className="icon icon-svg tableDownload" />
            </CSVLink>
          </div>
          <div className="showStockView">
            <label htmlFor="stockViewMode">Show Empty Stock</label>
            <div className="checkboxFilter">
              <input
                id="stockViewMode"
                type="checkbox"
                value="0"
                onChange={e => {
                  var newMode = !this.state.stockViewMode;
                  var data = this.getData(this.props.posStock, !newMode);
                  var total = 0;
                  data.forEach((stock, i) => {
                    var idx = this.props.posProducts.findIndex(
                      prod => prod['id'] === stock.productid,
                    );
                    if (idx !== -1) {
                      total +=
                        Number.parseFloat(stock.quantity) *
                        Number.parseFloat(
                          this.props.posProducts[idx].values['Price'],
                        );
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

                  this.setState({
                    stockViewMode: newMode,
                    data: data,
                    columns: columns,
                    total: total,
                  });
                }}
              />
              <label htmlFor="stockViewMode" />
            </div>
            {}
          </div>
        </div>
        <ReactTable
          ref={this.tableComponentRef}
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

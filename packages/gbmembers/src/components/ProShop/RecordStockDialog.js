import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import $ from 'jquery';
import { CoreForm } from 'react-kinetic-core';
import ReactSpinner from 'react16-spinjs';
import BarcodeReader from 'react-barcode-reader';
import barcodeIcon from '../../images/barcode.svg?raw';
import SVGInline from 'react-svg-inline';
import NumericInput from 'react-numeric-input';
import ScaleLoader from 'react-spinners/ScaleLoader';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};
var dialogThis = null;
export class RecordStockDialog extends Component {
  handleClick = () => {
    //    this.setState({ isShowingModal: false });
    //    this.props.setShowAttendanceDialog(false);
  };
  handleClose = () => {
    //    this.setState({ isShowingModal: false });
    this.props.setShowRecordStockDialog(false);
  };
  constructor(props) {
    super(props);
    this.handleScan = this.handleScan.bind(this);
    dialogThis = this;

    this.state = {
      loadingForm: true,
      values: {
        Status: 'Active',
        'Product Type': this.props.productType,
      },
      productCodeValue: '',
      productNameValue: '',
      editStockSwitch: false,
      posStockSaving: this.props.posStockSaving,
    };
  }
  handleScan(data) {
    console.log('Scanned ClassName00:' + data);
    console.log('Scanned ClassName11:' + this.state.className);
  }
  handleError(data) {
    console.log('Scanned Error:' + data);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.posStockSaving !== this.state.posStockSaving) {
      this.setState({
        posStockSaving: nextProps.posStockSaving,
      });
      if (!nextProps.posStockSaving) {
        Object.keys(this.state).map(key => {
          if (key.indexOf('qty') !== -1) {
            console.log('key:' + key);
            this.setState({
              [key]: 0,
            });
          }
          if (key.indexOf('sizeSelected') !== -1) {
            console.log('key:' + key);
            this.setState({
              [key]: undefined,
            });
          }
          return true;
        });
      }
      $('.sizeElement input').prop('checked', false);
    }
  }
  componentWillMount() {}
  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="recordStockDialog"
            onClose={this.handleClose}
            style={inlineStyle}
          >
            <span className="productStock">
              <div className="filterInfo">
                {/*                <SVGInline svg={barcodeIcon} className="barcodeIcon" /> */}
                <input
                  type="text"
                  value={this.state.productCodeValue}
                  className="searchValue"
                  placeholder="Search by Code..."
                  onChange={e => {
                    this.setState({
                      productCodeValue: e.target.value,
                    });
                  }}
                />
                <input
                  type="text"
                  value={this.state.productNameValue}
                  className="searchValue"
                  placeholder="Search by Name..."
                  onChange={e => {
                    this.setState({
                      productNameValue: e.target.value,
                    });
                  }}
                />
                <div className="editStockView">
                  <label htmlFor="editStockMode">Edit Stock</label>
                  <div className="checkboxFilter">
                    <input
                      id="editStockMode"
                      type="checkbox"
                      value="1"
                      onChange={e => {
                        Object.keys(this.state).map(key => {
                          if (key.indexOf('qty') !== -1) {
                            console.log('key:' + key);
                            this.setState({
                              [key]: 0,
                            });
                          }
                          if (key.indexOf('sizeSelected') !== -1) {
                            console.log('key:' + key);
                            this.setState({
                              [key]: '',
                            });
                          }
                          return true;
                        });
                        $('.sizeElement input').prop('checked', false);
                        this.setState({
                          editStockSwitch: !this.state.editStockSwitch,
                        });
                      }}
                    />
                    <label htmlFor="editStockMode"></label>
                  </div>
                  {}
                </div>
              </div>
              {this.props.products &&
                this.props.products
                  .filter(product => {
                    if (
                      product.values['Status'] === 'Active' &&
                      product.values['Product Type'] === 'Apparel' &&
                      product.values['SKU'] !== null &&
                      ((this.state.productCodeValue !== '' &&
                        product.values['SKU']
                          .toLowerCase()
                          .indexOf(
                            this.state.productCodeValue.toLowerCase(),
                          ) !== -1) ||
                        (this.state.productNameValue !== '' &&
                          product.values['Name']
                            .toLowerCase()
                            .indexOf(
                              this.state.productNameValue.toLowerCase(),
                            ) !== -1))
                    ) {
                      return true;
                    }
                    return false;
                  })
                  .sort((a, b) => {
                    if (
                      b.values['Display Order'] === undefined ||
                      a.values['Display Order'] < b.values['Display Order']
                    ) {
                      return -1;
                    }
                    if (
                      a.values['Display Order'] === undefined ||
                      a.values['Display Order'] > b.values['Display Order']
                    ) {
                      return 1;
                    }

                    return 0;
                  })
                  .map((product, index) => {
                    return (
                      <div
                        className={
                          index % 2 === 0
                            ? 'productInfo even'
                            : 'productInfo odd'
                        }
                        key={index}
                      >
                        <div
                          className="productImage"
                          style={{
                            backgroundImage: `url(${product.values['Image URL']})`,
                          }}
                        ></div>
                        <div className="details">
                          <div className="item">
                            <div className="label">Code:</div>
                            <div className="SKU">{product.values['SKU']}</div>
                          </div>
                          <div className="item">
                            <div className="label">Name:</div>
                            <div className="name">{product.values['Name']}</div>
                          </div>
                          <div className="item">
                            <div className="label">Colour:</div>
                            <div className="colour">
                              {product.values['Colour']}
                            </div>
                          </div>
                        </div>
                        <div className="sizes">
                          {product.values['Sizes'].map((size, i) => {
                            return (
                              <div className="sizeElement" key={i}>
                                <input
                                  id={'var' + i + '-' + product['id']}
                                  type="radio"
                                  className="var-1"
                                  name={'option' + product['id']}
                                  value={size}
                                  data-id={product['id']}
                                  data-length="false"
                                />
                                <label
                                  htmlFor={'var' + i + '-' + product['id']}
                                  onClick={e => {
                                    var id = $(e.target)
                                      .siblings('input')
                                      .attr('id');
                                    id = id.substring(id.indexOf('-') + 1);
                                    var value = $(e.target)
                                      .siblings('input')
                                      .val();
                                    if (this.state.editStockSwitch) {
                                      var qty =
                                        product.stock.filter(
                                          stock =>
                                            stock.values['Size'] === size,
                                        ).length > 0
                                          ? product.stock.filter(
                                              stock =>
                                                stock.values['Size'] === size,
                                            )[0].values['Quantity']
                                          : 0;
                                      this.setState({
                                        ['sizeSelected' + id]: value,
                                        ['qty' + id]: qty,
                                      });
                                    } else {
                                      this.setState({
                                        ['sizeSelected' + id]: value,
                                        ['qty' + id]: 0,
                                      });
                                    }
                                  }}
                                >
                                  {this.state.editStockSwitch
                                    ? size +
                                      '-' +
                                      (product.stock.filter(
                                        stock => stock.values['Size'] === size,
                                      ).length > 0
                                        ? product.stock.filter(
                                            stock =>
                                              stock.values['Size'] === size,
                                          )[0].values['Quantity']
                                        : 0)
                                    : size}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        <div className="addQuantity">
                          <div className="quantity">
                            <span>Quantity</span>
                            <NumericInput
                              id={'qty-' + product.id}
                              className="form-control"
                              min={0}
                              max={1000}
                              step={1}
                              precision={0}
                              size={2}
                              mobile
                              value={this.state['qty' + product.id]}
                              onChange={value => {
                                console.log('onChange:' + value);
                                // event is a global var that is not know to editor
                                if (
                                  event !== undefined &&
                                  $(event.target)
                                    .parent()
                                    .children('input').length > 0
                                ) {
                                  var id = $(event.target)
                                    .parent()
                                    .children('input')
                                    .attr('id');
                                  id = id.substring(id.indexOf('-') + 1);

                                  dialogThis.setState({
                                    ['qty' + id]: parseInt(value),
                                  });
                                }
                              }}
                            />
                          </div>
                          {this.state.editStockSwitch ? (
                            <div className="editStock">
                              {this.state.posStockSaving ? (
                                <ScaleLoader
                                  className="processing"
                                  height="35"
                                  width="16"
                                  radius="2"
                                  margin="4"
                                  color="#b6b1b1"
                                />
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary editStockBtn"
                                  onClick={e => {
                                    this.props.savePOSStock({
                                      products: this.props.products,
                                      product: product,
                                      size: this.state[
                                        'sizeSelected' + product.id
                                      ],
                                      quantity: this.state['qty' + product.id],
                                    });
                                  }}
                                  disabled={
                                    this.state['sizeSelected' + product.id] ===
                                      undefined ||
                                    this.state['qty' + product.id] === undefined
                                  }
                                >
                                  Update Stock
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="addStock">
                              {this.state.posStockSaving ? (
                                <ScaleLoader
                                  className="processing"
                                  height="35"
                                  width="16"
                                  radius="2"
                                  margin="4"
                                  color="#b6b1b1"
                                />
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary addStockBtn"
                                  onClick={e => {
                                    this.props.savePOSStock({
                                      products: this.props.products,
                                      product: product,
                                      size: this.state[
                                        'sizeSelected' + product.id
                                      ],
                                      quantity: this.state['qty' + product.id],
                                      addStock: true,
                                    });
                                  }}
                                  disabled={
                                    this.state['sizeSelected' + product.id] ===
                                      undefined ||
                                    this.state['qty' + product.id] ===
                                      undefined ||
                                    this.state['qty' + product.id] === 0
                                  }
                                >
                                  Add Stock
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
            </span>
            <BarcodeReader
              onError={this.handleError}
              onScan={this.handleScan}
            />
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
const inlineStyle = {
  width: '1000px',
  top: '10%',
  left: '20%',
};

export const RecordStockDialogContainer = enhance(RecordStockDialog);

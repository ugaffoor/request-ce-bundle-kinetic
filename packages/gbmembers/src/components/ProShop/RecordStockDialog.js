import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import $ from 'jquery';
import BarcodeReader from 'react-barcode-reader';
import { ReactComponent as BarcodeIcon } from '../../images/barcode.svg';
import NumericInput from 'react-numeric-input';
import ScaleLoader from 'react-spinners/ScaleLoader';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};
var dialogThis = null;
export class RecordStockDialog extends Component {
  handleClose = e => {
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
      scanned: false,
      editStockSwitch: false,
      posStockSaving: this.props.posStockSaving,
    };
  }
  handleScan(data) {
    this.setState({
      scanned: false,
      scannedSKU: '',
      productCodeValue: '',
      productNameValue: '',
    });

    var sizeVal = '';
    var skuValue = '';
    var idx = -1;

    const matchingBarcodes = this.props.posBarcodes.filter(
      item => item.values['Barcode'] === data,
    );

    if (matchingBarcodes.length > 0) {
      const getVersion = name => {
        const m = /\bV(\d+)\b/i.exec(name || '');
        return m ? parseInt(m[1], 10) : 0;
      };

      // If only one barcode matches, use it directly
      // Otherwise pick the record with the highest version from its Product Name
      const bestBarcode =
        matchingBarcodes.length === 1
          ? matchingBarcodes[0]
          : matchingBarcodes.reduce(
              (best, item) =>
                getVersion(item.values['Product Name'] || '') >
                getVersion((best && best.values['Product Name']) || '')
                  ? item
                  : best,
              matchingBarcodes[0],
            );

      skuValue = bestBarcode.values['SKU'];
      const barcodeProductName = bestBarcode.values['Product Name'] || '';

      // Prefer name match so the correct version is always selected.
      // barcodeProductName may be "Product Name - Colour", so try both forms.
      const nameMatchIdx = this.props.products.findIndex(p => {
        const name = (p.values['Name'] || '').toLowerCase();
        const colour = (p.values['Colour'] || '').toLowerCase();
        const target = barcodeProductName.toLowerCase();
        return name === target || (colour && name + ' - ' + colour === target);
      });

      if (nameMatchIdx !== -1) {
        idx = nameMatchIdx;
        const product = this.props.products[nameMatchIdx];
        const productSku =
          product.values['SKU'] !== null ? product.values['SKU'].trim() : '';
        product.values['Sizes'].forEach(size => {
          if (
            productSku + size === skuValue ||
            productSku.substr(0, productSku.length - 1) + size === skuValue ||
            (size === 'ALL' && productSku === skuValue)
          ) {
            sizeVal = size;
          }
        });
        if (!sizeVal && product.values['Sizes'].length > 0) {
          sizeVal = product.values['Sizes'][0];
        }
      } else {
        // Fallback: SKU matching with version preference from product Name
        let bestVersion = -1;
        this.props.products.forEach((product, i) => {
          const sizes = product.values['Sizes'];
          const productSku =
            product.values['SKU'] !== null ? product.values['SKU'].trim() : '';
          sizes.forEach(size => {
            if (
              productSku + size === skuValue ||
              productSku.substr(0, productSku.length - 1) + size === skuValue ||
              (size === 'ALL' && productSku === skuValue)
            ) {
              const version = getVersion(product.values['Name']);
              if (version > bestVersion) {
                bestVersion = version;
                idx = i;
                sizeVal = size;
              }
            }
          });
        });
      }
      if (idx !== -1) {
        console.log('SKU Found:' + skuValue);
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
        $('.sizeElement input').prop('checked', false);

        this.setState({
          scanned: true,
          productCodeValue: skuValue,
          ['sizeSelected' + this.props.products[idx]['id']]: sizeVal,
          productScanned: this.props.products[idx]['id'] + sizeVal,
          productNameValue: this.props.products[idx]['values']['Name'],
        });
      } else {
        this.setState({
          scanned: true,
          scannedSKU: skuValue,
          productCodeValue: '',
          productNameValue: '',
        });

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
    }
  }
  handleError(data) {
    console.log('Scanned Error:' + data);
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
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
  UNSAFE_componentWillMount() {}
  onChange = e => {
    this.setState({
      [e.target.name]: e.target.value,
      isShowingModal: this.props.isShowingModal,
    });
  };

  render() {
    return (
      <ModalContainer zIndex={1030}>
        <ModalDialog
          className="recordStockDialog"
          onClose={this.handleClose}
          dismissOnBackgroundClick={false}
          style={inlineStyle}
        >
          <span className="productStock">
            <div className="filterInfo">
              {<BarcodeIcon className="barcodeIcon icon-svg" />}
              {/*<input
                  type="text"
                  value={this.state.productCodeValue}
                  className="searchValue"
                  placeholder="Search by Code..."
                  onChange={e => {
                    this.handleScan(e.target.value);
                  }}
                />*/}
              <input
                type="text"
                value={this.state.productNameValue}
                className="searchValue"
                placeholder="Search by Name..."
                onChange={e => {
                  this.setState({
                    productNameValue: e.target.value,
                    scanned: false,
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
                  <label htmlFor="editStockMode" />
                </div>
                {}
              </div>
            </div>
            {this.state.scanned &&
              this.state.productCodeValue === '' && (
                <div className="noProductFound">
                  No product found with SKU and Size: {this.state.scannedSKU}
                </div>
              )}
            {this.props.products &&
              this.props.products
                .filter(product => {
                  if (
                    product.values['Status'] === 'Active' &&
                    (product.values['Product Type'] === 'Apparel' ||
                      product.values['Product Type'] === 'Concession') &&
                    product.values['SKU'] !== undefined &&
                    product.values['Name'] !== undefined &&
                    /* product.values['Colour'] !== undefined && */
                    ((this.state.productNameValue !== '' &&
                      product.values['SKU'] !== null &&
                      product.values['SKU'] !== undefined &&
                      product.values['SKU']
                        .toLowerCase()
                        .indexOf(
                          this.state.productNameValue.trim().toLowerCase(),
                        ) !== -1) ||
                      (this.state.productNameValue !== '' &&
                        product.values['Name']
                          .toLowerCase()
                          .indexOf(
                            this.state.productNameValue.toLowerCase(),
                          ) !== -1) ||
                      (this.state.productNameValue !== '' &&
                        product.values['Colour'] !== null &&
                        product.values['Colour'] !== undefined &&
                        product.values['Colour']
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
                        index % 2 === 0 ? 'productInfo even' : 'productInfo odd'
                      }
                      key={index}
                    >
                      <div
                        className="productImage"
                        style={{
                          backgroundImage: `url(${
                            product.values['Image URL']
                          })`,
                        }}
                      />
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
                                defaultChecked={
                                  this.state.productScanned ===
                                  product['id'] + size
                                }
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
                                        stock => stock.values['Size'] === size,
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
                            onChange={(value, inputValue, input) => {
                              console.log('onChange:' + value);
                              // event is a global var that is not know to editor
                              var id = $(input).attr('id');
                              id = id.substring(id.indexOf('-') + 1);
                              console.log('onChange event with id:' + id);

                              dialogThis.setState({
                                ['qty' + id]: parseInt(value),
                              });
                            }}
                          />
                        </div>
                        {this.state.editStockSwitch ? (
                          <div className="editStock">
                            {this.state.posStockSaving ? (
                              <ScaleLoader
                                className="processing"
                                height="35px"
                                width="16px"
                                radius="2px"
                                margin="4px"
                                color="#b6b1b1"
                              />
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary editStockBtn"
                                onClick={e => {
                                  this.props.savePOSStock({
                                    posStock: this.props.posStock,
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
                                height="35px"
                                width="16px"
                                radius="2px"
                                margin="4px"
                                color="#b6b1b1"
                              />
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary addStockBtn"
                                onClick={e => {
                                  this.props.savePOSStock({
                                    posStock: this.props.posStock,
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
          <BarcodeReader onError={this.handleScan} onScan={this.handleScan} />
        </ModalDialog>
      </ModalContainer>
    );
  }
}

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
);
const inlineStyle = {
  width: '1000px',
  top: '10%',
  left: '20%',
};

export const RecordStockDialogContainer = enhance(RecordStockDialog);

import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import $ from 'jquery';
import NumericInput from 'react-numeric-input';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};

export class AddProductToCheckoutDialog extends Component {
  handleClick = () => {
    //    this.setState({ isShowingModal: false });
    //    this.props.setShowAttendanceDialog(false);
  };
  handleClose = () => {
    //    this.setState({ isShowingModal: false });
    this.props.setShowAddProductToCheckoutDialog(false);
  };
  constructor(props) {
    super(props);
    this.enableSizeSelect = this.enableSizeSelect.bind(this);

    this.state = {
      maxQuantity:
        this.props.product.values['Product Type'] === 'Apparel' ? 0 : 100,
      quantity: 0,
      style: this.props.product.values['SKU'],
      size: undefined,
      packagedProducts: [],
      packagedProductSizes: [],
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {}
  getProductQuantity(product, size) {
    var qty = 0;
    product.stock.forEach((stock, i) => {
      if (stock.values['Size'] === size)
        return (qty = stock.values['Quantity']);
    });

    return parseInt(qty);
  }
  getProductStyle(product, size) {
    var style = product.values['SKU'];
    product.stock.forEach((stock, i) => {
      if (stock.values['Size'] === size) return (style = stock.values['SKU']);
    });

    return style + size;
  }
  getStockSelected(product, size, packagedProductSizes) {
    var stockItem = undefined;
    if (product.values['Product Type'] === 'Package') {
      var selectedProducts = product.packageStock.filter(stock => {
        var idx = packagedProductSizes.findIndex((prodSize, i) => {
          var id = prodSize.split('_')[0];
          return id === stock.id;
        });
        return idx !== -1;
      });

      stockItem = [];
      selectedProducts.forEach(product => {
        var idx = packagedProductSizes.findIndex((prodSize, i) => {
          var id = prodSize.split('_')[0];
          return id === product.id;
        });
        var sizeVal = packagedProductSizes[idx].split('_')[1];
        var stockIdx = product.stock.findIndex((stock, i) => {
          return stock.values['Size'] === sizeVal;
        });

        stockItem[stockItem.length] = product.stock[stockIdx];
      });
    } else {
      product.stock.forEach((stock, i) => {
        if (stock.values['Size'] === size) return (stockItem = stock);
      });
    }
    return stockItem;
  }
  enableSizeSelect(checked, productID) {
    if (checked) {
      $('#' + productID + 'sizes').removeAttr('disabled');
    } else {
      $('#' + productID + 'sizes').attr('disabled', 'disabled');
    }
  }
  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="addProductToCheckoutDialog"
            onClose={this.handleClose}
            style={inlineStyle}
          >
            <span
              className={'product ' + this.props.product.values['Product Type']}
            >
              {this.props.product.values['Product Type'] !== 'Package' && (
                <div
                  className="productImage"
                  style={{
                    backgroundImage: `url(${this.props.product.values['Image URL']})`,
                  }}
                />
              )}
              <div className="details">
                <div className="name">{this.props.product.values['Name']}</div>
                {this.props.product.values['Product Type'] !== 'Package' && (
                  <div className="style">
                    {this.props.product.values['Type'] === 'Apparel'
                      ? 'STYLE '
                      : ''}
                    ID:{this.state.style}
                  </div>
                )}
                {this.props.product.values['Details'] !== null && (
                  <div
                    className="info"
                    dangerouslySetInnerHTML={{
                      __html: this.props.product.values['Details'].replace(
                        /(?:\r\n|\r|\n)/g,
                        '<br>',
                      ),
                    }}
                  />
                )}
                <div className="prices">
                  {this.props.product.values['Display Type'] === 'Sale' ? (
                    <div className="sale">
                      <s className="fullPrice">
                        {new Intl.NumberFormat(this.props.locale, {
                          style: 'currency',
                          currency: this.props.currency,
                        }).format(this.props.product.values['Price'])}
                      </s>
                      <span className="discount">
                        {new Intl.NumberFormat(this.props.locale, {
                          style: 'currency',
                          currency: this.props.currency,
                        }).format(this.props.product.values['Discount'])}
                      </span>{' '}
                      SALE
                    </div>
                  ) : (
                    <span className="fullPrice">
                      {new Intl.NumberFormat(this.props.locale, {
                        style: 'currency',
                        currency: this.props.currency,
                      }).format(this.props.product.values['Price'])}
                    </span>
                  )}
                </div>
                {this.props.product.values['Product Type'] === 'Apparel' ? (
                  <div className="sizes">
                    {this.props.product.values['Sizes'].map((size, i) => {
                      return (
                        <div
                          className={
                            this.getProductQuantity(
                              this.props.product,
                              size,
                            ) === 0
                              ? 'sizeElement soldout'
                              : 'sizeElement'
                          }
                          key={i}
                        >
                          <input
                            id={'var' + i + '-' + this.props.product['id']}
                            type="radio"
                            className="var-1"
                            name="option1"
                            value="XS"
                            data-id={this.props.product['id']}
                            data-quantity={this.getProductQuantity(
                              this.props.product,
                              size,
                            )}
                            data-length="false"
                          />
                          <label
                            htmlFor={'var' + i + '-' + this.props.product['id']}
                            disabled={
                              this.getProductQuantity(
                                this.props.product,
                                size,
                              ) === 0
                            }
                            onClick={e => {
                              var qty = parseInt(
                                $(e.target)
                                  .siblings('input')
                                  .attr('data-quantity'),
                              );
                              var style = this.getProductStyle(
                                this.props.product,
                                size,
                              );
                              this.setState({
                                maxQuantity: qty,
                                quantity: 0,
                                style: style,
                                size: size,
                              });
                            }}
                          >
                            {size}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div />
                )}
                {this.props.product.values['Product Type'] === 'Package' && (
                  <div className="products">
                    {this.props.product.packageStock.map((product, i) => {
                      return (
                        <div className="name" key={i}>
                          <label htmlFor={product.id}>
                            <input
                              type="checkbox"
                              id={product.id}
                              value={product.id}
                              disabled={product.stock.length === 0}
                              onChange={e => {
                                var selected = this.state.packagedProducts;
                                var productSizes = this.state
                                  .packagedProductSizes;
                                if (e.target.checked) {
                                  selected[selected.length] = e.target.value;
                                } else {
                                  var idx = selected.findIndex(
                                    element => element === e.target.value,
                                  );
                                  selected = selected.splice(idx + 1, 1);

                                  idx = productSizes.findIndex(
                                    element =>
                                      element.indexOf(e.target.value) !== -1,
                                  );
                                  productSizes = productSizes.splice(
                                    idx + 1,
                                    1,
                                  );

                                  $(
                                    '#' +
                                      e.target.value +
                                      'sizes option:selected',
                                  ).prop('selected', false);
                                }
                                this.setState({
                                  packagedProducts: selected,
                                  packagedProductSizes: productSizes,
                                });
                                this.enableSizeSelect(
                                  e.target.checked,
                                  e.target.value,
                                );
                                console.log('selected:' + e.target.checked);
                              }}
                            />
                            {product.values['Name']}-{product.values['Colour']}
                          </label>
                          <div className="sizes">
                            <select
                              name={product.id + 'sizes'}
                              id={product.id + 'sizes'}
                              ref={input => (this.input = input)}
                              disabled
                              onChange={e => {
                                var selected = this.state.packagedProductSizes;
                                var id = e.target.id.replace('sizes', '');
                                var idx = selected.findIndex(
                                  element =>
                                    element.indexOf(e.target.value) !== -1,
                                );
                                selected = selected.splice(idx + 1, 1);

                                selected[selected.length] =
                                  id + '_' + e.target.value;
                                this.setState({
                                  packagedProductSizes: selected,
                                });
                              }}
                            >
                              <option value="" />
                              {product.values['Sizes'].map((stock, i) => {
                                return (
                                  <option
                                    value={stock}
                                    disabled={
                                      product.stock.length === 0 ||
                                      product.stock.findIndex(
                                        element =>
                                          element.values['Size'] === stock,
                                      ) === -1
                                    }
                                  >
                                    {stock}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="quantity">
                  <span>Quantity</span>
                  <NumericInput
                    className="form-control"
                    value={this.state.quantity}
                    min={0}
                    max={this.state.maxQuantity}
                    step={1}
                    precision={0}
                    size={2}
                    mobile
                    onChange={value => {
                      if (value !== 0) {
                        this.setState({
                          quantity: value,
                        });
                      }
                    }}
                  />
                </div>
                <div className="addToCart">
                  <button
                    type="button"
                    className="btn btn-primary addToCartBtn"
                    onClick={e => {
                      this.props.setShowAddProductToCheckoutDialog(false);
                      this.props.addProduct(
                        this.props.product,
                        this.getStockSelected(
                          this.props.product,
                          this.state.size,
                          this.state.packagedProductSizes,
                        ),
                        this.state.quantity,
                      );
                    }}
                    disabled={
                      this.state.maxQuantity === 0 || this.state.quantity === 0
                    }
                  >
                    Add To Cart
                  </button>
                </div>
              </div>
            </span>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
const inlineStyle = {
  width: '600px',
  top: '10%',
  left: '20%',
};

export const AddProductToCheckoutDialogContainer = enhance(
  AddProductToCheckoutDialog,
);

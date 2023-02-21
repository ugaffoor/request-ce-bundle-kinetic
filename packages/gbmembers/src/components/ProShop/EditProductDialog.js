import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import $ from 'jquery';
import { CoreForm } from 'react-kinetic-core';
import ReactSpinner from 'react16-spinjs';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};
var dialogThis = undefined;

export class EditProductDialog extends Component {
  handleClose = () => {
    this.props.setShowEditProductDialog(false);
  };
  constructor(props) {
    super(props);
    dialogThis = this;
    this.state = {
      loadingForm: true,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {}
  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="editProductDialog"
            onClose={this.handleClose}
            dismissOnBackgroundClick={false}
            style={inlineStyle}
          >
            <span className="product">
              <CoreForm
                datastore
                review={false}
                submission={this.props.product.id}
                updated={function(props) {
                  console.log('Submission Update completed');
                  dialogThis.props.product.values = props.submission.values;
                  dialogThis.props.product.packageStock = [];
                  for (
                    var k = 0;
                    k < props.submission.values['Package Products'].length;
                    k++
                  ) {
                    for (
                      var x = 0;
                      x < dialogThis.props.posProducts.length;
                      x++
                    ) {
                      if (
                        props.submission.values['Package Products'][k] ===
                        dialogThis.props.posProducts[x]['id']
                      ) {
                        dialogThis.props.product.packageStock[
                          dialogThis.props.product.packageStock.length
                        ] = dialogThis.props.posProducts[x];
                      }
                    }
                  }

                  dialogThis.handleClose();
                  dialogThis.props.refreshProducts();
                }}
                onLoaded={function() {
                  console.log('Form loaded');
                  /*dialogThis.setState({
                  loadingForm: false,
                });*/
                }}
                error={function() {}}
              />
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

export const EditProductDialogContainer = enhance(EditProductDialog);

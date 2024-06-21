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

export class AddProductDialog extends Component {
  handleClose = e => {
    this.props.setShowAddProductDialog(false);
  };
  constructor(props) {
    super(props);
    dialogThis = this;
    this.state = {
      loadingForm: true,
      values: {
        Status: 'Active',
        'Product Type': this.props.productType,
      },
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {}
  render() {
    return (
      <ModalContainer zIndex={1030}>
        <ModalDialog
          className="addProductDialog"
          onClose={this.handleClose}
          dismissOnBackgroundClick={false}
          style={inlineStyle}
        >
          <span className="product">
            <CoreForm
              datastore
              form="pos-product"
              values={this.state.values}
              created={function(props) {
                console.log('Submission Update completed');
                props.submission.stock = [];
                if (
                  props.submission.values['Image'] !== '' &&
                  props.submission.values['Image'] !== null &&
                  props.submission.values['Image'] !== undefined
                ) {
                  let serverName = props.submission.values[
                    'Image'
                  ][0].link.split('/')[1];
                  props.submission.values[
                    'Image URL'
                  ] = props.submission.values['Image'][0].link.replace(
                    '/' + serverName,
                    '',
                  );
                }
                dialogThis.props.products.push(props.submission);
                dialogThis.handleClose();
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
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
const inlineStyle = {
  width: '600px',
  top: '10%',
  left: '20%',
};

export const AddProductDialogContainer = enhance(AddProductDialog);

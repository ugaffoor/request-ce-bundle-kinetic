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
  handleClick = () => {
    //    this.setState({ isShowingModal: false });
    //    this.props.setShowAttendanceDialog(false);
  };
  handleClose = () => {
    //    this.setState({ isShowingModal: false });
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
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="addProductDialog"
            onClose={this.handleClose}
            style={inlineStyle}
          >
            <span className="product">
              <CoreForm
                datastore
                form="pos-product"
                values={this.state.values}
                created={function(props) {
                  console.log('Submission Update completed');
                  //                dialogThis.props.product.values=props.submission.values;
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

export const AddProductDialogContainer = enhance(AddProductDialog);

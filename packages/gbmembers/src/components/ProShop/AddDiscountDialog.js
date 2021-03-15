import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import $ from 'jquery';
import discountIcon from '../../images/discount.png?raw';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};

export class AddDiscountDialog extends Component {
  handleClick = () => {
    //    this.setState({ isShowingModal: false });
    //    this.props.setShowAttendanceDialog(false);
  };
  handleClose = () => {
    //    this.setState({ isShowingModal: false });
    this.props.setShowAddDiscountDialog(false);
  };
  constructor(props) {
    super(props);
    this.state = {
      discountid: undefined,
    };
  }
  componentWillReceiveProps(nextProps) {}
  componentWillMount() {}
  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="addDiscountDialog"
            onClose={this.handleClose}
            style={inlineStyle}
          >
            <span className="discounts">
              <div className="tabs">
                <div className="discountTab" onClick={e => {}}>
                  <img src={discountIcon} alt="Add Discount" />
                  <span className="label">Add Discount</span>
                </div>
              </div>
              <div className="discountContent">
                {this.props.posDiscounts.map((discount, i) => {
                  return (
                    <div>
                      <input
                        id={'var' + i + '-' + discount['id']}
                        type="radio"
                        className="var-discount"
                        name="option1"
                        value={discount.values['Value']}
                        data-id={discount['id']}
                      />
                      <label
                        htmlFor={'var' + i + '-' + discount['id']}
                        onClick={e => {
                          this.setState({
                            discountid: $(e.target)
                              .siblings('input')
                              .attr('data-id'),
                          });
                        }}
                      >
                        {discount.values['Name']} -{' '}
                        {discount.values['Type'] === 'Percentage'
                          ? discount.values['Value'] + '%'
                          : '$' + discount.values['Value']}
                      </label>
                    </div>
                  );
                })}

                <div className="buttons">
                  <button
                    type="button"
                    className="btn btn-primary cancel"
                    onClick={e => {
                      this.props.setShowAddDiscountDialog(false, undefined);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary add"
                    onClick={e => {
                      this.props.setShowAddDiscountDialog(
                        false,
                        this.state.discountid,
                      );
                    }}
                    disabled={this.state.discountid === undefined}
                  >
                    Add
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
  width: '400px',
  top: '30%',
  left: '30%',
};

export const AddDiscountDialogContainer = enhance(AddDiscountDialog);

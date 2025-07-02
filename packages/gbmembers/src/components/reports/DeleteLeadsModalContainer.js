import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { getJson } from '../Member/MemberUtils';
import moment from 'moment';
import { compose } from 'recompose';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};

export class DeleteLeadsModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowSetStatusModal(false);
  };
  deleteLeads = () => {};
  constructor(props) {
    super(props);
    this.leadRows = props.leadRows;
    this.state = {};
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog className="deleteLeadsDialog" onClose={this.handleClose}>
            <div className="statusOptions">
              <form>
                <span>
                  <span>
                    Are you sure you want to delete all Leads displayed in the
                    table?
                  </span>
                  <br></br>
                  <span className="leadCountTotal">
                    Total leads <b>{this.leadRows.length}</b>
                  </span>
                </span>
              </form>
              <button
                type="button"
                id="deleteLeads"
                className="btn btn-primary btn-block"
                onClick={async e => {
                  this.deleteLeads();
                }}
              >
                Delete
              </button>
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const DeleteLeadsModalContainer = enhance(DeleteLeadsModal);

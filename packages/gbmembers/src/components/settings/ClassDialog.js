import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { actions as memberActions } from '../../redux/modules/members';
import $ from 'jquery';
import { compose } from 'recompose';
import moment from 'moment';

const mapStateToProps = state => ({
  programs: state.member.app.programs,
});
const mapDispatchToProps = {
  promoteMember: memberActions.promoteMember,
  updateMember: memberActions.updateMember,
};

export class ClassDialog extends Component {
  handleClick = () => {
    //    this.setState({ isShowingModal: false });
    //    this.props.setShowPromotionDialog(this.props.gradingStatus, false);
  };
  handleClose = () => {
    //    this.setState({ isShowingModal: false });
    this.setState({ event: undefined });
    this.cancelDialog();
    //  if (this.props.setIsDirty) this.props.setIsDirty(true);
  };

  deleteClass = () => {
    this.deleteEvent(this.state.event);
    this.setState({
      event: undefined,
      title: undefined,
      program: undefined,
    });
  };

  applyClass = () => {
    if (this.state.title === undefined || this.state.program === undefined) {
      alert('Please ensure a Title and Program value is set.');
      return;
    }
    this.applyDates(
      this.state.start,
      this.state.end,
      this.state.title,
      this.state.program,
      this.state.maxStudents,
      this.state.event,
    );
    this.setState({
      event: undefined,
      title: undefined,
      program: undefined,
      maxStudents: undefined,
    });
  };

  constructor(props) {
    super(props);
    this.cancelDialog = this.props.cancelDialog.bind(this);
    this.applyDates = this.props.applyDates;
    this.deleteEvent = this.props.deleteEvent;
    if (this.props.event !== undefined) {
      this.state = {
        event: this.props.event,
        start: this.props.event.start,
        end: this.props.event.end,
        title: this.props.event.title,
        program: this.props.event.program,
        maxStudents: this.props.event.maxStudents,
      };
    } else {
      this.state = {
        start: this.props.start,
        end: this.props.end,
        title: undefined,
        program: undefined,
        maxStudents: undefined,
      };
    }
  }
  componentWillReceiveProps(nextProps) {}
  componentWillMount() {}

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="classDialog"
            onClose={this.handleClose}
            style={inlineStyle}
          >
            <div className="classDialog">
              <span className="datesValue">
                {moment(this.state.start).format('h:mm A')}-
                {moment(this.state.end).format('h:mm A')}
              </span>
              <div className="titleDiv form-group required">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  defaultValue={this.state.title}
                  onChange={e => {
                    this.setState({ title: e.target.value });
                  }}
                />
              </div>
              <div className="programDiv form-group required">
                <label htmlFor="program">Program</label>
                <select
                  name="program"
                  id="program"
                  defaultValue={this.state.program}
                  onChange={e => {
                    this.setState({ program: e.target.value });
                  }}
                >
                  <option value="" />
                  {this.props.programs.map(program => (
                    <option key={program.program} value={program.program}>
                      {program.program}
                    </option>
                  ))}
                </select>
                <div className="droparrow" />
              </div>
              <div className="maxStudentsDiv form-group">
                <label htmlFor="maxStudents">Max Students</label>
                <input
                  type="number"
                  name="maxStudents"
                  id="maxStudents"
                  defaultValue={this.state.maxStudents}
                  onChange={e => {
                    this.setState({ maxStudents: e.target.value });
                  }}
                />
              </div>
              {this.state.event !== undefined && (
                <button
                  type="button"
                  className="apply btn btn-primary"
                  onClick={e => this.deleteClass()}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                className="apply btn btn-primary"
                onClick={e => this.applyClass()}
              >
                Apply
              </button>
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
const inlineStyle = {
  width: '500px',
  top: '10%',
  left: '10%',
};

export const ClassDialogContainer = enhance(ClassDialog);

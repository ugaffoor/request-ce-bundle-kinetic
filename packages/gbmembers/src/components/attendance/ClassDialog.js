import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { actions as memberActions } from '../../redux/modules/members';
import $ from 'jquery';
import { compose } from 'recompose';
import moment from 'moment';
import reactCSS from 'reactcss';
import { SketchPicker } from 'react-color';
import Select from 'react-select';
import helpIcon from '../../images/help.svg?raw';
import SVGInline from 'react-svg-inline';

const mapStateToProps = state => ({});
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
      color: undefined,
      textColor: undefined,
      allowedPrograms: undefined,
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
      this.state.color.hex,
      this.state.textColor.hex,
      this.state.allowedPrograms,
      this.state.cancellationCutoff,
      this.state.bookingCutoff,
      this.state.coaches,
      this.state.acceptTrials,
      this.state.trialLimit,
      this.state.studentType,
      this.state.ageInfo,
      this.state.event,
    );
    this.setState({
      event: undefined,
      title: undefined,
      program: undefined,
      maxStudents: undefined,
      color: undefined,
      textColor: undefined,
      allowedPrograms: undefined,
      cancellationCutoff: undefined,
      bookingCutoff: undefined,
      acceptTrials: undefined,
      trialLimit: undefined,
      studentType: undefined,
      ageInfo: undefined,
      coaches: undefined,
    });
  };

  getProgramColor = program => {
    var color = '#6F6E6E';

    switch (program) {
      case 'GB1':
        color = '#4472c4';
        break;
      case 'GB2':
        color = '#7030a0';
        break;
      case 'GB3':
        color = 'black';
        break;
      case 'Tiny Champions':
        color = '#bdd7ee';
        break;
      case 'Little Champions 1':
        color = '#ffc001';
        break;
      case 'Little Champions 2':
        color = '#ed7d32';
        break;
      case 'Juniors':
        color = '#a9d18d';
        break;
      case 'Teens':
        color = '#70ad46';
        break;
      case 'Advanced Kids':
        color = '#48d1cc';
        break;
      default:
    }
    return color;
  };

  handleColorClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  handleColorClose = () => {
    this.setState({ displayColorPicker: false });
  };

  handleColorChange = color => {
    this.setState({ color: color });
  };

  handleTextColorClick = () => {
    this.setState({
      displayTextColorPicker: !this.state.displayTextColorPicker,
    });
  };

  handleTextColorClose = () => {
    this.setState({ displayTextColorPicker: false });
  };

  handleTextColorChange = color => {
    this.setState({ textColor: color });
  };
  handleAllowedProgramsChange = allowedPrograms => {
    this.setState({ allowedPrograms });
    //console.log(`Option selected:`, selectedOption);
  };
  constructor(props) {
    super(props);
    this.cancelDialog = this.props.cancelDialog.bind(this);
    this.applyDates = this.props.applyDates;
    this.deleteEvent = this.props.deleteEvent;
    this.programs = this.props.programs;
    if (this.props.event !== undefined) {
      this.state = {
        event: this.props.event,
        start: this.props.event.start,
        end: this.props.event.end,
        title: this.props.event.title,
        program: this.props.event.program,
        maxStudents: this.props.event.maxStudents,
        color: { hex: this.props.event.colour },
        textColor: { hex: this.props.event.textColour },
        allowedPrograms: this.props.event.allowedPrograms,
        coaches: this.props.event.coaches,
        cancellationCutoff: this.props.event.cancellationCutoff,
        bookingCutoff: this.props.event.bookingCutoff,
        displayColorPicker: false,
        acceptTrials: this.props.event.acceptTrials,
        trialLimit: this.props.event.trialLimit,
        studentType: this.props.event.studentType,
        ageInfo: this.props.event.ageInfo,
      };
    } else {
      this.state = {
        start: this.props.start,
        end: this.props.end,
        title: undefined,
        program: undefined,
        maxStudents: undefined,
        color: { hex: '#6F6E6E' },
        displayColorPicker: false,
        textColor: { hex: 'white' },
        displayTextColorPicker: false,
        allowedPrograms: [],
        coaches: undefined,
        cancellationCutoff: undefined,
        bookingCutoff: undefined,
        acceptTrials: undefined,
        trialLimit: undefined,
        studentType: undefined,
        ageInfo: undefined,
      };
    }
  }
  getProgramOptions(programs, additionalPrograms) {
    if (programs === undefined) {
      return [];
    }
    let options = [];

    programs.forEach(program => {
      options.push({
        value: program.program,
        label: program.program,
      });
    });
    additionalPrograms.forEach(program => {
      options.push({
        value: program.program,
        label: program.program,
      });
    });

    return options;
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {}

  render() {
    const styles = reactCSS({
      default: {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          backgroundColor: this.state.color.hex,
        },
        textColor: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          backgroundColor: this.state.textColor.hex,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
          marginLeft: '11px',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });
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
                    this.setState({
                      program: e.target.value,
                      color: { hex: this.getProgramColor(e.target.value) },
                    });
                  }}
                >
                  <option value="" />
                  {this.props.programs.map(program => (
                    <option key={program.program} value={program.program}>
                      {program.program}
                    </option>
                  ))}
                  {this.props.additionalPrograms.map(program => (
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
              <div className="cancellationCutoffDiv form-group">
                <label htmlFor="cancellationCutoff">
                  Cancellation Cutoff (hours)
                  <SVGInline
                    svg={helpIcon}
                    className="icon help"
                    onClick={e => {
                      $('.cancellationCutoffHelp').toggle('');
                    }}
                  />
                </label>
                <input
                  type="number"
                  name="cancellationCutoff"
                  id="cancellationCutoff"
                  defaultValue={this.state.cancellationCutoff}
                  onChange={e => {
                    this.setState({ cancellationCutoff: e.target.value });
                  }}
                />
                <span
                  className={'cancellationCutoffHelp'}
                  style={{ display: 'none' }}
                >
                  <ul>
                    <li>
                      A class booking cannot be canceled if there are fewer than
                      X hours remaining before the class starts.
                    </li>
                  </ul>
                </span>
              </div>
              <div className="bookingCutoffDiv form-group">
                <label htmlFor="bookingCutoff">
                  Booking Cutoff (hours)
                  <SVGInline
                    svg={helpIcon}
                    className="icon help"
                    onClick={e => {
                      $('.bookingCutoffHelp').toggle('');
                    }}
                  />
                </label>
                <input
                  type="number"
                  name="bookingCutoff"
                  id="bookingCutoff"
                  defaultValue={this.state.bookingCutoff}
                  onChange={e => {
                    this.setState({ bookingCutoff: e.target.value });
                  }}
                />
                <span
                  className={'bookingCutoffHelp'}
                  style={{ display: 'none' }}
                >
                  <ul>
                    <li>
                      A class cannot be booked if there are fewer than X hours
                      remaining before the class starts.
                    </li>
                  </ul>
                </span>
              </div>
              <div className="colorChoice">
                <label htmlFor="colorValue">Colour</label>
                <div
                  id="colorValue"
                  style={styles.swatch}
                  onClick={this.handleColorClick}
                >
                  <div style={styles.color} />
                </div>
                {this.state.displayColorPicker ? (
                  <div style={styles.popover}>
                    <div style={styles.cover} onClick={this.handleColorClose} />
                    <SketchPicker
                      color={this.state.color}
                      onChange={this.handleColorChange}
                    />
                  </div>
                ) : null}
              </div>
              <div className="textColorChoice">
                <label htmlFor="textColorValue">Text Colour</label>
                <div
                  id="textColorValue"
                  style={styles.swatch}
                  onClick={this.handleTextColorClick}
                >
                  <div style={styles.textColor} />
                </div>
                {this.state.displayTextColorPicker ? (
                  <div style={styles.popover}>
                    <div
                      style={styles.cover}
                      onClick={this.handleTextColorClose}
                    />
                    <SketchPicker
                      color={this.state.textColor}
                      onChange={this.handleTextColorChange}
                    />
                  </div>
                ) : null}
              </div>
              <div className="titleDiv form-group">
                <label htmlFor="title">Coaches</label>
                <input
                  type="text"
                  name="coaches"
                  id="coaches"
                  defaultValue={this.state.coaches}
                  onChange={e => {
                    this.setState({ coaches: e.target.value });
                  }}
                />
              </div>
              <div className="allowedPrograms">
                <label htmlFor="allowedPrograms">Allowed Programs</label>
                <Select
                  name="allowedPrograms"
                  defaultValue={
                    this.state.allowedPrograms === '{}' ||
                    this.state.allowedPrograms === ''
                      ? ''
                      : typeof this.state.allowedPrograms === 'string'
                      ? JSON.parse(this.state.allowedPrograms)
                      : this.state.allowedPrograms
                  }
                  onChange={this.handleAllowedProgramsChange}
                  options={this.getProgramOptions(
                    this.programs,
                    this.props.additionalPrograms,
                  )}
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  controlShouldRenderValue={true}
                  isMulti={true}
                />
              </div>
              <div className="titleDiv form-group">
                <label htmlFor="acceptTrials">Accept Trial Bookings</label>
                <input
                  type="checkbox"
                  name="acceptTrials"
                  id="acceptTrials"
                  checked={this.state.acceptTrials === 'YES' ? true : false}
                  onChange={e => {
                    const isChecked = e.target.checked;
                    this.setState({ acceptTrials: isChecked ? 'YES' : '' });
                  }}
                />
              </div>
              {this.state.acceptTrials && (
                <div className="trialInfo">
                  <div className="radioGroup">
                    <label htmlFor="adult" className="radio">
                      <input
                        id="adult"
                        name="studentType"
                        type="radio"
                        checked={
                          this.state.studentType === 'Adult' ? true : false
                        }
                        onChange={e => {
                          this.setState({
                            studentType: 'Adult',
                          });
                        }}
                      />
                      Adult
                    </label>
                    <label htmlFor="child" className="radio">
                      <input
                        id="child"
                        name="studentType"
                        type="radio"
                        checked={
                          this.state.studentType === 'Child' ? true : false
                        }
                        onChange={e => {
                          this.setState({
                            studentType: 'Child',
                          });
                        }}
                      />
                      Child
                    </label>
                  </div>
                  <div className="trialLimitDiv form-group">
                    <label htmlFor="trialLimit">Limit</label>
                    <input
                      type="number"
                      name="trialLimit"
                      id="trialLimit"
                      defaultValue={this.state.trialLimit}
                      onChange={e => {
                        this.setState({ trialLimit: e.target.value });
                      }}
                    />
                  </div>
                </div>
              )}
              {this.state.acceptTrials && this.state.studentType === 'Child' && (
                <div className="titleDiv form-group">
                  <label htmlFor="ageInfo">Age Information</label>
                  <input
                    type="text"
                    name="ageInfo"
                    id="ageInfo"
                    placeHolder="Describe age group of students"
                    value={this.state.ageInfo}
                    onChange={e => {
                      this.setState({ ageInfo: e.target.value });
                    }}
                  />
                </div>
              )}
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
  top: '20%',
  left: '20%',
};

export const ClassDialogContainer = enhance(ClassDialog);

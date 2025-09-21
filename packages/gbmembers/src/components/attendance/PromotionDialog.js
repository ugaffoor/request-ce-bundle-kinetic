import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import ReactSpinner from 'react16-spinjs';
import { connect } from 'react-redux';
import { actions as memberActions } from '../../redux/modules/members';
import { actions as messagingActions } from '../../redux/modules/messaging';
import moment from 'moment';
import $ from 'jquery';
import { setMemberPromotionValues } from '../../components/Member/MemberUtils';
import { compose } from 'recompose';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';
import { Utils } from 'common';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  programs: state.member.app.programs,
  belts: state.member.app.belts,
  promotingMember: state.member.members.promotingMember,
  profile: state.member.app.profile,
  allMembers: state.member.members.allMembers,
  space: state.member.app.space,
  memberPromotions: state.member.members.memberPromotions,
  memberPromotionsLoading: state.member.members.memberPromotionsLoading,
});
const mapDispatchToProps = {
  promoteMember: memberActions.promoteMember,
  fetchMemberPromotions: memberActions.fetchMemberPromotions,
  updateMember: memberActions.updateMember,
  createMemberActivities: messagingActions.createMemberActivities,
};
var compThis = undefined;
const util = require('util');
export class PromotionDialog extends Component {
  handleClick = () => {
    //    this.setState({ isShowingModal: false });
    //    this.props.setShowPromotionDialog(this.props.gradingStatus, false);
  };
  handleClose = () => {
    //    this.setState({ isShowingModal: false });
    this.props.setShowPromotionDialog(this.props.gradingStatus, false);
    if (this.props.setIsDirty) this.props.setIsDirty(true);
  };
  togglePromote = () => {
    this.setState({ showPromote: !this.state.showPromote });
  };
  applyPromote = () => {
    console.log('applyPromote');
    this.props.memberItem.values['Last Promotion'] = this.state.promotionDate;
    this.props.memberItem.values['Attendance Count'] = $('#classCarry').val();
    this.props.memberItem.values['Ranking Program'] = $(
      '#promoteProgram',
    ).val();
    this.props.memberItem.values['Ranking Belt'] = $('#promoteBelt').val();

    setMemberPromotionValues(this.props.memberItem, this.props.belts);

    let member = this.props.allMembers.find(
      obj => obj['id'] === this.props.memberItem['id'],
    );
    member.values['Attendance Count'] = this.props.memberItem.values[
      'Attendance Count'
    ];
    member.values['Ranking Program'] = this.props.memberItem.values[
      'Ranking Program'
    ];
    member.values['Ranking Belt'] = this.props.memberItem.values[
      'Ranking Belt'
    ];
    member.promotionSort = this.props.memberItem.promotionSort;
    member.statusText = this.props.memberItem.statusText;
    member.attendClasses = this.props.memberItem.attendClasses;
    member.durationPeriod = this.props.memberItem.durationPeriod;
    member.attendanceVal = this.props.memberItem.attendanceVal;
    member.daysElapsed = this.props.memberItem.daysElapsed;
    member.daysVal = this.props.memberItem.daysVal;
    member.attendancePerc = this.props.memberItem.attendancePerc;
    member.statusIndicator = this.props.memberItem.statusIndicator;

    var values = {};
    values['Last Promotion'] = this.props.memberItem.values['Last Promotion'];
    values['Attendance Count'] = this.props.memberItem.values[
      'Attendance Count'
    ];
    values['Ranking Program'] = this.props.memberItem.values['Ranking Program'];
    values['Ranking Belt'] = this.props.memberItem.values['Ranking Belt'];

    this.props.promoteMember({
      createMemberActivities: this.props.createMemberActivities,
      updateMember: this.props.updateMember,
      memberItem: this.props.memberItem,
      values: values,
      allMembers: this.props.allMembers,
      notes: $('#note').val(),
      gradingStatus: this.props.gradingStatus,
      setShowPromotionDialog: this.props.setShowPromotionDialog,
      submitter: this.props.profile.username,
      promotionComplete: this.promotionComplete,
    });
  };
  promotionComplete = () => {
    console.log('promotionComplete');
    $('#classCarry').val(this.props.memberItem.values['Attendance Count']);
    $('#promoteProgram').val(this.props.memberItem.values['Ranking Program']);
    $('#promoteBelt').val(this.props.memberItem.values['Ranking Belt']);

    let daysElapsed = this.props.memberItem.daysElapsed;
    let attendClasses = this.props.memberItem.attendClasses;
    let durationPeriod = this.props.memberItem.durationPeriod;
    let statusIndicator = this.props.memberItem.statusIndicator;
    let statusText = this.props.memberItem.statusText;
    let promotionSort = this.props.memberItem.promotionSort;
    let attendancePerc = this.props.memberItem.attendancePerc;

    let percentageStyle = {
      width: this.props.memberItem.attendancePerc + '%',
    };

    this.setState({
      promotionDate: moment(),
      attendClasses: attendClasses,
      durationPeriod: durationPeriod,
      daysElapsed: daysElapsed,
      statusIndicator: statusIndicator,
      statusText: statusText,
      promotionSort: promotionSort,
      attendancePerc: attendancePerc,
      percentageStyle: percentageStyle,
    });
    this.togglePromote();
  };
  setMemberPromotions = promotions => {
    console.log('setMemberPromotions');
    this.props.memberItem.promotionContent = promotions;
    this.setState({ attendClasses: this.props.memberItem.attendClasses });
  };
  constructor(props) {
    super(props);
    compThis = this;
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.setShowAttendanceDialog = this.setShowAttendanceDialog.bind(this);
    this.setMemberPromotions = this.setMemberPromotions.bind(this);

    if (props.memberItem.promotionContent === undefined)
      props.memberItem.promotionContent = [];

    let daysElapsed = props.memberItem.daysElapsed;
    let attendClasses = props.memberItem.attendClasses;
    let durationPeriod = props.memberItem.durationPeriod;
    let statusIndicator = props.memberItem.statusIndicator;
    let statusText = props.memberItem.statusText;
    let promotionSort = props.memberItem.promotionSort;
    let attendancePerc = props.memberItem.attendancePerc;

    let percentageStyle = {
      width: props.memberItem.attendancePerc + '%',
    };

    let showPromote = false;
    let showAttendanceDialog = false;
    this.state = {
      promotionDate: moment(),
      showPromote,
      daysElapsed,
      attendClasses,
      durationPeriod,
      statusIndicator,
      statusText,
      promotionSort,
      attendancePerc,
      percentageStyle,
      showAttendanceDialog,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {
    if (this.props.memberItem.promotionContent.length === 0) {
      this.props.fetchMemberPromotions({
        id: this.props.memberItem.id,
        setMemberPromotions: this.setMemberPromotions,
      });
    }
  }
  setShowAttendanceDialog(show) {
    this.setState({ showAttendanceDialog: show });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="promotionDialog"
            onClose={this.handleClose}
            style={inlineStyle}
          >
            <div className="rankbar">
              <span className="left">
                CURRENTLY {this.props.memberItem.values['Ranking Belt']}
              </span>
              <span className="right">
                {this.props.memberItem.values['Ranking Program']}
              </span>
            </div>
            <div className="infoAction">
              {this.props.memberItem.values['Photo'] === undefined ||
              this.props.memberItem.values['Photo'] === null ||
              this.props.memberItem.values['Photo'] === '' ? (
                <span className="noPhoto">
                  {this.props.memberItem.values['First Name'][0]}
                  {this.props.memberItem.values['Last Name'][0]}
                </span>
              ) : (
                <img
                  src={this.props.memberItem.values['Photo']}
                  alt="Member Photograph"
                  className="photo"
                />
              )}
              <div className="name">
                <span className="name">
                  {this.props.memberItem.values['First Name']}&nbsp;
                  {this.props.memberItem.values['Last Name']}
                </span>
                <span className="status">
                  {this.props.memberItem.values['Member Type']}
                </span>
              </div>
              <div className="grading">
                <div className={this.state.statusIndicator}>
                  <div className="bar">
                    <div
                      className="percent"
                      style={this.state.percentageStyle}
                    ></div>
                  </div>
                </div>
              </div>
              <span>
                {this.props.memberItem.values['Attendance Count']}/
                {this.state.attendClasses} CLASSES AND {this.state.daysElapsed}/
                {this.state.durationPeriod} DAYS
              </span>
              <div className="action">
                <span>
                  {this.state.statusText}
                  {this.state.statusIndicator !== 'ready' ? 'TO GRADE' : ''}
                </span>
                {(Utils.isMemberOf(
                  this.props.profile,
                  'Role::Program Managers',
                ) ||
                  getAttributeValue(
                    this.props.space,
                    'Allow Coach Promotions',
                  ) === 'YES') && (
                  <button
                    type="button"
                    className="promote btn btn-primary"
                    onClick={e => this.togglePromote()}
                  >
                    PROMOTE{' '}
                    <i
                      className={
                        this.state.showPromote
                          ? 'fa fa-arrow-circle-up'
                          : 'fa fa-arrow-circle-down'
                      }
                    ></i>
                  </button>
                )}
              </div>
            </div>
            {!this.state.showPromote ? (
              <div />
            ) : (
              <div className="promoteNow">
                <div className="dateDiv">
                  <label htmlFor="promotionDate">Promotion date</label>
                  <DayPickerInput
                    name="promotionDate"
                    id="promotionDate"
                    disabled={this.props.promotingMember}
                    placeholder={moment(new Date())
                      .locale(
                        getLocalePreference(
                          this.props.space,
                          this.props.profile,
                        ),
                      )
                      .localeData()
                      .longDateFormat('L')
                      .toLowerCase()}
                    formatDate={formatDate}
                    parseDate={parseDate}
                    value={moment(
                      this.state.promotionDate,
                      'YYYY-MM-DD',
                    ).toDate()}
                    onDayChange={function(
                      selectedDay,
                      modifiers,
                      dayPickerInput,
                    ) {
                      compThis.setState({
                        promotionDate: moment(selectedDay).format('YYYY-MM-DD'),
                      });
                    }}
                    dayPickerProps={{
                      locale: getLocalePreference(
                        this.props.space,
                        this.props.profile,
                      ),
                      localeUtils: MomentLocaleUtils,
                    }}
                  />
                </div>
                <div className="classesDiv">
                  <label htmlFor="classCarry">Classes Carry</label>
                  <input
                    type="number"
                    size="4"
                    disabled={this.props.promotingMember}
                    defaultValue="0"
                    onChange={e => {
                      if (e.target.value.trim() === '') e.target.value = '0';
                    }}
                    name="classCarry"
                    id="classCarry"
                  />
                </div>
                <div className="programDiv">
                  <label htmlFor="promoteProgram">Program</label>
                  <select
                    name="promoteProgram"
                    id="promoteProgram"
                    disabled={this.props.promotingMember}
                    defaultValue={
                      this.props.memberItem.values['Ranking Program']
                    }
                    onChange={e => {}}
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
                <div className="beltDiv">
                  <label htmlFor="promoteBelt">Belt</label>
                  <select
                    name="promoteBelt"
                    id="promoteBelt"
                    disabled={this.props.promotingMember}
                    defaultValue={this.props.memberItem.values['Ranking Belt']}
                    onChange={e => {}}
                  >
                    <option key="" value=""></option>
                    {this.props.belts.map(
                      belt =>
                        belt.program ===
                          this.props.memberItem.values['Ranking Program'] && (
                          <option key={belt.belt} value={belt.belt}>
                            {belt.belt}
                          </option>
                        ),
                    )}
                  </select>
                  <div className="droparrow" />
                </div>
                <div className="notesDiv">
                  <label htmlFor="note">Note</label>
                  <textarea
                    name="note"
                    id="note"
                    disabled={this.props.promotingMember}
                    onChange={e => {}}
                  />
                </div>
                <button
                  type="button"
                  className="apply btn btn-primary"
                  onClick={e => this.applyPromote()}
                >
                  Apply{this.props.promotingMember ? <ReactSpinner /> : ''}
                </button>
              </div>
            )}
            <div className="promotionHistory">
              <div className="promotionHistoryLabel">Promotion History</div>
              {this.props.memberItem.promotionContent.map((promotion, idx) => (
                <div
                  key={idx}
                  className={
                    idx % 2 === 0 ? 'promotionRow even' : 'promotionRow odd'
                  }
                >
                  <div className="info">
                    <div className="rank_name">
                      {promotion.Program} - {promotion.Belt}
                    </div>
                    <div className="date">
                      <label>
                        DATE{' '}
                        <span>
                          {moment(promotion.PromotionDate, 'YYYY-MM-DD').format(
                            'L',
                          )}
                        </span>
                      </label>
                    </div>
                    <div className="submitter">
                      Promoted by {promotion.Submitter}
                    </div>
                  </div>
                  <div className="note">{promotion.Notes}</div>
                </div>
              ))}
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
const inlineStyle = {
  width: '800px',
  top: '30%',
  left: '20%',
};

export const PromotionDialogContainer = enhance(PromotionDialog);

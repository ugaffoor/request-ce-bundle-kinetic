import React, { Component } from 'react';
import { compose, withState, lifecycle } from 'recompose';
import $ from 'jquery';
import { connect } from 'react-redux';
import { GradingStatus } from './GradingStatus';
import { withHandlers } from 'recompose';
import { getProgramSVG, getBeltSVG } from '../Member/MemberUtils';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  belts: state.member.app.belts,
});

const mapDispatchToProps = {};

export class GradingDetail extends Component {
  constructor(props) {
    super(props);

    let className = 'All Programs';
    let beltName = 'All Belts';
    let loadingMemberGrading = true;
    let isDirty = false;
    let programsGroup = [];
    this.state = {
      className,
      beltName,
      loadingMemberGrading,
      isDirty,
      programsGroup,
    };
  }
  setIsDirty = dirty => {
    this.setState({ isDirty: dirty });
  };
  handleProgramChange(e) {
    this.setState({
      className: e.target.value,
      beltName: $('#belt').val(),
    });
  }
  handleBeltChange(e) {
    this.setState({ beltName: e.target.value });
  }
  render() {
    return (
      <div className="gradingSection">
        <div className="classSection">
          <span className="line">
            <div className="grading">
              <label htmlFor="program">Program</label>
              <select
                name="program"
                id="program"
                ref={input => (this.input = input)}
                defaultValue={this.state.className}
                onChange={e => this.handleProgramChange(e)}
              >
                <option value="All Programs">All Programs</option>
                {this.props.programs.map(program => (
                  <option key={program.program} value={program.program}>
                    {program.program}
                  </option>
                ))}
              </select>
              <div className="droparrow" />
            </div>
            <div className="program">
              <label htmlFor="program">Belt</label>
              <select
                name="belt"
                id="belt"
                ref={input => (this.input = input)}
                defaultValue={this.state.beltName}
                onChange={e => this.handleBeltChange(e)}
              >
                <option value="All Belts">All Belts</option>
                {this.props.belts.map(
                  belt =>
                    belt.program === this.state.className && (
                      <option key={belt.belt} value={belt.belt}>
                        {belt.belt}
                      </option>
                    ),
                )}
              </select>
              <div className="droparrow" />
            </div>
          </span>
        </div>
        <div className="membersGradingSection">
          <div className="memberGrading">
            {this.props.allMembers
              .filter(
                member =>
                  member.values['Status'] !== 'Inactive' &&
                  member.values['Status'] !== 'Frozen',
              )
              .sort(function(a, b) {
                if (a.programOrder < b.programOrder) {
                  return -1;
                }
                if (a.programOrder > b.programOrder) {
                  return 1;
                }
                if (a.promotionSort < b.promotionSort) {
                  return -1;
                }
                if (a.promotionSort > b.promotionSort) {
                  return 1;
                }
                if (a.attendancePerc > b.attendancePerc) {
                  return -1;
                }
                if (a.attendancePerc < b.attendancePerc) {
                  return 1;
                }

                return 0;
              })
              .map((member, index) => {
                if (index === 0) {
                  this.state.programsGroup = [];
                }
                if (
                  member.values['Last Promotion'] &&
                  (this.state.className === 'All Programs' ||
                    this.state.className ===
                      member.values['Ranking Program']) &&
                  (this.state.beltName === 'All Belts' ||
                    this.state.beltName === member.values['Ranking Belt'])
                ) {
                  let newProgram = false;
                  if (
                    this.state.programsGroup.indexOf(
                      member.values['Ranking Program'],
                    ) === -1
                  ) {
                    this.state.programsGroup.push(
                      member.values['Ranking Program'],
                    );
                    newProgram = true;
                    console.log(
                      'newProgram:' + member.values['Ranking Program'],
                    );
                  }
                  return (
                    <div key={index}>
                      {newProgram ? (
                        <div className="programName">
                          {member.values['Ranking Program']}
                        </div>
                      ) : (
                        <div />
                      )}
                      <span className="memberRow">
                        <h4 className="memberName">
                          {member.values['First Name']}{' '}
                          {member.values['Last Name']}
                        </h4>
                        <span className="lastPromotion">
                          {new Date(
                            member.values['Last Promotion'],
                          ).toLocaleDateString()}
                        </span>
                        <GradingStatus
                          memberItem={member}
                          belts={this.props.belts}
                          setIsDirty={this.setIsDirty}
                          allMembers={this.props.allMembers}
                        />
                        <span className="statistics">
                          {member.values['Attendance Count']}/
                          {member.attendClasses} CLASSES AND{' '}
                          {member.daysElapsed}/{member.durationPeriod} DAYS
                        </span>
                        <span className="belt">
                          {getBeltSVG(member.values['Ranking Belt'])}
                        </span>
                      </span>
                    </div>
                  );
                } else {
                  return <div />;
                }
              })}
          </div>
        </div>
      </div>
    );
  }
}

export const GradingView = ({ allMembers, programs, belts }) => (
  <GradingDetail allMembers={allMembers} programs={programs} belts={belts} />
);

export const GradingContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({}),
  lifecycle({
    componentWillMount() {},
    componentWillReceiveProps(nextProps) {},
    componentDidMount() {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
  }),
)(GradingView);

import React, { Component } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import moment from 'moment';
import { KappNavLink as NavLink } from 'common';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import ReactTable from 'react-table';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

export class DemographicChart extends Component {
  constructor(props) {
    super(props);
    this.allMembers = this.props.allMembers;
    this.membersOnClick = this.membersOnClick.bind(this);
    this._getMemberColumns = this.getMemberColumns();

    let data = this.getData(this.props.allMembers);
    let malePercent = this.getMalePercent(this.props.allMembers);
    let femalePercent = this.getFemalePercent(this.props.allMembers);
    let otherPercent = this.getOtherPercent(this.props.allMembers);
    let noanswerPercent = this.getNoanswerPercent(this.props.allMembers);
    this.renderCusomizedLegend = this.renderCusomizedLegend.bind(this);

    this.state = {
      data,
      malePercent,
      femalePercent,
      otherPercent,
      noanswerPercent,
      showMembers: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    //console.log(" billing chart data = " + util.inspect(nextProps));
    if (nextProps.allMembers) {
      this.allMembers = nextProps.allMembers;
      this.setState({
        data: this.getData(nextProps.allMembers),
        malePercent: this.getMalePercent(nextProps.allMembers),
        femalePercent: this.getFemalePercent(nextProps.allMembers),
        otherPercent: this.getOtherPercent(nextProps.allMembers),
        noanswerPercent: this.getNoanswerPercent(nextProps.allMembers),
      });
    }
  }
  componentDidMount() {}

  getData(allMembers) {
    if (!allMembers) {
      return [];
    }

    let demographicData = [];
    let totalMembers = 0;
    let maleTotal = 0,
      femaleTotal = 0,
      otherTotal = 0,
      noanswerTotal = 0;
    let m_age_less_than_6 = { count: 0, members: [] },
      m_age_7_9 = { count: 0, members: [] },
      m_age_10_12 = { count: 0, members: [] },
      m_age_13_15 = { count: 0, members: [] },
      m_age_16_17 = { count: 0, members: [] },
      m_age_18_29 = { count: 0, members: [] },
      m_age_30_35 = { count: 0, members: [] },
      m_age_36_40 = { count: 0, members: [] },
      m_age_41_45 = { count: 0, members: [] },
      m_age_46_50 = { count: 0, members: [] },
      m_age_51_plus = { count: 0, members: [] };
    let f_age_less_than_6 = { count: 0, members: [] },
      f_age_7_9 = { count: 0, members: [] },
      f_age_10_12 = { count: 0, members: [] },
      f_age_13_15 = { count: 0, members: [] },
      f_age_16_17 = { count: 0, members: [] },
      f_age_18_29 = { count: 0, members: [] },
      f_age_30_35 = { count: 0, members: [] },
      f_age_36_40 = { count: 0, members: [] },
      f_age_41_45 = { count: 0, members: [] },
      f_age_46_50 = { count: 0, members: [] },
      f_age_51_plus = { count: 0, members: [] };
    let o_age_less_than_6 = { count: 0, members: [] },
      o_age_7_9 = { count: 0, members: [] },
      o_age_10_12 = { count: 0, members: [] },
      o_age_13_15 = { count: 0, members: [] },
      o_age_16_17 = { count: 0, members: [] },
      o_age_18_29 = { count: 0, members: [] },
      o_age_30_35 = { count: 0, members: [] },
      o_age_36_40 = { count: 0, members: [] },
      o_age_41_45 = { count: 0, members: [] },
      o_age_46_50 = { count: 0, members: [] },
      o_age_51_plus = { count: 0, members: [] };
    let n_age_less_than_6 = { count: 0, members: [] },
      n_age_7_9 = { count: 0, members: [] },
      n_age_10_12 = { count: 0, members: [] },
      n_age_13_15 = { count: 0, members: [] },
      n_age_16_17 = { count: 0, members: [] },
      n_age_18_29 = { count: 0, members: [] },
      n_age_30_35 = { count: 0, members: [] },
      n_age_36_40 = { count: 0, members: [] },
      n_age_41_45 = { count: 0, members: [] },
      n_age_46_50 = { count: 0, members: [] },
      n_age_51_plus = { count: 0, members: [] };
    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Casual' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        totalMembers++;
        let gender = member.values['Gender'];
        let age = getAgeInYears(member.values['DOB']);
        if (gender === 'Male') {
          maleTotal++;
        } else if (gender === 'Female') {
          femaleTotal++;
        } else if (gender === 'Other') {
          otherTotal++;
        } else if (gender === 'Prefer not to answer') {
          noanswerTotal++;
        }

        if (age <= 6) {
          if (gender === 'Male') {
            m_age_less_than_6.count++;
            m_age_less_than_6.members[m_age_less_than_6.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_less_than_6.count++;
            f_age_less_than_6.members[f_age_less_than_6.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_less_than_6.count++;
            o_age_less_than_6.members[o_age_less_than_6.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_less_than_6.count++;
            n_age_less_than_6.members[n_age_less_than_6.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }

        if (age >= 7 && age <= 9) {
          if (gender === 'Male') {
            m_age_7_9.count++;
            m_age_7_9.members[m_age_7_9.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_7_9.count++;
            f_age_7_9.members[f_age_7_9.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_7_9.count++;
            o_age_7_9.members[o_age_7_9.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_7_9.count++;
            n_age_7_9.members[n_age_7_9.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }

        if (age >= 10 && age <= 12) {
          if (gender === 'Male') {
            m_age_10_12.count++;
            m_age_10_12.members[m_age_10_12.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_10_12.count++;
            f_age_10_12.members[f_age_10_12.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_10_12.count++;
            o_age_10_12.members[o_age_10_12.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_10_12.count++;
            n_age_10_12.members[n_age_10_12.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }

        if (age >= 13 && age <= 15) {
          if (gender === 'Male') {
            m_age_13_15.count++;
            m_age_13_15.members[m_age_13_15.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_13_15.count++;
            f_age_13_15.members[f_age_13_15.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_13_15.count++;
            o_age_13_15.members[o_age_13_15.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_13_15.count++;
            n_age_13_15.members[n_age_13_15.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }

        if (age >= 16 && age <= 17) {
          if (gender === 'Male') {
            m_age_16_17.count++;
            m_age_16_17.members[m_age_16_17.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_16_17.count++;
            f_age_16_17.members[f_age_16_17.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_16_17.count++;
            o_age_16_17.members[o_age_16_17.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_16_17.count++;
            n_age_16_17.members[n_age_16_17.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }

        if (age >= 18 && age <= 29) {
          if (gender === 'Male') {
            m_age_18_29.count++;
            m_age_18_29.members[m_age_18_29.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_18_29.count++;
            f_age_18_29.members[f_age_18_29.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_18_29.count++;
            o_age_18_29.members[o_age_18_29.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_18_29.count++;
            n_age_18_29.members[n_age_18_29.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }

        if (age >= 30 && age <= 35) {
          if (gender === 'Male') {
            m_age_30_35.count++;
            m_age_30_35.members[m_age_30_35.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_30_35.count++;
            f_age_30_35.members[f_age_30_35.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_30_35.count++;
            o_age_30_35.members[o_age_30_35.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_30_35.count++;
            n_age_30_35.members[n_age_30_35.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }
        if (age >= 36 && age <= 40) {
          if (gender === 'Male') {
            m_age_36_40.count++;
            m_age_36_40.members[m_age_36_40.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_36_40.count++;
            f_age_36_40.members[f_age_36_40.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_36_40.count++;
            o_age_36_40.members[o_age_36_40.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_36_40.count++;
            n_age_36_40.members[n_age_36_40.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }
        if (age >= 41 && age <= 45) {
          if (gender === 'Male') {
            m_age_41_45.count++;
            m_age_41_45.members[m_age_41_45.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_41_45.count++;
            f_age_41_45.members[f_age_41_45.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_41_45.count++;
            o_age_41_45.members[o_age_41_45.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_41_45.count++;
            n_age_41_45.members[n_age_41_45.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }
        if (age >= 46 && age <= 50) {
          if (gender === 'Male') {
            m_age_46_50.count++;
            m_age_46_50.members[m_age_46_50.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_46_50.count++;
            f_age_46_50.members[f_age_46_50.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_46_50.count++;
            o_age_46_50.members[o_age_46_50.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_46_50.count++;
            n_age_46_50.members[n_age_46_50.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }

        if (age >= 51) {
          if (gender === 'Male') {
            m_age_51_plus.count++;
            m_age_51_plus.members[m_age_51_plus.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Female') {
            f_age_51_plus.count++;
            f_age_51_plus.members[f_age_51_plus.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Other') {
            o_age_51_plus.count++;
            o_age_51_plus.members[o_age_51_plus.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          } else if (gender === 'Prefer not to answer') {
            n_age_51_plus.count++;
            n_age_51_plus.members[n_age_51_plus.members.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
          }
        }
      }
    });

    demographicData.push({
      ageGroup: '< 6',
      Male: getPercent(m_age_less_than_6.count, totalMembers),
      Female: getPercent(f_age_less_than_6.count, totalMembers),
      Other: getPercent(o_age_less_than_6.count, totalMembers),
      Noanswer: getPercent(n_age_less_than_6.count, totalMembers),
      members: m_age_less_than_6.members
        .concat(f_age_less_than_6.members)
        .concat(o_age_less_than_6.members)
        .concat(n_age_less_than_6.members),
    });
    demographicData.push({
      ageGroup: '7-9',
      Male: getPercent(m_age_7_9.count, totalMembers),
      Female: getPercent(f_age_7_9.count, totalMembers),
      Other: getPercent(o_age_7_9.count, totalMembers),
      Noanswer: getPercent(n_age_7_9.count, totalMembers),
      members: m_age_7_9.members
        .concat(f_age_7_9.members)
        .concat(o_age_7_9.members)
        .concat(n_age_7_9.members),
    });
    demographicData.push({
      ageGroup: '10-12',
      Male: getPercent(m_age_10_12.count, totalMembers),
      Female: getPercent(f_age_10_12.count, totalMembers),
      Other: getPercent(o_age_10_12.count, totalMembers),
      Noanswer: getPercent(n_age_10_12.count, totalMembers),
      members: m_age_10_12.members
        .concat(f_age_10_12.members)
        .concat(o_age_10_12.members)
        .concat(n_age_10_12.members),
    });
    demographicData.push({
      ageGroup: '12-15',
      Male: getPercent(m_age_13_15.count, totalMembers),
      Female: getPercent(f_age_13_15.count, totalMembers),
      Other: getPercent(o_age_13_15.count, totalMembers),
      Noanswer: getPercent(n_age_13_15.count, totalMembers),
      members: m_age_13_15.members
        .concat(f_age_13_15.members)
        .concat(o_age_13_15.members)
        .concat(n_age_13_15.members),
    });
    demographicData.push({
      ageGroup: '16-17',
      Male: getPercent(m_age_16_17.count, totalMembers),
      Female: getPercent(f_age_16_17.count, totalMembers),
      Other: getPercent(o_age_16_17.count, totalMembers),
      Noanswer: getPercent(n_age_16_17.count, totalMembers),
      members: m_age_16_17.members
        .concat(f_age_16_17.members)
        .concat(o_age_16_17.members)
        .concat(n_age_16_17.members),
    });
    demographicData.push({
      ageGroup: '18-29',
      Male: getPercent(m_age_18_29.count, totalMembers),
      Female: getPercent(f_age_18_29.count, totalMembers),
      Other: getPercent(o_age_18_29.count, totalMembers),
      Noanswer: getPercent(n_age_18_29.count, totalMembers),
      members: m_age_18_29.members
        .concat(f_age_18_29.members)
        .concat(o_age_18_29.members)
        .concat(n_age_18_29.members),
    });
    demographicData.push({
      ageGroup: '30-35',
      Male: getPercent(m_age_30_35.count, totalMembers),
      Female: getPercent(f_age_30_35.count, totalMembers),
      Other: getPercent(o_age_30_35.count, totalMembers),
      Noanswer: getPercent(n_age_30_35.count, totalMembers),
      members: m_age_30_35.members
        .concat(f_age_30_35.members)
        .concat(o_age_30_35.members)
        .concat(n_age_30_35.members),
    });
    demographicData.push({
      ageGroup: '36-40',
      Male: getPercent(m_age_36_40.count, totalMembers),
      Female: getPercent(f_age_36_40.count, totalMembers),
      Other: getPercent(o_age_36_40.count, totalMembers),
      Noanswer: getPercent(n_age_36_40.count, totalMembers),
      members: m_age_36_40.members
        .concat(f_age_36_40.members)
        .concat(o_age_36_40.members)
        .concat(n_age_36_40.members),
    });
    demographicData.push({
      ageGroup: '41-45',
      Male: getPercent(m_age_41_45.count, totalMembers),
      Female: getPercent(f_age_41_45.count, totalMembers),
      Other: getPercent(o_age_41_45.count, totalMembers),
      Noanswer: getPercent(n_age_41_45.count, totalMembers),
      members: m_age_41_45.members
        .concat(f_age_41_45.members)
        .concat(o_age_41_45.members)
        .concat(n_age_41_45.members),
    });
    demographicData.push({
      ageGroup: '46-50',
      Male: getPercent(m_age_46_50.count, totalMembers),
      Female: getPercent(f_age_46_50.count, totalMembers),
      Other: getPercent(o_age_46_50.count, totalMembers),
      Noanswer: getPercent(n_age_46_50.count, totalMembers),
      members: m_age_46_50.members
        .concat(f_age_46_50.members)
        .concat(o_age_46_50.members)
        .concat(n_age_46_50.members),
    });
    demographicData.push({
      ageGroup: '51+',
      Male: getPercent(m_age_51_plus.count, totalMembers),
      Female: getPercent(f_age_51_plus.count, totalMembers),
      Other: getPercent(o_age_51_plus.count, totalMembers),
      Noanswer: getPercent(n_age_51_plus.count, totalMembers),
      members: m_age_51_plus.members
        .concat(f_age_51_plus.members)
        .concat(o_age_51_plus.members)
        .concat(n_age_51_plus.members),
    });

    return demographicData;
  }

  getMalePercent(allMembers) {
    if (!allMembers || allMembers.length <= 0) {
      return 0;
    }
    let maleTotal = 0;
    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        let gender = member.values['Gender'];
        if (gender === 'Male') {
          maleTotal++;
        }
      }
    });

    //return Math.round((maleTotal * 100) / allMembers.length);
    return maleTotal;
  }

  getFemalePercent(allMembers) {
    if (!allMembers || allMembers.length <= 0) {
      return 0;
    }
    let femaleTotal = 0;
    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        let gender = member.values['Gender'];
        if (gender === 'Female') {
          femaleTotal++;
        }
      }
    });

    //  return Math.round((femaleTotal * 100) / allMembers.length);
    return femaleTotal;
  }

  getOtherPercent(allMembers) {
    if (!allMembers || allMembers.length <= 0) {
      return 0;
    }
    let otherTotal = 0;
    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        let gender = member.values['Gender'];
        if (gender === 'Other') {
          otherTotal++;
        }
      }
    });

    //  return Math.round((femaleTotal * 100) / allMembers.length);
    return otherTotal;
  }

  getNoanswerPercent(allMembers) {
    if (!allMembers || allMembers.length <= 0) {
      return 0;
    }
    let noanswerTotal = 0;
    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        let gender = member.values['Gender'];
        if (gender === 'Prefer not to answer') {
          noanswerTotal++;
        }
      }
    });

    //  return Math.round((femaleTotal * 100) / allMembers.length);
    return noanswerTotal;
  }

  renderCusomizedLegend(props) {
    return (
      <ul
        className="recharts-default-legend"
        style={{ padding: '0px', margin: '0px', textAlign: 'center' }}
      >
        <li
          className="recharts-legend-item legend-item-0"
          style={{ display: 'inline-block', marginRight: '10px' }}
        >
          <svg
            className="recharts-surface"
            viewBox="0 0 32 32"
            version="1.1"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '4px',
              width: '14px',
              height: '14px',
            }}
          >
            <path
              stroke="none"
              fill="#4472c4"
              d="M0,4h32v24h-32z"
              className="recharts-legend-icon"
            />
          </svg>
          <span className="recharts-legend-item-text">
            Male {this.state.malePercent}
          </span>
        </li>
        <li
          className="recharts-legend-item legend-item-0"
          style={{ display: 'inline-block', marginRight: '10px' }}
        >
          <svg
            className="recharts-surface"
            viewBox="0 0 32 32"
            version="1.1"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '4px',
              width: '14px',
              height: '14px',
            }}
          >
            <path
              stroke="none"
              fill="#ff99cc"
              d="M0,4h32v24h-32z"
              className="recharts-legend-icon"
            />
          </svg>
          <span className="recharts-legend-item-text">
            Female {this.state.femalePercent}
          </span>
        </li>
        {getAttributeValue(this.props.space, 'Additional Gender Options') ===
          'YES' && (
          <li
            className="recharts-legend-item legend-item-0"
            style={{ display: 'inline-block', marginRight: '10px' }}
          >
            <svg
              className="recharts-surface"
              viewBox="0 0 32 32"
              version="1.1"
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '4px',
                width: '14px',
                height: '14px',
              }}
            >
              <path
                stroke="none"
                fill="#a9f4a9"
                d="M0,4h32v24h-32z"
                className="recharts-legend-icon"
              />
            </svg>
            <span className="recharts-legend-item-text">
              Other {this.state.otherPercent}
            </span>
          </li>
        )}
        {getAttributeValue(this.props.space, 'Additional Gender Options') ===
          'YES' && (
          <li
            className="recharts-legend-item legend-item-0"
            style={{ display: 'inline-block', marginRight: '10px' }}
          >
            <svg
              className="recharts-surface"
              viewBox="0 0 32 32"
              version="1.1"
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '4px',
                width: '14px',
                height: '14px',
              }}
            >
              <path
                stroke="none"
                fill="#ecd590"
                d="M0,4h32v24h-32z"
                className="recharts-legend-icon"
              />
            </svg>
            <span className="recharts-legend-item-text">
              Prefer not to answer {this.state.noanswerPercent}
            </span>
          </li>
        )}
      </ul>
    );
  }

  yAxisTickFormatter(value) {
    return value + '';
  }

  xAxisTickFormatter(ageGroup) {
    return ageGroup;
  }

  toolTipFormatter(value, name, payload) {
    return payload.value + '';
  }

  toolTipLabelFormatter(label) {
    return 'Age Group: ' + label;
  }
  membersOnClick(e) {
    console.log(e.members.length);
    this.setState({
      members: e.members,
      showMembers: true,
    });
  }
  getMembers(members, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 4) {
      //if (i % (col-1) === 0){
      members_col[members_col.length] = {
        memberId: members[i].id,
        name: members[i].name,
      };
      //}
    }

    return members_col;
  }

  getMemberTableData(members) {
    let members_col1 = this.getMembers(members, 1);
    let members_col2 = this.getMembers(members, 2);
    let members_col3 = this.getMembers(members, 3);
    let members_col4 = this.getMembers(members, 4);

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
          members_col3: members_col3,
          members_col4: members_col4,
        },
      },
    ];
  }
  getMemberColumns = () => {
    return [
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col1['memberId']}`}
              className=""
            >
              {props.original.members_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col2['memberId']}`}
              className=""
            >
              {props.original.members_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col3['memberId']}`}
              className=""
            >
              {props.original.members_col3['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col4['memberId']}`}
              className=""
            >
              {props.original.members_col4['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getMemberTableColumns(row) {
    return [
      {
        accessor: 'members',
        Header: 'Members',
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let members_col1 = props.value.members_col1;
          let members_col2 = props.value.members_col2;
          let members_col3 = props.value.members_col3;
          let members_col4 = props.value.members_col4;

          let members = [];
          for (var i = 0; i < members_col1.length; i++) {
            members[members.length] = {
              members_col1: members_col1[i],
              members_col2:
                members_col2.length > i ? members_col2[i] : undefined,
              members_col3:
                members_col3.length > i ? members_col3[i] : undefined,
              members_col4:
                members_col4.length > i ? members_col4[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getMemberColumns}
              pageSize={members_col1.length > 20 ? 20 : members_col1.length}
              showPagination={members_col1.length > 20 ? true : false}
              data={members}
            />
          );
        },
      },
    ];
  }

  render() {
    const { data, malePercent, femalePercent } = this.state;
    return (
      <span>
        <div className="page-header"> Demographics</div>
        {this.state.showMembers && (
          <div className="memberChartDetails">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showMembers: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getMemberTableColumns()}
              data={this.getMemberTableData(this.state.members)}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}
        {!this.state.showMembers && (
          <div className="demographicsChart">
            <ResponsiveContainer minHeight={370}>
              <BarChart
                width={600}
                height={370}
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                isAnimationActive={false}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ageGroup"
                  tickFormatter={this.xAxisTickFormatter}
                />
                <YAxis tickFormatter={this.yAxisTickFormatter} />
                <Tooltip
                  labelFormatter={this.toolTipLabelFormatter}
                  formatter={this.toolTipFormatter}
                />
                <Legend content={this.renderCusomizedLegend} />
                <Bar
                  dataKey="Male"
                  fill="#4472c4"
                  style={{ cursor: 'pointer' }}
                  onClick={this.membersOnClick}
                />
                <Bar
                  dataKey="Female"
                  fill="#ff99cc"
                  style={{ cursor: 'pointer' }}
                  onClick={this.membersOnClick}
                />
                {getAttributeValue(
                  this.props.space,
                  'Additional Gender Options',
                ) === 'YES' && (
                  <Bar
                    dataKey="Other"
                    fill="#a9f4a9"
                    style={{ cursor: 'pointer' }}
                    onClick={this.membersOnClick}
                  />
                )}
                {getAttributeValue(
                  this.props.space,
                  'Additional Gender Options',
                ) === 'YES' && (
                  <Bar
                    dataKey="Noanswer"
                    fill="#ecd590"
                    style={{ cursor: 'pointer' }}
                    onClick={this.membersOnClick}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </span>
    );
  }
}
function getAgeInYears(dob) {
  let date = moment(dob, 'YYYY-MM-DD').toDate();
  return moment().diff(date, 'years');
}

function getPercent(members, totalMembers) {
  if (!members) {
    return 0;
  }
  //  return Math.round((members * 100) / totalMembers);
  return members;
}

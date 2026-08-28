import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { PageTitle, Loading } from 'common';
import {
  I18n,
  fetchSubmission,
  searchSubmissions,
  SubmissionSearch,
} from '@kineticdata/react';
import { actions } from '../../../redux/modules/priceIncreases';
import NumberFormat from 'react-number-format';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import moment from 'moment';
import { EmailTemplateContainer } from '../journeytriggers/EmailTemplate';
import { PopConfirm } from '../../shared/PopConfirm';
import { Button } from 'reactstrap';
import { actions as memberActions } from 'gbmembers/src/redux/modules/members';
import { getAttributeValue } from 'gbmembers/src/lib/react-kinops-components/src/utils';
import ReactTooltip from 'react-tooltip';
import {
  getJson,
  getCurrency,
} from 'gbmembers/src/components/Member/MemberUtils';

const PRICE_INCREASE_EMAIL_TEMPLATE =
  '{"counters":{"u_column":1,"u_row":1,"u_content_image":1,"u_content_text":2,"u_content_html":1},"body":{"id":"-VfYj_ccH9","rows":[{"id":"eYZGpT3CAh","cells":[1],"columns":[{"id":"sKRYJoIzsW","contents":[{"id":"s3jq8xeNTj","type":"image","values":{"containerPadding":"10px","anchor":"","src":{"url":"https://images.unlayer.com/projects/0/1656655080676-Untitled%20design.png","width":600,"height":200,"dynamic":true},"textAlign":"center","altText":"","action":{"name":"web","values":{"href":"","target":"_blank"}},"hideDesktop":false,"displayCondition":null,"_styleGuide":null,"_meta":{"htmlID":"u_content_image_1","htmlClassNames":"u_content_image"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false,"pending":false}},{"id":"qU9p6GFGBm","type":"text","values":{"containerPadding":"10px","anchor":"","fontSize":"14px","textAlign":"left","lineHeight":"140%","linkStyle":{"inherit":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"hideDesktop":false,"displayCondition":null,"_styleGuide":null,"_meta":{"htmlID":"u_content_text_1","htmlClassNames":"u_content_text"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false,"text":"<p>Hi member(\'First Name\'),</p>"}},{"id":"Akc9uSWDyn","type":"html","values":{"html":"The following billing changes have been applied: $price_increase_change$","hideDesktop":false,"displayCondition":null,"_styleGuide":null,"containerPadding":"10px","anchor":"","_meta":{"htmlID":"u_content_html_1","htmlClassNames":"u_content_html"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false}},{"id":"JLYdH9JKv-","type":"text","values":{"containerPadding":"10px","anchor":"","fontSize":"14px","textAlign":"left","lineHeight":"140%","linkStyle":{"inherit":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"hideDesktop":false,"displayCondition":null,"_styleGuide":null,"_meta":{"htmlID":"u_content_text_2","htmlClassNames":"u_content_text"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false,"text":"<p style=\\"line-height: 140%;\\"><span style=\\"line-height: 19.6px;\\">Kind Regards,</span></p>\\n<p style=\\"line-height: 140%;\\"><span style=\\"line-height: 19.6px;\\"><strong>${spaceAttributes(\'School Name\')}</strong></span></p>\\n<p style=\\"line-height: 140%;\\"><span style=\\"line-height: 19.6px;\\">Address: ${spaceAttributes(\'School Address\')}</span></p>\\n<p style=\\"line-height: 140%;\\"><span style=\\"line-height: 19.6px;\\">Phone: ${spaceAttributes(\'School Telephone\')}</span></p>"}}],"values":{"backgroundColor":"","padding":"0px","border":{},"borderRadius":"0px","_meta":{"htmlID":"u_column_1","htmlClassNames":"u_column"},"deletable":true}}],"values":{"displayCondition":null,"columns":false,"_styleGuide":null,"backgroundColor":"","columnsBackgroundColor":"","backgroundImage":{"url":"","fullWidth":true,"repeat":"no-repeat","size":"custom","position":"center","customPosition":["50%","50%"]},"padding":"0px","anchor":"","hideDesktop":false,"_meta":{"htmlID":"u_row_1","htmlClassNames":"u_row"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false}}],"headers":[],"footers":[],"values":{"_styleGuide":null,"popupPosition":"center","popupDisplayDelay":0,"popupWidth":"600px","popupHeight":"auto","borderRadius":"10px","contentAlign":"center","contentVerticalAlign":"center","contentWidth":"500px","fontFamily":{"label":"Arial","value":"arial,helvetica,sans-serif"},"textColor":"#000000","popupBackgroundColor":"#FFFFFF","popupBackgroundImage":{"url":"","fullWidth":true,"repeat":"no-repeat","size":"cover","position":"center"},"popupOverlay_backgroundColor":"rgba(0, 0, 0, 0.1)","popupCloseButton_position":"top-right","popupCloseButton_backgroundColor":"#DDDDDD","popupCloseButton_iconColor":"#000000","popupCloseButton_borderRadius":"0px","popupCloseButton_margin":"0px","popupCloseButton_action":{"name":"close_popup","attrs":{"onClick":"document.querySelector(\'.u-popup-container\').style.display = \'none\';"}},"language":{},"backgroundColor":"#FFFFFF","preheaderText":"","linkStyle":{"body":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"backgroundImage":{"url":"","fullWidth":true,"repeat":"no-repeat","size":"custom","position":"center"},"accessibilityTitle":"","_meta":{"htmlID":"u_body","htmlClassNames":"u_body"}}}}';

export const mapStateToProps = state => {
  return {
    space: state.app.space,
    priceIncreases: state.space.priceIncreases.priceIncreases,
    priceIncreasesLoading: state.space.priceIncreases.priceIncreasesLoading,
    membershipFees: state.space.priceIncreases.membershipFees,
    membershipFeesLoading: state.space.priceIncreases.membershipFeesLoading,
    allMembers: state.member.members.allMembers,
    membersLoading: state.member.members.membersLoading,
    memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
    membersNextPageToken: state.member.members.membersNextPageToken,
    memberLastFetchTime: state.member.members.memberLastFetchTime,
  };
};

export const mapDispatchToProps = {
  fetchMembers: memberActions.fetchMembers,
  fetchPriceIncreases: actions.fetchPriceIncreases,
  fetchAllMembershipFees: actions.fetchAllMembershipFees,
  createPriceIncrease: actions.createPriceIncrease,
  updatePriceIncrease: actions.updatePriceIncrease,
  deletePriceIncrease: actions.deletePriceIncrease,
};

export class NewPriceIncrease extends Component {
  constructor(props) {
    super(props);
    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }
    this.state = {
      name: '',
      increaseType: 'fixedAmount',
      fixedAmount: '',
      percentage: '',
      selectedFees: [],
      showSchedule: false,
      scheduledDateTime: '',
      excludedMembers: [],
      affectedMemberFilter: '',
      doNotSendEmail: false,
      emailTemplateName: '',
      emailTemplateID: undefined,
      showEmailDialog: false,
      excludeFamilyAccounts: false,
      excludeIncreasesFrom: '',
      excludedFromIncreaseMembers: [],
      excludeNewMembersFrom: '',
      excludedNewMembers: [],
      priceIncreaseTemplates: [],
      selectedExistingTemplateID: '',
      submitting: false,
      submitError: null,
    };
    this.toggleFee = this.toggleFee.bind(this);
    this.toggleExcludeMember = this.toggleExcludeMember.bind(this);
    this.fetchExcludedFromIncreases = this.fetchExcludedFromIncreases.bind(
      this,
    );
    this.applyNewMemberExclusion = this.applyNewMemberExclusion.bind(this);
    this.createNewPriceIncrease = this.createNewPriceIncrease.bind(this);
  }
  fetchExcludedFromIncreases(dateStr) {
    if (!dateStr) {
      this.setState(prev => ({
        excludedMembers: prev.excludedMembers.filter(
          id => !prev.excludedFromIncreaseMembers.includes(id),
        ),
        excludedFromIncreaseMembers: [],
      }));
      return;
    }
    const fromDate = moment(dateStr, 'YYYY-MM-DD').startOf('day');
    const completedIncreases = (this.props.priceIncreases || []).filter(
      pi =>
        pi.values['Status'] === 'Completed' &&
        moment(pi.updatedAt).isSameOrAfter(fromDate),
    );
    if (completedIncreases.length === 0) {
      this.setState(prev => ({
        excludedMembers: prev.excludedMembers.filter(
          id => !prev.excludedFromIncreaseMembers.includes(id),
        ),
        excludedFromIncreaseMembers: [],
      }));
      return;
    }
    Promise.all(
      completedIncreases.map(pi =>
        searchSubmissions({
          datastore: true,
          form: 'member-price-increase',
          search: new SubmissionSearch(true)
            .index('values[Price Increase ID]')
            .eq('values[Price Increase ID]', pi.id)
            .include('values')
            .limit(1000)
            .build(),
        }).then(({ submissions }) => submissions || []),
      ),
    ).then(results => {
      const memberIds = [
        ...new Set(
          results
            .flat()
            .map(s => s.values['Member GUID'])
            .filter(Boolean),
        ),
      ];
      this.setState(prev => ({
        excludedFromIncreaseMembers: memberIds,
        excludedMembers: [
          ...new Set([
            ...prev.excludedMembers.filter(
              id => !prev.excludedFromIncreaseMembers.includes(id),
            ),
            ...memberIds,
          ]),
        ],
      }));
    });
  }
  applyNewMemberExclusion(dateStr) {
    if (!dateStr) {
      this.setState(prev => ({
        excludedMembers: prev.excludedMembers.filter(
          id => !prev.excludedNewMembers.includes(id),
        ),
        excludedNewMembers: [],
        excludeNewMembersFrom: '',
      }));
      return;
    }
    const fromDate = moment(dateStr, 'YYYY-MM-DD').startOf('day');
    const newMemberIds = (this.props.allMembers || [])
      .filter(m => {
        if (m.values['Billing User'] !== 'YES') return false;
        const dj = m.values['Date Joined'];
        return dj && moment(dj, 'YYYY-MM-DD').isSameOrAfter(fromDate, 'day');
      })
      .map(m => m.id);
    this.setState(prev => ({
      excludeNewMembersFrom: dateStr,
      excludedNewMembers: newMemberIds,
      excludedMembers: [
        ...new Set([
          ...prev.excludedMembers.filter(
            id => !prev.excludedNewMembers.includes(id),
          ),
          ...newMemberIds,
        ]),
      ],
    }));
  }
  toggleFee(program, info) {
    const infoKey = info || '';
    this.setState(prev => {
      const selected = prev.selectedFees;
      const exists = selected.some(
        s => s.program === program && s.info === infoKey,
      );
      return exists
        ? {
            selectedFees: selected.filter(
              s => !(s.program === program && s.info === infoKey),
            ),
          }
        : { selectedFees: [...selected, { program, info: infoKey }] };
    });
  }

  toggleExcludeMember(memberId) {
    this.setState(prev => {
      const excluded = prev.excludedMembers;
      return excluded.includes(memberId)
        ? { excludedMembers: excluded.filter(id => id !== memberId) }
        : { excludedMembers: [...excluded, memberId] };
    });
  }
  computeFamilyIds() {
    const allMembers = this.props.allMembers || [];
    const { selectedFees } = this.state;
    if (selectedFees.length === 0) return [];
    return allMembers.reduce((acc, member) => {
      if (member.values['Status'] !== 'Active') return acc;
      if (
        member.values['Non Paying'] === 'YES' ||
        member.values['Billing Payment Type'] === 'Cash'
      )
        return acc;
      const feeDetails = getJson(member.values['Family Fee Details']);
      if (feeDetails.length <= 1) return acc;
      const matched = feeDetails.filter(d =>
        selectedFees.some(
          s =>
            d.program === s.program + ' - ' + s.info ||
            d.program === s.program + '-' + s.info,
        ),
      );
      matched.forEach(d => acc.push(d.id));
      return acc;
    }, []);
  }
  componentDidMount() {
    searchSubmissions({
      datastore: true,
      form: 'email-templates',
      search: new SubmissionSearch()
        .includes(['values'])
        .limit(1000)
        .build(),
    }).then(({ submissions }) => {
      this.setState({
        priceIncreaseTemplates: (submissions || []).filter(
          t => t.values['Category'] === 'Price Increase',
        ),
      });
    });
  }
  componentDidUpdate(_prevProps, prevState) {
    if (
      this.state.excludeFamilyAccounts &&
      prevState.selectedFees !== this.state.selectedFees
    ) {
      const familyIds = this.computeFamilyIds();
      this.setState(prev => ({
        excludedMembers: [...new Set([...prev.excludedMembers, ...familyIds])],
      }));
    }
  }
  computeBillingMembers() {
    const allMembers = this.props.allMembers || [];
    const membersById = allMembers.reduce((map, m) => {
      map[m.id] = m;
      return map;
    }, {});
    const { selectedFees, excludedMembers } = this.state;
    return [
      ...new Set(
        allMembers.reduce((acc, member) => {
          if (member.values['Status'] !== 'Active') return acc;
          if (
            member.values['Non Paying'] === 'YES' ||
            member.values['Billing Payment Type'] === 'Cash'
          )
            return acc;
          const feeDetails = getJson(member.values['Family Fee Details']);
          const matched = feeDetails.filter(d =>
            selectedFees.some(
              s =>
                d.program === s.program + ' - ' + s.info ||
                d.program === s.program + '-' + s.info,
            ),
          );
          matched.forEach(d => {
            if (!excludedMembers.includes(d.id)) {
              const m = membersById[d.id];
              if (m && m.values['Billing User'] === 'YES') acc.push(d.id);
            }
          });
          return acc;
        }, []),
      ),
    ];
  }

  createNewPriceIncrease() {
    const hasSchedule =
      this.state.showSchedule &&
      this.state.scheduledDateTime !== '' &&
      moment(this.state.scheduledDateTime).isAfter(moment());
    let values = {};
    values['Status'] = hasSchedule ? 'Scheduled' : 'New';
    values['Name'] = this.state.name;
    values['Increase Type'] =
      this.state.increaseType === 'fixedAmount' ? 'Fixed Amount' : 'Percentage';
    values['Fixed Amount'] = this.state.fixedAmount;
    values['Percentage'] = this.state.percentage;
    values['Membership Fees Selected'] = this.state.selectedFees;
    values['Scheduled Date Time'] = hasSchedule
      ? this.state.scheduledDateTime
      : '';
    values['Excluded Members'] = this.state.excludedMembers;
    values['Billing Members'] = this.computeBillingMembers();
    values['Do Not Send Email'] = this.state.doNotSendEmail ? 'YES' : '';
    values['Email Template Name'] = this.state.doNotSendEmail
      ? ''
      : this.state.emailTemplateName;
    values['Email Template ID'] = this.state.doNotSendEmail
      ? ''
      : this.state.emailTemplateID;

    this.setState({ submitting: true, submitError: null });
    this.props.createPriceIncrease({
      values: values,
      onSuccess: () => this.props.cancelNewIncrease(),
      onError: msg => this.setState({ submitting: false, submitError: msg }),
    });
  }

  render() {
    const { membershipFees, allMembers } = this.props;
    const { selectedFees } = this.state;
    const toCamelCase = str =>
      str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '-';

    const seenFeeKeys = new Set();
    const visibleFees = [];
    (allMembers || []).forEach(member => {
      if (member.values['Status'] !== 'Active') return;
      getJson(member.values['Family Fee Details']).forEach(d => {
        if (!d.feeProgram) return;
        const key = `${d.feeProgram}||${d.program || ''}`;
        if (!seenFeeKeys.has(key)) {
          seenFeeKeys.add(key);
          const info =
            d.program &&
            d.feeProgram &&
            d.program.startsWith(d.feeProgram + ' - ')
              ? d.program.slice(d.feeProgram.length + 3)
              : d.program &&
                d.feeProgram &&
                d.program.startsWith(d.feeProgram + '-')
                ? d.program.slice(d.feeProgram.length + 1)
                : '';
          const mf = (membershipFees || []).find(
            f =>
              f.values['Program'] === d.feeProgram &&
              (f.values['Info'] || '') === info,
          );
          visibleFees.push({
            id: key,
            values: {
              Program: d.feeProgram,
              Info: info,
              Status: mf ? mf.values['Status'] : '',
              Frequency: mf ? mf.values['Frequency'] : '',
              Fee: d.cost || d.fee || '',
            },
          });
        }
      });
    });

    const membersById = (allMembers || []).reduce((map, m) => {
      map[m.id] = m;
      return map;
    }, {});

    const matchingMembers =
      selectedFees.length > 0
        ? (allMembers || []).reduce((acc, member) => {
            if (member.values['Status'] !== 'Active') return acc;
            if (member.values['Billing User'] !== 'YES') return acc;
            if (
              member.values['Non Paying'] === 'YES' ||
              member.values['Billing Payment Type'] === 'Cash'
            )
              return acc;
            const feeDetails = getJson(member.values['Family Fee Details']);
            const matched = feeDetails.filter(d =>
              selectedFees.some(
                s =>
                  d.program === s.program + ' - ' + s.info ||
                  d.program === s.program + '-' + s.info,
              ),
            );
            if (matched.length > 0) {
              matched[0].memberID = member.id;
              acc.push({ member, matched });
            }
            return acc;
          }, [])
        : [];

    const {
      name,
      increaseType,
      fixedAmount,
      percentage,
      scheduledDateTime,
      showSchedule,
    } = this.state;
    const isValidBase =
      name.trim() !== '' &&
      (increaseType === 'fixedAmount'
        ? fixedAmount !== ''
        : percentage !== '') &&
      selectedFees.length > 0;
    const isScheduleValid =
      scheduledDateTime !== '' && moment(scheduledDateTime).isAfter(moment());
    const isValid =
      isValidBase &&
      (!showSchedule ||
        (isScheduleValid &&
          (!!this.state.emailTemplateID || this.state.doNotSendEmail)));

    return (
      <div className="newPriceIncrease">
        <div className="settingsHeader">
          <h6>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#27ae60"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            New Price Increase
          </h6>
          <span className="line" />
        </div>
        <div className="newIncreaseForm">
          <div className="formField">
            <label>
              <I18n>Name</I18n>{' '}
              {name.trim() === '' && <span className="requiredMark">*</span>}
            </label>
            <input
              type="text"
              className="form-control"
              value={this.state.name}
              onChange={e => this.setState({ name: e.target.value })}
            />
          </div>
          <div className="formField">
            <label>
              <I18n>Increase Type</I18n>
            </label>
            <div className="radioGroup">
              <label>
                <input
                  type="radio"
                  value="fixedAmount"
                  checked={this.state.increaseType === 'fixedAmount'}
                  onChange={() =>
                    this.setState({
                      increaseType: 'fixedAmount',
                      percentage: '',
                    })
                  }
                />
                <I18n>Fixed Amount</I18n>
              </label>
              <label>
                <input
                  type="radio"
                  value="percentage"
                  checked={this.state.increaseType === 'percentage'}
                  onChange={() =>
                    this.setState({
                      increaseType: 'percentage',
                      fixedAmount: '',
                    })
                  }
                />
                <I18n>Percentage</I18n>
              </label>
            </div>
          </div>

          {this.state.increaseType === 'fixedAmount' && (
            <div className="formField">
              <label>
                <I18n>Fixed Amount</I18n>{' '}
                {fixedAmount === '' && <span className="requiredMark">*</span>}
              </label>
              <NumberFormat
                value={this.state.fixedAmount}
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                onValueChange={values =>
                  this.setState({ fixedAmount: values.value })
                }
                className="form-control"
              />
            </div>
          )}
          {this.state.increaseType === 'percentage' && (
            <div className="formField">
              <label>
                <I18n>Percentage</I18n>{' '}
                {percentage === '' && <span className="requiredMark">*</span>}
              </label>
              <NumberFormat
                value={this.state.percentage}
                suffix="%"
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                isAllowed={({ floatValue }) =>
                  floatValue === undefined || floatValue <= 100
                }
                onValueChange={values =>
                  this.setState({ percentage: values.value })
                }
                className="form-control"
              />
            </div>
          )}
          {getAttributeValue(this.props.space, 'Billing Company') ===
            'PaySmart' && (
            <div className="formField">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'normal',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={this.state.excludeFamilyAccounts}
                  onChange={e => {
                    const checked = e.target.checked;
                    const familyIds = this.computeFamilyIds();
                    this.setState(prev => ({
                      excludeFamilyAccounts: checked,
                      excludedMembers: checked
                        ? [...new Set([...prev.excludedMembers, ...familyIds])]
                        : prev.excludedMembers.filter(
                            id => !familyIds.includes(id),
                          ),
                    }));
                  }}
                />
                <I18n>Exclude Family Accounts</I18n>
                <span
                  data-tip="This checkbox will detect and exclude all members that are part of a Family Billing"
                  data-for="exclude-family-tip"
                  style={{
                    cursor: 'help',
                    color: '#888',
                    marginLeft: '4px',
                    fontSize: '14px',
                  }}
                >
                  &#9432;
                </span>
                <ReactTooltip
                  id="exclude-family-tip"
                  place="right"
                  effect="solid"
                  multiline={true}
                  style={{ maxWidth: '300px' }}
                />
              </label>
            </div>
          )}
          <div className="formField">
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <I18n>Exclude Increases From</I18n>
              <span
                data-tip="Any members that have had an increase applied since this date, will be checked as exclude in the Affected Members table, and will display an orange arrow."
                data-for="exclude-from-tip"
                style={{ cursor: 'help', color: '#888', fontSize: '14px' }}
              >
                &#9432;
              </span>
              <ReactTooltip
                id="exclude-from-tip"
                place="right"
                effect="solid"
                multiline={true}
                style={{ maxWidth: '300px' }}
              />
            </label>
            <input
              type="date"
              className="form-control"
              value={this.state.excludeIncreasesFrom}
              onChange={e => {
                const val = e.target.value;
                this.setState({ excludeIncreasesFrom: val });
                this.fetchExcludedFromIncreases(val);
              }}
            />
          </div>
          <div className="formField">
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <I18n>Exclude New Members</I18n>
              <span
                data-tip="Any members signed up from this date will be excluded from the Affected Members table an have a green NEW in the row."
                data-for="exclude-new-members-tip"
                style={{ cursor: 'help', color: '#888', fontSize: '14px' }}
              >
                &#9432;
              </span>
              <ReactTooltip
                id="exclude-new-members-tip"
                place="right"
                effect="solid"
                multiline={true}
                style={{ maxWidth: '300px' }}
              />
            </label>
            <input
              type="date"
              className="form-control"
              value={this.state.excludeNewMembersFrom}
              onChange={e => this.applyNewMemberExclusion(e.target.value)}
            />
          </div>
          <div className="formField">
            <label>
              <I18n>Membership Fees</I18n>{' '}
              {selectedFees.length === 0 && (
                <span className="requiredMark">*</span>
              )}
              {selectedFees.length > 0 && (
                <span className="matchCount">
                  {' '}
                  ({selectedFees.length} selected)
                </span>
              )}
            </label>
            {visibleFees.length === 0 ? (
              <span className="noFees">
                <I18n>No membership fees available</I18n>
              </span>
            ) : (
              <div className="feeCheckList">
                <div className="feeCheckHeader">
                  <span className="feeColCheck">
                    <input
                      type="checkbox"
                      title="Select all"
                      checked={
                        visibleFees.length > 0 &&
                        visibleFees.every(fee =>
                          this.state.selectedFees.some(
                            s =>
                              s.program === fee.values['Program'] &&
                              s.info === (fee.values['Info'] || ''),
                          ),
                        )
                      }
                      onChange={e => {
                        if (e.target.checked) {
                          const toAdd = visibleFees.filter(
                            fee =>
                              !this.state.selectedFees.some(
                                s =>
                                  s.program === fee.values['Program'] &&
                                  s.info === (fee.values['Info'] || ''),
                              ),
                          );
                          this.setState(prev => ({
                            selectedFees: [
                              ...prev.selectedFees,
                              ...toAdd.map(fee => ({
                                program: fee.values['Program'],
                                info: fee.values['Info'] || '',
                              })),
                            ],
                          }));
                        } else {
                          this.setState(prev => ({
                            selectedFees: prev.selectedFees.filter(
                              s =>
                                !visibleFees.some(
                                  fee =>
                                    fee.values['Program'] === s.program &&
                                    (fee.values['Info'] || '') === s.info,
                                ),
                            ),
                          }));
                        }
                      }}
                    />
                  </span>
                  <span className="feeColName">Program</span>
                  <span className="feeColStatus">Status</span>
                  <span className="feeColFrequency">Frequency</span>
                  <span className="feeColAmount">Fee</span>
                </div>
                {visibleFees.map(fee => {
                  const isInactive =
                    fee.values['Status'] &&
                    fee.values['Status'].toLowerCase() === 'inactive';
                  return (
                    <label
                      key={fee.id}
                      className={`feeCheckItem${
                        isInactive ? ' feeInactive' : ''
                      }`}
                    >
                      <span className="feeColCheck">
                        <input
                          type="checkbox"
                          checked={this.state.selectedFees.some(
                            s =>
                              s.program === fee.values['Program'] &&
                              s.info === (fee.values['Info'] || ''),
                          )}
                          onChange={() =>
                            this.toggleFee(
                              fee.values['Program'],
                              fee.values['Info'],
                            )
                          }
                        />
                      </span>
                      <span className="feeColName">
                        <span className="feeProgram">
                          {fee.values['Program']}
                        </span>
                        {fee.values['Info'] && (
                          <span className="feeInfo">{fee.values['Info']}</span>
                        )}
                      </span>
                      <span className="feeColStatus">
                        {toCamelCase(fee.values['Status'])}
                      </span>
                      <span className="feeColFrequency">
                        {fee.values['Frequency'] || '-'}
                      </span>
                      <span className="feeColAmount">
                        {this.currencySymbol}
                        {fee.values['Fee']}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          {matchingMembers.length > 0 && (
            <div className="formField">
              <label>
                <I18n>Affected Members</I18n>
                <span className="matchCount">
                  {' '}
                  ({
                    new Set(
                      matchingMembers.flatMap(({ matched }) =>
                        matched.map(d => d.id),
                      ),
                    ).size
                  })
                </span>
                {(() => {
                  const visibleExcluded = matchingMembers
                    .flatMap(({ matched }) => matched.map(d => d.id))
                    .filter(id => this.state.excludedMembers.includes(id))
                    .length;
                  return visibleExcluded > 0 ? (
                    <span className="excludeCount">
                      {' '}
                      — {visibleExcluded} excluded
                    </span>
                  ) : null;
                })()}
                <button
                  type="button"
                  className="btn btn-link btn-sm affectedExportBtn"
                  onClick={() => {
                    const escape = v =>
                      `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
                    const rows = [
                      [
                        'Last Name',
                        'First Name',
                        'Date Joined',
                        'Program',
                        'Info',
                        'Member Type',
                        'Cost',
                        'Excluded',
                      ],
                    ];
                    matchingMembers
                      .flatMap(({ matched }) =>
                        matched.map(d => {
                          const fm = membersById[d.id];
                          const memberName = fm
                            ? `${fm.values['Last Name']} ${
                                fm.values['First Name']
                              }`
                            : d.id;
                          const isDependent = !!(
                            fm &&
                            fm.values['Billing Parent Member'] &&
                            fm.values['Billing Parent Member'] !== fm.id
                          );
                          const parentMember = isDependent
                            ? membersById[fm.values['Billing Parent Member']]
                            : fm;
                          const parentName = parentMember
                            ? `${parentMember.values['Last Name']} ${
                                parentMember.values['First Name']
                              }`
                            : memberName;
                          return { d, fm, memberName, parentName, isDependent };
                        }),
                      )
                      .sort((a, b) => {
                        const keyA = `${a.parentName}|${
                          a.isDependent ? '1' : '0'
                        }|${a.memberName}`;
                        const keyB = `${b.parentName}|${
                          b.isDependent ? '1' : '0'
                        }|${b.memberName}`;
                        return keyA.localeCompare(keyB);
                      })
                      .forEach(({ d, fm }) => {
                        const lastName = fm ? fm.values['Last Name'] : d.id;
                        const firstName = fm ? fm.values['First Name'] : '';
                        const dateJoined = fm
                          ? fm.values['Date Joined'] || ''
                          : '';
                        const memberType = fm ? fm.values['Member Type'] : '';
                        const excluded = this.state.excludedMembers.includes(
                          d.id,
                        )
                          ? 'Yes'
                          : 'No';
                        rows.push([
                          lastName,
                          firstName,
                          dateJoined,
                          d.feeProgram || '',
                          d.program || '',
                          memberType,
                          d.cost || d.fee || '',
                          excluded,
                        ]);
                      });
                    const csv = rows
                      .map(r => r.map(escape).join(','))
                      .join('\r\n');
                    const blob = new Blob([csv], {
                      type: 'text/csv;charset=utf-8;',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'affected-members.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export CSV
                </button>
              </label>
              <div className="mpiFilterBar" style={{ marginBottom: 6 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by name..."
                  value={this.state.affectedMemberFilter}
                  onChange={e =>
                    this.setState({ affectedMemberFilter: e.target.value })
                  }
                />
              </div>
              <div className="matchingMembersList">
                <div className="matchingMembersHeader">
                  <span className="memColExclude">
                    <input
                      type="checkbox"
                      title="Exclude all"
                      checked={
                        matchingMembers.length > 0 &&
                        matchingMembers
                          .flatMap(({ matched }) => matched.map(d => d.id))
                          .every(id => this.state.excludedMembers.includes(id))
                      }
                      onChange={e => {
                        const ids = matchingMembers.flatMap(({ matched }) =>
                          matched.map(d => d.id),
                        );
                        if (e.target.checked) {
                          this.setState(prev => ({
                            excludedMembers: [
                              ...new Set([...prev.excludedMembers, ...ids]),
                            ],
                          }));
                        } else {
                          this.setState(prev => ({
                            excludedMembers: prev.excludedMembers.filter(
                              id => !ids.includes(id),
                            ),
                          }));
                        }
                      }}
                    />{' '}
                    Select → Exclude
                  </span>
                  <span className="memColName">Name</span>
                  <span className="memColFee">Program</span>
                  <span className="memColInfo">Info</span>
                  <span className="memColMemberType">Member Type</span>
                  <span className="memColPaymentMethod">Payment Method</span>
                  <span className="memColDateJoined">Date Joined</span>
                  <span className="memColCost">Cost</span>
                </div>
                {matchingMembers
                  .flatMap(({ member, matched }) =>
                    matched.map(d => {
                      const detailMember = membersById[d.id];
                      const memberName = detailMember
                        ? `${detailMember.values['Last Name']} ${
                            detailMember.values['First Name']
                          }`
                        : d.id;
                      const isFamilyAccount =
                        getJson(member.values['Family Fee Details']).length > 1;
                      const isDependent = !!(
                        detailMember &&
                        detailMember.values['Billing Parent Member'] &&
                        detailMember.values['Billing Parent Member'] !==
                          detailMember.id
                      );
                      const parentMember = isDependent
                        ? membersById[
                            detailMember.values['Billing Parent Member']
                          ]
                        : detailMember;
                      const parentName = parentMember
                        ? `${parentMember.values['Last Name']} ${
                            parentMember.values['First Name']
                          }`
                        : memberName;
                      return {
                        d,
                        detailMember,
                        memberName,
                        parentName,
                        isFamilyAccount,
                        isDependent,
                      };
                    }),
                  )
                  .filter(
                    ({ memberName }) =>
                      !this.state.affectedMemberFilter ||
                      memberName
                        .toLowerCase()
                        .includes(
                          this.state.affectedMemberFilter.toLowerCase(),
                        ),
                  )
                  .sort((a, b) => {
                    const keyA = `${a.parentName}|${
                      a.isDependent ? '1' : '0'
                    }|${a.memberName}`;
                    const keyB = `${b.parentName}|${
                      b.isDependent ? '1' : '0'
                    }|${b.memberName}`;
                    return keyA.localeCompare(keyB);
                  })
                  .map(
                    ({
                      d,
                      detailMember,
                      memberName,
                      isFamilyAccount,
                      isDependent,
                    }) => {
                      const isExcluded = this.state.excludedMembers.includes(
                        d.id,
                      );
                      const hasRecentIncrease = this.state.excludedFromIncreaseMembers.includes(
                        d.id,
                      );
                      const isNewMember = this.state.excludedNewMembers.includes(
                        d.id,
                      );
                      return (
                        <div
                          key={`${d.id}-${d.feeProgram}`}
                          className={`matchingMemberRow${
                            isExcluded ? ' memberExcluded' : ''
                          }${isFamilyAccount ? ' familyAccount' : ''}${
                            isDependent ? ' dependent' : ''
                          }`}
                        >
                          <span className="memColExclude">
                            <input
                              type="checkbox"
                              checked={isExcluded}
                              onChange={() => this.toggleExcludeMember(d.id)}
                            />
                          </span>
                          <span className="memColName">
                            {memberName}
                            {hasRecentIncrease && (
                              <span
                                title="Already had a price increase applied"
                                style={{
                                  marginLeft: '5px',
                                  color: '#e67e22',
                                  fontSize: '13px',
                                  cursor: 'default',
                                }}
                              >
                                ↑
                              </span>
                            )}
                            {isNewMember && (
                              <span
                                title="New member — signed up after the excluded date"
                                style={{
                                  marginLeft: '5px',
                                  color: '#27ae60',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'default',
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </span>
                          <span className="memColFee">{d.feeProgram}</span>
                          <span className="memColInfo">{d.program}</span>
                          <span className="memColMemberType">
                            {detailMember
                              ? detailMember.values['Member Type']
                              : ''}
                          </span>
                          <span className="memColPaymentMethod">
                            {detailMember
                              ? detailMember.values['Billing Payment Type']
                              : ''}
                          </span>
                          <span className="memColDateJoined">
                            {detailMember
                              ? moment(
                                  detailMember.values['Date Joined'],
                                  'YYYY-MM-DD',
                                ).format('L') || ''
                              : ''}
                          </span>
                          <span className="memColCost">
                            {this.currencySymbol}
                            {d.cost || d.fee}
                          </span>
                        </div>
                      );
                    },
                  )}
              </div>
            </div>
          )}
          <div className="formField">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'normal',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={this.state.doNotSendEmail}
                onChange={e =>
                  this.setState({ doNotSendEmail: e.target.checked })
                }
              />
              <I18n>Do not send Email</I18n>
            </label>
          </div>
          {!this.state.doNotSendEmail && (
            <div className="formField">
              <label>
                <I18n>Email Template</I18n>
              </label>
              <div className="emailTemplateField">
                {this.state.emailTemplateName ? (
                  <span className="displayValue">
                    {this.state.emailTemplateName}
                  </span>
                ) : (
                  <span className="noTemplate">No template selected</span>
                )}
                <Button
                  color="link"
                  size="sm"
                  onClick={() => this.setState({ showEmailDialog: true })}
                >
                  <I18n>
                    {this.state.emailTemplateName
                      ? 'Edit Email Template'
                      : 'New Email Template'}
                  </I18n>
                </Button>
                {this.state.priceIncreaseTemplates.length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <select
                      className="form-control"
                      style={{ width: 'auto', display: 'inline-block' }}
                      value={this.state.selectedExistingTemplateID}
                      onChange={e => {
                        const id = e.target.value;
                        const t = this.state.priceIncreaseTemplates.find(
                          t => t.id === id,
                        );
                        this.setState({
                          selectedExistingTemplateID: id,
                          ...(id && {
                            emailTemplateID: id,
                            emailTemplateName: t
                              ? t.values['Template Name']
                              : '',
                          }),
                        });
                      }}
                    >
                      <option value="">Select existing template...</option>
                      {this.state.priceIncreaseTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.values['Template Name']}
                        </option>
                      ))}
                    </select>
                    {this.state.selectedExistingTemplateID && (
                      <Button
                        color="link"
                        size="sm"
                        onClick={() => {
                          const t = this.state.priceIncreaseTemplates.find(
                            t => t.id === this.state.selectedExistingTemplateID,
                          );
                          this.setState({
                            emailTemplateID: this.state
                              .selectedExistingTemplateID,
                            emailTemplateName: t
                              ? t.values['Template Name']
                              : '',
                            showEmailDialog: true,
                            selectedExistingTemplateID: '',
                          });
                        }}
                      >
                        <I18n>Edit</I18n>
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {this.state.showEmailDialog && (
                <EmailTemplateContainer
                  defaultTemplate={
                    !this.state.emailTemplateID
                      ? PRICE_INCREASE_EMAIL_TEMPLATE
                      : undefined
                  }
                  defaultTemplateName={
                    !this.state.emailTemplateID ? this.state.name : undefined
                  }
                  defaultCategory={
                    !this.state.emailTemplateID ? 'Price Increase' : undefined
                  }
                  defaultContentWidth="80%"
                  setShowEmailDialog={show =>
                    this.setState({ showEmailDialog: show })
                  }
                  emailTemplateID={this.state.emailTemplateID}
                  updateTriggerDetails={(_type, details) => {
                    this.setState({
                      emailTemplateName: details.values['Template Name'],
                      emailTemplateID: details.id,
                    });
                  }}
                  journeyTriggers={[]}
                />
              )}
            </div>
          )}
          {this.state.showSchedule && (
            <div className="formField">
              <label>
                <I18n>Scheduled Date Time</I18n>
              </label>
              <Datetime
                value={this.state.scheduledDateTime}
                dateFormat="L"
                timeFormat="hh:mm A"
                isValidDate={current =>
                  current.isSameOrAfter(moment().startOf('day'))
                }
                onChange={dt => this.setState({ scheduledDateTime: dt })}
                inputProps={{
                  className: 'form-control',
                  placeholder: 'L hh:mm AM',
                }}
              />
            </div>
          )}
        </div>
        {this.state.submitError && (
          <div className="submitError">{this.state.submitError}</div>
        )}
        <div className="buttons">
          <Button
            className="cancelButton"
            color="primary"
            onClick={() => {
              this.props.cancelNewIncrease();
            }}
          >
            <I18n>Cancel</I18n>
          </Button>
          <Button
            className="scheduleButton"
            color="secondary"
            onClick={() =>
              this.setState(prev => ({
                showSchedule: !prev.showSchedule,
                scheduledDateTime: prev.showSchedule ? '' : moment(),
              }))
            }
          >
            <I18n>
              {this.state.showSchedule ? 'Remove Schedule' : 'Schedule'}
            </I18n>
          </Button>
          <Button
            className="applyButton"
            color="primary"
            disabled={!isValid || this.state.submitting}
            onClick={() => {
              this.createNewPriceIncrease();
            }}
          >
            <I18n>{this.state.submitting ? 'Saving...' : 'Apply'}</I18n>
          </Button>
        </div>
      </div>
    );
  }
}
export class PriceIncreaseEdit extends Component {
  constructor(props) {
    super(props);
    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }
    const { priceIncrease } = props;
    const storedType = priceIncrease.values['Increase Type'];
    const increaseType =
      storedType === 'Fixed Amount' ? 'fixedAmount' : 'percentage';
    this.state = {
      name: priceIncrease.values['Name'] || '',
      increaseType,
      fixedAmount: priceIncrease.values['Fixed Amount'] || '',
      percentage: priceIncrease.values['Percentage'] || '',
      selectedFees:
        getJson(priceIncrease.values['Membership Fees Selected']) || [],
      showSchedule: !!priceIncrease.values['Scheduled Date Time'],
      scheduledDateTime: priceIncrease.values['Scheduled Date Time']
        ? moment(priceIncrease.values['Scheduled Date Time'])
        : '',
      excludedMembers: getJson(priceIncrease.values['Excluded Members']) || [],
      affectedMemberFilter: '',
      doNotSendEmail: priceIncrease.values['Do Not Send Email'] === 'YES',
      emailTemplateName: priceIncrease.values['Email Template Name'] || '',
      emailTemplateID: priceIncrease.values['Email Template ID'] || undefined,
      showEmailDialog: false,
      excludeFamilyAccounts: false,
      excludeIncreasesFrom: '',
      excludedFromIncreaseMembers: [],
      excludeNewMembersFrom: '',
      excludedNewMembers: [],
      emailTemplateContent: this.props.initialEmailTemplateContent || null,
      priceIncreaseTemplates: [],
      selectedExistingTemplateID: '',
      memberPriceIncreases: [],
      memberPriceIncreasesLoading: false,
      expandedMpiId: null,
      mpiFilterName: '',
      mpiFilterStatus: '',
    };
    this.toggleFee = this.toggleFee.bind(this);
    this.toggleExcludeMember = this.toggleExcludeMember.bind(this);
    this.fetchExcludedFromIncreases = this.fetchExcludedFromIncreases.bind(
      this,
    );
    this.applyNewMemberExclusion = this.applyNewMemberExclusion.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
  }

  fetchExcludedFromIncreases(dateStr) {
    if (!dateStr) {
      this.setState(prev => ({
        excludedMembers: prev.excludedMembers.filter(
          id => !prev.excludedFromIncreaseMembers.includes(id),
        ),
        excludedFromIncreaseMembers: [],
      }));
      return;
    }
    const fromDate = moment(dateStr, 'YYYY-MM-DD').startOf('day');
    const completedIncreases = (this.props.priceIncreases || []).filter(
      pi =>
        pi.values['Status'] === 'Completed' &&
        moment(pi.updatedAt).isSameOrAfter(fromDate),
    );
    if (completedIncreases.length === 0) {
      this.setState(prev => ({
        excludedMembers: prev.excludedMembers.filter(
          id => !prev.excludedFromIncreaseMembers.includes(id),
        ),
        excludedFromIncreaseMembers: [],
      }));
      return;
    }
    Promise.all(
      completedIncreases.map(pi =>
        searchSubmissions({
          datastore: true,
          form: 'member-price-increase',
          search: new SubmissionSearch(true)
            .index('values[Price Increase ID]')
            .eq('values[Price Increase ID]', pi.id)
            .include('values')
            .limit(1000)
            .build(),
        }).then(({ submissions }) => submissions || []),
      ),
    ).then(results => {
      const memberIds = [
        ...new Set(
          results
            .flat()
            .map(s => s.values['Member GUID'])
            .filter(Boolean),
        ),
      ];
      this.setState(prev => ({
        excludedFromIncreaseMembers: memberIds,
        excludedMembers: [
          ...new Set([
            ...prev.excludedMembers.filter(
              id => !prev.excludedFromIncreaseMembers.includes(id),
            ),
            ...memberIds,
          ]),
        ],
      }));
    });
  }

  applyNewMemberExclusion(dateStr) {
    if (!dateStr) {
      this.setState(prev => ({
        excludedMembers: prev.excludedMembers.filter(
          id => !prev.excludedNewMembers.includes(id),
        ),
        excludedNewMembers: [],
        excludeNewMembersFrom: '',
      }));
      return;
    }
    const fromDate = moment(dateStr, 'YYYY-MM-DD').startOf('day');
    const newMemberIds = (this.props.allMembers || [])
      .filter(m => {
        if (m.values['Billing User'] !== 'YES') return false;
        const dj = m.values['Date Joined'];
        return dj && moment(dj, 'YYYY-MM-DD').isSameOrAfter(fromDate, 'day');
      })
      .map(m => m.id);
    this.setState(prev => ({
      excludeNewMembersFrom: dateStr,
      excludedNewMembers: newMemberIds,
      excludedMembers: [
        ...new Set([
          ...prev.excludedMembers.filter(
            id => !prev.excludedNewMembers.includes(id),
          ),
          ...newMemberIds,
        ]),
      ],
    }));
  }

  fetchEmailTemplateContent(id) {
    fetchSubmission({
      id,
      datastore: true,
      include: 'values',
    }).then(({ submission }) => {
      if (submission) {
        const content = submission.values['Email Content'];
        this.setState({ emailTemplateContent: content });
        if (this.props.onEmailTemplateContentFetched) {
          this.props.onEmailTemplateContentFetched(content);
        }
      }
    });
  }

  fetchMemberPriceIncreases() {
    const { priceIncrease } = this.props;
    this.setState({ memberPriceIncreasesLoading: true });
    const search = new SubmissionSearch(true)
      .index('values[Price Increase ID]')
      .eq('values[Price Increase ID]', priceIncrease.id)
      .include('details,values')
      .limit(1000)
      .build();
    searchSubmissions({
      datastore: true,
      form: 'member-price-increase',
      search,
    }).then(({ submissions }) => {
      this.setState({
        memberPriceIncreases: submissions || [],
        memberPriceIncreasesLoading: false,
      });
    });
  }

  componentDidMount() {
    if (this.props.readOnly) {
      if (this.state.emailTemplateID && !this.state.emailTemplateContent) {
        this.fetchEmailTemplateContent(this.state.emailTemplateID);
      }
      if (this.props.priceIncrease.values['Status'] === 'Completed') {
        this.fetchMemberPriceIncreases();
      }
    }
    searchSubmissions({
      datastore: true,
      form: 'email-templates',
      search: new SubmissionSearch()
        .includes(['values'])
        .limit(1000)
        .build(),
    }).then(({ submissions }) => {
      this.setState({
        priceIncreaseTemplates: (submissions || []).filter(
          t => t.values['Category'] === 'Price Increase',
        ),
      });
    });
  }

  componentDidUpdate(_prevProps, prevState) {
    if (
      this.state.emailTemplateID &&
      this.state.emailTemplateID !== prevState.emailTemplateID
    ) {
      this.fetchEmailTemplateContent(this.state.emailTemplateID);
    }
    if (
      this.state.excludeFamilyAccounts &&
      prevState.selectedFees !== this.state.selectedFees
    ) {
      const familyIds = this.computeFamilyIds();
      this.setState(prev => ({
        excludedMembers: [...new Set([...prev.excludedMembers, ...familyIds])],
      }));
    }
  }

  toggleFee(program, info) {
    const infoKey = info || '';
    this.setState(prev => {
      const selected = prev.selectedFees;
      const exists = selected.some(
        s => s.program === program && s.info === infoKey,
      );
      return exists
        ? {
            selectedFees: selected.filter(
              s => !(s.program === program && s.info === infoKey),
            ),
          }
        : { selectedFees: [...selected, { program, info: infoKey }] };
    });
  }

  toggleExcludeMember(memberId) {
    this.setState(prev => {
      const excluded = prev.excludedMembers;
      return excluded.includes(memberId)
        ? { excludedMembers: excluded.filter(id => id !== memberId) }
        : { excludedMembers: [...excluded, memberId] };
    });
  }

  computeFamilyIds() {
    const allMembers = this.props.allMembers || [];
    const { selectedFees } = this.state;
    if (selectedFees.length === 0) return [];
    return allMembers.reduce((acc, member) => {
      if (member.values['Status'] !== 'Active') return acc;
      if (
        member.values['Non Paying'] === 'YES' ||
        member.values['Billing Payment Type'] === 'Cash'
      )
        return acc;
      const feeDetails = getJson(member.values['Family Fee Details']);
      if (feeDetails.length <= 1) return acc;
      const matched = feeDetails.filter(d =>
        selectedFees.some(
          s =>
            d.program === s.program + ' - ' + s.info ||
            d.program === s.program + '-' + s.info,
        ),
      );
      matched.forEach(d => acc.push(d.id));
      return acc;
    }, []);
  }

  computeBillingMembers() {
    const allMembers = this.props.allMembers || [];
    const membersById = allMembers.reduce((map, m) => {
      map[m.id] = m;
      return map;
    }, {});
    const { selectedFees, excludedMembers } = this.state;
    return [
      ...new Set(
        allMembers.reduce((acc, member) => {
          if (member.values['Status'] !== 'Active') return acc;
          if (
            member.values['Non Paying'] === 'YES' ||
            member.values['Billing Payment Type'] === 'Cash'
          )
            return acc;
          const feeDetails = getJson(member.values['Family Fee Details']);
          const matched = feeDetails.filter(d =>
            selectedFees.some(
              s =>
                d.program === s.program + ' - ' + s.info ||
                d.program === s.program + '-' + s.info,
            ),
          );
          matched.forEach(d => {
            if (!excludedMembers.includes(d.id)) {
              const m = membersById[d.id];
              if (m && m.values['Billing User'] === 'YES') acc.push(d.id);
            }
          });
          return acc;
        }, []),
      ),
    ];
  }

  saveChanges() {
    const hasSchedule =
      this.state.showSchedule &&
      this.state.scheduledDateTime !== '' &&
      moment(this.state.scheduledDateTime).isAfter(moment());
    const values = {};
    values['Name'] = this.state.name;
    values['Status'] = hasSchedule ? 'Scheduled' : 'New';
    values['Increase Type'] =
      this.state.increaseType === 'fixedAmount' ? 'Fixed Amount' : 'Percentage';
    values['Fixed Amount'] = this.state.fixedAmount;
    values['Percentage'] = this.state.percentage;
    values['Membership Fees Selected'] = this.state.selectedFees;
    values['Scheduled Date Time'] = hasSchedule
      ? this.state.scheduledDateTime
      : '';
    values['Excluded Members'] = this.state.excludedMembers;
    values['Billing Members'] = this.computeBillingMembers();
    values['Do Not Send Email'] = this.state.doNotSendEmail ? 'YES' : '';
    values['Email Template Name'] = this.state.doNotSendEmail
      ? ''
      : this.state.emailTemplateName;
    values['Email Template ID'] = this.state.doNotSendEmail
      ? ''
      : this.state.emailTemplateID;
    this.props.updatePriceIncrease({ id: this.props.priceIncrease.id, values });
    this.props.cancelEdit();
  }

  render() {
    const { priceIncrease, membershipFees, allMembers } = this.props;
    const isEditable =
      priceIncrease.values['Status'] === 'New' ||
      priceIncrease.values['Status'] === 'Scheduled';
    const toCamelCase = str =>
      str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '-';

    if (this.props.readOnly) {
      const storedType = priceIncrease.values['Increase Type'];
      const storedFees =
        getJson(priceIncrease.values['Membership Fees Selected']) || [];
      const storedExcluded =
        getJson(priceIncrease.values['Excluded Members']) || [];
      const membersById = (allMembers || []).reduce((map, m) => {
        map[m.id] = m;
        return map;
      }, {});

      return (
        <div className="newPriceIncrease">
          <div className="settingsHeader">
            <h6>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7f8c8d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {priceIncrease.values['Name']}
            </h6>
            <span className="line" />
          </div>
          <div className="newIncreaseForm">
            <div className="formField">
              <label>
                <I18n>Status</I18n>
              </label>
              <div className="displayValue">
                {priceIncrease.values['Status']}
              </div>
            </div>
            <div className="formField">
              <label>
                <I18n>Name</I18n>
              </label>
              <div className="displayValue">{priceIncrease.values['Name']}</div>
            </div>
            <div className="formField">
              <label>
                <I18n>Increase Type</I18n>
              </label>
              <div className="displayValue">{storedType}</div>
            </div>
            {storedType === 'Fixed Amount' && (
              <div className="formField">
                <label>
                  <I18n>Fixed Amount</I18n>
                </label>
                <div className="displayValue">
                  {this.currencySymbol}
                  {priceIncrease.values['Fixed Amount']}
                </div>
              </div>
            )}
            {storedType === 'Percentage' && (
              <div className="formField">
                <label>
                  <I18n>Percentage</I18n>
                </label>
                <div className="displayValue">
                  {priceIncrease.values['Percentage']}%
                </div>
              </div>
            )}
            {storedFees.length > 0 && (
              <div className="formField">
                <label>
                  <I18n>Membership Fees</I18n>
                  <span className="matchCount">
                    {' '}
                    ({storedFees.length} selected)
                  </span>
                </label>
                <div className="feeCheckList">
                  <div className="feeCheckHeader">
                    <span className="feeColCheck" />
                    <span className="feeColName">Program</span>
                    <span className="feeColStatus">Status</span>
                    <span className="feeColFrequency">Frequency</span>
                    <span className="feeColAmount">Fee</span>
                  </div>
                  {(membershipFees || [])
                    .filter(fee =>
                      storedFees.some(
                        s =>
                          s.program === fee.values['Program'] &&
                          s.info === (fee.values['Info'] || ''),
                      ),
                    )
                    .map(fee => {
                      const isInactive =
                        fee.values['Status'] &&
                        fee.values['Status'].toLowerCase() === 'inactive';
                      return (
                        <div
                          key={fee.id}
                          className={`feeCheckItem${
                            isInactive ? ' feeInactive' : ''
                          }`}
                        >
                          <span className="feeColCheck" />
                          <span className="feeColName">
                            <span className="feeProgram">
                              {fee.values['Program']}
                            </span>
                            {fee.values['Info'] && (
                              <span className="feeInfo">
                                {fee.values['Info']}
                              </span>
                            )}
                          </span>
                          <span className="feeColStatus">
                            {toCamelCase(fee.values['Status'])}
                          </span>
                          <span className="feeColFrequency">
                            {fee.values['Frequency'] || '-'}
                          </span>
                          <span className="feeColAmount">
                            {this.currencySymbol}
                            {fee.values['Fee']}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            <div className="formField">
              <label>
                <I18n>Scheduled Date Time</I18n>
              </label>
              <div className="displayValue">
                {priceIncrease.values['Scheduled Date Time']
                  ? moment(priceIncrease.values['Scheduled Date Time']).format(
                      'L hh:mm A',
                    )
                  : ''}
              </div>
            </div>
            {storedExcluded.length > 0 && (
              <div className="formField">
                <label>
                  <I18n>Excluded Members</I18n>
                  <span className="excludeCount">
                    {' '}
                    ({storedExcluded.length})
                  </span>
                </label>
                <div className="displayValue">
                  {storedExcluded
                    .map(id => {
                      const m = membersById[id];
                      return m
                        ? `${m.values['First Name']} ${m.values['Last Name']}`
                        : id;
                    })
                    .join(', ')}
                </div>
              </div>
            )}
            {priceIncrease.values['Do Not Send Email'] === 'YES' ? (
              <div className="formField">
                <div
                  className="displayValue"
                  style={{ color: '#c0392b', fontStyle: 'italic' }}
                >
                  <I18n>Do Not Send Email</I18n>
                </div>
              </div>
            ) : (
              <div className="formField">
                <label>
                  <I18n>Email Template</I18n>
                </label>
                <div className="displayValue">
                  {priceIncrease.values['Email Template Name'] || '—'}
                </div>
                {this.state.emailTemplateContent && (
                  <div
                    className="emailTemplatePreview"
                    dangerouslySetInnerHTML={{
                      __html: this.state.emailTemplateContent,
                    }}
                  />
                )}
              </div>
            )}
          </div>
          {priceIncrease.values['Status'] === 'Completed' && (
            <div className="formField">
              <label>
                <I18n>Member Price Increases</I18n>
                {!this.state.memberPriceIncreasesLoading && (
                  <span className="matchCount">
                    {' '}
                    ({this.state.memberPriceIncreases.length})
                  </span>
                )}
                {!this.state.memberPriceIncreasesLoading &&
                  this.state.memberPriceIncreases.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm affectedExportBtn"
                      onClick={() => {
                        const escape = v =>
                          `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
                        const htmlToTable = html => {
                          if (!html) return '';
                          const doc = new DOMParser().parseFromString(
                            html,
                            'text/html',
                          );
                          const tableRows = doc.querySelectorAll('tr');
                          if (tableRows.length > 0) {
                            return Array.from(tableRows)
                              .map(row => {
                                const cells = row.querySelectorAll('th, td');
                                return Array.from(cells)
                                  .map(c => c.textContent.trim())
                                  .join('\t');
                              })
                              .filter(r => r.trim())
                              .join('\n');
                          }
                          return doc.body.textContent.trim();
                        };
                        const nameLower = this.state.mpiFilterName
                          .trim()
                          .toLowerCase();
                        const statusLower = this.state.mpiFilterStatus
                          .trim()
                          .toLowerCase();
                        const rows = [
                          ['Last Name', 'First Name', 'Status', 'Information'],
                        ];
                        this.state.memberPriceIncreases
                          .filter(s => {
                            const m = membersById[s.values['Member GUID']];
                            const memberName = m
                              ? `${m.values['First Name']} ${
                                  m.values['Last Name']
                                }`
                              : s.values['Member GUID'] || '';
                            if (
                              nameLower &&
                              !memberName.toLowerCase().includes(nameLower)
                            )
                              return false;
                            if (
                              statusLower &&
                              !(s.values['Status'] || '')
                                .toLowerCase()
                                .includes(statusLower)
                            )
                              return false;
                            return true;
                          })
                          .forEach(s => {
                            const m = membersById[s.values['Member GUID']];
                            const lastName = m
                              ? m.values['Last Name']
                              : s.values['Member GUID'];
                            const firstName = m ? m.values['First Name'] : '';
                            const status = s.values['Status'] || '';
                            const information =
                              status === 'Successful'
                                ? s.values['Result Information']
                                : status === 'Error'
                                  ? s.values['Error Information']
                                  : '';
                            rows.push([
                              lastName,
                              firstName,
                              status,
                              htmlToTable(information),
                            ]);
                          });
                        const csv = rows
                          .map(r => r.map(escape).join(','))
                          .join('\r\n');
                        const blob = new Blob([csv], {
                          type: 'text/csv;charset=utf-8;',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'member-price-increases.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export CSV
                    </button>
                  )}
              </label>
              {this.state.memberPriceIncreasesLoading ? (
                <div className="displayValue">
                  <I18n>Loading...</I18n>
                </div>
              ) : (
                <div className="memberPriceIncreasesTable">
                  <div className="mpiFilterBar">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter by name..."
                      value={this.state.mpiFilterName}
                      onChange={e =>
                        this.setState({
                          mpiFilterName: e.target.value,
                          expandedMpiId: null,
                        })
                      }
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter by status..."
                      value={this.state.mpiFilterStatus}
                      onChange={e =>
                        this.setState({
                          mpiFilterStatus: e.target.value,
                          expandedMpiId: null,
                        })
                      }
                    />
                  </div>
                  <table>
                    <thead>
                      <tr className="tableHeader">
                        <th>
                          <I18n>Member Name</I18n>
                        </th>
                        <th>
                          <I18n>Status</I18n>
                        </th>
                        <th>
                          <I18n>Datetime</I18n>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const nameLower = this.state.mpiFilterName
                          .trim()
                          .toLowerCase();
                        const statusLower = this.state.mpiFilterStatus
                          .trim()
                          .toLowerCase();
                        return this.state.memberPriceIncreases
                          .filter(s => {
                            const m = membersById[s.values['Member GUID']];
                            const memberName = m
                              ? `${m.values['First Name']} ${
                                  m.values['Last Name']
                                }`
                              : s.values['Member GUID'] || '';
                            if (
                              nameLower &&
                              !memberName.toLowerCase().includes(nameLower)
                            )
                              return false;
                            if (
                              statusLower &&
                              !(s.values['Status'] || '')
                                .toLowerCase()
                                .includes(statusLower)
                            )
                              return false;
                            return true;
                          })
                          .map(s => {
                            const m = membersById[s.values['Member GUID']];
                            const memberName = m
                              ? `${m.values['First Name']} ${
                                  m.values['Last Name']
                                }`
                              : s.values['Member GUID'];
                            const information =
                              s.values['Status'] === 'Successful'
                                ? s.values['Result Information']
                                : s.values['Status'] === 'Error'
                                  ? s.values['Error Information']
                                  : '';
                            const isExpanded =
                              this.state.expandedMpiId === s.id;
                            return (
                              <Fragment key={s.id}>
                                <tr
                                  className="mpiRow"
                                  onClick={() =>
                                    this.setState({
                                      expandedMpiId: isExpanded ? null : s.id,
                                    })
                                  }
                                >
                                  <td>{memberName}</td>
                                  <td
                                    style={
                                      s.values['Status'] === 'Error'
                                        ? {
                                            fontWeight: 'bold',
                                            color: '#c0392b',
                                          }
                                        : undefined
                                    }
                                  >
                                    {s.values['Status']}
                                  </td>
                                  <td>
                                    {s.createdAt
                                      ? moment(s.createdAt).format(
                                          'DD/MM/YYYY HH:mm',
                                        )
                                      : ''}
                                  </td>
                                </tr>
                                {isExpanded && information ? (
                                  <tr className="mpiDetailRow">
                                    <td
                                      colSpan={3}
                                      dangerouslySetInnerHTML={{
                                        __html: information,
                                      }}
                                    />
                                  </tr>
                                ) : null}
                              </Fragment>
                            );
                          });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <div className="buttons">
            {isEditable && (
              <Button color="primary" onClick={() => this.props.onEdit()}>
                <I18n>Edit</I18n>
              </Button>
            )}
            <Button
              className="cancelButton"
              color="primary"
              onClick={() => this.props.cancelEdit()}
            >
              <I18n>Close</I18n>
            </Button>
          </div>
        </div>
      );
    }

    // Editable mode (Status === 'New')
    const { selectedFees } = this.state;
    const {
      name,
      increaseType,
      fixedAmount,
      percentage,
      scheduledDateTime,
      showSchedule,
    } = this.state;

    const seenFeeKeys = new Set();
    const visibleFees = [];
    (allMembers || []).forEach(member => {
      if (member.values['Status'] !== 'Active') return;
      getJson(member.values['Family Fee Details']).forEach(d => {
        if (!d.feeProgram) return;
        const key = `${d.feeProgram}||${d.program || ''}`;
        if (!seenFeeKeys.has(key)) {
          seenFeeKeys.add(key);
          const info =
            d.program &&
            d.feeProgram &&
            d.program.startsWith(d.feeProgram + ' - ')
              ? d.program.slice(d.feeProgram.length + 3)
              : d.program &&
                d.feeProgram &&
                d.program.startsWith(d.feeProgram + '-')
                ? d.program.slice(d.feeProgram.length + 1)
                : '';
          const mf = (membershipFees || []).find(
            f =>
              f.values['Program'] === d.feeProgram &&
              (f.values['Info'] || '') === info,
          );
          visibleFees.push({
            id: key,
            values: {
              Program: d.feeProgram,
              Info: info,
              Status: mf ? mf.values['Status'] : '',
              Frequency: mf ? mf.values['Frequency'] : '',
              Fee: d.cost || d.fee || '',
            },
          });
        }
      });
    });

    const membersById = (allMembers || []).reduce((map, m) => {
      map[m.id] = m;
      return map;
    }, {});

    const matchingMembers =
      selectedFees.length > 0
        ? (allMembers || []).reduce((acc, member) => {
            if (member.values['Status'] !== 'Active') return acc;
            if (member.values['Billing User'] !== 'YES') return acc;
            if (
              member.values['Non Paying'] === 'YES' ||
              member.values['Billing Payment Type'] === 'Cash'
            )
              return acc;
            const feeDetails = getJson(member.values['Family Fee Details']);
            const matched = feeDetails.filter(d =>
              selectedFees.some(
                s =>
                  d.program === s.program + ' - ' + s.info ||
                  d.program === s.program + '-' + s.info,
              ),
            );
            if (matched.length > 0) acc.push({ member, matched });
            return acc;
          }, [])
        : [];

    const isValidBase =
      name.trim() !== '' &&
      (increaseType === 'fixedAmount'
        ? fixedAmount !== ''
        : percentage !== '') &&
      selectedFees.length > 0;
    const isScheduleValid =
      scheduledDateTime !== '' && moment(scheduledDateTime).isAfter(moment());
    const isValid =
      isValidBase &&
      (!showSchedule ||
        (isScheduleValid &&
          (!!this.state.emailTemplateID || this.state.doNotSendEmail)));

    return (
      <div className="newPriceIncrease">
        <div className="settingsHeader">
          <h6>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2980b9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Price Increase
          </h6>
          <span className="line" />
        </div>
        <div className="newIncreaseForm">
          <div className="formField">
            <label>
              <I18n>Name</I18n>{' '}
              {name.trim() === '' && <span className="requiredMark">*</span>}
            </label>
            <input
              type="text"
              className="form-control"
              value={this.state.name}
              onChange={e => this.setState({ name: e.target.value })}
            />
          </div>
          <div className="formField">
            <label>
              <I18n>Increase Type</I18n>
            </label>
            <div className="radioGroup">
              <label>
                <input
                  type="radio"
                  value="fixedAmount"
                  checked={this.state.increaseType === 'fixedAmount'}
                  onChange={() =>
                    this.setState({
                      increaseType: 'fixedAmount',
                      percentage: '',
                    })
                  }
                />
                <I18n>Fixed Amount</I18n>
              </label>
              <label>
                <input
                  type="radio"
                  value="percentage"
                  checked={this.state.increaseType === 'percentage'}
                  onChange={() =>
                    this.setState({
                      increaseType: 'percentage',
                      fixedAmount: '',
                    })
                  }
                />
                <I18n>Percentage</I18n>
              </label>
            </div>
          </div>
          {getAttributeValue(this.props.space, 'Billing Company') ===
            'PaySmart' && (
            <div className="formField">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'normal',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={this.state.excludeFamilyAccounts}
                  onChange={e => {
                    const checked = e.target.checked;
                    const familyIds = this.computeFamilyIds();
                    this.setState(prev => ({
                      excludeFamilyAccounts: checked,
                      excludedMembers: checked
                        ? [...new Set([...prev.excludedMembers, ...familyIds])]
                        : prev.excludedMembers.filter(
                            id => !familyIds.includes(id),
                          ),
                    }));
                  }}
                />
                <I18n>Exclude Family Accounts</I18n>
                <span
                  data-tip="This checkbox will detect and exclude all members that are part of a Family Billing"
                  data-for="exclude-family-tip"
                  style={{
                    cursor: 'help',
                    color: '#888',
                    marginLeft: '4px',
                    fontSize: '14px',
                  }}
                >
                  &#9432;
                </span>
                <ReactTooltip
                  id="exclude-family-tip"
                  place="right"
                  effect="solid"
                  multiline={true}
                  style={{ maxWidth: '300px' }}
                />
              </label>
            </div>
          )}
          <div className="formField">
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <I18n>Exclude Increases From</I18n>
              <span
                data-tip="Any members that have had an increase applied since this date, will not be shown in the Affected Members table"
                data-for="exclude-from-tip"
                style={{ cursor: 'help', color: '#888', fontSize: '14px' }}
              >
                &#9432;
              </span>
              <ReactTooltip
                id="exclude-from-tip"
                place="right"
                effect="solid"
                multiline={true}
                style={{ maxWidth: '300px' }}
              />
            </label>
            <input
              type="date"
              className="form-control"
              value={this.state.excludeIncreasesFrom}
              onChange={e => {
                const val = e.target.value;
                this.setState({ excludeIncreasesFrom: val });
                this.fetchExcludedFromIncreases(val);
              }}
            />
          </div>
          <div className="formField">
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <I18n>Exclude New Members</I18n>
              <span
                data-tip="Any members signed up from this date will be excluded"
                data-for="exclude-new-members-tip"
                style={{ cursor: 'help', color: '#888', fontSize: '14px' }}
              >
                &#9432;
              </span>
              <ReactTooltip
                id="exclude-new-members-tip"
                place="right"
                effect="solid"
                multiline={true}
                style={{ maxWidth: '300px' }}
              />
            </label>
            <input
              type="date"
              className="form-control"
              value={this.state.excludeNewMembersFrom}
              onChange={e => this.applyNewMemberExclusion(e.target.value)}
            />
          </div>
          {this.state.increaseType === 'fixedAmount' && (
            <div className="formField">
              <label>
                <I18n>Fixed Amount</I18n>{' '}
                {fixedAmount === '' && <span className="requiredMark">*</span>}
              </label>
              <NumberFormat
                value={this.state.fixedAmount}
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                onValueChange={vals =>
                  this.setState({ fixedAmount: vals.value })
                }
                className="form-control"
              />
            </div>
          )}
          {this.state.increaseType === 'percentage' && (
            <div className="formField">
              <label>
                <I18n>Percentage</I18n>{' '}
                {percentage === '' && <span className="requiredMark">*</span>}
              </label>
              <NumberFormat
                value={this.state.percentage}
                suffix="%"
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                isAllowed={({ floatValue }) =>
                  floatValue === undefined || floatValue <= 100
                }
                onValueChange={vals =>
                  this.setState({ percentage: vals.value })
                }
                className="form-control"
              />
            </div>
          )}
          <div className="formField">
            <label>
              <I18n>Membership Fees</I18n>{' '}
              {selectedFees.length === 0 && (
                <span className="requiredMark">*</span>
              )}
              {selectedFees.length > 0 && (
                <span className="matchCount">
                  {' '}
                  ({selectedFees.length} selected)
                </span>
              )}
            </label>
            {visibleFees.length === 0 ? (
              <span className="noFees">
                <I18n>No membership fees available</I18n>
              </span>
            ) : (
              <div className="feeCheckList">
                <div className="feeCheckHeader">
                  <span className="feeColCheck">
                    <input
                      type="checkbox"
                      title="Select all"
                      checked={
                        visibleFees.length > 0 &&
                        visibleFees.every(fee =>
                          this.state.selectedFees.some(
                            s =>
                              s.program === fee.values['Program'] &&
                              s.info === (fee.values['Info'] || ''),
                          ),
                        )
                      }
                      onChange={e => {
                        if (e.target.checked) {
                          const toAdd = visibleFees.filter(
                            fee =>
                              !this.state.selectedFees.some(
                                s =>
                                  s.program === fee.values['Program'] &&
                                  s.info === (fee.values['Info'] || ''),
                              ),
                          );
                          this.setState(prev => ({
                            selectedFees: [
                              ...prev.selectedFees,
                              ...toAdd.map(fee => ({
                                program: fee.values['Program'],
                                info: fee.values['Info'] || '',
                              })),
                            ],
                          }));
                        } else {
                          this.setState(prev => ({
                            selectedFees: prev.selectedFees.filter(
                              s =>
                                !visibleFees.some(
                                  fee =>
                                    fee.values['Program'] === s.program &&
                                    (fee.values['Info'] || '') === s.info,
                                ),
                            ),
                          }));
                        }
                      }}
                    />
                  </span>
                  <span className="feeColName">Program</span>
                  <span className="feeColStatus">Status</span>
                  <span className="feeColFrequency">Frequency</span>
                  <span className="feeColAmount">Fee</span>
                </div>
                {visibleFees.map(fee => {
                  const isInactive =
                    fee.values['Status'] &&
                    fee.values['Status'].toLowerCase() === 'inactive';
                  return (
                    <label
                      key={
                        fee.values['Program'] +
                        '-' +
                        fee.values['Info'] +
                        '-' +
                        fee.values['Status']
                      }
                      className={`feeCheckItem${
                        isInactive ? ' feeInactive' : ''
                      }`}
                    >
                      <span className="feeColCheck">
                        <input
                          type="checkbox"
                          checked={this.state.selectedFees.some(
                            s =>
                              s.program === fee.values['Program'] &&
                              s.info === (fee.values['Info'] || ''),
                          )}
                          onChange={() =>
                            this.toggleFee(
                              fee.values['Program'],
                              fee.values['Info'],
                            )
                          }
                        />
                      </span>
                      <span className="feeColName">
                        <span className="feeProgram">
                          {fee.values['Program']}
                        </span>
                        {fee.values['Info'] && (
                          <span className="feeInfo">{fee.values['Info']}</span>
                        )}
                      </span>
                      <span className="feeColStatus">
                        {toCamelCase(fee.values['Status'])}
                      </span>
                      <span className="feeColFrequency">
                        {fee.values['Frequency'] || '-'}
                      </span>
                      <span className="feeColAmount">
                        {this.currencySymbol}
                        {fee.values['Fee']}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          {matchingMembers.length > 0 && (
            <div className="formField">
              <label>
                <I18n>Affected Members</I18n>
                <span className="matchCount">
                  {' '}
                  ({
                    new Set(
                      matchingMembers.flatMap(({ matched }) =>
                        matched.map(d => d.id),
                      ),
                    ).size
                  })
                </span>
                {(() => {
                  const visibleExcluded = matchingMembers
                    .flatMap(({ matched }) => matched.map(d => d.id))
                    .filter(id => this.state.excludedMembers.includes(id))
                    .length;
                  return visibleExcluded > 0 ? (
                    <span className="excludeCount">
                      {' '}
                      — {visibleExcluded} excluded
                    </span>
                  ) : null;
                })()}
                <button
                  type="button"
                  className="btn btn-link btn-sm affectedExportBtn"
                  onClick={() => {
                    const escape = v =>
                      `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
                    const rows = [
                      [
                        'Last Name',
                        'First Name',
                        'Date Joined',
                        'Program',
                        'Info',
                        'Member Type',
                        'Cost',
                        'Excluded',
                      ],
                    ];
                    matchingMembers
                      .flatMap(({ matched }) =>
                        matched.map(d => {
                          const fm = membersById[d.id];
                          const memberName = fm
                            ? `${fm.values['Last Name']} ${
                                fm.values['First Name']
                              }`
                            : d.id;
                          const isDependent = !!(
                            fm &&
                            fm.values['Billing Parent Member'] &&
                            fm.values['Billing Parent Member'] !== fm.id
                          );
                          const parentMember = isDependent
                            ? membersById[fm.values['Billing Parent Member']]
                            : fm;
                          const parentName = parentMember
                            ? `${parentMember.values['Last Name']} ${
                                parentMember.values['First Name']
                              }`
                            : memberName;
                          return { d, fm, memberName, parentName, isDependent };
                        }),
                      )
                      .sort((a, b) => {
                        const keyA = `${a.parentName}|${
                          a.isDependent ? '1' : '0'
                        }|${a.memberName}`;
                        const keyB = `${b.parentName}|${
                          b.isDependent ? '1' : '0'
                        }|${b.memberName}`;
                        return keyA.localeCompare(keyB);
                      })
                      .forEach(({ d, fm }) => {
                        const lastName = fm ? fm.values['Last Name'] : d.id;
                        const firstName = fm ? fm.values['First Name'] : '';
                        const dateJoined = fm
                          ? fm.values['Date Joined'] || ''
                          : '';
                        const memberType = fm ? fm.values['Member Type'] : '';
                        const excluded = this.state.excludedMembers.includes(
                          d.id,
                        )
                          ? 'Yes'
                          : 'No';
                        rows.push([
                          lastName,
                          firstName,
                          dateJoined,
                          d.feeProgram || '',
                          d.program || '',
                          memberType,
                          d.cost || d.fee || '',
                          excluded,
                        ]);
                      });
                    const csv = rows
                      .map(r => r.map(escape).join(','))
                      .join('\r\n');
                    const blob = new Blob([csv], {
                      type: 'text/csv;charset=utf-8;',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'affected-members.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export CSV
                </button>
              </label>
              <div className="mpiFilterBar" style={{ marginBottom: 6 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by name..."
                  value={this.state.affectedMemberFilter}
                  onChange={e =>
                    this.setState({ affectedMemberFilter: e.target.value })
                  }
                />
              </div>
              <div className="matchingMembersList">
                <div className="matchingMembersHeader">
                  <span className="memColExclude">
                    <input
                      type="checkbox"
                      title="Exclude all"
                      checked={
                        matchingMembers.length > 0 &&
                        matchingMembers
                          .flatMap(({ matched }) => matched.map(d => d.id))
                          .every(id => this.state.excludedMembers.includes(id))
                      }
                      onChange={e => {
                        const ids = matchingMembers.flatMap(({ matched }) =>
                          matched.map(d => d.id),
                        );
                        if (e.target.checked) {
                          this.setState(prev => ({
                            excludedMembers: [
                              ...new Set([...prev.excludedMembers, ...ids]),
                            ],
                          }));
                        } else {
                          this.setState(prev => ({
                            excludedMembers: prev.excludedMembers.filter(
                              id => !ids.includes(id),
                            ),
                          }));
                        }
                      }}
                    />{' '}
                    Select → Exclude
                  </span>
                  <span className="memColName">Name</span>
                  <span className="memColFee">Program</span>
                  <span className="memColInfo">Info</span>
                  <span className="memColMemberType">Member Type</span>
                  <span className="memColPaymentMethod">Payment Method</span>
                  <span className="memColDateJoined">Date Joined</span>
                  <span className="memColCost">Cost</span>
                </div>
                {matchingMembers
                  .flatMap(({ member, matched }) =>
                    matched.map(d => {
                      const detailMember = membersById[d.id];
                      const memberName = detailMember
                        ? `${detailMember.values['Last Name']} ${
                            detailMember.values['First Name']
                          }`
                        : d.id;
                      const isFamilyAccount =
                        getJson(member.values['Family Fee Details']).length > 1;
                      const isDependent = !!(
                        detailMember &&
                        detailMember.values['Billing Parent Member'] &&
                        detailMember.values['Billing Parent Member'] !==
                          detailMember.id
                      );
                      const parentMember = isDependent
                        ? membersById[
                            detailMember.values['Billing Parent Member']
                          ]
                        : detailMember;
                      const parentName = parentMember
                        ? `${parentMember.values['Last Name']} ${
                            parentMember.values['First Name']
                          }`
                        : memberName;
                      return {
                        d,
                        detailMember,
                        memberName,
                        parentName,
                        isFamilyAccount,
                        isDependent,
                      };
                    }),
                  )
                  .filter(
                    ({ memberName }) =>
                      !this.state.affectedMemberFilter ||
                      memberName
                        .toLowerCase()
                        .includes(
                          this.state.affectedMemberFilter.toLowerCase(),
                        ),
                  )
                  .sort((a, b) => {
                    const keyA = `${a.parentName}|${
                      a.isDependent ? '1' : '0'
                    }|${a.memberName}`;
                    const keyB = `${b.parentName}|${
                      b.isDependent ? '1' : '0'
                    }|${b.memberName}`;
                    return keyA.localeCompare(keyB);
                  })
                  .map(
                    ({
                      d,
                      detailMember,
                      memberName,
                      isFamilyAccount,
                      isDependent,
                    }) => {
                      const isExcluded = this.state.excludedMembers.includes(
                        d.id,
                      );
                      const hasRecentIncrease = this.state.excludedFromIncreaseMembers.includes(
                        d.id,
                      );
                      const isNewMember = this.state.excludedNewMembers.includes(
                        d.id,
                      );
                      return (
                        <div
                          key={`${d.id}-${d.feeProgram}`}
                          className={`matchingMemberRow${
                            isExcluded ? ' memberExcluded' : ''
                          }${isFamilyAccount ? ' familyAccount' : ''}${
                            isDependent ? ' dependent' : ''
                          }`}
                        >
                          <span className="memColExclude">
                            <input
                              type="checkbox"
                              checked={isExcluded}
                              onChange={() => this.toggleExcludeMember(d.id)}
                            />
                          </span>
                          <span className="memColName">
                            {memberName}
                            {hasRecentIncrease && (
                              <span
                                title="Already had a price increase applied"
                                style={{
                                  marginLeft: '5px',
                                  color: '#e67e22',
                                  fontSize: '13px',
                                  cursor: 'default',
                                }}
                              >
                                ↑
                              </span>
                            )}
                            {isNewMember && (
                              <span
                                title="New member — signed up after the excluded date"
                                style={{
                                  marginLeft: '5px',
                                  color: '#27ae60',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'default',
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </span>
                          <span className="memColFee">{d.feeProgram}</span>
                          <span className="memColInfo">{d.program}</span>
                          <span className="memColMemberType">
                            {detailMember
                              ? detailMember.values['Member Type']
                              : ''}
                          </span>
                          <span className="memColPaymentMethod">
                            {detailMember
                              ? detailMember.values['Billing Payment Type']
                              : ''}
                          </span>
                          <span className="memColDateJoined">
                            {detailMember
                              ? moment(
                                  detailMember.values['Date Joined'],
                                  'YYYY-MM-DD',
                                ).format('L') || ''
                              : ''}
                          </span>
                          <span className="memColCost">
                            {this.currencySymbol}
                            {d.cost || d.fee}
                          </span>
                        </div>
                      );
                    },
                  )}
              </div>
            </div>
          )}
          <div className="formField">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'normal',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={this.state.doNotSendEmail}
                onChange={e =>
                  this.setState({ doNotSendEmail: e.target.checked })
                }
              />
              <I18n>Do not send Email</I18n>
            </label>
          </div>
          {!this.state.doNotSendEmail && (
            <div className="formField">
              <label>
                <I18n>Email Template</I18n>
              </label>
              <div className="emailTemplateField">
                {this.state.emailTemplateName ? (
                  <span className="displayValue">
                    {this.state.emailTemplateName}
                  </span>
                ) : (
                  <span className="noTemplate">No template selected</span>
                )}
                <Button
                  color="link"
                  size="sm"
                  onClick={() => this.setState({ showEmailDialog: true })}
                >
                  <I18n>
                    {this.state.emailTemplateName
                      ? 'Edit Email Template'
                      : 'New Email Template'}
                  </I18n>
                </Button>
                {this.state.priceIncreaseTemplates.length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <select
                      className="form-control"
                      style={{ width: 'auto', display: 'inline-block' }}
                      value={this.state.selectedExistingTemplateID}
                      onChange={e => {
                        const id = e.target.value;
                        const t = this.state.priceIncreaseTemplates.find(
                          t => t.id === id,
                        );
                        this.setState({
                          selectedExistingTemplateID: id,
                          ...(id && {
                            emailTemplateID: id,
                            emailTemplateName: t
                              ? t.values['Template Name']
                              : '',
                          }),
                        });
                      }}
                    >
                      <option value="">Select existing template...</option>
                      {this.state.priceIncreaseTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.values['Template Name']}
                        </option>
                      ))}
                    </select>
                    {this.state.selectedExistingTemplateID && (
                      <Button
                        color="link"
                        size="sm"
                        onClick={() => {
                          const t = this.state.priceIncreaseTemplates.find(
                            t => t.id === this.state.selectedExistingTemplateID,
                          );
                          this.setState({
                            emailTemplateID: this.state
                              .selectedExistingTemplateID,
                            emailTemplateName: t
                              ? t.values['Template Name']
                              : '',
                            showEmailDialog: true,
                            selectedExistingTemplateID: '',
                          });
                        }}
                      >
                        <I18n>Edit</I18n>
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {this.state.showEmailDialog && (
                <EmailTemplateContainer
                  defaultTemplate={
                    !this.state.emailTemplateID
                      ? PRICE_INCREASE_EMAIL_TEMPLATE
                      : undefined
                  }
                  defaultTemplateName={
                    !this.state.emailTemplateID ? this.state.name : undefined
                  }
                  defaultCategory={
                    !this.state.emailTemplateID ? 'Price Increase' : undefined
                  }
                  defaultContentWidth="80%"
                  setShowEmailDialog={show =>
                    this.setState({ showEmailDialog: show })
                  }
                  emailTemplateID={this.state.emailTemplateID}
                  updateTriggerDetails={(_type, details) => {
                    this.setState({
                      emailTemplateName: details.values['Template Name'],
                      emailTemplateID: details.id,
                    });
                  }}
                  journeyTriggers={[]}
                />
              )}
              {!this.state.showEmailDialog &&
                this.state.emailTemplateContent && (
                  <div
                    className="emailTemplatePreview"
                    dangerouslySetInnerHTML={{
                      __html: this.state.emailTemplateContent,
                    }}
                  />
                )}
            </div>
          )}
          {this.state.showSchedule && (
            <div className="formField">
              <label>
                <I18n>Scheduled Date Time</I18n>
              </label>
              <Datetime
                value={this.state.scheduledDateTime}
                dateFormat="L"
                timeFormat="hh:mm A"
                isValidDate={current =>
                  current.isSameOrAfter(moment().startOf('day'))
                }
                onChange={dt => this.setState({ scheduledDateTime: dt })}
                inputProps={{
                  className: 'form-control',
                  placeholder: 'L hh:mm AM',
                }}
              />
            </div>
          )}
        </div>
        <div className="buttons">
          <Button
            className="cancelButton"
            color="primary"
            onClick={() => this.props.cancelEdit()}
          >
            <I18n>Cancel</I18n>
          </Button>
          <Button
            className="scheduleButton"
            color="secondary"
            onClick={() =>
              this.setState(prev => ({
                showSchedule: !prev.showSchedule,
                scheduledDateTime: prev.showSchedule ? '' : moment(),
              }))
            }
          >
            <I18n>
              {this.state.showSchedule ? 'Remove Schedule' : 'Schedule'}
            </I18n>
          </Button>
          <Button
            className="applyButton"
            color="primary"
            disabled={!isValid}
            onClick={() => this.saveChanges()}
          >
            <I18n>Save</I18n>
          </Button>
        </div>
      </div>
    );
  }
}
export class AuditMembersView extends Component {
  constructor(props) {
    super(props);
    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }
    this.state = { filterName: '', filterProgram: '' };
  }
  exportCSV(auditMembers, membersById, programFilterLower) {
    const escape = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const adminFeeStr =
      getAttributeValue(this.props.space, 'Admin Fee Charge') || '';
    const csvAdminFeeRate = adminFeeStr
      ? parseFloat(adminFeeStr.replace('%', '')) / 100
      : 0;
    const showAdminFee = csvAdminFeeRate > 0 && !isNaN(csvAdminFeeRate);
    const csvAdminFeeLabel =
      getAttributeValue(this.props.space, 'Admin Fee Label') || 'Admin Fee';
    const csvTax1Rate = parseFloat(
      getAttributeValue(this.props.space, 'TAX 1 Value') || 0,
    );
    const csvTax1Label =
      getAttributeValue(this.props.space, 'TAX 1 Label') || 'TAX 1';
    const showTax1 = csvTax1Rate > 0 && !isNaN(csvTax1Rate);
    const csvTax2Rate = parseFloat(
      getAttributeValue(this.props.space, 'TAX 2 Value') || 0,
    );
    const csvTax2Label =
      getAttributeValue(this.props.space, 'TAX 2 Label') || 'TAX 2';
    const showTax2 = csvTax2Rate > 0 && !isNaN(csvTax2Rate);
    const header = [
      'Last Name',
      'First Name',
      'Program',
      'Cost',
      'Discount',
      'Fee',
    ];
    if (showAdminFee) header.push(csvAdminFeeLabel);
    if (showTax1) header.push(csvTax1Label);
    if (showTax2) header.push(csvTax2Label);
    header.push('Billing Cost');
    const rows = [header];
    auditMembers.forEach(m => {
      const fees = getJson(m.values['Family Fee Details']);
      const isEmpty = !fees || fees.length === 0;
      if (isEmpty) {
        if (!programFilterLower) {
          const emptyRow = [
            m.values['Last Name'],
            m.values['First Name'],
            '',
            '',
            '',
            '',
          ];
          if (showAdminFee) emptyRow.push('');
          if (showTax1) emptyRow.push('');
          if (showTax2) emptyRow.push('');
          emptyRow.push('');
          rows.push(emptyRow);
        }
        return;
      }
      const filteredFees = programFilterLower
        ? fees.filter(d =>
            (d.program || '').toLowerCase().includes(programFilterLower),
          )
        : fees;
      const sortedFees = [...filteredFees].sort((a, b) => {
        if (a.id === m.id) return -1;
        if (b.id === m.id) return 1;
        return 0;
      });
      sortedFees.forEach(d => {
        const fm = membersById[d.id];
        const lastName = fm ? fm.values['Last Name'] : m.values['Last Name'];
        const firstName = fm ? fm.values['First Name'] : m.values['First Name'];
        const billingCost = fm ? fm.values['Membership Cost'] || '' : '';
        const dataRow = [
          lastName,
          firstName,
          d.program || '',
          d.cost || '',
          d.discount || '',
          d.fee || '',
        ];
        if (showAdminFee)
          dataRow.push(
            d.fee ? (parseFloat(d.fee) * csvAdminFeeRate).toFixed(2) : '',
          );
        if (showTax1)
          dataRow.push(
            d.fee ? (parseFloat(d.fee) * csvTax1Rate).toFixed(2) : '',
          );
        if (showTax2)
          dataRow.push(
            d.fee ? (parseFloat(d.fee) * csvTax2Rate).toFixed(2) : '',
          );
        dataRow.push(billingCost);
        rows.push(dataRow);
      });
    });
    const csv = rows.map(r => r.map(escape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-members.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  render() {
    const { allMembers, onClose, space } = this.props;
    const { filterName, filterProgram } = this.state;
    const adminFeeStr = getAttributeValue(space, 'Admin Fee Charge') || '';
    const adminFeeRate = adminFeeStr
      ? parseFloat(adminFeeStr.replace('%', '')) / 100
      : 0;
    const adminFeeLabel =
      getAttributeValue(space, 'Admin Fee Label') || 'Admin Fee';
    const tax1Rate = parseFloat(getAttributeValue(space, 'TAX 1 Value') || 0);
    const tax1Label = getAttributeValue(space, 'TAX 1 Label') || 'TAX 1';
    const tax2Rate = parseFloat(getAttributeValue(space, 'TAX 2 Value') || 0);
    const tax2Label = getAttributeValue(space, 'TAX 2 Label') || 'TAX 2';
    const calcExpected = baseFee =>
      Math.round(
        baseFee *
          (1 +
            (isNaN(adminFeeRate) ? 0 : adminFeeRate) +
            (isNaN(tax1Rate) ? 0 : tax1Rate) +
            (isNaN(tax2Rate) ? 0 : tax2Rate)) *
          100,
      ) / 100;
    const membersById = (allMembers || []).reduce((map, m) => {
      map[m.id] = m;
      return map;
    }, {});
    const filterLower = filterName.trim().toLowerCase();
    const programFilterLower = filterProgram.trim().toLowerCase();
    const auditMembers = (allMembers || [])
      .filter(m => {
        if (
          m.values['Status'] !== 'Active' ||
          m.values['Billing User'] !== 'YES'
        )
          return false;
        if (
          m.values['Non Paying'] === 'YES' ||
          m.values['Billing Payment Type'] === 'Cash'
        )
          return false;
        if (!filterLower) return true;
        const fullName = `${m.values['First Name']} ${
          m.values['Last Name']
        }`.toLowerCase();
        if (fullName.includes(filterLower)) return true;
        const fees = getJson(m.values['Family Fee Details']);
        return (fees || []).some(d => {
          const fm = membersById[d.id];
          if (!fm) return false;
          const fmName = `${fm.values['First Name']} ${
            fm.values['Last Name']
          }`.toLowerCase();
          return fmName.includes(filterLower);
        });
      })
      .sort((a, b) => {
        const nameA = `${a.values['Last Name']} ${
          a.values['First Name']
        }`.toLowerCase();
        const nameB = `${b.values['Last Name']} ${
          b.values['First Name']
        }`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    return (
      <div className="newPriceIncrease">
        <div className="settingsHeader">
          <h6>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7f8c8d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Audit Members
          </h6>
          <span className="line" />
        </div>
        <div className="auditFilterBar">
          <input
            type="text"
            className="form-control"
            placeholder="Filter by name..."
            value={filterName}
            onChange={e => this.setState({ filterName: e.target.value })}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Filter by program..."
            value={filterProgram}
            onChange={e => this.setState({ filterProgram: e.target.value })}
          />
        </div>
        <div
          style={{
            background: '#eaf3fb',
            border: '1px solid #aed6f1',
            borderRadius: '4px',
            padding: '10px 14px',
            marginBottom: '10px',
            fontSize: '0.88em',
            color: '#2c3e50',
          }}
        >
          <ol style={{ margin: 0, paddingLeft: '18px' }}>
            <li>
              If <strong style={{ color: '#c0392b' }}>Billing Cost</strong> is
              red, this means the Associated Membership/Program Fee does not
              match the actual charged Membership Cost.
            </li>
            <li>
              If a <strong style={{ color: '#c0392b' }}>member row</strong> is
              red, then the member does not have a Membership/Program Fee row
              added to their account.
            </li>
          </ol>
          <p style={{ margin: '6px 0 0' }}>
            To avoid errors with the price increase, these members need to be
            fixed. Update the member via the{' '}
            <strong>Update Billing Details</strong> on the member's billing
            view.
          </p>
        </div>
        <div className="auditSummary">
          <span>
            Total Billing Members: <strong>{auditMembers.length}</strong>
          </span>
          <span>
            Total All Members:{' '}
            <strong>
              {
                auditMembers.reduce((set, m) => {
                  const f = getJson(m.values['Family Fee Details']);
                  if (!f || f.length === 0) {
                    set.add(m.id);
                  } else {
                    f.forEach(d => set.add(d.id));
                  }
                  return set;
                }, new Set()).size
              }
            </strong>
          </span>
          <span>
            Missing fee details:{' '}
            <strong
              style={{
                color:
                  auditMembers.filter(m => {
                    const f = getJson(m.values['Family Fee Details']);
                    return !f || f.length === 0;
                  }).length > 0
                    ? '#c0392b'
                    : undefined,
              }}
            >
              {
                auditMembers.filter(m => {
                  const f = getJson(m.values['Family Fee Details']);
                  return !f || f.length === 0;
                }).length
              }
            </strong>
          </span>
          <span>
            Showing Billing Members:{' '}
            <strong>
              {
                auditMembers.filter(m => {
                  const fees = getJson(m.values['Family Fee Details']);
                  const isEmpty = !fees || fees.length === 0;
                  if (isEmpty) return !programFilterLower;
                  return programFilterLower
                    ? fees.some(d =>
                        (d.program || '')
                          .toLowerCase()
                          .includes(programFilterLower),
                      )
                    : true;
                }).length
              }
            </strong>
          </span>
          <span>
            Total mis-matched billing cost:{' '}
            <strong
              style={{
                color:
                  auditMembers.filter(m => {
                    const fees = getJson(m.values['Family Fee Details']);
                    if (!fees || fees.length === 0) return false;
                    const baseFee = fees.reduce(
                      (sum, f) => sum + parseFloat(f.fee || 0),
                      0,
                    );
                    const totalExpected = calcExpected(baseFee);
                    const baseBillingCost = m.values['Membership Cost'];
                    return (
                      baseBillingCost != null &&
                      baseBillingCost !== '' &&
                      totalExpected > 0 &&
                      Math.round(
                        Math.abs(parseFloat(baseBillingCost) - totalExpected) *
                          100,
                      ) > 1
                    );
                  }).length > 0
                    ? '#c0392b'
                    : undefined,
              }}
            >
              {
                auditMembers.filter(m => {
                  const fees = getJson(m.values['Family Fee Details']);
                  if (!fees || fees.length === 0) return false;
                  const baseFee = fees.reduce(
                    (sum, f) => sum + parseFloat(f.fee || 0),
                    0,
                  );
                  const totalExpected = calcExpected(baseFee);
                  const baseBillingCost = m.values['Membership Cost'];
                  return (
                    baseBillingCost != null &&
                    baseBillingCost !== '' &&
                    totalExpected > 0 &&
                    Math.round(
                      Math.abs(parseFloat(baseBillingCost) - totalExpected) *
                        100,
                    ) > 1
                  );
                }).length
              }
            </strong>
          </span>
        </div>
        <div className="auditMembersTable">
          <table>
            <thead>
              <tr className="tableHeader">
                <th width="260">Name</th>
                <th>Program</th>
                <th width="100">Cost</th>
                <th width="100">Discount</th>
                <th width="100">Fee</th>
                {adminFeeRate > 0 && <th width="100">{adminFeeLabel}</th>}
                {tax1Rate > 0 &&
                  !isNaN(tax1Rate) && <th width="100">{tax1Label}</th>}
                {tax2Rate > 0 &&
                  !isNaN(tax2Rate) && <th width="100">{tax2Label}</th>}
                <th width="100">Billing Cost</th>
              </tr>
            </thead>
            <tbody>
              {auditMembers.flatMap((m, groupIndex) => {
                const fees = getJson(m.values['Family Fee Details']);
                const isEmpty = !fees || fees.length === 0;
                const memberName = `${m.values['Last Name']} ${
                  m.values['First Name']
                }`;
                const groupClass =
                  groupIndex % 2 !== 0 ? 'auditGroupOdd' : 'auditGroupEven';
                if (isEmpty) {
                  if (programFilterLower) return [];
                  return (
                    <tr key={m.id} className="auditEmptyFee">
                      <td style={{ fontWeight: 'bold' }}>
                        <Link to={`/kapps/gbmembers/Member/${m.id}`}>
                          {memberName}
                        </Link>
                      </td>
                      <td>—</td>
                      <td />
                      <td />
                      <td />
                      {adminFeeRate > 0 && <td />}
                      {tax1Rate > 0 && !isNaN(tax1Rate) && <td />}
                      {tax2Rate > 0 && !isNaN(tax2Rate) && <td />}
                      <td />
                    </tr>
                  );
                }
                const filteredFees = programFilterLower
                  ? fees.filter(d =>
                      (d.program || '')
                        .toLowerCase()
                        .includes(programFilterLower),
                    )
                  : fees;
                if (filteredFees.length === 0) return [];
                const baseFee = fees.reduce(
                  (sum, f) => sum + parseFloat(f.fee || 0),
                  0,
                );
                const totalExpected = calcExpected(baseFee);
                const baseBillingCost = m.values['Membership Cost'];
                const sortedFees = [...filteredFees].sort((a, b) => {
                  if (a.id === m.id) return -1;
                  if (b.id === m.id) return 1;
                  return 0;
                });
                return sortedFees.map((d, i) => {
                  const fm = membersById[d.id];
                  const feeMemberName = fm
                    ? `${fm.values['Last Name']} ${fm.values['First Name']}`
                    : memberName;
                  const isBaseMember = d.id === m.id;
                  const billingCost = fm ? fm.values['Membership Cost'] : '';
                  const costMismatch =
                    isBaseMember &&
                    baseBillingCost != null &&
                    baseBillingCost !== '' &&
                    totalExpected > 0 &&
                    Math.round(
                      Math.abs(parseFloat(baseBillingCost) - totalExpected) *
                        100,
                    ) > 1;
                  return (
                    <tr key={`${m.id}-${i}`} className={groupClass}>
                      <td
                        style={
                          isBaseMember
                            ? { fontWeight: 'bold' }
                            : { fontStyle: 'italic', paddingLeft: '20px' }
                        }
                      >
                        {isBaseMember ? (
                          <Link to={`/kapps/gbmembers/Member/${m.id}`}>
                            {feeMemberName}
                          </Link>
                        ) : (
                          feeMemberName
                        )}
                      </td>
                      <td>{d.program}</td>
                      <td>{d.cost ? `${this.currencySymbol}${d.cost}` : ''}</td>
                      <td>{d.discount ? `${d.discount}` : ''}</td>
                      <td>{d.fee ? `${this.currencySymbol}${d.fee}` : ''}</td>
                      {adminFeeRate > 0 && (
                        <td>
                          {d.fee
                            ? `${this.currencySymbol}${(
                                parseFloat(d.fee) * adminFeeRate
                              ).toFixed(2)}`
                            : ''}
                        </td>
                      )}
                      {tax1Rate > 0 &&
                        !isNaN(tax1Rate) && (
                          <td>
                            {d.fee
                              ? `${this.currencySymbol}${(
                                  parseFloat(d.fee) * tax1Rate
                                ).toFixed(2)}`
                              : ''}
                          </td>
                        )}
                      {tax2Rate > 0 &&
                        !isNaN(tax2Rate) && (
                          <td>
                            {d.fee
                              ? `${this.currencySymbol}${(
                                  parseFloat(d.fee) * tax2Rate
                                ).toFixed(2)}`
                              : ''}
                          </td>
                        )}
                      <td
                        style={
                          costMismatch
                            ? { color: '#c0392b', fontWeight: 'bold' }
                            : undefined
                        }
                      >
                        {billingCost
                          ? `${this.currencySymbol}${billingCost}`
                          : ''}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
        <div className="buttons">
          <Button
            color="secondary"
            onClick={() =>
              this.exportCSV(auditMembers, membersById, programFilterLower)
            }
          >
            <I18n>Export CSV</I18n>
          </Button>
          <Button color="primary" className="cancelButton" onClick={onClose}>
            <I18n>Close</I18n>
          </Button>
        </div>
      </div>
    );
  }
}
export class PriceIncreaseTable extends Component {
  constructor(props) {
    super(props);
    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }
    this.cancelNewIncrease = this.cancelNewIncrease.bind(this);
    this.closeView = this.closeView.bind(this);
    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.state = {
      addNewIncrease: false,
      selectedIncrease: null,
      editingIncrease: false,
      deleteConfirmId: null,
      showAuditMembers: false,
      emailTemplateContent: null,
    };
  }

  componentDidMount() {
    this.refreshInterval = setInterval(() => {
      this.props.fetchPriceIncreases();
    }, 5 * 60 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval);
  }

  componentDidUpdate(prevProps) {
    if (
      this.state.selectedIncrease &&
      prevProps.priceIncreases !== this.props.priceIncreases
    ) {
      const updated = (this.props.priceIncreases || []).find(
        pi => pi.id === this.state.selectedIncrease.id,
      );
      if (updated) {
        this.setState({ selectedIncrease: updated });
      }
    }
  }

  cancelNewIncrease() {
    this.setState({ addNewIncrease: false });
  }

  closeView() {
    this.setState({
      selectedIncrease: null,
      editingIncrease: false,
      emailTemplateContent: null,
    });
  }

  startEdit() {
    this.setState({ editingIncrease: true });
  }

  cancelEdit() {
    this.setState({ editingIncrease: false });
  }

  render() {
    const {
      addNewIncrease,
      selectedIncrease,
      editingIncrease,
      deleteConfirmId,
      showAuditMembers,
    } = this.state;
    const showTable = !addNewIncrease && !editingIncrease && !showAuditMembers;
    return (
      <div className="priceIncreases">
        {showTable && (
          <div className="buttons">
            <Button
              color="secondary"
              className="auditButton"
              onClick={() =>
                this.setState({
                  showAuditMembers: true,
                  selectedIncrease: null,
                })
              }
            >
              <I18n>Audit Members</I18n>
            </Button>
            <Button
              className="newButton"
              color="primary"
              onClick={() =>
                this.setState({ addNewIncrease: true, selectedIncrease: null })
              }
            >
              <I18n>New Price Increase</I18n>
            </Button>
          </div>
        )}
        {addNewIncrease && (
          <NewPriceIncrease
            space={this.props.space}
            allMembers={this.props.allMembers}
            membershipFees={this.props.membershipFees}
            priceIncreases={this.props.priceIncreases}
            cancelNewIncrease={this.cancelNewIncrease}
            createPriceIncrease={this.props.createPriceIncrease}
          />
        )}
        {showAuditMembers && (
          <AuditMembersView
            space={this.props.space}
            allMembers={this.props.allMembers}
            onClose={() => this.setState({ showAuditMembers: false })}
          />
        )}
        {showTable && (
          <div className="priceIncreasesTable">
            <table>
              <thead>
                <tr className="tableHeader">
                  <th width="100">Status</th>
                  <th width="200">Name</th>
                  <th width="120">Increase Type</th>
                  <th width="120">Amount / %</th>
                  <th width="160">Scheduled Date Time</th>
                  <th width="40" />
                </tr>
              </thead>
              <tbody>
                {this.props.priceIncreasesLoading ? (
                  <tr>
                    <td colSpan="6" className="loadingRow">
                      <span className="fa fa-spinner fa-spin" />
                    </td>
                  </tr>
                ) : (
                  (this.props.priceIncreases || []).map(pi => {
                    const type = pi.values['Increase Type'];
                    const value =
                      type === 'Fixed Amount'
                        ? `${this.currencySymbol}${pi.values['Fixed Amount']}`
                        : `${pi.values['Percentage']}%`;
                    const isSelected =
                      selectedIncrease && selectedIncrease.id === pi.id;
                    const isNew =
                      pi.values['Status'] === 'New' ||
                      pi.values['Status'] === 'Scheduled';
                    const btnId = `delete-pi-${pi.id}`;
                    return (
                      <tr
                        key={pi.id}
                        className={`eventRow${isSelected ? ' selected' : ''}`}
                        onClick={() => this.setState({ selectedIncrease: pi })}
                      >
                        <td>{pi.values['Status']}</td>
                        <td>{pi.values['Name']}</td>
                        <td>{type}</td>
                        <td>{value}</td>
                        <td>
                          {pi.values['Scheduled Date Time']
                            ? moment(pi.values['Scheduled Date Time']).format(
                                'L hh:mm A',
                              )
                            : ''}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          {isNew && (
                            <span>
                              <button
                                id={btnId}
                                className="deleteIconBtn"
                                title="Delete"
                                onClick={() =>
                                  this.setState({ deleteConfirmId: pi.id })
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#4d5059"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                              </button>
                              <PopConfirm
                                target={btnId}
                                placement="left"
                                isOpen={deleteConfirmId === pi.id}
                                toggle={() =>
                                  this.setState({ deleteConfirmId: null })
                                }
                                title="Delete Price Increase?"
                              >
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() => {
                                    this.props.deletePriceIncrease({
                                      id: pi.id,
                                    });
                                    this.setState({
                                      deleteConfirmId: null,
                                      selectedIncrease: null,
                                    });
                                  }}
                                >
                                  <I18n>Yes, Delete</I18n>
                                </Button>
                                <Button
                                  color="link"
                                  size="sm"
                                  onClick={() =>
                                    this.setState({ deleteConfirmId: null })
                                  }
                                >
                                  <I18n>Cancel</I18n>
                                </Button>
                              </PopConfirm>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {selectedIncrease &&
          showTable && (
            <PriceIncreaseEdit
              key={selectedIncrease.id}
              readOnly={true}
              space={this.props.space}
              priceIncrease={selectedIncrease}
              priceIncreases={this.props.priceIncreases}
              membershipFees={this.props.membershipFees}
              allMembers={this.props.allMembers}
              cancelEdit={this.closeView}
              onEdit={this.startEdit}
              updatePriceIncrease={this.props.updatePriceIncrease}
              initialEmailTemplateContent={this.state.emailTemplateContent}
              onEmailTemplateContentFetched={content =>
                this.setState({ emailTemplateContent: content })
              }
            />
          )}
        {editingIncrease &&
          selectedIncrease && (
            <PriceIncreaseEdit
              key={`edit-${selectedIncrease.id}`}
              readOnly={false}
              space={this.props.space}
              priceIncrease={selectedIncrease}
              priceIncreases={this.props.priceIncreases}
              membershipFees={this.props.membershipFees}
              allMembers={this.props.allMembers}
              cancelEdit={this.cancelEdit}
              updatePriceIncrease={this.props.updatePriceIncrease}
              initialEmailTemplateContent={this.state.emailTemplateContent}
              onEmailTemplateContentFetched={content =>
                this.setState({ emailTemplateContent: content })
              }
            />
          )}
      </div>
    );
  }
}
const PriceIncreaseComponent = ({
  space,
  priceIncreases,
  priceIncreasesLoading,
  fetchPriceIncreases,
  createPriceIncrease,
  updatePriceIncrease,
  deletePriceIncrease,
  membershipFees,
  membershipFeesLoading,
  allMembers,
  membersLoading,
  isSpaceAdmin,
}) =>
  membershipFeesLoading || membersLoading ? (
    <Loading text="Membership Price Increase loading ..." />
  ) : (
    <div className="page-container page-container--space-profile">
      <PageTitle parts={['Membership Price Increase']} />
      <div className="page-panel">
        <div className="page-title">
          <div className="page-title__wrapper">
            {isSpaceAdmin && (
              <h3>
                <Link to="/">
                  <I18n>home</I18n>
                </Link>{' '}
                /
              </h3>
            )}
            <h1>
              <I18n>Membership Fee Bulk Price Increases</I18n>
            </h1>
          </div>
        </div>
        <PriceIncreaseTable
          space={space}
          membershipFees={membershipFees}
          allMembers={allMembers}
          priceIncreases={priceIncreases}
          priceIncreasesLoading={priceIncreasesLoading}
          fetchPriceIncreases={fetchPriceIncreases}
          createPriceIncrease={createPriceIncrease}
          updatePriceIncrease={updatePriceIncrease}
          deletePriceIncrease={deletePriceIncrease}
        />
      </div>
    </div>
  );

export const PriceIncrease = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('showTriggerActivities', 'setShowTriggerActivities', false),
  withHandlers({}),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchPriceIncreases();
      this.props.fetchAllMembershipFees();
      this.props.fetchMembers({
        membersNextPageToken: this.props.membersNextPageToken,
        memberInitialLoadComplete: this.props.memberInitialLoadComplete,
        memberLastFetchTime: this.props.memberLastFetchTime,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {},
  }),
)(PriceIncreaseComponent);

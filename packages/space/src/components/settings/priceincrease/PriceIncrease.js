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
import {
  getJson,
  getCurrency,
} from 'gbmembers/src/components/Member/MemberUtils';

const PRICE_INCREASE_EMAIL_TEMPLATE =
  '{"counters":{"u_column":1,"u_row":1,"u_content_image":1,"u_content_text":2,"u_content_html":1},"body":{"id":"-VfYj_ccH9","rows":[{"id":"eYZGpT3CAh","cells":[1],"columns":[{"id":"sKRYJoIzsW","contents":[{"id":"s3jq8xeNTj","type":"image","values":{"containerPadding":"10px","anchor":"","src":{"url":"https://images.unlayer.com/projects/0/1656655080676-Untitled%20design.png","width":600,"height":200,"dynamic":true},"textAlign":"center","altText":"","action":{"name":"web","values":{"href":"","target":"_blank"}},"hideDesktop":false,"displayCondition":null,"_styleGuide":null,"_meta":{"htmlID":"u_content_image_1","htmlClassNames":"u_content_image"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false,"pending":false}},{"id":"qU9p6GFGBm","type":"text","values":{"containerPadding":"10px","anchor":"","fontSize":"14px","textAlign":"left","lineHeight":"140%","linkStyle":{"inherit":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"hideDesktop":false,"displayCondition":null,"_styleGuide":null,"_meta":{"htmlID":"u_content_text_1","htmlClassNames":"u_content_text"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false,"text":"<p>Hi member(\'First Name\'),</p>"}},{"id":"Akc9uSWDyn","type":"html","values":{"html":"The following billing changes have been applied: $price_increase_change$","hideDesktop":false,"displayCondition":null,"_styleGuide":null,"containerPadding":"10px","anchor":"","_meta":{"htmlID":"u_content_html_1","htmlClassNames":"u_content_html"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false}},{"id":"JLYdH9JKv-","type":"text","values":{"containerPadding":"10px","anchor":"","fontSize":"14px","textAlign":"left","lineHeight":"140%","linkStyle":{"inherit":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"hideDesktop":false,"displayCondition":null,"_styleGuide":null,"_meta":{"htmlID":"u_content_text_2","htmlClassNames":"u_content_text"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false,"text":"<p style=\\"line-height: 140%;\\"><span style=\\"line-height: 19.6px;\\">Kind Regards,</span></p>\\n<p style=\\"line-height: 140%;\\"><span style=\\"line-height: 19.6px;\\"><strong>${spaceAttributes(\'School Name\')}</strong></span></p>\\n<p style=\\"line-height: 140%;\\"><span style=\\"line-height: 19.6px;\\">Address: ${spaceAttributes(\'School Address\')}</span></p>\\n<p style=\\"line-height: 140%;\\"><span style=\\"line-height: 19.6px;\\">Phone: ${spaceAttributes(\'School Telephone\')}</span></p>"}}],"values":{"backgroundColor":"","padding":"0px","border":{},"borderRadius":"0px","_meta":{"htmlID":"u_column_1","htmlClassNames":"u_column"},"deletable":true}}],"values":{"displayCondition":null,"columns":false,"_styleGuide":null,"backgroundColor":"","columnsBackgroundColor":"","backgroundImage":{"url":"","fullWidth":true,"repeat":"no-repeat","size":"custom","position":"center","customPosition":["50%","50%"]},"padding":"0px","anchor":"","hideDesktop":false,"_meta":{"htmlID":"u_row_1","htmlClassNames":"u_row"},"selectable":true,"draggable":true,"duplicatable":true,"deletable":true,"hideable":true,"locked":false}}],"headers":[],"footers":[],"values":{"_styleGuide":null,"popupPosition":"center","popupDisplayDelay":0,"popupWidth":"600px","popupHeight":"auto","borderRadius":"10px","contentAlign":"center","contentVerticalAlign":"center","contentWidth":"500px","fontFamily":{"label":"Arial","value":"arial,helvetica,sans-serif"},"textColor":"#000000","popupBackgroundColor":"#FFFFFF","popupBackgroundImage":{"url":"","fullWidth":true,"repeat":"no-repeat","size":"cover","position":"center"},"popupOverlay_backgroundColor":"rgba(0, 0, 0, 0.1)","popupCloseButton_position":"top-right","popupCloseButton_backgroundColor":"#DDDDDD","popupCloseButton_iconColor":"#000000","popupCloseButton_borderRadius":"0px","popupCloseButton_margin":"0px","popupCloseButton_action":{"name":"close_popup","attrs":{"onClick":"document.querySelector(\'.u-popup-container\').style.display = \'none\';"}},"language":{},"backgroundColor":"#FFFFFF","preheaderText":"","linkStyle":{"body":true,"linkColor":"#0000ee","linkHoverColor":"#0000ee","linkUnderline":true,"linkHoverUnderline":true},"backgroundImage":{"url":"","fullWidth":true,"repeat":"no-repeat","size":"custom","position":"center"},"accessibilityTitle":"","_meta":{"htmlID":"u_body","htmlClassNames":"u_body"}}}}';

export const mapStateToProps = state => {
  return {
    space: state.member.app.space,
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
      emailTemplateName: '',
      emailTemplateID: undefined,
      showEmailDialog: false,
      submitting: false,
      submitError: null,
    };
    this.toggleFee = this.toggleFee.bind(this);
    this.toggleExcludeMember = this.toggleExcludeMember.bind(this);
    this.createNewPriceIncrease = this.createNewPriceIncrease.bind(this);
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
    values['Email Template Name'] = this.state.emailTemplateName;
    values['Email Template ID'] = this.state.emailTemplateID;

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
      (!showSchedule || (isScheduleValid && !!this.state.emailTemplateID));

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
                {this.state.excludedMembers.length > 0 && (
                  <span className="excludeCount">
                    {' '}
                    — {this.state.excludedMembers.length} excluded
                  </span>
                )}
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
                        'Program',
                        'Info',
                        'Member Type',
                        'Cost',
                        'Excluded',
                      ],
                    ];
                    matchingMembers.forEach(({ matched }) => {
                      matched.forEach(d => {
                        const fm = membersById[d.id];
                        const lastName = fm ? fm.values['Last Name'] : d.id;
                        const firstName = fm ? fm.values['First Name'] : '';
                        const memberType = fm ? fm.values['Member Type'] : '';
                        const excluded = this.state.excludedMembers.includes(
                          d.id,
                        )
                          ? 'Yes'
                          : 'No';
                        rows.push([
                          lastName,
                          firstName,
                          d.feeProgram || '',
                          d.program || '',
                          memberType,
                          d.cost || d.fee || '',
                          excluded,
                        ]);
                      });
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
                  <span className="memColCost">Cost</span>
                </div>
                {matchingMembers
                  .flatMap(({ matched }) =>
                    matched.map(d => {
                      const detailMember = membersById[d.id];
                      const memberName = detailMember
                        ? `${detailMember.values['Last Name']} ${
                            detailMember.values['First Name']
                          }`
                        : d.id;
                      return { d, detailMember, memberName };
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
                  .sort((a, b) => a.memberName.localeCompare(b.memberName))
                  .map(({ d, detailMember, memberName }) => {
                    const isExcluded = this.state.excludedMembers.includes(
                      d.id,
                    );
                    return (
                      <div
                        key={`${d.id}-${d.feeProgram}`}
                        className={`matchingMemberRow${
                          isExcluded ? ' memberExcluded' : ''
                        }`}
                      >
                        <span className="memColExclude">
                          <input
                            type="checkbox"
                            checked={isExcluded}
                            onChange={() => this.toggleExcludeMember(d.id)}
                          />
                        </span>
                        <span className="memColName">{memberName}</span>
                        <span className="memColFee">{d.feeProgram}</span>
                        <span className="memColInfo">{d.program}</span>
                        <span className="memColMemberType">
                          {detailMember
                            ? detailMember.values['Member Type']
                            : ''}
                        </span>
                        <span className="memColCost">
                          {this.currencySymbol}
                          {d.cost || d.fee}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
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
      emailTemplateName: priceIncrease.values['Email Template Name'] || '',
      emailTemplateID: priceIncrease.values['Email Template ID'] || undefined,
      showEmailDialog: false,
      emailTemplateContent: this.props.initialEmailTemplateContent || null,
      memberPriceIncreases: [],
      memberPriceIncreasesLoading: false,
      expandedMpiId: null,
      mpiFilterName: '',
      mpiFilterStatus: '',
    };
    this.toggleFee = this.toggleFee.bind(this);
    this.toggleExcludeMember = this.toggleExcludeMember.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
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
  }

  componentDidUpdate(_prevProps, prevState) {
    if (
      this.state.emailTemplateID &&
      this.state.emailTemplateID !== prevState.emailTemplateID
    ) {
      this.fetchEmailTemplateContent(this.state.emailTemplateID);
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
    values['Email Template Name'] = this.state.emailTemplateName;
    values['Email Template ID'] = this.state.emailTemplateID;
    this.props.updatePriceIncrease({ id: this.props.priceIncrease.id, values });
    this.props.cancelEdit();
  }

  render() {
    const { priceIncrease, membershipFees, allMembers } = this.props;
    const isEditable = priceIncrease.values['Status'] === 'New';
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
      (!showSchedule || (isScheduleValid && !!this.state.emailTemplateID));

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
                {this.state.excludedMembers.length > 0 && (
                  <span className="excludeCount">
                    {' '}
                    — {this.state.excludedMembers.length} excluded
                  </span>
                )}
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
                        'Program',
                        'Info',
                        'Member Type',
                        'Cost',
                        'Excluded',
                      ],
                    ];
                    matchingMembers.forEach(({ matched }) => {
                      matched.forEach(d => {
                        const fm = membersById[d.id];
                        const lastName = fm ? fm.values['Last Name'] : d.id;
                        const firstName = fm ? fm.values['First Name'] : '';
                        const memberType = fm ? fm.values['Member Type'] : '';
                        const excluded = this.state.excludedMembers.includes(
                          d.id,
                        )
                          ? 'Yes'
                          : 'No';
                        rows.push([
                          lastName,
                          firstName,
                          d.feeProgram || '',
                          d.program || '',
                          memberType,
                          d.cost || d.fee || '',
                          excluded,
                        ]);
                      });
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
                  <span className="memColCost">Cost</span>
                </div>
                {matchingMembers
                  .flatMap(({ matched }) =>
                    matched.map(d => {
                      const detailMember = membersById[d.id];
                      const memberName = detailMember
                        ? `${detailMember.values['Last Name']} ${
                            detailMember.values['First Name']
                          }`
                        : d.id;
                      return { d, detailMember, memberName };
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
                  .sort((a, b) => a.memberName.localeCompare(b.memberName))
                  .map(({ d, detailMember, memberName }) => {
                    const isExcluded = this.state.excludedMembers.includes(
                      d.id,
                    );
                    return (
                      <div
                        key={`${d.id}-${d.feeProgram}`}
                        className={`matchingMemberRow${
                          isExcluded ? ' memberExcluded' : ''
                        }`}
                      >
                        <span className="memColExclude">
                          <input
                            type="checkbox"
                            checked={isExcluded}
                            onChange={() => this.toggleExcludeMember(d.id)}
                          />
                        </span>
                        <span className="memColName">{memberName}</span>
                        <span className="memColFee">{d.feeProgram}</span>
                        <span className="memColInfo">{d.program}</span>
                        <span className="memColMemberType">
                          {detailMember
                            ? detailMember.values['Member Type']
                            : ''}
                        </span>
                        <span className="memColCost">
                          {this.currencySymbol}
                          {d.cost || d.fee}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
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
    const rows = [['Last Name', 'First Name', 'Program', 'Cost', 'Discount']];
    auditMembers.forEach(m => {
      const fees = getJson(m.values['Family Fee Details']);
      const isEmpty = !fees || fees.length === 0;
      if (isEmpty) {
        if (!programFilterLower) {
          rows.push([
            m.values['Last Name'],
            m.values['First Name'],
            '',
            '',
            '',
          ]);
        }
        return;
      }
      const filteredFees = programFilterLower
        ? fees.filter(d =>
            (d.program || '').toLowerCase().includes(programFilterLower),
          )
        : fees;
      filteredFees.forEach(d => {
        const fm = membersById[d.id];
        const lastName = fm ? fm.values['Last Name'] : m.values['Last Name'];
        const firstName = fm ? fm.values['First Name'] : m.values['First Name'];
        rows.push([
          lastName,
          firstName,
          d.program || '',
          d.cost || '',
          d.discount || '',
        ]);
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
    const { allMembers, onClose } = this.props;
    const { filterName, filterProgram } = this.state;
    const membersById = (allMembers || []).reduce((map, m) => {
      map[m.id] = m;
      return map;
    }, {});
    const filterLower = filterName.trim().toLowerCase();
    const programFilterLower = filterProgram.trim().toLowerCase();
    const auditMembers = (allMembers || []).filter(m => {
      if (m.values['Status'] !== 'Active' || m.values['Billing User'] !== 'YES')
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
            <strong>
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
        </div>
        <div className="auditMembersTable">
          <table>
            <thead>
              <tr className="tableHeader">
                <th width="260">Name</th>
                <th>Program</th>
                <th width="100">Cost</th>
                <th width="100">Discount</th>
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
                return filteredFees.map((d, i) => {
                  const fm = membersById[d.id];
                  const feeMemberName = fm
                    ? `${fm.values['Last Name']} ${fm.values['First Name']}`
                    : memberName;
                  const isBaseMember = d.id === m.id;
                  return (
                    <tr key={`${m.id}-${i}`} className={groupClass}>
                      <td
                        style={
                          isBaseMember
                            ? { fontWeight: 'bold', fontStyle: 'italic' }
                            : undefined
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
              readOnly={true}
              space={this.props.space}
              priceIncrease={selectedIncrease}
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
              readOnly={false}
              space={this.props.space}
              priceIncrease={selectedIncrease}
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

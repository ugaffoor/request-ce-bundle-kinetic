import $ from 'jquery';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';

export function handleChange(
  memberItem,
  key,
  event,
  setIsDirty,
  memberChanges,
) {
  if (setIsDirty !== undefined) setIsDirty(true);
  if (memberChanges) {
    let memberChange = memberChanges.find(change => change.field === key);
    if (!memberChange) {
      memberChange = { field: key, from: memberItem.values[key] };
      memberChanges.push(memberChange);
    }
    memberChange.to = event.target.value;
    memberChange.date = moment().format(contact_date_format);
  }
  //console.log("key = " + key + ", changes = " + JSON.stringify(memberChanges));

  memberItem.values[key] = event.target.value;

  if ($(event.target).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null || val === '') {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
      $(event.target).css('border-color', '');
    }
  }
  //Commenting out following code since we are using uncontrolled components calling setState on value change (and consequently on every keypress)
  //is not required and not desirable. It will result in lifecycle methods like componentWillReceiveProps, componentDidUpdate etc being called
  //on every keypress
  //A hack to for a redraw of Ranking Belts menu
  if (memberItem.myThis !== undefined) memberItem.myThis.setState({ test: 0 });
}

export function handleProgramChange(memberItem, key, event) {
  memberItem.values[key] = event.target.value;

  if ($(event.target).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null || val === '') {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
      $(event.target).css('border-color', '');
    }
  }
  //Commenting out following code since we are using uncontrolled components calling setState on value change (and consequently on every keypress)
  //is not required and not desirable. It will result in lifecycle methods like componentWillReceiveProps, componentDidUpdate etc being called
  //on every keypress
  //A hack to for a redraw of Ranking Belts menu
  if (memberItem.myThis !== undefined) memberItem.myThis.setState({ test: 0 });
}
export function handleDynamicChange(memberItem, key, elementId, setIsDirty) {
  if (setIsDirty !== undefined) setIsDirty(true);
  memberItem.values[key] = $('#' + elementId).val();

  if ($('#' + elementId).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null || val === '') {
      $('#' + elementId)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $('#' + elementId)
        .siblings('label')
        .removeAttr('required');
      $('#' + elementId).css('border-color', '');
    }
  }
}

export function handleMultiSelectChange(memberItem, key, element, setIsDirty) {
  if (setIsDirty !== undefined) setIsDirty(true);

  memberItem.values[key] = [...element.options]
    .filter(option => option.selected)
    .map(option => option.value);

  if ($(element).attr('required')) {
    var val = memberItem.values[key];
    if (!val) {
      $(element)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(element)
        .siblings('label')
        .removeAttr('required');
      $(element).css('border-color', '');
    }
  }
}

export function handleFormattedChange(
  values,
  memberItem,
  key,
  event,
  setIsDirty,
  memberChanges,
) {
  if (setIsDirty !== undefined) setIsDirty(true);
  const { formattedValue, value } = values;

  if (memberChanges) {
    let memberChange = memberChanges.find(change => change.field === key);
    if (!memberChange) {
      memberChange = { field: key, from: memberItem.values[key] };
      memberChanges.push(memberChange);
    }
    memberChange.to = value;
    memberChange.date = moment().format(contact_date_format);
  }

  memberItem.values[key] = value;
  if ($(event.target).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null) {
      $(event.target)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $(event.target)
        .siblings('label')
        .removeAttr('required');
      $(event.target).css('border-color', '');
    }
  }
}

export function handleDynamicFormattedChange(
  value,
  memberItem,
  key,
  elementId,
  setIsDirty,
) {
  if (setIsDirty !== undefined) setIsDirty(true);
  //const {formattedValue, value} = values;
  memberItem.values[key] = value;
  if ($('#' + elementId).attr('required')) {
    var val = memberItem.values[key];
    if (val === undefined || val === null) {
      $('#' + elementId)
        .siblings('label')
        .attr('required', 'required');
    } else {
      $('#' + elementId)
        .siblings('label')
        .removeAttr('required');
      $('#' + elementId).css('border-color', '');
    }
  }
}

export function getJson(input) {
  if (!input) {
    return [];
  }

  if (typeof input === 'string') {
    try {
      return $.parseJSON(input);
    } catch (err) {
      return [input];
    }
  } else {
    return input;
  }
}

export function setMemberPromotionValues(member, belts) {
  let statusIndicator = 'notready';
  let statusText = 'NOT READY';
  let programOrder = 0;
  let promotionSort = 2;
  let attendClasses = 0;
  let durationPeriod = 0;
  if (
    member.values !== undefined &&
    member.values['Ranking Program'] !== undefined &&
    member.values['Ranking Belt'] !== undefined
  ) {
    let belt = belts.find(
      obj =>
        obj['program'] === member.values['Ranking Program'] &&
        obj['belt'] === member.values['Ranking Belt'],
    );
    if (belt !== undefined) {
      attendClasses = belt.attendClasses;
      durationPeriod = belt.durationPeriod;
      programOrder = belt.programOrder;
    }
  }

  let attendanceVal =
    parseInt(member.values['Attendance Count']) / attendClasses;
  let daysElapsed = moment().diff(
    moment(member.values['Last Promotion']),
    'days',
  );
  let daysVal = daysElapsed / durationPeriod;

  if (attendanceVal <= 0.6 || daysVal <= 0.6) {
    statusIndicator = 'notready';
    statusText = 'NOT READY';
    promotionSort = 2;
  } else if (attendanceVal >= 1 && daysVal >= 1) {
    statusIndicator = 'ready';
    statusText = 'READY';
    promotionSort = 0;
  } /*  if (
    attendanceVal >= 0.8 &&
    parseInt(member.values['Attendance Count']) < attendClasses &&
    daysVal >= 0.8
  ) */ else {
    //console.log("attendanceVal:"+attendanceVal+" member.values['Attendance Count']:"+member.values['Attendance Count']+" attendClasses:"+attendClasses+" daysVal:"+daysVal);
    statusIndicator = 'almost';
    statusText = 'ALMOST READY';
    promotionSort = 1;
  }
  let attendancePerc = attendanceVal * 100;
  if (attendancePerc > 100) attendancePerc = 100;

  member.programOrder = programOrder;
  member.promotionSort = promotionSort;
  member.statusText = statusText;
  member.attendClasses = attendClasses;
  member.durationPeriod = durationPeriod;
  member.attendanceVal = attendanceVal;
  member.daysElapsed = daysElapsed;
  member.daysVal = daysVal;
  member.attendancePerc = attendancePerc;
  member.statusIndicator = statusIndicator;

  return member;
}

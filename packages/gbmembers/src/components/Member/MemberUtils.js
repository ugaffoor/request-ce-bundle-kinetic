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

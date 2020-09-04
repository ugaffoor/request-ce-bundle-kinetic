import $ from 'jquery';
import moment from 'moment';

export const contact_date_format = 'YYYY-MM-DD HH:mm';
export const reminder_date_format = 'YYYY-MM-DD';
export const gmt_format = 'YYYY-MM-DDTHH:mm:ss'; // Must manually add Z to result.
export const email_sent_date_format = 'DD-MM-YYYY HH:mm';
export const email_received_date_format = 'DD-MM-YYYY HH:mm';

export function getDateValue(dateValue) {
  return dateValue === undefined || dateValue === ''
    ? ''
    : moment(dateValue, 'YYYY-MM-DD').toDate();
}
export function handleDateChange() {
  var value = $('#' + this.id)
    .siblings('.DayPickerInput')
    .find('input')
    .val();
  var input = $('#' + this.id)
    .siblings('.DayPickerInput')
    .find('input');
  console.log('Date value:' + value.trim());
  var dateValue =
    value.trim() === '' ? '' : moment(value, 'L').format('YYYY-MM-DD');
  if (value.trim() !== '' && dateValue === 'Invalid Date') return;
  if (value.trim() === '') dateValue = '';

  if (this.fieldName === 'Reminder Date') {
    this.leadThis.setState({
      reminderDate: moment(value, 'L').format('YYYY-MM-DD'),
    });
  } else {
    this.leadItem.values[this.fieldName] = dateValue;
  }

  if (this.setIsDirty !== undefined) this.setIsDirty(true);
  if (this.required) {
    var val = this.leadItem.values[this.fieldName];
    if (val === undefined || val === null || val === '') {
      input
        .parent()
        .siblings('label')
        .attr('required', 'required');
    } else {
      input
        .parent()
        .siblings('label')
        .removeAttr('required');
      input.css('border-color', '');
    }
  }
}
export function handleChange(leadItem, key, event, setIsDirty) {
  if (setIsDirty !== undefined) setIsDirty(true);
  leadItem.values[key] =
    event.target !== undefined ? event.target.value : event.value;

  if ($(event.target).attr('required')) {
    var val = leadItem.values[key];
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
  //A hack to for a redraw of Ranking Belts menu
  //if (leadItem.myThis!==undefined)
  //leadItem.myThis.setState({test:0});
}

export function handleMultiSelectChange(leadItem, key, element, setIsDirty) {
  if (setIsDirty !== undefined) setIsDirty(true);

  leadItem.values[key] = [...element.options]
    .filter(option => option.selected)
    .map(option => option.value);
  if ($(element).attr('required')) {
    var val = leadItem.values[key];
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
  //A hack to for a redraw of Ranking Belts menu
  //if (leadItem.myThis!==undefined)
  //leadItem.myThis.setState({test:0});
}

export function handleFormattedChange(
  values,
  leadItem,
  key,
  event,
  setIsDirty,
) {
  if (setIsDirty !== undefined) setIsDirty(true);
  const { formattedValue, value } = values;
  leadItem.values[key] = value;
  if ($(event.target).attr('required')) {
    var val = leadItem.values[key];
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

export function getReminderDate(input) {
  if (!input) {
    return undefined;
  }

  if (input === 'Tomorrow') {
    return (
      moment()
        .add(1, 'days')
        .format('YYYY-MM-DDTHH:mm:ss') + 'Z'
    );
  }

  if (input === 'Next Week') {
    return (
      moment()
        .add(1, 'weeks')
        .format('YYYY-MM-DDTHH:mm:ss') + 'Z'
    );
  }

  if (input === 'Next Month') {
    return (
      moment()
        .add(1, 'months')
        .format('YYYYY-MM-DDTHH:mm:ss') + 'Z'
    );
  }

  if (input === 'Never') {
    return undefined;
  }
}

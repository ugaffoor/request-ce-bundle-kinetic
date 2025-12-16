import $ from 'jquery';
import moment from 'moment';
import axios from 'axios';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

export const contact_date_format = 'YYYY-MM-DD HH:mm';
export const reminder_date_format = 'YYYY-MM-DD';
export const gmt_format = 'YYYY-MM-DDTHH:mm:ss'; // Must manually add Z to result.
export const email_sent_date_format = 'DD-MM-YYYY HH:mm';
export const email_received_date_format = 'DD-MM-YYYY HH:mm';

const handleErrors = error => {
  if (error instanceof Error && !error.response) {
    // When the error is an Error object an exception was thrown in the process.
    // so we'll just 'convert' it to a 400 error to be handled downstream.
    return { serverError: { status: 400, statusText: error.message } };
  }

  // Destructure out the information needed.
  const { data, status, statusText } = error.response;
  if (status === 400 && typeof data === 'object') {
    // If the errors returned are from server-side validations or constraints.
    return data.errors ? { errors: data.errors } : data;
  }

  // For all other server-side errors.
  return { serverError: { status, statusText, error: data && data.error } };
};

export function getTimezone(profileTimezone, spaceTimezone) {
  var timezone =
    profileTimezone !== null && profileTimezone !== ''
      ? profileTimezone
      : spaceTimezone;
  if (timezone.lastIndexOf('(') !== -1) {
    timezone = timezone.substring(timezone.lastIndexOf('(') + 1);
    timezone = timezone.substring(0, timezone.lastIndexOf(')'));
  }
  return timezone;
}
export function getLocalePreference(space, profile) {
  if (profile.preferredLocale !== null)
    return profile.preferredLocale.toLowerCase();
  if (space.defaultLocale !== null) return space.defaultLocale.toLowerCase();

  return 'en-au';
}
export function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
}
export function substituteFields(text, person, space, profile, journeyEvent) {
  if (text === undefined) return '';

  text = text.replace(/\$\{space\}/g, space.slug);
  if (person !== undefined) {
    text = text.replace(/member\('ID'\)/g, person.id);
    text = text.replace(/member\('First Name'\)/g, person.values['First Name']);
    text = text.replace(/member\('Last Name'\)/g, person.values['Last Name']);
  }
  //  var matches = text.match(/\$\{.*?\('(.*?)'\)\}/g);
  var matches = text.match(/\$\{.*?\}/g);
  if (matches !== null) {
    matches.forEach(function(value, index) {
      console.log(value);
      if (value.indexOf('spaceAttributes') !== -1) {
        text = text.replace(
          new RegExp(escapeRegExp(value), 'g'),
          getAttributeValue(space, value.split("'")[1]),
        );
      }
    });
  }

  if (person !== undefined) {
    matches = text.match(/\$\{Intro Scheduled Date\}/g);
    if (matches !== null) {
      let introDate = undefined;
      let history = person.values['History'];
      if (history !== undefined) {
        history = getJson(history);
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i]['contactMethod'] === 'intro_class') {
            introDate = moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm');
            break;
          }
        }
      }
      if (introDate !== undefined) {
        matches.forEach(function(value, index) {
          text = text.replace(
            new RegExp(escapeRegExp(value), 'g'),
            introDate.format('Do MMM YYYY h:mmA'),
          );
        });
      }
    }

    matches = text.match(/\$\{Intro Scheduled Time\}/g);
    if (matches !== null) {
      let introTime = undefined;
      let history = person.values['History'];
      if (history !== undefined) {
        history = getJson(history);
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i]['contactMethod'] === 'intro_class') {
            introTime = moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm');
            break;
          }
        }
      }
      if (introTime !== undefined) {
        matches.forEach(function(value, index) {
          text = text.replace(
            new RegExp(escapeRegExp(value), 'g'),
            introTime.format('LT'),
          );
        });
      }
    }
  }
  matches = text.match(/\$\{payment_end_date\}/g);
  if (matches !== null) {
    var termDate = moment(
      person['values']['Billing Cash Term End Date'],
      'YYYY-MM-DD',
    );
    if (termDate !== undefined) {
      matches.forEach(function(value, index) {
        text = text.replace(
          new RegExp(escapeRegExp(value), 'g'),
          termDate.format('Do MMM YYYY'),
        );
      });
    }
  }

  matches = text.match(/\$\{submitterName\}/g);
  if (matches !== null) {
    matches.forEach(function(value, index) {
      text = text.replace(
        new RegExp(escapeRegExp(value), 'g'),
        profile.displayName,
      );
    });
  }
  matches = text.match(/\$\{date\}/g);
  if (matches !== null) {
    matches.forEach(function(value, index) {
      text = text.replace(
        new RegExp(escapeRegExp(value), 'g'),
        moment().format('Do MMM YYYY'),
      );
    });
  }

  matches = text.match(/\$\{Event Source Date\}/g);
  if (matches !== null) {
    matches.forEach(function(value, index) {
      text = text.replace(
        new RegExp(escapeRegExp(value), 'g'),
        moment(journeyEvent.values['Event Source Date']).format('Do MMM YYYY'),
      );
    });
  }

  return text;
}

export function getDateValue(dateValue) {
  return dateValue === undefined || dateValue === ''
    ? ''
    : moment(dateValue, 'YYYY-MM-DD').toDate();
}
export function formatDateValue(value) {
  var dateValue = moment(value, 'L').format('YYYY-MM-DD');

  if (dateValue === 'Invalid date') {
    dateValue = moment(value).format('YYYY-MM-DD');
  }
  return dateValue;
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
  var dateValue = value.trim() === '' ? '' : formatDateValue(value);
  if (value.trim() !== '' && dateValue === 'Invalid Date') return;
  if (value.trim() === '') dateValue = '';

  if (this.fieldName === 'Reminder Date') {
    this.leadThis.setState({
      reminderDate: formatDateValue(value),
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
  if (!Array.isArray(leadItem.values[key])) {
    leadItem.values[key] =
      event.target !== undefined ? event.target.value : event.value;
  }

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
  if (leadItem.myThis !== undefined) leadItem.myThis.setState({ test: 0 });
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
    return moment()
      .add(1, 'days')
      .format('YYYY-MM-DDTHH:mm:ssZ');
  }
  if (input === '2 days from now') {
    return moment()
      .add(2, 'days')
      .format('YYYY-MM-DDTHH:mm:ssZ');
  }

  if (input === 'Next Week') {
    return moment()
      .add(1, 'weeks')
      .format('YYYY-MM-DDTHH:mm:ssZ');
  }

  if (input === 'Next Month') {
    return moment()
      .add(1, 'months')
      .format('YYYY-MM-DDTHH:mm:ssZ');
  }

  if (input === 'Never') {
    return undefined;
  }
}
export function handleCountryChange(leadItem, key, event, setIsDirty) {
  if (setIsDirty !== undefined) setIsDirty(true);
  //console.log("key = " + key + ", changes = " + JSON.stringify(memberChanges));
  if (!Array.isArray(leadItem.values[key])) {
    leadItem.values[key] = event.target.value;
  }

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

  var billingSystem = getAttributeValue(
    leadItem.myThis.props.space,
    'Billing Company',
  );
  var states = '';
  let promise = axios.post(
    `https://countriesnow.space/api/v0.1/countries/states`,
    {
      country: event.target.value,
    },
  );

  promise = promise.then(response => {
    if (response.data.data.states) {
      response.data.data.states.forEach(state => {
        if (states.length > 0) {
          states = states + ',';
        }
        states =
          states +
          (billingSystem === 'Bambora' ? state.state_code : state.name);
      });
    }
    if (leadItem.myThis !== undefined)
      leadItem.myThis.setState({ states: states });
    return states;
  });

  promise = promise.catch(handleErrors);

  //Commenting out following code since we are using uncontrolled components calling setState on value change (and consequently on every keypress)
  //is not required and not desirable. It will result in lifecycle methods like componentWillReceiveProps, componentDidUpdate etc being called
  //on every keypress
  //A hack to for a redraw of Ranking Belts menu
}

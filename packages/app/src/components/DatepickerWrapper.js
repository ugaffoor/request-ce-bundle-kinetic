import React, { useEffect, useRef, useState } from 'react';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import DayPicker from 'react-day-picker/DayPicker';
import 'react-day-picker/lib/style.css';
import { getLocalePreference } from 'gbmembers/src/components/Member/MemberUtils';
import { bundle } from '@kineticdata/react';

const isDateAllowed = (date, allowedDates) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  // Disallow today or any earlier date
  if (date <= today) return true;

  // Disallow all dates that are not explicitly allowed
  const isAllowed =
    allowedDates.length > 0
      ? allowedDates.some(
          allowed =>
            allowed.getDate() === date.getDate() &&
            allowed.getMonth() === date.getMonth() &&
            allowed.getFullYear() === date.getFullYear(),
        )
      : true;

  return !isAllowed; // true = disabled
};
const SmartOverlay = ({ classNames, children, ...props }) => {
  const ref = useRef(null);
  const [positionAbove, setPositionAbove] = useState(false);

  useEffect(() => {
    const inputRect = props.input.getBoundingClientRect();
    const calendarHeight = 300; // estimated height
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    setPositionAbove(
      spaceBelow < calendarHeight && spaceAbove > calendarHeight,
    );
  }, []);

  return (
    <div
      ref={ref}
      className={classNames.overlay}
      style={{
        position: 'absolute',
        left: '20px',
        top: positionAbove ? 'auto' : '',
        bottom: positionAbove ? 'auto' : '',
        zIndex: 1000,
        background: 'white',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};
export class DatepickerWrapper extends React.Component {
  constructor(props) {
    super(props);
    let allowedDates = [];
    if (this.props.options.allowDates) {
      this.props.options.allowDates.forEach(item => {
        allowedDates.push(moment(item, 'DD-MM-YYYY').toDate());
      });
    }
    this.state = {
      options: this.props.options,
      allowedDates,
    };
  }
  componentDidMount() {
    if (this.props.onGenerate !== undefined) this.props.onGenerate();
  }
  componentDidUpdate() {
    if (
      this.state.options.allowDates.length !==
        this.props.options.allowDates.length ||
      (this.state.options.allowDates.length !== 0 &&
        this.props.options.allowDates !== 0 &&
        this.state.options.allowDates[0] !== this.props.options.allowDates[0])
    ) {
      this.setState({ options: this.props.options });
    }
  }
  render() {
    const {
      parentID,
      value,
      value_format,
      defaultValue,
      displayDateFormat,
      minDate,
      timepicker,
      datepicker,
      onSelectDate,
      inline,
      onGenerate,
      options,
      space,
      profile,
    } = this.props;
    return options !== undefined && options.inline ? (
      <DayPicker
        id={parentID}
        mode="single"
        formatDate={formatDate}
        parseDate={parseDate}
        value={value}
        placeholder={''}
        onDayClick={function(selectedDay, modifiers, dayPickerInput) {
          onSelectDate(selectedDay);
        }}
        overlayComponent={SmartOverlay}
        disabledDays={date => isDateAllowed(date, this.state.allowedDates)}
      />
    ) : (
      <DayPickerInput
        id={parentID}
        formatDate={formatDate}
        parseDate={parseDate}
        value={value}
        placeholder={''}
        onDayChange={function(selectedDay, modifiers, dayPickerInput) {
          onSelectDate(selectedDay);
        }}
        overlayComponent={SmartOverlay}
        dayPickerProps={{
          disabledDays: date => isDateAllowed(date, this.state.allowedDates),
          locale: getLocalePreference(
            bundle.config.widgets.space,
            bundle.config.widgets.profile,
          ),
          localeUtils: MomentLocaleUtils,
        }}
        classNames={{
          container: 'DayPickerInput datetimepicker',
        }}
      />
    );
  }
}

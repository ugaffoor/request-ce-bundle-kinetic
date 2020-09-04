export const TIME_AGO_INTERVAL = 10000;
export const TIME_FORMAT = 'MMMM D, YYYY h:mm A';

export const COLORS = {
  default: 'rgb(126, 128, 131)',
  black: 'rgb(52, 52, 52)',
  blue: 'rgb(16, 148, 196)',
  blueGray: 'rgb(168, 183, 199)',
  blueLake: 'rgb(9, 84, 130)',
  blueSlate: 'rgb(12, 56, 79)',
  blueSky: 'rgb(11, 168, 224)',
  green: 'rgb(102, 225, 65)',
  greenGrass: 'rgb(0, 212, 106)',
  greenTeal: 'rgb(2, 212, 177)',
  orange: 'rgb(255, 153, 28)',
  orangeKinops: 'rgb(255, 119, 0)',
  purple: 'rgb(166, 48, 150)',
  redPurple: 'rgb(191, 52, 121)',
  red: 'rgb(250, 58, 55)',
  redRose: 'rgb(255, 74, 94)',
  sunflower: 'rgb(255, 207, 74)',
  yellow: 'rgb(254, 233, 78)',
  white: 'rgb(255, 255, 255)',
};

export const MOMENT_FORMATS = {
  time: 'LT',
  timeWithSeconds: 'LTS',
  date: 'LL',
  dateWithDay: 'dddd, LL',
  dateNumeric: 'L',
  dateShort: 'll',
  dateWithDayShort: 'ddd, ll',
  dateTime: 'LLL',
  dateTimeNumeric: 'L LT',
  dateTimeShort: 'lll',
  dateTimeWithDay: 'LLLL',
  dateTimeWithDayShort: 'llll',
};

export const DATE_TIME_REGEX = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)$/;
export const DATE_REGEX = /^\d{4}-[01]\d-[0-3]\d$/;
export const TIME_REGEX = /^[0-2]\d:[0-5]\d$/;

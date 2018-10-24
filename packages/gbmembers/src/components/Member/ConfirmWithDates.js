import InputDialogWithDates from './InputDialogWithDates';
import { createConfirmation } from 'react-confirm';
import $ from 'jquery';

export const confirmWithDates = createConfirmation(
  InputDialogWithDates,
  100,
  $('#mainContent')[0],
);

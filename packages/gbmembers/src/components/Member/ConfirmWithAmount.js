import InputDialogWithAmount from './InputDialogWithAmount';
import { createConfirmation } from 'react-confirm';
import $ from 'jquery';

export const confirmWithAmount = createConfirmation(
  InputDialogWithAmount,
  100,
  $('#mainContent')[0],
);

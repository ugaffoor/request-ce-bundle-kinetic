import $ from 'jquery';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import { contact_date_format } from '../leads/LeadsUtils';

export function getHistoryInfo(journeyEvent) {
  let histJson;
  if (journeyEvent.submission.values['Record Type'] === 'Member') {
    histJson = getJson(journeyEvent.memberItem.values['Notes History']);
  } else {
    histJson = getJson(journeyEvent.leadItem.values['History']);
    if (
      histJson.length > 0 &&
      typeof histJson[0] === 'string' &&
      histJson[0].indexOf('. User Comment:') !== -1
    ) {
      //      histJson[0]=histJson[0].replace("User Comment:", "\",\"User Comment\":\"").replaceAll("[{","{").replaceAll("}]","}");
      histJson[0] = histJson[0].replace('[{', '{').replace('}]', '}');
      histJson[0] = getJson(histJson[0].replace(/\n/g, ' '));
    }
  }
  let sortedHistory = histJson.slice().sort(function(a, b) {
    if (
      moment(a['contactDate'], contact_date_format).isBefore(
        moment(b['contactDate'], contact_date_format),
      )
    )
      return 1;
    if (
      moment(a['contactDate'], contact_date_format).isAfter(
        moment(b['contactDate'], contact_date_format),
      )
    )
      return -1;
    return 0;
  });

  return sortedHistory;
}

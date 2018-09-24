import { getJson } from '../Member/MemberUtils';

var familyDiscounts = { first: 10.0, second: 20.0, third: 30.0 };

export function getMembershipCost(member, membershipFees) {
  let programs = member.values['Fee Program'];

  console.log('######### FEE Program = ' + programs);

  if (!programs) {
    return Number(0);
  }
  let feePrograms = membershipFees.filter(feeprogram =>
    getJson(programs).some(program => program === feeprogram.program),
  );
  let fee = Number(0);

  feePrograms.forEach(program => {
    fee += Number(program.fee);
  });
  console.log('# membershipCost #' + fee);
  return fee;
}

export function getFamilyMembershipCost(member, familyMembers, membershipFees) {
  let parentMemberFee = getMembershipCost(member, membershipFees);
  let familyMemberFees = 0.0;

  familyMembers.forEach(member => {
    let memberOrder = member.values['Family Member Order'];
    if (!memberOrder) {
      return;
    }
    let discountPercent = familyDiscounts[memberOrder];
    let memberFee =
      (getMembershipCost(member, membershipFees) * (100.0 - discountPercent)) /
      100;
    familyMemberFees += memberFee;
    member.values['Membership Cost'] = memberFee;
  });
  console.log('# familyMembershipCost # ' + familyMemberFees);
  return Number(parentMemberFee) + Number(familyMemberFees);
}

export const schedulePeriodType = [
  { value: 'M', label: 'Monthly' },
  { value: 'F', label: 'Fortnightly' },
];
export const dayOfMonth = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
];
export const dayOfWeek = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
];

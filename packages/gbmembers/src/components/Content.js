import React, { lazy, Suspense } from 'react';
import { KappRoute as Route, KappRedirect as Redirect, Loading } from 'common';
import { NotificationsContainer } from './notifications/NotificationsContainer';
import { ModalFormContainer } from '../lib/react-kinops-components/src/components/Modals/ModalFormContainer';

const HomeContainer = lazy(() =>
  import('./home/Home').then(m => ({ default: m.HomeContainer })),
);
const AttendanceContainer = lazy(() =>
  import('./attendance/Attendance').then(m => ({
    default: m.AttendanceContainer,
  })),
);
const GradingContainer = lazy(() =>
  import('./attendance/Grading').then(m => ({ default: m.GradingContainer })),
);
const LeadsContainer = lazy(() =>
  import('./leads/Leads').then(m => ({ default: m.LeadsContainer })),
);
const LeadNewContainer = lazy(() =>
  import('./leads/LeadNew').then(m => ({ default: m.LeadNewContainer })),
);
const LeadDetailContainer = lazy(() =>
  import('./leads/LeadDetail').then(m => ({ default: m.LeadDetailContainer })),
);
const LeadEditContainer = lazy(() =>
  import('./leads/LeadEdit').then(m => ({ default: m.LeadEditContainer })),
);
const MemberEditContainer = lazy(() =>
  import('./Member/MemberEdit').then(m => ({ default: m.MemberEditContainer })),
);
const MemberNewContainer = lazy(() =>
  import('./Member/MemberNew').then(m => ({ default: m.MemberNewContainer })),
);
const MemberViewContainer = lazy(() =>
  import('./Member/MemberView').then(m => ({ default: m.MemberViewContainer })),
);
const RemoteRegistrationContainer = lazy(() =>
  import('./Member/RemoteRegistration').then(m => ({
    default: m.RemoteRegistrationContainer,
  })),
);
const BillingContainer = lazy(() =>
  import('./Member/Billing').then(m => ({ default: m.BillingContainer })),
);
const ListNewContainer = lazy(() =>
  import('./lists/ListNew').then(m => ({ default: m.ListNewContainer })),
);
const ListContainer = lazy(() =>
  import('./lists/MemberList').then(m => ({ default: m.ListContainer })),
);
const ListEditContainer = lazy(() =>
  import('./lists/ListEdit').then(m => ({ default: m.ListEditContainer })),
);
const LeadListNewContainer = lazy(() =>
  import('./lists/LeadListNew').then(m => ({
    default: m.LeadListNewContainer,
  })),
);
const LeadListContainer = lazy(() =>
  import('./lists/LeadList').then(m => ({ default: m.LeadListContainer })),
);
const LeadListEditContainer = lazy(() =>
  import('./lists/LeadListEdit').then(m => ({
    default: m.LeadListEditContainer,
  })),
);
const MemberNotesContainer = lazy(() =>
  import('./Member/MemberNotes').then(m => ({
    default: m.MemberNotesContainer,
  })),
);
const MemberFollowUpContainer = lazy(() =>
  import('./Member/MemberFollowUp').then(m => ({
    default: m.MemberFollowUpContainer,
  })),
);
const MigratingMembersContainer = lazy(() =>
  import('./Member/MigratingMembers').then(m => ({
    default: m.MigratingMembersContainer,
  })),
);
const CampaignContainer = lazy(() =>
  import('./send/Send').then(m => ({ default: m.CampaignContainer })),
);
const EmailCampaignContainer = lazy(() =>
  import('./send/NewEmailCampaign').then(m => ({
    default: m.EmailCampaignContainer,
  })),
);
const SmsCampaignContainer = lazy(() =>
  import('./send/NewSmsCampaign').then(m => ({
    default: m.SmsCampaignContainer,
  })),
);
const DDRTemplatesContainer = lazy(() =>
  import('./DDRTemplates').then(m => ({ default: m.DDRTemplatesContainer })),
);
const FormContainer = lazy(() =>
  import('./form/FormContainer').then(m => ({ default: m.FormContainer })),
);
const ReportsContainer = lazy(() =>
  import('./reports/Reports').then(m => ({ default: m.ReportsContainer })),
);
const EmailEventContainer = lazy(() =>
  import('./journey/EmailEvent').then(m => ({
    default: m.EmailEventContainer,
  })),
);
const SMSEventContainer = lazy(() =>
  import('./journey/SMSEvent').then(m => ({ default: m.SMSEventContainer })),
);
const CallEventContainer = lazy(() =>
  import('./journey/CallEvent').then(m => ({ default: m.CallEventContainer })),
);
const ProShopContainer = lazy(() =>
  import('./ProShop/ProShop').then(m => ({ default: m.ProShopContainer })),
);

export const Content = ({ isKiosk }) => (
  <div className="content" id="mainContent">
    <NotificationsContainer />
    {!isKiosk && (
      <Route path="/" exact render={() => <Redirect to="/Home" />} />
    )}
    {isKiosk && (
      <Route path="/" exact render={() => <Redirect to="/Attendance" />} />
    )}
    <Suspense fallback={<Loading />}>
      <Route path="/Home" component={HomeContainer} />
      <Route path="/Attendance" component={AttendanceContainer} />
      <Route path="/Grading" component={GradingContainer} />
      <Route path="/Leads" component={LeadsContainer} />
      <Route path="/NewLead" component={LeadNewContainer} />
      <Route path="/LeadDetail/:id" component={LeadDetailContainer} />
      <Route path="/LeadEdit/:id" component={LeadEditContainer} />
      <Route path="/NewMember/:leadId?" component={MemberNewContainer} />
      <Route path="/Edit/:id" component={MemberEditContainer} />
      <Route path="/Member/:id" component={MemberViewContainer} />
      <Route
        path="/RemoteRegistration/:id"
        component={RemoteRegistrationContainer}
      />
      <Route path="/Billing/:id" component={BillingContainer} />
      <Route path="/NewList" component={ListNewContainer} />
      <Route path="/memberLists" component={ListContainer} />
      <Route path="/ListEdit/:name" component={ListEditContainer} />
      <Route path="/NewLeadList" component={LeadListNewContainer} />
      <Route path="/leadLists" component={LeadListContainer} />
      <Route path="/LeadListEdit/:name" component={LeadListEditContainer} />
      <Route path="/MemberNotesDetail/:id" component={MemberNotesContainer} />
      <Route path="/MemberFollowUp/:id" component={MemberFollowUpContainer} />
      <Route path="/Send" component={CampaignContainer} />
      <Route path="/MigratingMembers" component={MigratingMembersContainer} />
      <Route
        path="/NewEmailCampaign/:submissionType?/:submissionId?/:replyType?/:campaignId?"
        component={EmailCampaignContainer}
      />
      <Route
        path="/NewSmsCampaign/:submissionType?/:submissionId?/:replyType?/:campaignId?"
        component={SmsCampaignContainer}
      />
      <Route path="/ddrTemplates" component={DDRTemplatesContainer} />
      <Route exact path="/forms/:formSlug" component={FormContainer} />
      <Route
        exact
        path="/forms/:formSlug/:submissionId"
        component={FormContainer}
      />
      <ModalFormContainer />
      <Route path="/Reports" component={ReportsContainer} />
      <Route
        path="/EmailEvent/:recordType?/:eventId?"
        component={EmailEventContainer}
      />
      <Route
        path="/SMSEvent/:recordType?/:eventId?"
        component={SMSEventContainer}
      />
      <Route
        path="/CallEvent/:recordType?/:eventId?"
        component={CallEventContainer}
      />
      <Route
        path="/ProShop/:recordType?/:eventId?"
        component={ProShopContainer}
      />
    </Suspense>
  </div>
);

import React from 'react';
import { KappRoute as Route, KappRedirect as Redirect, Loading } from 'common';
import { HomeContainer } from './home/Home';
import { AttendanceContainer } from './attendance/Attendance';
import { LeadsContainer } from './leads/Leads';
import { LeadNewContainer } from './leads/LeadNew';
import { LeadDetailContainer } from './leads/LeadDetail';
import { LeadEditContainer } from './leads/LeadEdit';
import { FollowUpContainer } from './leads/FollowUp';
import { NotificationsContainer } from './notifications/NotificationsContainer';
import { MemberEditContainer } from './Member/MemberEdit';
import { MemberNewContainer } from './Member/MemberNew';
import { MemberViewContainer } from './Member/MemberView';
import { BillingContainer } from './Member/Billing';
import { ModalFormContainer } from '../lib/react-kinops-components/src/components/Modals/ModalFormContainer';
import { ListNewContainer } from './lists/ListNew';
import { ListContainer } from './lists/MemberList';
import { ListEditContainer } from './lists/ListEdit';
import { MemberNotesContainer } from './Member/MemberNotes';
import { MemberFollowUpContainer } from './Member/MemberFollowUp';
import { CampaignContainer } from './send/Send';
import { ManualCampaignContainer } from './send/NewManualCampaign';
import { DDRTemplatesContainer } from './DDRTemplates';
import { SettingsContainer } from './settings/Settings';
import { FormContainer } from './form/FormContainer';
import { ReportsContainer } from './reports/Reports';

export const Content = () => (
  <div className="content" id="mainContent">
    <NotificationsContainer />
    <Route path="/" exact render={() => <Redirect to="/Home" />} />
    <Route path="/Home" component={HomeContainer} />
    <Route path="/Attendance" component={AttendanceContainer} />
    <Route path="/Leads" component={LeadsContainer} />
    <Route path="/NewLead" component={LeadNewContainer} />
    <Route path="/LeadDetail/:id" component={LeadDetailContainer} />
    <Route path="/LeadEdit/:id" component={LeadEditContainer} />
    <Route path="/FollowUp/:id" component={FollowUpContainer} />
    <Route path="/NewMember/:leadId?" component={MemberNewContainer} />
    <Route path="/Edit/:id" component={MemberEditContainer} />
    <Route path="/Member/:id" component={MemberViewContainer} />
    <Route path="/Billing/:id" component={BillingContainer} />
    <Route path="/NewList" component={ListNewContainer} />
    <Route path="/memberLists" component={ListContainer} />
    <Route path="/ListEdit/:name" component={ListEditContainer} />
    <Route path="/MemberNotesDetail/:id" component={MemberNotesContainer} />
    <Route path="/MemberFollowUp/:id" component={MemberFollowUpContainer} />
    <Route path="/Send" component={CampaignContainer} />
    <Route
      path="/NewManualCampaign/:submissionId?/:submissionType?"
      component={ManualCampaignContainer}
    />
    <Route path="/ddrTemplates" component={DDRTemplatesContainer} />
    <Route path="/Settings" component={SettingsContainer} />
    <Route exact path="/forms/:formSlug" component={FormContainer} />
    <Route
      exact
      path="/forms/:formSlug/:submissionId"
      component={FormContainer}
    />
    <ModalFormContainer />
    <Route path="/Reports" component={ReportsContainer} />
  </div>
);

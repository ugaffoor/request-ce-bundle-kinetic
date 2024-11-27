import React, { Component } from 'react';
import ReactTable from 'react-table';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import SVGInline from 'react-svg-inline';
import ReactToPrint from 'react-to-print';
import printerIcon from '../../images/Print.svg?raw';

export class PDDailyReport extends Component {
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    let startOfWeek = moment().startOf('week');
    let endOfWeek = moment().endOf('week');
    let leads = this.props.leadsByDate;
    let data = this.getData(leads, startOfWeek, endOfWeek);
    let columns = this.getColumns();
    this.state = {
      leads,
      data,
      columns,
      startOfWeek,
      endOfWeek,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    let leads = nextProps.leadsByDate;
    let data = this.getData(
      leads,
      this.state.startOfWeek,
      this.state.endOfWeek,
    );
    this.setState({
      leads,
      data: data,
    });
  }

  UNSAFE_componentWillMount() {
    if (this.props.leadsByDate.length === 0) {
      this.props.fetchLeadsByDate();
    }
  }

  getData(leads, startOfWeek, endOfWeek) {
    if (!leads || leads.length <= 0) {
      return [];
    }
    let leadsData = [];
    let newLeads = new Map();
    newLeads.set('label', 'Lead');
    newLeads.set('monday', 0);
    newLeads.set('tuesday', 0);
    newLeads.set('wednesday', 0);
    newLeads.set('thursday', 0);
    newLeads.set('friday', 0);
    newLeads.set('saturday', 0);
    newLeads.set('sunday', 0);
    let intros = new Map();
    intros.set('label', 'Intros Appointment');
    intros.set('monday', 0);
    intros.set('tuesday', 0);
    intros.set('wednesday', 0);
    intros.set('thursday', 0);
    intros.set('friday', 0);
    intros.set('saturday', 0);
    intros.set('sunday', 0);
    let taught = new Map();
    taught.set('label', 'Intros Taught');
    taught.set('monday', 0);
    taught.set('tuesday', 0);
    taught.set('wednesday', 0);
    taught.set('thursday', 0);
    taught.set('friday', 0);
    taught.set('saturday', 0);
    taught.set('sunday', 0);
    let noshow = new Map();
    noshow.set('label', 'Intros No Show');
    noshow.set('monday', 0);
    noshow.set('tuesday', 0);
    noshow.set('wednesday', 0);
    noshow.set('thursday', 0);
    noshow.set('friday', 0);
    noshow.set('saturday', 0);
    noshow.set('sunday', 0);
    let enrollment = new Map();
    enrollment.set('label', 'Enrollment');
    enrollment.set('monday', 0);
    enrollment.set('tuesday', 0);
    enrollment.set('wednesday', 0);
    enrollment.set('thursday', 0);
    enrollment.set('friday', 0);
    enrollment.set('saturday', 0);
    enrollment.set('sunday', 0);
    let newSales = new Map();
    newSales.set('label', 'New Sales');
    newSales.set('monday', 0);
    newSales.set('tuesday', 0);
    newSales.set('wednesday', 0);
    newSales.set('thursday', 0);
    newSales.set('friday', 0);
    newSales.set('saturday', 0);
    newSales.set('sunday', 0);
    let newSalesWeek = new Map();
    newSalesWeek.set('label', 'New Sales This Week');
    newSalesWeek.set('monday', 0);
    newSalesWeek.set('tuesday', 0);
    newSalesWeek.set('wednesday', 0);
    newSalesWeek.set('thursday', 0);
    newSalesWeek.set('friday', 0);
    newSalesWeek.set('saturday', 0);
    newSalesWeek.set('sunday', 0);
    let phone = new Map();
    phone.set('label', 'Phone Calls');
    phone.set('monday', 0);
    phone.set('tuesday', 0);
    phone.set('wednesday', 0);
    phone.set('thursday', 0);
    phone.set('friday', 0);
    phone.set('saturday', 0);
    phone.set('sunday', 0);
    let emails = new Map();
    emails.set('label', 'Email Notes');
    emails.set('monday', 0);
    emails.set('tuesday', 0);
    emails.set('wednesday', 0);
    emails.set('thursday', 0);
    emails.set('friday', 0);
    emails.set('saturday', 0);
    emails.set('sunday', 0);
    let emailSent = new Map();
    emailSent.set('label', 'Email Sent');
    emailSent.set('monday', 0);
    emailSent.set('tuesday', 0);
    emailSent.set('wednesday', 0);
    emailSent.set('thursday', 0);
    emailSent.set('friday', 0);
    emailSent.set('saturday', 0);
    emailSent.set('sunday', 0);
    let sms = new Map();
    sms.set('label', 'SMS Notes');
    sms.set('monday', 0);
    sms.set('tuesday', 0);
    sms.set('wednesday', 0);
    sms.set('thursday', 0);
    sms.set('friday', 0);
    sms.set('saturday', 0);
    sms.set('sunday', 0);
    let smsSent = new Map();
    smsSent.set('label', 'SMS Sent');
    smsSent.set('monday', 0);
    smsSent.set('tuesday', 0);
    smsSent.set('wednesday', 0);
    smsSent.set('thursday', 0);
    smsSent.set('friday', 0);
    smsSent.set('saturday', 0);
    smsSent.set('sunday', 0);
    let inperson = new Map();
    inperson.set('label', 'In Person');
    inperson.set('monday', 0);
    inperson.set('tuesday', 0);
    inperson.set('wednesday', 0);
    inperson.set('thursday', 0);
    inperson.set('friday', 0);
    inperson.set('saturday', 0);
    inperson.set('sunday', 0);

    leads.forEach(lead => {
      if (moment(lead['createdAt']).isBetween(startOfWeek, endOfWeek)) {
        switch (moment(lead['createdAt']).day()) {
          case 1:
            newLeads.set('monday', newLeads.get('monday') + 1);
            if (
              lead.values['SMS Sent Count'] !== undefined &&
              lead.values['SMS Sent Count'] !== null &&
              lead.values['SMS Sent Count'] !== ''
            ) {
              smsSent.set('monday', smsSent.get('monday') + 1);
            }
            if (
              lead.values['Email Sent Count'] !== undefined &&
              lead.values['Email Sent Count'] !== null &&
              lead.values['Email Sent Count'] !== ''
            ) {
              emailSent.set('monday', emailSent.get('monday') + 1);
            }
            break;
          case 2:
            newLeads.set('tuesday', newLeads.get('tuesday') + 1);
            if (
              lead.values['SMS Sent Count'] !== undefined &&
              lead.values['SMS Sent Count'] !== null &&
              lead.values['SMS Sent Count'] !== ''
            ) {
              smsSent.set('tuesday', smsSent.get('tuesday') + 1);
            }
            if (
              lead.values['Email Sent Count'] !== undefined &&
              lead.values['Email Sent Count'] !== null &&
              lead.values['Email Sent Count'] !== ''
            ) {
              emailSent.set('tuesday', emailSent.get('tuesday') + 1);
            }
            break;
          case 3:
            newLeads.set('wednesday', newLeads.get('wednesday') + 1);
            if (
              lead.values['SMS Sent Count'] !== undefined &&
              lead.values['SMS Sent Count'] !== null &&
              lead.values['SMS Sent Count'] !== ''
            ) {
              smsSent.set('wednesday', smsSent.get('wednesday') + 1);
            }
            if (
              lead.values['Email Sent Count'] !== undefined &&
              lead.values['Email Sent Count'] !== null &&
              lead.values['Email Sent Count'] !== ''
            ) {
              emailSent.set('wednesday', emailSent.get('wednesday') + 1);
            }
            break;
          case 4:
            newLeads.set('thursday', newLeads.get('thursday') + 1);
            if (
              lead.values['SMS Sent Count'] !== undefined &&
              lead.values['SMS Sent Count'] !== null &&
              lead.values['SMS Sent Count'] !== ''
            ) {
              smsSent.set('thursday', smsSent.get('thursday') + 1);
            }
            if (
              lead.values['Email Sent Count'] !== undefined &&
              lead.values['Email Sent Count'] !== null &&
              lead.values['Email Sent Count'] !== ''
            ) {
              emailSent.set('thursday', emailSent.get('thursday') + 1);
            }
            break;
          case 5:
            newLeads.set('friday', newLeads.get('friday') + 1);
            if (
              lead.values['SMS Sent Count'] !== undefined &&
              lead.values['SMS Sent Count'] !== null &&
              lead.values['SMS Sent Count'] !== ''
            ) {
              smsSent.set('friday', smsSent.get('friday') + 1);
            }
            if (
              lead.values['Email Sent Count'] !== undefined &&
              lead.values['Email Sent Count'] !== null &&
              lead.values['Email Sent Count'] !== ''
            ) {
              emailSent.set('friday', emailSent.get('friday') + 1);
            }
            break;
          case 6:
            newLeads.set('saturday', newLeads.get('saturday') + 1);
            if (
              lead.values['SMS Sent Count'] !== undefined &&
              lead.values['SMS Sent Count'] !== null &&
              lead.values['SMS Sent Count'] !== ''
            ) {
              smsSent.set('saturday', smsSent.get('saturday') + 1);
            }
            if (
              lead.values['Email Sent Count'] !== undefined &&
              lead.values['Email Sent Count'] !== null &&
              lead.values['Email Sent Count'] !== ''
            ) {
              emailSent.set('saturday', emailSent.get('saturday') + 1);
            }
            break;
          case 0:
            newLeads.set('sunday', newLeads.get('sunday') + 1);
            if (
              lead.values['SMS Sent Count'] !== undefined &&
              lead.values['SMS Sent Count'] !== null &&
              lead.values['SMS Sent Count'] !== ''
            ) {
              smsSent.set('sunday', smsSent.get('sunday') + 1);
            }
            if (
              lead.values['Email Sent Count'] !== undefined &&
              lead.values['Email Sent Count'] !== null &&
              lead.values['Email Sent Count'] !== ''
            ) {
              emailSent.set('sunday', emailSent.get('sunday') + 1);
            }
            break;
          default:
            console.log('Something is wrong');
        }
      }
      var history =
        lead.values['History'] !== undefined
          ? getJson(lead.values['History'])
          : {};
      for (var i = 0; i < history.length; i++) {
        var contactDate = moment(history[i]['contactDate']);
        if (contactDate.isBetween(startOfWeek, endOfWeek)) {
          if (history[i]['contactMethod'] === 'intro_class') {
            switch (contactDate.day()) {
              case 1:
                intros.set('monday', intros.get('monday') + 1);
                break;
              case 2:
                intros.set('tuesday', intros.get('tuesday') + 1);
                break;
              case 3:
                intros.set('wednesday', intros.get('wednesday') + 1);
                break;
              case 4:
                intros.set('thursday', intros.get('thursday') + 1);
                break;
              case 5:
                intros.set('friday', intros.get('friday') + 1);
                break;
              case 6:
                intros.set('saturday', intros.get('saturday') + 1);
                break;
              case 0:
                intros.set('sunday', intros.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
      }
      for (i = 0; i < history.length; i++) {
        var contactDate = moment(history[i]['contactDate']);
        if (contactDate.isBetween(startOfWeek, endOfWeek)) {
          if (history[i]['contactMethod'] === 'attended_class') {
            switch (contactDate.day()) {
              case 1:
                taught.set('monday', taught.get('monday') + 1);
                break;
              case 2:
                taught.set('tuesday', taught.get('tuesday') + 1);
                break;
              case 3:
                taught.set('wednesday', taught.get('wednesday') + 1);
                break;
              case 4:
                taught.set('thursday', taught.get('thursday') + 1);
                break;
              case 5:
                taught.set('friday', taught.get('friday') + 1);
                break;
              case 6:
                taught.set('saturday', taught.get('saturday') + 1);
                break;
              case 0:
                taught.set('sunday', taught.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
      }
      for (i = 0; i < history.length; i++) {
        var contactDate = moment(history[i]['contactDate']);
        if (contactDate.isBetween(startOfWeek, endOfWeek)) {
          if (history[i]['contactMethod'] === 'noshow_class') {
            switch (contactDate.day()) {
              case 1:
                noshow.set('monday', taught.get('monday') + 1);
                break;
              case 2:
                noshow.set('tuesday', taught.get('tuesday') + 1);
                break;
              case 3:
                noshow.set('wednesday', taught.get('wednesday') + 1);
                break;
              case 4:
                noshow.set('thursday', taught.get('thursday') + 1);
                break;
              case 5:
                noshow.set('friday', taught.get('friday') + 1);
                break;
              case 6:
                noshow.set('saturday', taught.get('saturday') + 1);
                break;
              case 0:
                noshow.set('sunday', taught.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
      }
      if (
        moment(lead['updatedAt']).isBetween(startOfWeek, endOfWeek) &&
        lead.values['Lead State'] === 'Converted'
      ) {
        switch (moment(lead['updatedAt']).day()) {
          case 1:
            enrollment.set('monday', enrollment.get('monday') + 1);
            break;
          case 2:
            enrollment.set('tuesday', enrollment.get('tuesday') + 1);
            break;
          case 3:
            enrollment.set('wednesday', enrollment.get('wednesday') + 1);
            break;
          case 4:
            enrollment.set('thursday', enrollment.get('thursday') + 1);
            break;
          case 5:
            enrollment.set('friday', enrollment.get('friday') + 1);
            break;
          case 6:
            enrollment.set('saturday', enrollment.get('saturday') + 1);
            break;
          case 0:
            enrollment.set('sunday', enrollment.get('sunday') + 1);
            break;
          default:
            console.log('Something is wrong');
        }
      }
      for (i = 0; i < history.length; i++) {
        var contactDate = moment(history[i]['contactDate']);
        if (contactDate.isBetween(startOfWeek, endOfWeek)) {
          if (history[i]['contactMethod'] === 'phone') {
            switch (contactDate.day()) {
              case 1:
                phone.set('monday', phone.get('monday') + 1);
                break;
              case 2:
                phone.set('tuesday', phone.get('tuesday') + 1);
                break;
              case 3:
                phone.set('wednesday', phone.get('wednesday') + 1);
                break;
              case 4:
                phone.set('thursday', phone.get('thursday') + 1);
                break;
              case 5:
                phone.set('friday', phone.get('friday') + 1);
                break;
              case 6:
                phone.set('saturday', phone.get('saturday') + 1);
                break;
              case 0:
                phone.set('sunday', phone.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
      }
      for (i = 0; i < history.length; i++) {
        var contactDate = moment(history[i]['contactDate']);
        if (contactDate.isBetween(startOfWeek, endOfWeek)) {
          if (history[i]['contactMethod'] === 'email') {
            switch (contactDate.day()) {
              case 1:
                emails.set('monday', emails.get('monday') + 1);
                break;
              case 2:
                emails.set('tuesday', emails.get('tuesday') + 1);
                break;
              case 3:
                emails.set('wednesday', emails.get('wednesday') + 1);
                break;
              case 4:
                emails.set('thursday', emails.get('thursday') + 1);
                break;
              case 5:
                emails.set('friday', emails.get('friday') + 1);
                break;
              case 6:
                emails.set('saturday', emails.get('saturday') + 1);
                break;
              case 0:
                emails.set('sunday', emails.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
      }
      for (i = 0; i < history.length; i++) {
        var contactDate = moment(history[i]['contactDate']);
        if (contactDate.isBetween(startOfWeek, endOfWeek)) {
          if (history[i]['contactMethod'] === 'sms') {
            switch (contactDate.day()) {
              case 1:
                sms.set('monday', sms.get('monday') + 1);
                break;
              case 2:
                sms.set('tuesday', sms.get('tuesday') + 1);
                break;
              case 3:
                sms.set('wednesday', sms.get('wednesday') + 1);
                break;
              case 4:
                sms.set('thursday', sms.get('thursday') + 1);
                break;
              case 5:
                sms.set('friday', sms.get('friday') + 1);
                break;
              case 6:
                sms.set('saturday', sms.get('saturday') + 1);
                break;
              case 0:
                sms.set('sunday', sms.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
      }
      for (i = 0; i < history.length; i++) {
        var contactDate = moment(history[i]['contactDate']);
        if (contactDate.isBetween(startOfWeek, endOfWeek)) {
          if (history[i]['contactMethod'] === 'in_person') {
            switch (contactDate.day()) {
              case 1:
                inperson.set('monday', inperson.get('monday') + 1);
                break;
              case 2:
                inperson.set('tuesday', inperson.get('tuesday') + 1);
                break;
              case 3:
                inperson.set('wednesday', inperson.get('wednesday') + 1);
                break;
              case 4:
                inperson.set('thursday', inperson.get('thursday') + 1);
                break;
              case 5:
                inperson.set('friday', inperson.get('friday') + 1);
                break;
              case 6:
                inperson.set('saturday', inperson.get('saturday') + 1);
                break;
              case 0:
                inperson.set('sunday', inperson.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
      }

      //      }
    });

    leadsData.push({
      label: newLeads.get('label'),
      monday: newLeads.get('monday'),
      tuesday: newLeads.get('tuesday'),
      wednesday: newLeads.get('wednesday'),
      thursday: newLeads.get('thursday'),
      friday: newLeads.get('friday'),
      saturday: newLeads.get('saturday'),
      sunday: newLeads.get('sunday'),
      total:
        newLeads.get('monday') +
        newLeads.get('tuesday') +
        newLeads.get('wednesday') +
        newLeads.get('thursday') +
        newLeads.get('friday') +
        newLeads.get('saturday') +
        newLeads.get('sunday'),
    });
    leadsData.push({
      label: emailSent.get('label'),
      monday: emailSent.get('monday'),
      tuesday: emailSent.get('tuesday'),
      wednesday: emailSent.get('wednesday'),
      thursday: emailSent.get('thursday'),
      friday: emailSent.get('friday'),
      saturday: emailSent.get('saturday'),
      sunday: emailSent.get('sunday'),
      total:
        emailSent.get('monday') +
        emailSent.get('tuesday') +
        emailSent.get('wednesday') +
        emailSent.get('thursday') +
        emailSent.get('friday') +
        emailSent.get('saturday') +
        emailSent.get('sunday'),
    });
    leadsData.push({
      label: smsSent.get('label'),
      monday: smsSent.get('monday'),
      tuesday: smsSent.get('tuesday'),
      wednesday: smsSent.get('wednesday'),
      thursday: smsSent.get('thursday'),
      friday: smsSent.get('friday'),
      saturday: smsSent.get('saturday'),
      sunday: smsSent.get('sunday'),
      total:
        smsSent.get('monday') +
        smsSent.get('tuesday') +
        smsSent.get('wednesday') +
        smsSent.get('thursday') +
        smsSent.get('friday') +
        smsSent.get('saturday') +
        smsSent.get('sunday'),
    });

    leadsData.push({
      label: intros.get('label'),
      monday: intros.get('monday'),
      tuesday: intros.get('tuesday'),
      wednesday: intros.get('wednesday'),
      thursday: intros.get('thursday'),
      friday: intros.get('friday'),
      saturday: intros.get('saturday'),
      sunday: intros.get('sunday'),
      total:
        intros.get('monday') +
        intros.get('tuesday') +
        intros.get('wednesday') +
        intros.get('thursday') +
        intros.get('friday') +
        intros.get('saturday') +
        intros.get('sunday'),
    });

    leadsData.push({
      label: taught.get('label'),
      monday: taught.get('monday'),
      tuesday: taught.get('tuesday'),
      wednesday: taught.get('wednesday'),
      thursday: taught.get('thursday'),
      friday: taught.get('friday'),
      saturday: taught.get('saturday'),
      sunday: taught.get('sunday'),
      total:
        taught.get('monday') +
        taught.get('tuesday') +
        taught.get('wednesday') +
        taught.get('thursday') +
        taught.get('friday') +
        taught.get('saturday') +
        taught.get('sunday'),
    });

    leadsData.push({
      label: noshow.get('label'),
      monday: noshow.get('monday'),
      tuesday: noshow.get('tuesday'),
      wednesday: noshow.get('wednesday'),
      thursday: noshow.get('thursday'),
      friday: noshow.get('friday'),
      saturday: noshow.get('saturday'),
      sunday: noshow.get('sunday'),
      total:
        noshow.get('monday') +
        noshow.get('tuesday') +
        noshow.get('wednesday') +
        noshow.get('thursday') +
        noshow.get('friday') +
        noshow.get('saturday') +
        noshow.get('sunday'),
    });

    leadsData.push({
      label: enrollment.get('label'),
      monday: enrollment.get('monday'),
      tuesday: enrollment.get('tuesday'),
      wednesday: enrollment.get('wednesday'),
      thursday: enrollment.get('thursday'),
      friday: enrollment.get('friday'),
      saturday: enrollment.get('saturday'),
      sunday: enrollment.get('sunday'),
      total:
        enrollment.get('monday') +
        enrollment.get('tuesday') +
        enrollment.get('wednesday') +
        enrollment.get('thursday') +
        enrollment.get('friday') +
        enrollment.get('saturday') +
        enrollment.get('sunday'),
    });
    /*
    leadsData.push({
      label: newSales.get("label"),
      monday: newSales.get("monday"),
      tuesday: newSales.get("tuesday"),
      wednesday: newSales.get("wednesday"),
      thursday: newSales.get("thursday"),
      friday: newSales.get("friday"),
      saturday: newSales.get("saturday"),
      sunday: newSales.get("sunday"),
      total: (newSales.get("monday")+newSales.get("tuesday")+newSales.get("wednesday")+newSales.get("thursday")+newSales.get("friday")+newSales.get("saturday")+newSales.get("sunday")),
    });
*/
    leadsData.push({
      label: phone.get('label'),
      monday: phone.get('monday'),
      tuesday: phone.get('tuesday'),
      wednesday: phone.get('wednesday'),
      thursday: phone.get('thursday'),
      friday: phone.get('friday'),
      saturday: phone.get('saturday'),
      sunday: phone.get('sunday'),
      total:
        phone.get('monday') +
        phone.get('tuesday') +
        phone.get('wednesday') +
        phone.get('thursday') +
        phone.get('friday') +
        phone.get('saturday') +
        phone.get('sunday'),
    });
    leadsData.push({
      label: emails.get('label'),
      monday: emails.get('monday'),
      tuesday: emails.get('tuesday'),
      wednesday: emails.get('wednesday'),
      thursday: emails.get('thursday'),
      friday: emails.get('friday'),
      saturday: emails.get('saturday'),
      sunday: emails.get('sunday'),
      total:
        emails.get('monday') +
        emails.get('tuesday') +
        emails.get('wednesday') +
        emails.get('thursday') +
        emails.get('friday') +
        emails.get('saturday') +
        emails.get('sunday'),
    });
    leadsData.push({
      label: sms.get('label'),
      monday: sms.get('monday'),
      tuesday: sms.get('tuesday'),
      wednesday: sms.get('wednesday'),
      thursday: sms.get('thursday'),
      friday: sms.get('friday'),
      saturday: sms.get('saturday'),
      sunday: sms.get('sunday'),
      total:
        sms.get('monday') +
        sms.get('tuesday') +
        sms.get('wednesday') +
        sms.get('thursday') +
        sms.get('friday') +
        sms.get('saturday') +
        sms.get('sunday'),
    });
    leadsData.push({
      label: inperson.get('label'),
      monday: inperson.get('monday'),
      tuesday: inperson.get('tuesday'),
      wednesday: inperson.get('wednesday'),
      thursday: inperson.get('thursday'),
      friday: inperson.get('friday'),
      saturday: inperson.get('saturday'),
      sunday: inperson.get('sunday'),
      total:
        inperson.get('monday') +
        inperson.get('tuesday') +
        inperson.get('wednesday') +
        inperson.get('thursday') +
        inperson.get('friday') +
        inperson.get('saturday') +
        inperson.get('sunday'),
    });

    var mondayTotal =
      parseInt(newLeads.get('monday')) +
      parseInt(intros.get('monday')) +
      parseInt(taught.get('monday')) +
      parseInt(noshow.get('monday')) +
      parseInt(enrollment.get('monday')) +
      parseInt(phone.get('monday')) +
      parseInt(emails.get('monday')) +
      parseInt(emailSent.get('monday')) +
      parseInt(sms.get('monday')) +
      parseInt(smsSent.get('monday')) +
      parseInt(inperson.get('monday'));
    var tuesdayTotal =
      parseInt(newLeads.get('tuesday')) +
      parseInt(intros.get('tuesday')) +
      parseInt(taught.get('tuesday')) +
      parseInt(noshow.get('tuesday')) +
      parseInt(enrollment.get('tuesday')) +
      parseInt(phone.get('tuesday')) +
      parseInt(emails.get('tuesday')) +
      parseInt(emailSent.get('tuesday')) +
      parseInt(sms.get('tuesday')) +
      parseInt(smsSent.get('tuesday')) +
      parseInt(inperson.get('tuesday'));
    var wednesdayTotal =
      parseInt(newLeads.get('wednesday')) +
      parseInt(intros.get('wednesday')) +
      parseInt(taught.get('wednesday')) +
      parseInt(noshow.get('wednesday')) +
      parseInt(enrollment.get('wednesday')) +
      parseInt(phone.get('wednesday')) +
      parseInt(emails.get('wednesday')) +
      parseInt(emailSent.get('wednesday')) +
      parseInt(sms.get('wednesday')) +
      parseInt(smsSent.get('wednesday')) +
      parseInt(inperson.get('wednesday'));
    var thursdayTotal =
      parseInt(newLeads.get('thursday')) +
      parseInt(intros.get('thursday')) +
      parseInt(taught.get('thursday')) +
      parseInt(noshow.get('thursday')) +
      parseInt(enrollment.get('thursday')) +
      parseInt(phone.get('thursday')) +
      parseInt(emails.get('thursday')) +
      parseInt(emailSent.get('thursday')) +
      parseInt(sms.get('thursday')) +
      parseInt(smsSent.get('thursday')) +
      parseInt(inperson.get('thursday'));
    var fridayTotal =
      parseInt(newLeads.get('friday')) +
      parseInt(intros.get('friday')) +
      parseInt(taught.get('friday')) +
      parseInt(noshow.get('friday')) +
      parseInt(enrollment.get('friday')) +
      parseInt(phone.get('friday')) +
      parseInt(emails.get('friday')) +
      parseInt(emailSent.get('friday')) +
      parseInt(sms.get('friday')) +
      parseInt(smsSent.get('friday')) +
      parseInt(inperson.get('friday'));
    var saturdayTotal =
      parseInt(newLeads.get('saturday')) +
      parseInt(intros.get('saturday')) +
      parseInt(taught.get('saturday')) +
      parseInt(noshow.get('saturday')) +
      parseInt(enrollment.get('saturday')) +
      parseInt(phone.get('saturday')) +
      parseInt(emails.get('saturday')) +
      parseInt(emailSent.get('saturday')) +
      parseInt(sms.get('saturday')) +
      parseInt(smsSent.get('saturday')) +
      parseInt(inperson.get('saturday'));
    var sundayTotal =
      parseInt(newLeads.get('sunday')) +
      parseInt(intros.get('sunday')) +
      parseInt(taught.get('sunday')) +
      parseInt(noshow.get('sunday')) +
      parseInt(enrollment.get('sunday')) +
      parseInt(phone.get('sunday')) +
      parseInt(emails.get('sunday')) +
      parseInt(emailSent.get('sunday')) +
      parseInt(sms.get('sunday')) +
      parseInt(smsSent.get('sunday')) +
      parseInt(inperson.get('sunday'));

    leadsData.push({
      label: 'Total',
      monday: mondayTotal,
      tuesday: tuesdayTotal,
      wednesday: wednesdayTotal,
      thursday: thursdayTotal,
      friday: fridayTotal,
      saturday: saturdayTotal,
      sunday: sundayTotal,
      total:
        mondayTotal +
        tuesdayTotal +
        wednesdayTotal +
        thursdayTotal +
        fridayTotal +
        saturdayTotal +
        sundayTotal,
    });
    return leadsData;
  }

  getColumns(data) {
    const columns = [
      { accessor: 'label', Header: 'Report' },
      { accessor: 'monday', Header: 'Monday' },
      { accessor: 'tuesday', Header: 'Tuesday' },
      { accessor: 'wednesday', Header: 'Wednesday' },
      { accessor: 'thursday', Header: 'Thursday' },
      { accessor: 'friday', Header: 'Friday' },
      { accessor: 'saturday', Header: 'Saturday' },
      { accessor: 'sunday', Header: 'Sunday' },
      { accessor: 'total', Header: 'Weekly Total' },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.leadsByDateLoading ? (
      <div style={{ margin: '10px' }}>
        <p>Loading PD Daily report ...</p>
        <ReactSpinner />{' '}
      </div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>PD Daily Report</h6>
          <div className="dateSettings">
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                let startOfWeek = this.state.startOfWeek.subtract(7, 'days');
                let endOfWeek = this.state.endOfWeek.subtract(7, 'days');
                let data = this.getData(
                  this.state.leads,
                  startOfWeek,
                  endOfWeek,
                );
                this.setState({
                  data: data,
                  startOfWeek: startOfWeek,
                  endOfWeek: endOfWeek,
                });
              }}
            >
              Previous Week
            </button>
            <h6>
              {this.state.startOfWeek.format('L')} to{' '}
              {this.state.endOfWeek.format('L')}
            </h6>
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              disabled={moment().isBetween(
                this.state.startOfWeek,
                this.state.endOfWeek,
              )}
              onClick={e => {
                let startOfWeek = this.state.startOfWeek.add(7, 'days');
                let endOfWeek = this.state.endOfWeek.add(7, 'days');
                let data = this.getData(
                  this.state.leads,
                  startOfWeek,
                  endOfWeek,
                );
                this.setState({
                  data: data,
                  startOfWeek: startOfWeek,
                  endOfWeek: endOfWeek,
                });
              }}
            >
              Next Week
            </button>
          </div>
        </div>
        <ReactToPrint
          trigger={() => (
            <SVGInline svg={printerIcon} className="icon tablePrint" />
          )}
          content={() => this.tableComponentRef}
        />
        <ReactTable
          ref={el => (this.tableComponentRef = el)}
          columns={columns}
          data={data}
          className="-striped -highlight"
          defaultPageSize={data.length > 0 ? data.length : 2}
          pageSize={data.length > 0 ? data.length : 2}
          showPagination={false}
        />
        <br />
      </span>
    );
  }
}

import React from 'react';
import DocumentTitle from 'react-document-title';
import { compose, lifecycle } from 'recompose';
import $ from 'jquery';

export const AttendanceView = () => (
  <DocumentTitle title="Attendance">
    <div>Hello Attendance!</div>
  </DocumentTitle>
);
export const AttendanceContainer = compose(
  lifecycle({
    componentWillMount() {},
    componentWillReceiveProps(nextProps) {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(AttendanceView);

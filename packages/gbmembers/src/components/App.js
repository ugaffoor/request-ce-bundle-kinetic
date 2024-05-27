import React from 'react';
import { Helmet } from 'react-helmet';
import 'bootstrap/scss/bootstrap.scss';
import 'typeface-open-sans/index.css';
import '../styles/master.scss';
import { LayoutContainer } from './Layout';
import { Content } from './Content';
import { SidebarContainer } from './SidebarContainer';
import { HeaderContainer } from './HeaderContainer';
import { LoginModal } from './authentication/LoginModal';
import { LiveChatWidget, EventHandlerPayload } from '@livechat/widget-react';
import { getAttributeValue } from '../lib/react-kinops-components/src/utils';

export const App = ({ loading, isKiosk, space, profile }) => (
  <div>
    <Helmet>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
      />
      {/*<link rel="stylesheet" href="//basehold.it/12/11/168/224/0.2" />*/}
      {
        <link
          rel="icon"
          href="https://us-gbfms-files.s3.us-east-2.amazonaws.com/favicon.ico"
          type="image/x-icon"
        ></link>
      }
    </Helmet>
    {loading ? (
      <div />
    ) : (
      <div className="app gbmembers">
        <HeaderContainer />
        {getAttributeValue(space, 'LiveChat License') !== undefined &&
          !isKiosk && (
            <LiveChatWidget
              license={getAttributeValue(space, 'LiveChat License')} //"14790045"
              visibility="minimized"
              customerName={getAttributeValue(space, 'School Name')}
              customerEmail={profile.customerEmail}
            />
          )}
        <LayoutContainer
          sidebarContent={<SidebarContainer />}
          mainContent={<Content isKiosk={isKiosk} />}
        />
        <LoginModal />
      </div>
    )}
  </div>
);

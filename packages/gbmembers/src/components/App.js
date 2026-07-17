import React from 'react';
import { Helmet } from 'react-helmet';
import 'bootstrap/scss/bootstrap.scss';
import 'typeface-open-sans/index.css';
import '../styles/master.scss';
import 'moment/locale/en-au';
import 'moment/locale/en-gb';
import 'moment/locale/en-ca';
import { LayoutContainer } from './Layout';
import { Content } from './Content';
import { SidebarContainer } from './SidebarContainer';
import { HeaderContainer } from './HeaderContainer';
import { LoginModal } from './authentication/LoginModal';
import { Loading } from 'common';

export const App = ({ loading, isKiosk }) => (
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
        />
      }
    </Helmet>
    {loading ? (
      <Loading text="GB Members loading ..." />
    ) : (
      <div className="app gbmembers">
        <HeaderContainer />
        <LayoutContainer
          sidebarContent={<SidebarContainer />}
          mainContent={<Content isKiosk={isKiosk} />}
        />
      </div>
    )}
    <LoginModal />
  </div>
);

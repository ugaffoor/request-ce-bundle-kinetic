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

export const App = ({ loading, isKiosk }) => (
  <div>
    <Helmet>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
      />
      {/*<link rel="stylesheet" href="//basehold.it/12/11/168/224/0.2" />*/}
    </Helmet>
    {loading ? (
      <div />
    ) : (
      <div className="app gbmembers">
        <HeaderContainer />
        <LayoutContainer
          sidebarContent={<SidebarContainer />}
          mainContent={<Content isKiosk={isKiosk} />}
        />
        <LoginModal />
      </div>
    )}
  </div>
);

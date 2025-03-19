import React, { ReactNode } from 'react';
import { Header, HeaderName, HeaderNavigation, HeaderMenuItem, SkipToContent } from '@carbon/react';
import { Link } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <Header aria-label="Bahmni Clinical">
        <SkipToContent />
        <HeaderName element={Link} to="/" prefix="">
          Bahmni Clinical
        </HeaderName>
        <HeaderNavigation aria-label="Main Navigation">
          <HeaderMenuItem element={Link} to="/">
            Home
          </HeaderMenuItem>
          {/* Add more navigation items as needed */}
        </HeaderNavigation>
      </Header>
      <main id="main-content">{children}</main>
    </>
  );
};

export default MainLayout;

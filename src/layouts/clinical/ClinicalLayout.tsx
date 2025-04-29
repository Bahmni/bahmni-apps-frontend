import React, { ReactNode } from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  SkipToContent,
} from '@carbon/react';

interface ClinicalLayoutProps {
  children: ReactNode;
}

const ClinicalLayout: React.FC<ClinicalLayoutProps> = ({ children }) => {
  return (
    <>
      <Header aria-label="Bahmni Clinical">
        <SkipToContent />
        <HeaderName href="/" prefix="">
          Bahmni Clinical
        </HeaderName>
        <HeaderNavigation aria-label="Main Navigation">
          <HeaderMenuItem href="/">Home</HeaderMenuItem>
          {/* Add more navigation items as needed */}
        </HeaderNavigation>
      </Header>
      <main id="main-content">{children}</main>
    </>
  );
};

export default ClinicalLayout;

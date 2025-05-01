import React, { ReactNode } from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  SkipToContent,
} from '@carbon/react';
import BahmniIcon from '@/components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@constants/icon';

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
          <HeaderMenuItem href="/">
            <BahmniIcon
              name="fa-home"
              size={ICON_SIZE.LG}
              id="home"
            ></BahmniIcon>
            Home
          </HeaderMenuItem>
          {/* Add more navigation items as needed */}
        </HeaderNavigation>
      </Header>
      <main id="main-content">{children}</main>
    </>
  );
};

export default ClinicalLayout;

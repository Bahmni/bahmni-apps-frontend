import React from 'react';
import {
  Header as CarbonHeader,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
} from '@carbon/react';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@constants/icon';

/**
 * Header component for the Bahmni Clinical application
 * Provides navigation and branding elements
 *
 * @returns {React.ReactElement} The Header component
 */
const Header: React.FC = () => {
  return (
    <CarbonHeader aria-label="Bahmni Clinical">
      <HeaderName href="/" prefix="">
        Bahmni Clinical
      </HeaderName>
      <HeaderNavigation aria-label="Main Navigation">
        <HeaderMenuItem href="/" aria-label="Bahmni Home">
          <BahmniIcon
            name="fa-home"
            size={ICON_SIZE.LG}
            id="homeIcon"
          ></BahmniIcon>
          Home
        </HeaderMenuItem>
      </HeaderNavigation>
    </CarbonHeader>
  );
};

export default Header;

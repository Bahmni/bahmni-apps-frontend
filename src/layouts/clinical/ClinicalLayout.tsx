import React, { ReactNode } from 'react';
import Header from '@components/clinical/header/Header';

interface ClinicalLayoutProps {
  children: ReactNode;
}

/**
 * Clinical Layout component that provides the main layout structure
 * for clinical pages, including the header and main content area
 *
 * @param {ReactNode} children - The content to render in the main area
 * @returns {React.ReactElement} The ClinicalLayout component
 */
const ClinicalLayout: React.FC<ClinicalLayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
    </>
  );
};

export default ClinicalLayout;

import { RegistrationLayout } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PatientSearch from './pages/patientSearch/PatientSearch';

/**
 * Registration Routes component that wraps routes with RegistrationLayout
 * This component handles the layout with PageHeader and breadcrumbs
 */
const RegistrationRoutes: React.FC = () => {
  const { t } = useTranslation();

  // Breadcrumb navigation for registration pages
  const breadcrumbItems = [
    {
      id: 'home',
      label: t('HOME'),
      href: '/',
    },
    {
      id: 'search-patient',
      label: t('SEARCH_PATIENT_PAGE'),
      isCurrentPage: true,
    },
  ];

  return (
    <RegistrationLayout
      breadcrumbItems={breadcrumbItems}
      testId="registration-app-header"
    >
      <Routes>
        <Route path="/search" element={<PatientSearch />} />
      </Routes>
    </RegistrationLayout>
  );
};

export default RegistrationRoutes;

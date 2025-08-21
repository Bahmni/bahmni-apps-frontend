import { HeaderWSideNav } from '@bahmni-frontend/bahmni-design-system';
import { BAHMNI_HOME_PATH } from '@bahmni-frontend/bahmni-services';

const breadcrumbItems = [
  { id: 'home', label: 'Home', href: BAHMNI_HOME_PATH },
  { id: 'current', label: 'Registration', isCurrentPage: true },
];

/**
 * SearchPage
 *
 * Registration Search interface that let's the user search for a patient using keywords.
 *
 * @returns React component with registration search interface
 */
const PatientSearchPage: React.FC = () => {
  return (
    <HeaderWSideNav
      breadcrumbItems={breadcrumbItems}
      ariaLabel="registration-search-page-header"
    />
  );
};

export default PatientSearchPage;

import { BaseLayout, Header } from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  PatientSearch,
} from '@bahmni-frontend/bahmni-services';
import { SearchPatient } from '@bahmni-frontend/bahmni-widgets';
import { useState } from 'react';
import styles from './styles/PatientSearchPage.module.scss';

const breadcrumbItems = [
  { id: 'home', label: 'Home', href: BAHMNI_HOME_PATH },
  { id: 'current', label: 'Registration', isCurrentPage: true },
];

/**
 * PatientSearchPage
 *
 * Registration Patient Search interface that let's the user search for a patient using keywords.
 *
 * @returns React component with registration search interface
 */
const PatientSearchPage: React.FC = () => {
  const [patientSearchData, setPatientSearchData] = useState<PatientSearch[]>(
    [],
  );
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchPatientUpdate = (
    data: PatientSearch[] | undefined,
    error: Error | null,
    isLoading: boolean,
  ) => {
    setIsLoading(isLoading);
    setError(error);
    setPatientSearchData(data ?? []);
  };
  return (
    <BaseLayout
      header={
        <Header
          breadcrumbItems={breadcrumbItems}
          ariaLabel="registration-search-page-header"
        />
      }
      main={<div className={styles.main}></div>}
    />
  );
};

export default PatientSearchPage;

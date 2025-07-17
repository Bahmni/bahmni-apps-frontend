import React from 'react';
import { Content } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { PatientSearchForm } from '@components/registration/PatientSearchForm';
import { PatientSearchResults } from '@components/registration/PatientSearchResults';
import { usePatientSearch } from '@hooks/usePatientSearch';

const PatientSearchPage: React.FC = () => {
  const { t } = useTranslation();
  const { searchResults, isLoading, error, searchPatients } = usePatientSearch();

  return (
    <Content>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>
          {t('PATIENT_SEARCH_TITLE', 'Patient Search')}
        </h1>
        
        <PatientSearchForm 
          onSearchByIdentifier={(identifier) => searchPatients({ identifier })}
          onSearchByNameOrPhone={(criteria) => searchPatients(criteria)}
          isLoading={isLoading} 
        />
        
        <PatientSearchResults 
          results={searchResults}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </Content>
  );
};

export default PatientSearchPage;

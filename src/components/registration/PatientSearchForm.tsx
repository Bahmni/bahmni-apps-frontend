import React, { useState } from 'react';
import { Button, TextInput, Grid, Column } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import type { PatientSearchCriteria } from '../../types/patientSearch';

interface PatientSearchFormProps {
  onSearchByIdentifier: (identifier: string) => void;
  onSearchByNameOrPhone: (criteria: { name?: string; phoneNumber?: string }) => void;
  isLoading: boolean;
}

export const PatientSearchForm: React.FC<PatientSearchFormProps> = ({
  onSearchByIdentifier,
  onSearchByNameOrPhone,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [searchCriteria, setSearchCriteria] = useState<PatientSearchCriteria>({
    identifier: '',
    name: '',
    phoneNumber: '',
  });

  const handleInputChange = (field: keyof PatientSearchCriteria, value: string) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearchByIdentifier = () => {
    if (searchCriteria.identifier?.trim()) {
      onSearchByIdentifier(searchCriteria.identifier.trim());
    }
  };

  const handleSearchByNameOrPhone = () => {
    if (searchCriteria.name?.trim() || searchCriteria.phoneNumber?.trim()) {
      onSearchByNameOrPhone({
        name: searchCriteria.name?.trim() || undefined,
        phoneNumber: searchCriteria.phoneNumber?.trim() || undefined,
      });
    }
  };

  const isIdentifierSearchDisabled = !searchCriteria.identifier?.trim();
  const isNamePhoneSearchDisabled = !searchCriteria.name?.trim() && !searchCriteria.phoneNumber?.trim();

  return (
    <div>
      <Grid>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="patient-identifier"
            labelText={t('PATIENT_SEARCH_ID_LABEL', 'ID')}
            placeholder={t('PATIENT_SEARCH_ID_PLACEHOLDER', 'Enter ID')}
            value={searchCriteria.identifier}
            onChange={(e) => handleInputChange('identifier', e.target.value)}
            disabled={isLoading}
          />
          <div style={{ marginTop: '1rem' }}>
            <Button
              onClick={handleSearchByIdentifier}
              disabled={isIdentifierSearchDisabled || isLoading}
              size="md"
              kind="primary"
            >
              {isLoading ? t('SEARCHING', 'Searching...') : t('SEARCH_BY_ID', 'Search by ID')}
            </Button>
          </div>
        </Column>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="patient-name"
            labelText={t('PATIENT_SEARCH_NAME_LABEL', 'Name')}
            placeholder={t('PATIENT_SEARCH_NAME_PLACEHOLDER', 'Enter Name')}
            value={searchCriteria.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={isLoading}
          />
        </Column>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="patient-phone"
            labelText={t('PATIENT_SEARCH_PHONE_LABEL', 'Phone Number')}
            placeholder={t('PATIENT_SEARCH_PHONE_PLACEHOLDER', 'Phone Number')}
            value={searchCriteria.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            disabled={isLoading}
          />
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <Button
              onClick={handleSearchByNameOrPhone}
              disabled={isNamePhoneSearchDisabled || isLoading}
              size="md"
              kind="secondary"
            >
              {isLoading ? t('SEARCHING', 'Searching...') : t('SEARCH_BY_NAME_PHONE', 'Search by Name/Phone')}
            </Button>
          </div>
        </Column>
      </Grid>
    </div>
  );
};

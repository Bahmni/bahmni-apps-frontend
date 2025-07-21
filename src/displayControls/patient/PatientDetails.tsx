import { SkeletonText, Tile } from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePatient } from '@hooks/usePatient';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { formatPatientData } from '@services/patientService';
import * as styles from './__styles__/PatientDetails.module.scss';

// TODO: Extract this as a PatientDetails Display Control Component
const PatientDetails: React.FC = () => {
  const { t } = useTranslation();
  const patientUUID: string | null = usePatientUUID();
  const { patient, loading, error } = usePatient(patientUUID);

  // Format patient data using the service
  const formattedPatient = useMemo(() => {
    if (!patient) return null;
    return formatPatientData(patient);
  }, [patient]);

  if (loading || error || !patient || !formattedPatient) {
    return (
      <Tile>
        <SkeletonText
          heading
          width="100%"
          lineCount={5}
          data-testid="skeleton-loader"
        />
      </Tile>
    );
  }

  const formatField = (value?: string | number | null) => value ?? null;

  const formattedIdentifiers = formattedPatient.identifiers.size
    ? Array.from(formattedPatient.identifiers.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .filter(Boolean)
        .join(' | ')
    : null;

  const formattedGender = formatField(formattedPatient.gender);

  const formattedAge =
    formattedPatient.age?.years !== undefined
      ? `${formattedPatient.age.years} ${t('CLINICAL_YEARS_TRANSLATION_KEY', { count: formattedPatient.age.years })}, ${formattedPatient.age.months} ${t('CLINICAL_MONTHS_TRANSLATION_KEY', { count: formattedPatient.age.months })}, ${formattedPatient.age.days} ${t('CLINICAL_DAYS_TRANSLATION_KEY', { count: formattedPatient.age.days })}`
      : null;

  const details = [formattedAge, formatField(formattedPatient.birthDate)]
    .filter(Boolean)
    .join(' | ');

  return (
    <div className={styles.header}>
      {formattedPatient.fullName && (
        <p data-testid="patient-name" className={styles.patientName}>
          {formattedPatient.fullName}
        </p>
      )}
      <div className={styles.patientDetails}>
        <div>
          {formattedIdentifiers && <span>{formattedIdentifiers}</span>}
          {formattedGender && <span>{formattedGender}</span>}
        </div>
        {details && <span>{details}</span>}
      </div>
    </div>
  );
};

export default PatientDetails;

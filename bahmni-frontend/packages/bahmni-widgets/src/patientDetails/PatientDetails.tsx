import { SkeletonText } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, ICON_SIZE } from '@bahmni-frontend/bahmni-design-system';
import styles from './__styles__/PatientDetails.module.scss';
import { usePatient } from '../hooks/usePatient';

// TODO: Extract this as a PatientDetails Display Control Component
const PatientDetails: React.FC = () => {
  const { t } = useTranslation();
  const { patient, loading, error } = usePatient();

  if (loading || error || !patient) {
    return (
      <div className={styles.skeletonContainer}>
        <SkeletonText
          heading
          width="20%"
          lineCount={2}
          data-testid="skeleton-loader"
        />
        <SkeletonText
          width="50%"
          lineCount={3}
          data-testid="skeleton-loade-subheader"
        />
      </div>
    );
  }

  const formatField = (value?: string | number | null) => value ?? null;

  const formattedIdentifiers = patient.identifiers.size
    ? Array.from(patient.identifiers.entries())
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(([key, value]) => `${value}`)
        .filter(Boolean)
        .join(' | ')
    : null;

  const formattedGender = formatField(patient.gender);

  const formattedAge =
    patient.age?.years !== undefined
      ? `${patient.age.years} ${t('CLINICAL_YEARS_TRANSLATION_KEY', { count: patient.age.years })}, ${patient.age.months} ${t('CLINICAL_MONTHS_TRANSLATION_KEY', { count: patient.age.months })}, ${patient.age.days} ${t('CLINICAL_DAYS_TRANSLATION_KEY', { count: patient.age.days })}`
      : null;

  const details = [formattedAge, formatField(patient.birthDate)]
    .filter(Boolean)
    .join(' | ');

  return (
    <div className={styles.header}>
      {patient.fullName && (
        <p data-testid="patient-name" className={styles.patientName}>
          {patient.fullName}
        </p>
      )}
      <div className={styles.patientDetails}>
        <div className={styles.identifierAndGenderWrapper}>
          {formattedIdentifiers && (
            <p className={styles.detailsWithIcon}>
              <Icon id="id-card" name="fa-id-card" size={ICON_SIZE.SM} />
              <p>{formattedIdentifiers}</p>
            </p>
          )}
          {formattedGender && (
            <p className={styles.detailsWithIcon}>
              <Icon id="gender" name="fa-mars-stroke-up" size={ICON_SIZE.SM} />
              <p>{formattedGender}</p>
            </p>
          )}
        </div>
        {details && (
          <p className={styles.detailsWithIcon}>
            <Icon id="age" name="fa-cake-candles" size={ICON_SIZE.SM} />
            <p>{details}</p>
          </p>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;

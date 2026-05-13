import { Icon, ICON_SIZE } from '@bahmni/design-system';
import {
  type FormattedPatientData,
  getFormattedAge,
  formatDateTime,
} from '@bahmni/services';
import { SkeletonText } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './__styles__/PatientDetails.module.scss';
import { usePatient } from './usePatient';

interface PatientDetailsProps {
  patient?: FormattedPatientData | null;
  loading?: boolean;
  error?: Error | null;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({
  patient: patientProp,
  loading: loadingProp,
  error: errorProp,
}) => {
  const { t } = useTranslation();
  const hasExternalData = patientProp !== undefined;
  const {
    patient: internalPatient,
    loading: internalLoading,
    error: internalError,
  } = usePatient({ enabled: !hasExternalData });
  const patient = hasExternalData ? patientProp : internalPatient;
  const loading = hasExternalData ? (loadingProp ?? false) : internalLoading;
  const error = hasExternalData ? (errorProp ?? null) : internalError;

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

        .map(([key, value]) => value)
        .filter((value) => value != null && value !== '')
        .join(' | ')
    : null;

  const formattedGender = formatField(patient.gender);

  const formattedAge = patient.birthDate
    ? getFormattedAge(patient.birthDate, t)
    : null;

  const formattedBirthDate = patient.birthDate
    ? formatDateTime(patient.birthDate, t).formattedResult
    : null;

  const details = [formattedAge, formattedBirthDate]
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
              <span>{formattedIdentifiers}</span>
            </p>
          )}
          {formattedGender && (
            <p className={styles.detailsWithIcon}>
              <Icon id="gender" name="fa-mars-stroke-up" size={ICON_SIZE.SM} />
              <span>{formattedGender}</span>
            </p>
          )}
        </div>
        {details && (
          <p className={styles.detailsWithIcon}>
            <Icon id="age" name="fa-cake-candles" size={ICON_SIZE.SM} />
            <span>{details}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;

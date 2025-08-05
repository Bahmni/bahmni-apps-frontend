import { SkeletonText } from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BahmniIcon from '@/components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@/constants/icon';
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

  const formattedIdentifiers = formattedPatient.identifiers.size
    ? Array.from(formattedPatient.identifiers.entries())
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(([key, value]) => `${value}`)
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
        <div className={styles.identifierAndGenderWrapper}>
          {formattedIdentifiers && (
            <p className={styles.detailsWithIcon}>
              <BahmniIcon id="id-card" name="fa-id-card" size={ICON_SIZE.SM} />
              <span>{formattedIdentifiers}</span>
            </p>
          )}
          {formattedGender && (
            <p className={styles.detailsWithIcon}>
              <BahmniIcon
                id="gender"
                name="fa-mars-stroke-up"
                size={ICON_SIZE.SM}
              />
              <span>{formattedGender}</span>
            </p>
          )}
        </div>
        {details && (
          <p className={styles.detailsWithIcon}>
            <BahmniIcon id="age" name="fa-cake-candles" size={ICON_SIZE.SM} />
            <span>{details}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;

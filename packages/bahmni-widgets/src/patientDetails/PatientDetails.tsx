import { Icon, ICON_SIZE } from '@bahmni/design-system';
import { getFormattedPatientById } from '@bahmni/services';
import { SkeletonText } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePatientPhoto } from '../hooks/usePatientPhoto';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import styles from './__styles__/PatientDetails.module.scss';
import { createPatientDetailsViewModel } from './utils';

const PatientDetails: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const patientUUID = usePatientUUID();
  const {
    data: patient,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['patient', patientUUID],
    queryFn: () => getFormattedPatientById(patientUUID!),
    enabled: !!patientUUID,
  });

  const photoUrl = patient?.photoUrl;
  const { patientPhoto: photoDataUrl, error: photoError } = usePatientPhoto({
    photoUrl,
  });

  useEffect(() => {
    if (photoError) {
      addNotification({
        type: 'warning',
        title: t('ERROR_DEFAULT_TITLE'),
        message: photoError.message,
      });
    }
  }, [photoError, addNotification, t]);

  if (isLoading || error || !patient) {
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
          data-testid="skeleton-loader-subheader"
        />
      </div>
    );
  }

  const { fullName, gender, formattedIdentifiers, ageDetails } =
    createPatientDetailsViewModel(patient, t);

  return (
    <div className={styles.container}>
      {photoDataUrl ? (
        <img
          id="patient-photo"
          data-testid="patient-photo-test-id"
          src={photoDataUrl}
          alt={fullName}
          className={styles.photo}
        />
      ) : null}
      <div className={styles.header}>
        <p data-testid="patient-name" className={styles.patientName}>
          {fullName}
        </p>
        <div className={styles.details}>
          <div className={styles.identifierAndGenderWrapper}>
            <p className={styles.detailsWithIcon}>
              <Icon id="id-card" name="fa-id-card" size={ICON_SIZE.SM} />
              <span>{formattedIdentifiers}</span>
            </p>
            <p className={styles.detailsWithIcon}>
              <Icon id="gender" name="fa-mars-stroke-up" size={ICON_SIZE.SM} />
              <span>{gender}</span>
            </p>
          </div>
          <p className={styles.detailsWithIcon}>
            <Icon id="age" name="fa-cake-candles" size={ICON_SIZE.SM} />
            <span>{ageDetails}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;

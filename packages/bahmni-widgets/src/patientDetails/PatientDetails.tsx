import { Icon, ICON_SIZE } from '@bahmni/design-system';
import {
  fetchPatientPhotoFromUrl,
  getFormattedPatientById,
} from '@bahmni/services';
import { SkeletonText } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { GET_PATIENT_PHOTO_PRIVILEGE } from '../userPrivileges/patientPhotoPrivileges';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import styles from './__styles__/PatientDetails.module.scss';
import { DeceasedTag } from './DeceasedTag';
import { createPatientDetailsViewModel } from './utils';

const PatientDetails: React.FC = () => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const hasPhotoPrivilege = useHasPrivilege(GET_PATIENT_PHOTO_PRIVILEGE);
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
  const { data: photoDataUrl } = useQuery({
    queryKey: ['patientPhoto', photoUrl],
    queryFn: () => fetchPatientPhotoFromUrl(photoUrl!),
    enabled: !!photoUrl && hasPhotoPrivilege,
  });

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
        <div className={styles.patientNameWrapper}>
          <p data-testid="patient-name" className={styles.patientName}>
            {fullName}
          </p>
          <DeceasedTag isDead={patient.isDead} />
        </div>
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

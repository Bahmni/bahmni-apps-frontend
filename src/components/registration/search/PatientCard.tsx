import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientSearchResult } from '../../../types/registration';
import styles from './PatientCard.module.scss';

/**
 * Props for the PatientCard component
 */
export interface PatientCardProps {
  /** Patient data to display */
  patient: PatientSearchResult & { photo?: string };
  /** Callback when patient is selected */
  onSelect: (patient: PatientSearchResult) => void;
  /** Whether the patient is currently selected */
  isSelected?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Whether the card is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PatientCard component for displaying patient information in search results
 * Provides a clickable card with patient details, photo, and selection state
 *
 * @param props - PatientCard component props
 * @returns JSX.Element
 */
export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onSelect,
  isSelected = false,
  disabled = false,
  isLoading = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  // Get patient display name
  const getPatientName = useCallback((): string => {
    if (patient.person.names.length > 0) {
      const preferredName = patient.person.names.find((name) => name.preferred);
      const name = preferredName || patient.person.names[0];

      if (name.display) {
        return name.display;
      }

      const parts = [name.givenName, name.middleName, name.familyName].filter(Boolean);
      return parts.join(' ') || patient.display;
    }
    return patient.display;
  }, [patient]);

  // Get primary patient identifier
  const getPrimaryIdentifier = useCallback((): string | null => {
    if (patient.identifiers.length === 0) return null;

    const preferredId = patient.identifiers.find((id) => id.preferred);
    const identifier = preferredId || patient.identifiers[0];
    return identifier.identifier;
  }, [patient.identifiers]);

  // Get formatted gender display
  const getGenderDisplay = useCallback((): string => {
    switch (patient.person.gender) {
      case 'M':
        return t('patient.gender.male', 'Male');
      case 'F':
        return t('patient.gender.female', 'Female');
      case 'O':
        return t('patient.gender.other', 'Other');
      default:
        return '';
    }
  }, [patient.person.gender, t]);

  // Get age or birthdate display
  const getAgeDisplay = useCallback((): string => {
    if (patient.person.age !== undefined) {
      return t('patient.age.years', '{{age}} years', { age: patient.person.age });
    }

    if (patient.person.birthdate) {
      const birthYear = new Date(patient.person.birthdate).getFullYear();
      return t('patient.birthdate.born', 'Born {{year}}', { year: birthYear });
    }

    return '';
  }, [patient.person.age, patient.person.birthdate, t]);

  // Get formatted address
  const getAddressDisplay = useCallback((): string | null => {
    if (patient.person.addresses.length === 0) return null;

    const preferredAddress = patient.person.addresses.find((addr) => addr.preferred);
    const address = preferredAddress || patient.person.addresses[0];

    if (address.display) {
      return address.display;
    }

    const parts = [
      address.address1,
      address.address2,
      address.cityVillage,
      address.stateProvince,
      address.country,
      address.postalCode,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  }, [patient.person.addresses]);

  // Handle card selection
  const handleSelect = useCallback(() => {
    if (!disabled && !isLoading) {
      onSelect(patient);
    }
  }, [disabled, isLoading, onSelect, patient]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelect();
      }
    },
    [handleSelect],
  );

  // Handle photo error
  const handlePhotoError = useCallback(() => {
    setPhotoError(true);
  }, []);

  // Mouse event handlers
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const patientName = getPatientName();
  const primaryIdentifier = getPrimaryIdentifier();
  const genderDisplay = getGenderDisplay();
  const ageDisplay = getAgeDisplay();
  const addressDisplay = getAddressDisplay();

  // Build demographics display
  const demographicsDisplay = [genderDisplay, ageDisplay].filter(Boolean).join(', ');

  // Build ARIA label
  const ariaLabel = t(
    'patient.card.ariaLabel',
    'Patient {{name}}, ID {{identifier}}, {{demographics}}',
    {
      name: patientName,
      identifier: primaryIdentifier || '',
      demographics: demographicsDisplay,
    },
  );

  return (
    <button
      type="button"
      className={`${styles.patientCard} ${className} ${isSelected ? styles.selected : ''} ${
        isLoading ? styles.loading : ''
      } ${isHovered ? styles.hover : ''}`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className={styles.patientCardContent}>
        {/* Patient Photo/Avatar */}
        <div className={styles.patientPhoto}>
          {patient.photo && !photoError ? (
            <img
              src={patient.photo}
              alt={patientName}
              className={styles.patientImage}
              onError={handlePhotoError}
            />
          ) : (
            <div
              className={styles.patientAvatar}
              data-testid="patient-avatar"
              aria-label={t('patient.avatar.placeholder', 'Patient photo placeholder')}
            >
              {patientName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Patient Information */}
        <div className={styles.patientInfo}>
          {/* Patient Name */}
          <h3 className={styles.patientName}>{patientName}</h3>

          {/* Primary Identifier */}
          {primaryIdentifier && (
            <div className={styles.patientIdentifier} data-testid="patient-identifier">
              <span className={styles.identifierLabel}>
                {t('patient.identifier.label', 'ID:')}
              </span>
              <span className={styles.identifierValue}>{primaryIdentifier}</span>
            </div>
          )}

          {/* Demographics */}
          {demographicsDisplay && (
            <div className={styles.patientDemographics}>{demographicsDisplay}</div>
          )}

          {/* Address */}
          {addressDisplay && (
            <div className={styles.patientAddress} data-testid="patient-address">
              {addressDisplay}
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className={styles.selectionIndicator} aria-hidden="true">
            <span className={styles.checkmark}>✓</span>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className={styles.loadingIndicator} aria-hidden="true">
            <div className={styles.spinner} />
          </div>
        )}
      </div>
    </button>
  );
};

export default PatientCard;

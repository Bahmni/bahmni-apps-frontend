import type { Notification } from '@bahmni/services';
import type { AdditionalIdentifiersRef } from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import type { AdditionalInfoRef } from '../../components/forms/additionalInfo/AdditionalInfo';
import type { AddressInfoRef } from '../../components/forms/addressInfo/AddressInfo';
import type { ContactInfoRef } from '../../components/forms/contactInfo/ContactInfo';
import type { ProfileRef } from '../../components/forms/profile/Profile';

export interface PatientFormRefs {
  profileRef: React.RefObject<ProfileRef | null>;
  addressRef: React.RefObject<AddressInfoRef | null>;
  contactRef: React.RefObject<ContactInfoRef | null>;
  additionalRef: React.RefObject<AdditionalInfoRef | null>;
  additionalIdentifiersRef: React.RefObject<AdditionalIdentifiersRef | null>;
}

export interface ValidationOptions {
  /** Whether to validate additional identifiers section (only if visible) */
  shouldValidateAdditionalIdentifiers?: boolean;
}

export function validateAllSections(
  refs: PatientFormRefs,
  addNotification: (notification: Omit<Notification, 'id'>) => void,
  t: (key: string) => string,
  options?: ValidationOptions,
): boolean {
  const {
    profileRef,
    addressRef,
    contactRef,
    additionalRef,
    additionalIdentifiersRef,
  } = refs;

  const isProfileValid = profileRef.current?.validate() ?? false;
  const isAddressValid = addressRef.current?.validate() ?? false;
  const isContactValid = contactRef.current?.validate() ?? false;
  const isAdditionalValid = additionalRef.current?.validate() ?? false;

  let allValid =
    isProfileValid && isAddressValid && isContactValid && isAdditionalValid;

  const shouldValidate = options?.shouldValidateAdditionalIdentifiers ?? false;
  if (shouldValidate) {
    const isAdditionalIdentifiersValid =
      additionalIdentifiersRef.current?.validate() ?? true;
    allValid = allValid && isAdditionalIdentifiersValid;
  }

  if (!allValid) {
    addNotification({
      title: t('NOTIFICATION_ERROR_TITLE'),
      message: t('NOTIFICATION_VALIDATION_ERRORS'),
      type: 'error',
      timeout: 5000,
    });
  }

  return allValid;
}

/**
 * Collect data from all patient form sections
 *
 * @param refs - References to all form sections
 * @param addNotification - Function to show notifications
 * @param t - Translation function
 * @returns Collected form data or null if any section fails to return data
 */
export function collectFormData(
  refs: PatientFormRefs,
  addNotification: (notification: Omit<Notification, 'id'>) => void,
  t: (key: string) => string,
) {
  const {
    profileRef,
    addressRef,
    contactRef,
    additionalRef,
    additionalIdentifiersRef,
  } = refs;

  const profileData = profileRef.current?.getData();
  if (!profileData) {
    addNotification({
      title: t('NOTIFICATION_ERROR_TITLE'),
      message: t('NOTIFICATION_UNABLE_TO_GET_PATIENT_DATA'),
      type: 'error',
      timeout: 5000,
    });
    return null;
  }

  const addressData = addressRef.current?.getData();
  if (!addressData) {
    addNotification({
      title: t('NOTIFICATION_ERROR_TITLE'),
      message: t('NOTIFICATION_UNABLE_TO_GET_ADDRESS_DATA'),
      type: 'error',
      timeout: 5000,
    });
    return null;
  }

  const contactData = contactRef.current?.getData();
  if (!contactData) {
    addNotification({
      title: t('NOTIFICATION_ERROR_TITLE'),
      message: t('NOTIFICATION_UNABLE_TO_GET_CONTACT_DATA'),
      type: 'error',
      timeout: 5000,
    });
    return null;
  }

  const additionalData = additionalRef.current?.getData();
  if (!additionalData) {
    addNotification({
      title: t('NOTIFICATION_ERROR_TITLE'),
      message: t('NOTIFICATION_UNABLE_TO_GET_ADDITIONAL_DATA'),
      type: 'error',
      timeout: 5000,
    });
    return null;
  }

  // Additional identifiers are optional - only collect if component is rendered
  const additionalIdentifiersData =
    additionalIdentifiersRef.current?.getData() ?? {};

  return {
    profile: profileData,
    address: addressData,
    contact: contactData,
    additional: additionalData,
    additionalIdentifiers: additionalIdentifiersData,
  };
}

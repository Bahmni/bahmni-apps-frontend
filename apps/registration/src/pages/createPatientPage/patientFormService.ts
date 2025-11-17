import { notificationService } from '@bahmni/services';
import type { AdditionalInfoRef } from '../../components/forms/additionalInfo/AdditionalInfo';
import type { AddressInfoRef } from '../../components/forms/addressInfo/AddressInfo';
import type { ContactInfoRef } from '../../components/forms/contactInfo/ContactInfo';
import type { ProfileRef } from '../../components/forms/profile/Profile';

/**
 * Form references interface for all patient registration sections
 */
export interface PatientFormRefs {
  profileRef: React.RefObject<ProfileRef | null>;
  addressRef: React.RefObject<AddressInfoRef | null>;
  contactRef: React.RefObject<ContactInfoRef | null>;
  additionalRef: React.RefObject<AdditionalInfoRef | null>;
}

/**
 * Validate all patient form sections
 *
 * @param refs - References to all form sections
 * @returns true if all sections are valid, false otherwise
 */
export function validateAllSections(refs: PatientFormRefs): boolean {
  const { profileRef, addressRef, contactRef, additionalRef } = refs;

  const isProfileValid = profileRef.current?.validate() ?? false;
  const isAddressValid = addressRef.current?.validate() ?? false;
  const isContactValid = contactRef.current?.validate() ?? false;
  const isAdditionalValid = additionalRef.current?.validate() ?? false;

  const allValid =
    isProfileValid && isAddressValid && isContactValid && isAdditionalValid;

  if (!allValid) {
    notificationService.showError(
      'Error',
      'Please fix validation errors',
      5000,
    );
  }

  return allValid;
}

/**
 * Collect data from all patient form sections
 *
 * @param refs - References to all form sections
 * @returns Collected form data or null if any section fails to return data
 */
export function collectFormData(refs: PatientFormRefs) {
  const { profileRef, addressRef, contactRef, additionalRef } = refs;

  const profileData = profileRef.current?.getData();
  if (!profileData) {
    notificationService.showError('Error', 'Unable to get patient data', 5000);
    return null;
  }

  const addressData = addressRef.current?.getData();
  if (!addressData) {
    notificationService.showError(
      'Error',
      'Unable to get patient address data',
      5000,
    );
    return null;
  }

  const contactData = contactRef.current?.getData();
  if (!contactData) {
    notificationService.showError(
      'Error',
      'Unable to get patient contact data',
      5000,
    );
    return null;
  }

  const additionalData = additionalRef.current?.getData();
  if (!additionalData) {
    notificationService.showError(
      'Error',
      'Unable to get patient additional data',
      5000,
    );
    return null;
  }

  return {
    profile: profileData,
    address: addressData,
    contact: contactData,
    additional: additionalData,
  };
}

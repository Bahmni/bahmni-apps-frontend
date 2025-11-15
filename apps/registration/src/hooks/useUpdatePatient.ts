import {
  updatePatient,
  notificationService,
  CreatePatientRequest,
  PatientName,
  PatientIdentifier,
  PatientAddress,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
} from '@bahmni-frontend/bahmni-services';
import { useMutation } from '@tanstack/react-query';
import { convertTimeToISODateTime } from '../components/forms/profile/dateAgeUtils';
import { BasicInfoData, ContactData, AdditionalData } from '../models/patient';

/**
 * Form data structure representing all collected patient information
 */
interface UpdatePatientFormData {
  patientUuid: string;
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
  };
  address: PatientAddress;
  contact: ContactData;
  additional: AdditionalData;
}

/**
 * Custom hook for updating a patient with React Query
 *
 * Handles:
 * - Data transformation from form data to API payload
 * - Mutation execution
 * - Success/error notifications
 */
export const useUpdatePatient = () => {
  const mutation = useMutation({
    mutationFn: (formData: UpdatePatientFormData) => {
      const payload = transformFormDataToPayload(formData);
      return updatePatient(formData.patientUuid, payload);
    },
    onSuccess: (response) => {
      notificationService.showSuccess(
        'Success',
        'Patient updated successfully',
        5000,
      );

      if (response?.patient?.uuid) {
        // Dispatch audit event for patient update
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT
            .eventType as AuditEventType,
          patientUuid: response.patient.uuid,
          module: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT.module,
        });
      }
    },
    onError: () => {
      notificationService.showError('Error', 'Failed to update patient', 5000);
    },
  });

  return mutation;
};

function transformFormDataToPayload(
  formData: UpdatePatientFormData,
): CreatePatientRequest {
  const { profile, address } = formData;
  // Build patient name object
  const patientName: PatientName = {
    givenName: profile.firstName,
    ...(profile.middleName && { middleName: profile.middleName }),
    familyName: profile.lastName,
    display: `${profile.firstName}${profile.middleName ? ' ' + profile.middleName : ''} ${profile.lastName}`,
    preferred: false,
  };

  // Build the complete patient payload
  const payload: CreatePatientRequest = {
    patient: {
      person: {
        names: [patientName],
        gender: profile.gender.charAt(0).toUpperCase(),
        birthdate: profile.dateOfBirth,
        birthdateEstimated: profile.dobEstimated,
        birthtime: convertTimeToISODateTime(
          profile.dateOfBirth,
          profile.birthTime,
        ),
        addresses: [address],
        attributes: [],
        deathDate: null,
        causeOfDeath: '',
      },
      identifiers: [profile.patientIdentifier],
    },
    relationships: [],
  };

  return payload;
}

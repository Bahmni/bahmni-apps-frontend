import {
  createPatient,
  notificationService,
  CreatePatientRequest,
  PatientName,
  PatientIdentifier,
  PatientAddress,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
} from '@bahmni/services';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { convertTimeToISODateTime } from '../components/forms/profile/dateAgeUtils';
import { BasicInfoData, ContactData, AdditionalData } from '../models/patient';

/**
 * Form data structure representing all collected patient information
 */
interface CreatePatientFormData {
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
  };
  address: PatientAddress;
  contact: ContactData;
  additional: AdditionalData;
}

/**
 * Custom hook for creating a patient with React Query
 *
 * Handles:
 * - Data transformation from form data to API payload
 * - Mutation execution
 * - Success/error notifications
 * - Navigation after success
 */
export const useCreatePatient = () => {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (formData: CreatePatientFormData) => {
      const payload = transformFormDataToPayload(formData);
      return createPatient(payload);
    },
    onSuccess: (response) => {
      notificationService.showSuccess(
        'Success',
        'Patient saved successfully',
        5000,
      );

      if (response?.patient?.uuid) {
        // Dispatch audit event for patient registration
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT
            .eventType as AuditEventType,
          patientUuid: response.patient.uuid,
          module: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT.module,
        });

        // Update browser history with patient details
        window.history.replaceState(
          {
            patientDisplay: response.patient.display,
            patientUuid: response.patient.uuid,
          },
          '',
          `/registration/patient/${response.patient.uuid}`,
        );
      } else {
        navigate('/registration/search');
      }
    },
    onError: () => {
      notificationService.showError('Error', 'Failed to save patient', 5000);
    },
  });

  return mutation;
};

function transformFormDataToPayload(
  formData: CreatePatientFormData,
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

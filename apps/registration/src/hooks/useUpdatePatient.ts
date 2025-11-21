import {
  updatePatient,
  notificationService,
  CreatePatientRequest,
  PatientName,
  PatientIdentifier,
  PatientAddress,
  PatientAttribute,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  PHONE_NUMBER_UUID,
  ALTERNATE_PHONE_NUMBER_UUID,
  EMAIL_UUID,
} from '@bahmni/services';
import { useMutation } from '@tanstack/react-query';
import { convertTimeToISODateTime } from '../components/forms/profile/dateAgeUtils';
import { BasicInfoData, ContactData, AdditionalData } from '../models/patient';

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
  const { profile, address, contact, additional } = formData;
  const patientName: PatientName = {
    givenName: profile.firstName,
    ...(profile.middleName && { middleName: profile.middleName }),
    familyName: profile.lastName,
    display: `${profile.firstName}${profile.middleName ? ' ' + profile.middleName : ''} ${profile.lastName}`,
    preferred: false,
  };

  const attributes: PatientAttribute[] = [];

  if (contact.phoneNumber) {
    attributes.push({
      attributeType: { uuid: PHONE_NUMBER_UUID },
      value: contact.phoneNumber,
    });
  }

  if (contact.altPhoneNumber) {
    attributes.push({
      attributeType: { uuid: ALTERNATE_PHONE_NUMBER_UUID },
      value: contact.altPhoneNumber,
    });
  }

  if (additional.email) {
    attributes.push({
      attributeType: { uuid: EMAIL_UUID },
      value: additional.email,
    });
  }

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
        attributes,
        deathDate: null,
        causeOfDeath: '',
      },
      identifiers: [profile.patientIdentifier],
    },
    relationships: [],
  };

  return payload;
}

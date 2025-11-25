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
  PersonAttributeType,
} from '@bahmni/services';
import { useMutation } from '@tanstack/react-query';
import { convertTimeToISODateTime } from '../components/forms/profile/dateAgeUtils';
import { BasicInfoData, ContactData, AdditionalData } from '../models/patient';
import { usePersonAttributes } from './usePersonAttributes';

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
  const { personAttributes } = usePersonAttributes();

  const mutation = useMutation({
    mutationFn: (formData: UpdatePatientFormData) => {
      const payload = transformFormDataToPayload(formData, personAttributes);
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
  personAttributes: PersonAttributeType[],
): CreatePatientRequest {
  const { profile, address, contact, additional } = formData;
  const patientName: PatientName = {
    givenName: profile.firstName,
    ...(profile.middleName && { middleName: profile.middleName }),
    familyName: profile.lastName,
    display: `${profile.firstName}${profile.middleName ? ' ' + profile.middleName : ''} ${profile.lastName}`,
    preferred: false,
  };

  // Create a map of attribute name to UUID for quick lookup
  const attributeMap = new Map<string, string>();
  personAttributes.forEach((attr) => {
    attributeMap.set(attr.name, attr.uuid);
  });

  const attributes: PatientAttribute[] = [];

  // Dynamically add all contact attributes
  Object.entries(contact).forEach(([key, value]) => {
    if (value && attributeMap.has(key)) {
      attributes.push({
        attributeType: { uuid: attributeMap.get(key)! },
        value: String(value),
      });
    }
  });

  // Dynamically add all additional attributes
  Object.entries(additional).forEach(([key, value]) => {
    if (value && attributeMap.has(key)) {
      attributes.push({
        attributeType: { uuid: attributeMap.get(key)! },
        value: String(value),
      });
    }
  });

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

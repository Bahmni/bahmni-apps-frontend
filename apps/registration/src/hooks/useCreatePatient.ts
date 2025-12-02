import {
  createPatient,
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
import { useNavigate } from 'react-router-dom';
import { convertTimeToISODateTime } from '../components/forms/profile/dateAgeUtils';
import {
  BasicInfoData,
  ContactData,
  AdditionalData,
  AdditionalIdentifiersData,
} from '../models/patient';
import { usePersonAttributes } from './usePersonAttributes';

interface CreatePatientFormData {
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
    image?: string;
  };
  address: PatientAddress;
  contact: ContactData;
  additional: AdditionalData;
  additionalIdentifiers: AdditionalIdentifiersData;
}

export const useCreatePatient = () => {
  const navigate = useNavigate();
  const { personAttributes } = usePersonAttributes();

  const mutation = useMutation({
    mutationFn: (formData: CreatePatientFormData) => {
      const payload = transformFormDataToPayload(formData, personAttributes);
      return createPatient(payload);
    },
    onSuccess: (response) => {
      notificationService.showSuccess(
        'Success',
        'Patient saved successfully',
        5000,
      );

      if (response?.patient?.uuid) {
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT
            .eventType as AuditEventType,
          patientUuid: response.patient.uuid,
          module: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT.module,
        });

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
  personAttributes: PersonAttributeType[],
): CreatePatientRequest {
  const { profile, address, contact, additional, additionalIdentifiers } =
    formData;
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

  Object.entries(contact).forEach(([key, value]) => {
    if (value && attributeMap.has(key)) {
      attributes.push({
        attributeType: { uuid: attributeMap.get(key)! },
        value: String(value),
      });
    }
  });

  Object.entries(additional).forEach(([key, value]) => {
    if (value && attributeMap.has(key)) {
      attributes.push({
        attributeType: { uuid: attributeMap.get(key)! },
        value: String(value),
      });
    }
  });

  const identifiers: (PatientIdentifier & { identifier?: string })[] = [
    profile.patientIdentifier,
  ];

  Object.entries(additionalIdentifiers).forEach(
    ([identifierTypeUuid, value]) => {
      if (value && value.trim() !== '') {
        identifiers.push({
          identifier: value,
          identifierType: identifierTypeUuid,
          preferred: false,
        });
      }
    },
  );

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
      identifiers,
    },
    ...(profile.image && { image: profile.image }),
    relationships: [],
  };

  return payload;
}

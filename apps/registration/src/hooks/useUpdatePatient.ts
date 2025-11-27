import {
  updatePatient,
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
import { useNotification } from '@bahmni/widgets';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { convertTimeToISODateTime } from '../components/forms/profile/dateAgeUtils';
import { BasicInfoData, ContactData, AdditionalData } from '../models/patient';
import { usePersonAttributes } from './usePersonAttributes';

interface UpdatePatientFormData {
  patientUuid: string;
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
    image?: string;
  };
  address: PatientAddress;
  contact: ContactData;
  additional: AdditionalData;
}

export const useUpdatePatient = () => {
  const { personAttributes } = usePersonAttributes();
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: (formData: UpdatePatientFormData) => {
      const payload = transformFormDataToPayload(formData, personAttributes);
      return updatePatient(formData.patientUuid, payload);
    },
    onSuccess: (response) => {
      addNotification({
        title: t('NOTIFICATION_SUCCESS_TITLE'),
        message: t('NOTIFICATION_PATIENT_UPDATED_SUCCESSFULLY'),
        type: 'success',
        timeout: 5000,
      });

      if (response?.patient?.uuid) {
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_PATIENT_DETAILS
            .eventType as AuditEventType,
          patientUuid: response.patient.uuid,
          module: AUDIT_LOG_EVENT_DETAILS.EDIT_PATIENT_DETAILS.module,
        });
      }
    },
    onError: () => {
      addNotification({
        title: t('NOTIFICATION_ERROR_TITLE'),
        message: t('NOTIFICATION_PATIENT_UPDATE_FAILED'),
        type: 'error',
        timeout: 5000,
      });
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
    ...(profile.image && { image: profile.image }),
    relationships: [],
  };

  return payload;
}

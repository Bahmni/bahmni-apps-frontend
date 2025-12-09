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
  useTranslation,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import { convertTimeToISODateTime } from '../components/forms/profile/dateAgeUtils';
import { BasicInfoData, ContactData, AdditionalData } from '../models/patient';
import { parseDateStringToDate } from '../utils/ageUtils';
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
  relationships?: RelationshipData[];
}

export const useUpdatePatient = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { personAttributes } = usePersonAttributes();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (formData: UpdatePatientFormData) => {
      const payload = transformFormDataToPayload(formData, personAttributes);
      return updatePatient(formData.patientUuid, payload);
    },
    onSuccess: (response, variables) => {
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

        queryClient.setQueryData(
          ['formattedPatient', variables.patientUuid],
          response,
        );
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: t('ERROR_UPDATING_PATIENT'),
        message: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return mutation;
};

function transformFormDataToPayload(
  formData: UpdatePatientFormData,
  personAttributes: PersonAttributeType[],
): CreatePatientRequest {
  const { profile, address, contact, additional, relationships } = formData;

  const addressWithNulls: PatientAddress = {};
  Object.entries(address).forEach(([key, value]) => {
    addressWithNulls[key as keyof PatientAddress] =
      value && value.trim() !== '' ? value : null;
  });
  const patientName: PatientName = {
    ...(profile.nameUuid && { uuid: profile.nameUuid }),
    givenName: profile.firstName,
    middleName: profile.middleName || '',
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
    if (attributeMap.has(key)) {
      attributes.push({
        attributeType: { uuid: attributeMap.get(key)! },
        value: String(value ?? ''),
      });
    }
  });

  // Dynamically add all additional attributes
  Object.entries(additional).forEach(([key, value]) => {
    if (attributeMap.has(key)) {
      attributes.push({
        attributeType: { uuid: attributeMap.get(key)! },
        value: String(value ?? ''),
      });
    }
  });

  const transformedRelationships = (relationships ?? [])
    .filter((rel) => {
      return !rel.isExisting || rel.isDeleted;
    })
    .map((rel) => {
      if (rel.isDeleted) {
        return {
          uuid: rel.id,
          personA: { uuid: formData.patientUuid },
          personB: { uuid: rel.patientUuid! },
          relationshipType: { uuid: rel.relationshipType! },
          voided: true,
        };
      }

      const relationship: {
        relationshipType: { uuid: string };
        personB: { uuid: string };
        endDate?: string;
      } = {
        relationshipType: { uuid: rel.relationshipType! },
        personB: { uuid: rel.patientUuid! },
      };

      if (rel.tillDate) {
        const date = parseDateStringToDate(rel.tillDate);
        if (date) {
          relationship.endDate = date.toISOString();
        }
      }

      return relationship;
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
        addresses: [addressWithNulls],
        attributes,
        deathDate: null,
        causeOfDeath: '',
      },
      identifiers: [profile.patientIdentifier],
    },
    ...(profile.image && { image: profile.image }),
    relationships: transformedRelationships,
  };

  return payload;
}

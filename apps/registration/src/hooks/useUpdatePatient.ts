import {
  updateFhirPatient,
  createRelatedPerson,
  deleteRelatedPerson,
  PatientIdentifier,
  PatientAddress,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  getUserLoginLocation,
  useTranslation,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Patient } from 'fhir/r4';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import {
  RELATIONSHIP_TYPE_SYSTEM,
  RELATED_PATIENT_EXT_URL,
} from '../constants/relatedPerson';
import {
  BasicInfoData,
  PersonAttributesData,
  AdditionalIdentifiersData,
} from '../models/patient';
import { buildFhirPatient } from '../utils/fhirPatientMapper';
import { useIdentifierTypes } from './useAdditionalIdentifiers';
import { usePersonAttributes } from './usePersonAttributes';

const TRAILING_BRACKETED_SUFFIX = /\s\[.*\]$/;

interface UpdatePatientFormData {
  patientUuid: string;
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
    image?: string;
  };
  address: PatientAddress;
  contact: PersonAttributesData;
  additional: PersonAttributesData;
  additionalIdentifiers: AdditionalIdentifiersData;
  additionalIdentifiersInitialData?: AdditionalIdentifiersData;
  relationships?: RelationshipData[];
}

function buildIdentifierTypeNames(
  types?: { uuid: string; name: string }[],
): Record<string, string> {
  const map: Record<string, string> = {};
  types?.forEach((t) => {
    map[t.uuid] = t.name;
  });
  return map;
}

export const useUpdatePatient = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { personAttributes } = usePersonAttributes();
  const { data: identifierTypes } = useIdentifierTypes();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: UpdatePatientFormData) => {
      const payload = buildFhirPatient({
        profile: formData.profile,
        address: formData.address,
        contact: formData.contact,
        additional: formData.additional,
        additionalIdentifiers: formData.additionalIdentifiers,
        additionalIdentifiersInitialData:
          formData.additionalIdentifiersInitialData,
        identifierTypeNames: buildIdentifierTypeNames(identifierTypes),
        loginLocationUuid: getUserLoginLocation()?.uuid,
        personAttributes,
        patientUuid: formData.patientUuid,
      });
      const patient = await updateFhirPatient<Patient>(
        formData.patientUuid,
        payload,
      );

      if (formData.relationships?.length) {
        const newRels = formData.relationships.filter(
          (rel) =>
            !rel.isExisting &&
            !rel.isDeleted &&
            rel.patientUuid &&
            rel.relationshipType,
        );
        const deletedRels = formData.relationships.filter(
          (rel) => rel.isExisting && rel.isDeleted,
        );

        const results = await Promise.allSettled([
          ...newRels.map((rel) =>
            createRelatedPerson({
              resourceType: 'RelatedPerson',
              patient: { reference: `Patient/${formData.patientUuid}` },
              relationship: [
                {
                  coding: [
                    {
                      system: RELATIONSHIP_TYPE_SYSTEM,
                      code: rel.relationshipType,
                    },
                  ],
                },
              ],
              extension: [
                {
                  url: RELATED_PATIENT_EXT_URL,
                  valueReference: { reference: `Patient/${rel.patientUuid}` },
                },
              ],
              ...(rel.tillDate && { period: { end: rel.tillDate } }),
            }),
          ),
          ...deletedRels.map((rel) => deleteRelatedPerson(rel.id)),
        ]);
        if (results.some((r) => r.status === 'rejected')) {
          throw new Error(t('ERROR_SAVING_RELATIONSHIPS'));
        }
      }

      return patient;
    },
    onSuccess: (response, variables) => {
      addNotification({
        title: t('NOTIFICATION_SUCCESS_TITLE'),
        message: t('NOTIFICATION_PATIENT_UPDATED_SUCCESSFULLY'),
        type: 'success',
        timeout: 5000,
      });

      const patientUuid = response?.id;
      if (patientUuid) {
        queryClient.invalidateQueries({
          queryKey: ['formattedPatient', variables.patientUuid],
        });

        const hasRelationshipChanges = variables.relationships?.some(
          (rel) =>
            (!rel.isExisting &&
              !rel.isDeleted &&
              !!rel.patientUuid &&
              !!rel.relationshipType) ||
            (rel.isExisting && rel.isDeleted),
        );
        if (hasRelationshipChanges) {
          queryClient.invalidateQueries({
            queryKey: ['relatedPersons', variables.patientUuid],
          });
        }

        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_PATIENT_DETAILS
            .eventType as AuditEventType,
          patientUuid,
          module: AUDIT_LOG_EVENT_DETAILS.EDIT_PATIENT_DETAILS.module,
        });
      }
    },
    onError: (error) => {
      const message = (
        error instanceof Error ? error.message : String(error)
      ).replace(TRAILING_BRACKETED_SUFFIX, '');
      addNotification({
        type: 'error',
        title: t('ERROR_UPDATING_PATIENT'),
        message,
        timeout: 5000,
      });
    },
  });

  return mutation;
};

import {
  updateFhirPatient,
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
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import {
  BasicInfoData,
  PersonAttributesData,
  AdditionalIdentifiersData,
} from '../models/patient';
import {
  buildFhirPatient,
  type FhirPatientPayload,
} from '../utils/fhirPatientMapper';
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
    mutationFn: (formData: UpdatePatientFormData) => {
      const payload = buildFhirPatient({
        profile: formData.profile,
        address: formData.address,
        contact: formData.contact,
        additional: formData.additional,
        additionalIdentifiers: formData.additionalIdentifiers,
        identifierTypeNames: buildIdentifierTypeNames(identifierTypes),
        loginLocationUuid: getUserLoginLocation()?.uuid,
        personAttributes,
        patientUuid: formData.patientUuid,
      });
      return updateFhirPatient<FhirPatientPayload>(
        formData.patientUuid,
        payload,
      );
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

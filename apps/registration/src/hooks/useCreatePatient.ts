import {
  createFhirPatient,
  generateIdentifier,
  PatientIdentifier,
  PatientAddress,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  getUserLoginLocation,
  useTranslation,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useMutation } from '@tanstack/react-query';
import type { Patient } from 'fhir/r4';
import { useNavigate } from 'react-router-dom';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import {
  BasicInfoData,
  PersonAttributesData,
  AdditionalIdentifiersData,
} from '../models/patient';
import { createRegistrationEncounterForPatient } from '../services/registrationEncounterService';
import { buildFhirPatient } from '../utils/fhirPatientMapper';
import { useIdentifierTypes } from './useAdditionalIdentifiers';
import { usePersonAttributes } from './usePersonAttributes';
import { useRegistrationEncounterTypeUuid } from './useRegistrationEncounterTypeUuid';

interface CreatePatientFormData {
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
    image?: string;
  };
  address: PatientAddress;
  contact: PersonAttributesData;
  additional: PersonAttributesData;
  additionalIdentifiers: AdditionalIdentifiersData;
  relationships: RelationshipData[];
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

export const useCreatePatient = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { personAttributes } = usePersonAttributes();
  const { data: identifierTypes } = useIdentifierTypes();
  const encounterTypeUuid = useRegistrationEncounterTypeUuid();

  const createRegistrationEncounter = async (patientUuid: string) => {
    if (!encounterTypeUuid) return;

    try {
      await createRegistrationEncounterForPatient(
        patientUuid,
        encounterTypeUuid,
      );
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('ERROR_DEFAULT_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        timeout: 5000,
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (formData: CreatePatientFormData) => {
      const { identifierSourceUuid } = formData.profile.patientIdentifier;
      let identifierValue: string | undefined;

      if (identifierSourceUuid) {
        const result = await generateIdentifier(identifierSourceUuid);
        identifierValue = result.identifier;
      }

      const profile = {
        ...formData.profile,
        patientIdentifier: {
          ...formData.profile.patientIdentifier,
          ...(identifierValue && { identifier: identifierValue }),
        },
      };

      const payload = buildFhirPatient({
        profile,
        address: formData.address,
        contact: formData.contact,
        additional: formData.additional,
        additionalIdentifiers: formData.additionalIdentifiers,
        identifierTypeNames: buildIdentifierTypeNames(identifierTypes),
        loginLocationUuid: getUserLoginLocation()?.uuid,
        personAttributes,
      });
      return createFhirPatient<Patient>(payload);
    },
    onSuccess: async (response) => {
      addNotification({
        title: t('NOTIFICATION_SUCCESS_TITLE'),
        message: t('NOTIFICATION_PATIENT_SAVED_SUCCESSFULLY'),
        type: 'success',
        timeout: 5000,
      });

      const patientUuid = response?.id;
      if (patientUuid) {
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT
            .eventType as AuditEventType,
          patientUuid,
          module: AUDIT_LOG_EVENT_DETAILS.REGISTER_NEW_PATIENT.module,
        });

        // Await encounter creation before navigating so the encounter exists
        // by the time the user can click "Start Visit". createRegistrationEncounter
        // catches its own errors and shows a notification, so navigation is
        // never blocked by failure.
        await createRegistrationEncounter(patientUuid);

        const patientDisplay =
          [response.name?.[0]?.given?.join(' '), response.name?.[0]?.family]
            .filter(Boolean)
            .join(' ') || patientUuid;

        window.history.replaceState(
          { patientDisplay, patientUuid },
          '',
          `/registration/patient/${patientUuid}`,
        );
      } else {
        navigate('/registration/search');
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: t('ERROR_SAVING_PATIENT'),
        message: error instanceof Error ? error.message : String(error),
        timeout: 5000,
      });
    },
  });

  return mutation;
};

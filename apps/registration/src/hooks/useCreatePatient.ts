import {
  createFhirPatient,
  createFhirEncounter,
  generateIdentifier,
  getCurrentUser,
  getCurrentProvider,
  PatientIdentifier,
  PatientAddress,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  getUserLoginLocation,
  useTranslation,
  FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useMutation } from '@tanstack/react-query';
import type { Encounter, Patient } from 'fhir/r4';
import { useNavigate } from 'react-router-dom';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import {
  BasicInfoData,
  PersonAttributesData,
  AdditionalIdentifiersData,
} from '../models/patient';
import { useRegistrationConfig } from '../providers/registrationConfig';
import { buildFhirPatient } from '../utils/fhirPatientMapper';
import { useIdentifierTypes } from './useAdditionalIdentifiers';
import { usePersonAttributes } from './usePersonAttributes';

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
  const { registrationConfig } = useRegistrationConfig();

  const createRegistrationEncounter = async (patientUuid: string) => {
    const encounterTypeUuid = registrationConfig?.registrationEncounterTypeUuid;
    if (!encounterTypeUuid) return;

    try {
      const locationUuid = getUserLoginLocation().uuid;
      const user = await getCurrentUser();
      const provider = user ? await getCurrentProvider(user.uuid) : null;

      const encounter: Encounter = {
        resourceType: 'Encounter',
        status: 'in-progress',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'ambulatory',
        },
        meta: {
          tag: [
            {
              system: 'http://fhir.openmrs.org/ext/encounter-tag',
              code: 'encounter',
              display: 'Encounter',
            },
          ],
        },
        type: [
          {
            coding: [
              {
                system: FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
                code: encounterTypeUuid,
              },
            ],
          },
        ],
        subject: { reference: `Patient/${patientUuid}` },
        location: [{ location: { reference: `Location/${locationUuid}` } }],
        ...(provider && {
          participant: [
            {
              individual: {
                reference: `Practitioner/${provider.uuid}`,
                type: 'Practitioner',
              },
            },
          ],
        }),
        period: { start: new Date().toISOString() },
      };

      const createdEncounter = await createFhirEncounter(encounter);

      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.CREATE_ENCOUNTER
          .eventType as AuditEventType,
        patientUuid,
        messageParams: {
          encounterUuid: createdEncounter.id,
          encounterType: encounterTypeUuid,
        },
        module: AUDIT_LOG_EVENT_DETAILS.CREATE_ENCOUNTER.module,
      });
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
    onSuccess: (response) => {
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

        // Fire and forget — encounter creation failure must not block navigation
        createRegistrationEncounter(patientUuid);

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

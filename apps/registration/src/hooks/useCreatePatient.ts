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
  PHONE_NUMBER_UUID,
  ALTERNATE_PHONE_NUMBER_UUID,
  EMAIL_UUID,
} from '@bahmni/services';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import { convertTimeToISODateTime } from '../components/forms/profile/dateAgeUtils';
import { BasicInfoData, ContactData, AdditionalData } from '../models/patient';
import { parseDateStringToDate } from '../utils/ageUtils';

interface CreatePatientFormData {
  profile: BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
    image?: string;
  };
  address: PatientAddress;
  contact: ContactData;
  additional: AdditionalData;
  relationships: RelationshipData[];
}

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

  const transformedRelationships = (formData.relationships || [])
    .filter((rel) => rel.patientUuid && rel.relationshipType)
    .map((rel) => {
      const relationship: {
        relationshipType: { uuid: string };
        personB: { uuid: string };
        endDate?: string;
      } = {
        relationshipType: { uuid: rel.relationshipType! },
        personB: { uuid: rel.patientUuid },
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
        addresses: [address],
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

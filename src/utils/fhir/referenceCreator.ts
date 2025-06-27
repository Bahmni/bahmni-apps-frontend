import { EncounterLocation, EncounterParticipant, Reference } from 'fhir/r4';

const createReference = (
  resourceName: string,
  resourceId: string,
): Reference => {
  const patientReference: Reference = {
    reference: `${resourceName}/${resourceId}`,
  };
  return patientReference;
};

export const getPlaceholderReference = (placeholderUUID: string): Reference => {
  const reference: Reference = {
    reference: placeholderUUID,
  };
  return reference;
};

export const createPatientReference = (patientUUID: string): Reference => {
  return createReference('Patient', patientUUID);
};
export const createEncounterReference = (encounterUUID: string): Reference => {
  return createReference('Encounter', encounterUUID);
};
export const getLocationReference = (locationUUID: string): Reference => {
  return createReference('Location', locationUUID);
};

export const createEncounterLocationReference = (
  locationUUID: string,
): EncounterLocation => {
  const encounterLocation: EncounterLocation = {
    location: getLocationReference(locationUUID),
  };
  return encounterLocation;
};

export const createPractitionerReference = (
  practitionerUUID: string,
): Reference => {
  const practitionerReference: Reference = createReference(
    'Practitioner',
    practitionerUUID,
  );
  practitionerReference.type = 'Practitioner';
  return practitionerReference;
};

export const createEncounterParticipantReference = (
  practitionerUUID: string,
): EncounterParticipant => {
  const encounterParticipant: EncounterParticipant = {
    individual: createPractitionerReference(practitionerUUID),
  };
  return encounterParticipant;
};

export const createMedicationReference = (
  medicationId: string,
): Reference => {
  const medicationReference: Reference = createReference('Medication', medicationId);
  medicationReference.type = 'Medication';
  return medicationReference;
}
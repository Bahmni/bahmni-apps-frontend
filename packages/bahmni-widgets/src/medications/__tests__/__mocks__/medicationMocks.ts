import { MedicationRequest as FhirMedicationRequest } from 'fhir/r4';

export const fhirMedicationRequestMock: FhirMedicationRequest = {
  resourceType: 'MedicationRequest',
  id: 'test-med-id',
  status: 'active',
  intent: 'order',
  subject: { reference: 'Patient/test-patient' },
  medicationReference: {
    reference: 'Medication/test-med',
    display: 'Paracetamol',
  },
};

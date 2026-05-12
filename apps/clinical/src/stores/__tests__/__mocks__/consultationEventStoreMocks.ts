import { MedicationRequest } from 'fhir/r4';

export const fhirMedicationRequestMock: MedicationRequest = {
  resourceType: 'MedicationRequest',
  id: 'med-req-1',
  status: 'active',
  intent: 'order',
  subject: { reference: 'Patient/patient-1' },
  medicationReference: {
    reference: 'Medication/med-1',
    display: 'Paracetamol',
  },
};

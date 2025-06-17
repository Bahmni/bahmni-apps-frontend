export interface DrugOrder {
  visit: {
    startDateTime: string;
    uuid: string;
  };
  drug: {
    name: string;
    form: string;
  };
  provider: {
    name: string;
  };
  effectiveStartDate: string;
  effectiveStopDate?: string;
  durationInDays: number;
  orderAttributes: Array<{
    name: string;
    value: string;
  }>;
}

// FHIR MedicationRequest
export interface FhirMedicationRequest {
  medicationReference: any;
  id: string;
  medication: {
    code: string;
    display: string;
  };
  status: string;
  intent: string;
  subject: {
    reference: string; // e.g., "Patient/12345"
    display: string; // e.g., "John Doe"
  };
  authoredOn: string; // ISO date string
  requester: {
    reference: string; // e.g., "Practitioner/67890"
    display: string; // e.g., "Dr. Smith"
  };
  dosageInstruction?: Array<{
    text?: string;
    timing?: {
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: string; // e.g., "d" for days
      };
    };
    route?: {
      coding?: Array<{
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    doseAndRate?: Array<{
      doseQuantity?: {
        value?: number;
        unit?: string;
      };
    }>;
    extension?: Array<any>; // For STAT/PRN, etc.
  }>;
  dispenseRequest?: {
    validityPeriod?: {
      start?: string;
      end?: string;
    };
    expectedSupplyDuration?: {
      value?: number;
      unit?: string;
    };
  };
  note?: Array<{
    text: string;
  }>;
  extension?: Array<any>; // For custom statuses, etc.
}

// Formatted type for UI display
export interface MedicationOrder {
  id: string;
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  status: 'active' | 'scheduled' | 'completed' | 'stopped' | string;
  priority?: 'STAT' | 'PRN' | string;
  startDate: string;
  orderDate: string;
  orderedBy: string;
  notes?: string;
  isActive: boolean;
  isScheduled: boolean;
}
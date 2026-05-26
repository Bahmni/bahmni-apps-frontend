import { MedicationStatus } from '@bahmni/services';
import { MedicationRequest } from 'fhir/r4';

export type MedicationAction = {
  label: string;
  type: string;
  encounterType: string;
  requiredPrivilege: string[];
};

export interface FormattedMedicationRequest {
  readonly id: string;
  readonly name: string;
  readonly dosage: string;
  readonly dosageUnit: string;
  readonly quantity: string;
  readonly instruction: string;
  readonly startDate: string;
  readonly orderDate: string;
  readonly orderedBy: string;
  readonly status: MedicationStatus;
  readonly priority: MedicationRequest['priority'];
  readonly asNeeded: boolean;
  readonly isImmediate: boolean;
  readonly note?: string;
  readonly doseForm?: string;
  readonly fhirResource: MedicationRequest;
}

/**
 * FHIR Observation Bundle response
 */
export interface FHIRObservationBundle {
  resourceType: 'Bundle';
  total: number;
  entry: Array<{
    resource:
      | {
          resourceType: 'Observation';
          id: string;
          code: {
            text: string;
          };
          effectiveDateTime: string;
          valueString?: string;
          valueQuantity?: { value: number; unit?: string };
          valueCodeableConcept?: { text: string };
          valueBoolean?: boolean;
          valueDateTime?: string;
          hasMember?: Array<{ reference: string }>;
          encounter?: { reference: string };
        }
      | {
          resourceType: 'Encounter';
          id: string;
          participant?: Array<{
            individual?: {
              display?: string;
            };
          }>;
        };
  }>;
}

/**
 * Formatted observation for display
 */
export interface FormattedObservation {
  id: string;
  conceptName: string;
  value: string;
  unit?: string;
  date: string;
  isParent: boolean;
  recordedBy?: string;
  children: FormattedObservation[];
}

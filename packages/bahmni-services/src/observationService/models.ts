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
          extension?: Array<{
            url: string;
            valueString: string;
          }>;
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

export interface ObsGroup {
  id: string;
  conceptName: string;
  value: string;
  unit?: string;
  date: string;
  isParent: boolean;
  recordedBy?: string;
  formName?: string;
  children: ObsGroup[];
}

export interface ObservationFormGroup {
  formName: string;
  observations: ObsGroup[];
}

export interface FormattedObservations {
  forms: ObservationFormGroup[];
}

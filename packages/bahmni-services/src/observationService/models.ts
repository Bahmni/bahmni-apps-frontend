/**
 * FHIR Observation Bundle response
 */
export interface FHIRObservationBundle {
  resourceType: 'Bundle';
  total: number;
  entry: Array<{
    resource: {
      id: string;
      code: {
        text: string;
      };
      effectiveDateTime: string;
      valueString?: string;
      valueQuantity?: { value: number };
      valueCodeableConcept?: { text: string };
      hasMember?: Array<{ reference: string }>;
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
  date: string;
  isParent: boolean;
  children: FormattedObservation[];
}

export interface EncounterDetailsMetadata extends Record<string, unknown> {
  defaultEncounterType?: string;
  requestedEncounterType?: string;
  allowedVisitTypes?: string[];
}

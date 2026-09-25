import { OPENMRS_REST_V1 } from '../constants/app';

export const CONCEPT_SET_EXPORT_URL = (conceptName: string) =>
  OPENMRS_REST_V1 +
  `/bahmnicore/admin/export/conceptset?conceptName=${encodeURIComponent(conceptName)}`;

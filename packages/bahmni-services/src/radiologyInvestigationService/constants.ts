import { OPENMRS_FHIR_R4 } from '../constants/app';

export const IMAGING_STUDY_FETCH_QC_URL = (imagingStudyId: string) =>
  `${OPENMRS_FHIR_R4}/ImagingStudy/${imagingStudyId}/$fetch-quality-assessment`;

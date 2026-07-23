import { get } from '@bahmni/services';
import { PATIENT_DOCUMENTS_V2_CONFIG_BASE_URL } from '../constants/app';

export const PATIENT_DOCUMENTS_CONFIG_URL =
  PATIENT_DOCUMENTS_V2_CONFIG_BASE_URL + '/app.json';

export const getPatientDocumentsConfig = () =>
  get<unknown>(PATIENT_DOCUMENTS_CONFIG_URL);

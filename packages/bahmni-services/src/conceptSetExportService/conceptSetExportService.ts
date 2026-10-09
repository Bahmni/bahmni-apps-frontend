import { get } from '../api';
import { CONCEPT_SET_EXPORT_URL } from './constants';

export const exportConceptSet = async (conceptName: string): Promise<Blob> =>
  get<Blob>(CONCEPT_SET_EXPORT_URL(conceptName), { responseType: 'blob' });

import { get } from '../api';
import { CONCEPT_SET_EXPORT_URL } from './constants';

export const exportConceptSet = async (conceptName: string): Promise<Blob> =>
  get<Blob>(CONCEPT_SET_EXPORT_URL(conceptName), { responseType: 'blob' });

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

import { useLocation } from 'react-router-dom';

export interface DocumentUploadParams {
  encounterType: string | null;
  topLevelConcept: string | null;
  defaultOption: string | null;
}

export const useDocumentUploadParams = (): DocumentUploadParams => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  return {
    encounterType: params.get('encounterType'),
    topLevelConcept: params.get('topLevelConcept'),
    defaultOption: params.get('defaultOption'),
  };
};

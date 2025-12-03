import { getPatientImageAsDataUrl } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

interface UsePatientPhotoProps {
  patientUuid: string | undefined;
}

export const usePatientPhoto = ({ patientUuid }: UsePatientPhotoProps) => {
  const { data: patientPhoto, isLoading } = useQuery({
    queryKey: ['patientPhoto', patientUuid],
    queryFn: () => getPatientImageAsDataUrl(patientUuid!),
    enabled: !!patientUuid,
  });

  return {
    patientPhoto,
    isLoading,
  };
};

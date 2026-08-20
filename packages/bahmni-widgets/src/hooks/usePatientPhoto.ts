import { fetchPatientPhotoFromUrl } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

interface UsePatientPhotoProps {
  photoUrl: string | undefined;
}

export const usePatientPhoto = ({ photoUrl }: UsePatientPhotoProps) => {
  const { data: patientPhoto, isLoading, error } = useQuery({
    queryKey: ['patientPhoto', photoUrl],
    queryFn: () => fetchPatientPhotoFromUrl(photoUrl!),
    enabled: !!photoUrl,
  });

  return {
    patientPhoto,
    isLoading,
    error,
  };
};

import { fetchPatientPhotoFromUrl } from '@bahmni/services';
import { GET_PATIENT_PHOTO_PRIVILEGE, useHasPrivilege } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';

interface UsePatientPhotoProps {
  photoUrl: string | undefined;
}

export const usePatientPhoto = ({ photoUrl }: UsePatientPhotoProps) => {
  const hasPhotoPrivilege = useHasPrivilege(GET_PATIENT_PHOTO_PRIVILEGE);
  const { data: patientPhoto, isLoading } = useQuery({
    queryKey: ['patientPhoto', photoUrl],
    queryFn: () => fetchPatientPhotoFromUrl(photoUrl!),
    enabled: !!photoUrl && hasPhotoPrivilege,
  });

  return {
    patientPhoto,
    isLoading,
  };
};

import { fetchPatientPhotoFromUrl } from '@bahmni/services';
import { useHasPrivilege } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';

const GET_PATIENT_PHOTO_PRIVILEGE = 'Get Patient Photo';

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

import {
  type AppointmentService,
  fetchAllProviders,
  getAllAppointmentServices,
  getCurrentUser,
  getFHIRLocationsByTag,
  getProviderLoginLocations,
  type Location,
  type Provider,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { APPOINTMENT_LOCATION_TAG } from './constants';
import { mapFHIRBundleToLocations } from './utils';

const useUnavailabilityFormData = () => {
  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
    isError: isCurrentUserError,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const {
    data: loginLocations = [],
    isLoading: isLocationsLoading,
    isError: isLocationsError,
  } = useQuery<Location[]>({
    queryKey: ['providerLoginLocations', currentUser?.uuid],
    queryFn: async (): Promise<Location[]> => {
      const providerLocations = await getProviderLoginLocations(
        currentUser.uuid,
      );

      if (providerLocations.length === 0) {
        const fhirResponse = await getFHIRLocationsByTag(
          APPOINTMENT_LOCATION_TAG,
        );
        return mapFHIRBundleToLocations(fhirResponse);
      }

      return providerLocations.filter((location) =>
        location.tags?.some((tag) => tag.display === APPOINTMENT_LOCATION_TAG),
      );
    },
    enabled: !!currentUser?.uuid,
  });

  const {
    data: services = [],
    isLoading: isServicesLoading,
    isError: isServicesError,
  } = useQuery<AppointmentService[]>({
    queryKey: ['appointmentServices'],
    queryFn: getAllAppointmentServices,
  });

  const {
    data: providers = [],
    isLoading: isProvidersLoading,
    isError: isProvidersError,
  } = useQuery<Provider[]>({
    queryKey: ['providers'],
    queryFn: fetchAllProviders,
  });

  return {
    loginLocations,
    services,
    providers,
    isLoading:
      isCurrentUserLoading ||
      isLocationsLoading ||
      isServicesLoading ||
      isProvidersLoading,
    isError:
      isCurrentUserError ||
      isLocationsError ||
      isServicesError ||
      isProvidersError,
  };
};

export default useUnavailabilityFormData;

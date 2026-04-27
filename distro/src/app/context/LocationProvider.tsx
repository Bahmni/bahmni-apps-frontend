import {
  getUserLoginLocation,
  getAvailableLocations,
  getCurrentUser,
  saveUserLocation,
  setCookie,
  notificationService,
} from '@bahmni/services';
import i18next from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { LocationContext, UserLocation } from './LocationContext';

const BAHMNI_USER_LOCATION_COOKIE = 'bahmni.user.location';

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [availableLocations, setAvailableLocations] = useState<UserLocation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setError(null);
        const currentLocation = getUserLoginLocation();
        setLocationState(currentLocation);
        const locations = await getAvailableLocations();
        setAvailableLocations(locations);
        const user = await getCurrentUser();
        setUserUuid(user?.uuid ?? null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load location';
        // eslint-disable-next-line no-console
        console.error('Location initialization error:', errorMessage);
        setError(errorMessage);
        setLocationState(null);
      } finally {
        setLoading(false);
      }
    };

    initializeLocation();
  }, []);

  const handleSetLocation = (newLocation: UserLocation | null) => {
    const previousLocation = location;
    try {
      setError(null);
      setLocationState(newLocation);

      if (newLocation) {
        setCookie(
          BAHMNI_USER_LOCATION_COOKIE,
          encodeURIComponent(JSON.stringify(newLocation)),
        );

        if (userUuid) {
          saveUserLocation(userUuid, newLocation).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Failed to save location to server:', err);
            notificationService.showWarning(
              i18next.t('HOME_ERROR_LOCATION_SYNC_FAILED_TITLE'),
              i18next.t('HOME_ERROR_LOCATION_SYNC_FAILED'),
            );
          });
        }
      }
    } catch (err) {
      setLocationState(previousLocation);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error('Error updating location:', err);
    }
  };

  const value = useMemo(
    () => ({
      location,
      setLocation: handleSetLocation,
      availableLocations,
      loading,
      error,
    }),
    [location, availableLocations, loading, error, userUuid],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

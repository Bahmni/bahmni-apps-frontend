import React from 'react';

export interface UserLocation {
  name: string;
  uuid: string;
}

interface LocationContextType {
  location: UserLocation | null;
  setLocation: (location: UserLocation | null) => void;
  availableLocations: UserLocation[];
  loading: boolean;
  error: string | null;
}

export const LocationContext = React.createContext<
  LocationContextType | undefined
>(undefined);

export const useLocation = () => {
  const context = React.useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

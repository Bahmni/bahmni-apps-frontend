import { Dropdown } from '@bahmni/design-system';
import { useTranslation, UserLocation } from '@bahmni/services';
import React, { useState } from 'react';
import { useLocation } from '../../context/LocationContext';
import styles from './styles/LocationSelector.module.scss';

export const LocationSelector: React.FC = () => {
  const { t } = useTranslation();
  const { location, setLocation, availableLocations, loading, error } =
    useLocation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLocationChange = async (selected: UserLocation) => {
    if (!selected || selected.uuid === location?.uuid) {
      return;
    }

    try {
      setIsUpdating(true);
      await setLocation(selected);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to change location:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading} role="status">
        {t('LOADING')}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error} data-testid="location-error" role="alert">
        {error}
      </div>
    );
  }

  if (!location) {
    return (
      <div className={styles.noLocation} role="status">
        {t('NO_LOCATION_SELECTED')}
      </div>
    );
  }

  const selectedItem =
    availableLocations.find((loc) => loc.uuid === location.uuid) ?? null;

  return (
    <div className={styles.dropdownWrapper}>
      <Dropdown
        id="location-selector"
        titleText=""
        hideLabel
        label={location.name}
        items={availableLocations}
        itemToString={(item: UserLocation) => item?.display ?? item?.name ?? ''}
        selectedItem={selectedItem}
        onChange={({ selectedItem }: { selectedItem: UserLocation }) =>
          handleLocationChange(selectedItem)
        }
        disabled={isUpdating}
        size="sm"
        data-testid="location-selector"
      />
    </div>
  );
};

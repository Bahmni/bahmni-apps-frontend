import { Dropdown, SkeletonPlaceholder } from '@bahmni/design-system';
import { useTranslation, UserLocation } from '@bahmni/services';
import React from 'react';
import { useLocation } from '../../context/LocationContext';
import styles from './styles/LocationSelector.module.scss';

export const LocationSelector: React.FC = () => {
  const { t } = useTranslation();
  const { location, setLocation, availableLocations, loading, error } =
    useLocation();
  const handleLocationChange = (selected: UserLocation) => {
    if (!selected || selected.uuid === location?.uuid) {
      return;
    }
    setLocation(selected);
  };

  if (loading) {
    return (
      <div role="status" aria-label={t('HOME_LOADING')}>
        <SkeletonPlaceholder className={styles.skeleton} />
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
        {t('HOME_NO_LOCATION_SELECTED')}
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
        size="sm"
        data-testid="location-selector"
      />
    </div>
  );
};

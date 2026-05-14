import {
  ArrowRight,
  ClickableTile,
  Icon,
  ICON_SIZE,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import styles from './styles/AppTile.module.scss';

interface AppTileProps {
  id: string;
  label: string;
  icon: string;
  url: string;
}

export const AppTile: React.FC<AppTileProps> = ({ id, label, icon, url }) => {
  const { t } = useTranslation();
  const translatedLabel = t(label);

  return (
    <ClickableTile
      href={url}
      className={styles.tile}
      aria-label={translatedLabel}
      testId={`app-tile-${id}`}
    >
      <p className={styles.label} aria-hidden="true">
        {translatedLabel}
      </p>
      <div className={styles.bottom}>
        <Icon name={icon} id={id} size={ICON_SIZE.X2} aria-hidden="true" />
        <ArrowRight size={20} aria-hidden="true" />
      </div>
    </ClickableTile>
  );
};

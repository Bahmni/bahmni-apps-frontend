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
  /** Shown when `label` has no translation in any loaded locale. */
  fallbackLabel?: string;
}

export const AppTile: React.FC<AppTileProps> = ({
  id,
  label,
  icon,
  url,
  fallbackLabel,
}) => {
  const { t } = useTranslation();
  const translatedLabel = t(label, { defaultValue: fallbackLabel });

  return (
    <ClickableTile
      href={url}
      className={styles.tile}
      aria-label={translatedLabel}
      testId={`app-tile-${id}`}
    >
      <h2 className={styles.label} aria-hidden="true">
        {translatedLabel}
      </h2>
      <div className={styles.bottom}>
        <Icon name={icon} id={id} size={ICON_SIZE.X2} aria-hidden="true" />
        <ArrowRight size={20} aria-hidden="true" />
      </div>
    </ClickableTile>
  );
};

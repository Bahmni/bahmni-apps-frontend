import { Tile, Icon, ICON_SIZE } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { ArrowRight } from '@carbon/icons-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/AppTile.module.scss';

interface AppTileProps {
  id: string;
  label: string;
  icon: string;
  url: string;
}

export const AppTile: React.FC<AppTileProps> = ({ id, label, icon, url }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    if (url.startsWith('/') || url.startsWith('http')) {
      window.location.href = url;
    } else {
      navigate(url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const translatedLabel = t(label);

  return (
    <Tile
      className={styles.tile}
      role="button"
      tabIndex={0}
      aria-label={translatedLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`app-tile-${id}`}
    >
      <p className={styles.label} aria-hidden="true">
        {translatedLabel}
      </p>
      <div className={styles.bottom}>
        <Icon name={icon} id={id} size={ICON_SIZE.X2} aria-hidden="true" />
        <ArrowRight size={20} aria-hidden="true" />
      </div>
    </Tile>
  );
};

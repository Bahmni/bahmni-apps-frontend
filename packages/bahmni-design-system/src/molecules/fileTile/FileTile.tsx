import classNames from 'classnames';
import React from 'react';
import { Icon, ICON_SIZE } from '../icon';
import styles from './styles/FileTile.module.scss';

export interface FileTileProps {
  id: string;
  iconName?: string;
  className?: string;
  onClick: () => void;
}

export const FileTile: React.FC<FileTileProps> = ({
  id,
  className,
  onClick,
  iconName = 'fa-file',
}) => {
  const handleClick = () => {
    onClick();
  };

  return (
    <button
      id={id}
      data-testid={`${id}-test-id`}
      aria-label={`${id}-aria-label`}
      type="button"
      className={classNames(styles.fileTileButton, className)}
      onClick={handleClick}
    >
      <Icon
        name={iconName}
        size={ICON_SIZE.XXL}
        id={`${id}-icon`}
        ariaLabel={`${id}-icon-aria-label`}
        testId={`${id}-icon-test-id`}
      />
    </button>
  );
};

export default FileTile;

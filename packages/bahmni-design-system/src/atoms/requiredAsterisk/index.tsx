import React from 'react';
import styles from './index.module.scss';

export interface RequiredAsteriskProps {
  className?: string;
}

export const RequiredAsterisk: React.FC<RequiredAsteriskProps> = ({
  className,
}) => (
  <span
    aria-hidden="true"
    className={
      className
        ? `${styles.requiredAsterisk} ${className}`
        : styles.requiredAsterisk
    }
  >
    *
  </span>
);

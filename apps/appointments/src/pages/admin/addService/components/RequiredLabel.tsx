import React from 'react';
import styles from '../styles/index.module.scss';

interface RequiredLabelProps {
  label: string;
}

const RequiredLabel: React.FC<RequiredLabelProps> = ({ label }) => (
  <>
    {label}
    <span className={styles.requiredAsterisk} aria-hidden="true">
      *
    </span>
  </>
);

export default RequiredLabel;

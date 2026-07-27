import { Tag } from '@bahmni/design-system';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './__styles__/DeceasedTag.module.scss';

export interface DeceasedTagProps {
  isDead?: boolean;
}

export const DeceasedTag: React.FC<DeceasedTagProps> = ({ isDead }) => {
  const { t } = useTranslation();

  if (!isDead) {
    return null;
  }

  return (
    <Tag type="red" size="sm" className={styles.deceasedTag}>
      {t('PATIENT_STATUS_DECEASED', { defaultValue: 'Deceased' })}
    </Tag>
  );
};

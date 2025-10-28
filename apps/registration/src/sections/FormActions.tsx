import { Button } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import styles from '../pages/createPatientPage/styles/index.module.scss';

interface FormActionsProps {
  onSave: () => void;
  isSaving: boolean;
}

export const FormActions = ({ onSave, isSaving }: FormActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.formActions}>
      <Button kind="tertiary">{t('CREATE_PATIENT_BACK_TO_SEARCH')}</Button>
      <div className={styles.actionButtons}>
        <Button kind="tertiary" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : t('CREATE_PATIENT_SAVE')}
        </Button>
        <Button kind="tertiary">{t('CREATE_PATIENT_PRINT_REG_CARD')}</Button>
        <Button kind="primary">{t('CREATE_PATIENT_START_OPD_VISIT')}</Button>
      </div>
    </div>
  );
};

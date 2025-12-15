import { Button, Dropdown } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useParams } from 'react-router-dom';
import { useActiveVisit } from '../../hooks/useActiveVisit';
import { useRegistrationConfig } from '../../hooks/useRegistrationConfig';
import { useVisitTypes } from '../../hooks/useVisitTypes';
import styles from './styles/VisitTypeSelector.module.scss';

interface VisitTypeSelectorProps {
  onVisitTypeSelect: (visitType: { name: string; uuid: string }) => void;
}

export const VisitTypeSelector = ({
  onVisitTypeSelect,
}: VisitTypeSelectorProps) => {
  const { t } = useTranslation();
  const { patientUuid } = useParams<{ patientUuid: string }>();
  const { hasActiveVisit } = useActiveVisit(patientUuid);
  const { registrationConfig } = useRegistrationConfig();
  const { visitTypes: visitTypesArray, isLoading: isLoadingVisitTypes } =
    useVisitTypes();

  const defaultVisitType =
    visitTypesArray.find(
      (vt) => vt.name === registrationConfig?.defaultVisitType,
    ) ?? visitTypesArray[0];

  return (
    <div className={styles.opdVisitGroup}>
      <Button
        id="visit-button"
        className={styles.visitButton}
        kind="tertiary"
        disabled={isLoadingVisitTypes || visitTypesArray.length === 0}
        onClick={() => defaultVisitType && onVisitTypeSelect(defaultVisitType)}
      >
        {!isLoadingVisitTypes && defaultVisitType
          ? hasActiveVisit
            ? t('ENTER_VISIT_DETAILS')
            : t('START_VISIT_TYPE', { visitType: defaultVisitType.name })
          : ''}
      </Button>
      {!hasActiveVisit && (
        <Dropdown
          id="visit-dropdown"
          className={styles.visitDropdown}
          items={visitTypesArray.filter(
            (vt) => vt.uuid !== defaultVisitType?.uuid,
          )}
          itemToString={(item) =>
            item ? t('START_VISIT_TYPE', { visitType: item.name }) : ''
          }
          onChange={({ selectedItem }) =>
            selectedItem && onVisitTypeSelect(selectedItem)
          }
          label=""
          type="inline"
          size="lg"
          disabled={isLoadingVisitTypes || visitTypesArray.length === 0}
          titleText=""
          selectedItem={null}
        />
      )}
    </div>
  );
};

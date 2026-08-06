import {
  ArrowRight,
  Button,
  ComboButton,
  InlineLoading,
  MenuItem,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useParams } from 'react-router-dom';
import { useActiveVisit, useVisitTypes } from '../../hooks/useVisit';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import { transformVisitTypesToArray } from '../../utils/visitUtils';

interface VisitTypeSelectorProps {
  onVisitTypeSelect: (visitType: { name: string; uuid: string }) => void;
  activeVisitLabel?: string;
  onActiveVisitClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const VisitTypeSelector = ({
  onVisitTypeSelect,
  activeVisitLabel,
  onActiveVisitClick,
  disabled = false,
  isLoading = false,
}: VisitTypeSelectorProps) => {
  const { t } = useTranslation();
  const { patientUuid } = useParams<{ patientUuid: string }>();
  const { hasActiveVisit } = useActiveVisit(patientUuid);
  const { registrationConfig } = useRegistrationConfig();
  const { visitTypes, isLoading: isLoadingVisitTypes } = useVisitTypes();

  const visitTypesArray = transformVisitTypesToArray(visitTypes);

  const defaultVisitType =
    visitTypesArray.find(
      (vt) => vt.name === registrationConfig?.defaultVisitType,
    ) ?? visitTypesArray[0];

  const isDisabled =
    disabled ||
    isLoading ||
    isLoadingVisitTypes ||
    visitTypesArray.length === 0;

  return hasActiveVisit ? (
    <Button
      id="visit-button"
      data-testid="start-visit-button"
      kind="primary"
      disabled={isDisabled}
      onClick={() => {
        if (onActiveVisitClick) {
          onActiveVisitClick();
        } else if (defaultVisitType) {
          onVisitTypeSelect(defaultVisitType);
        }
      }}
      renderIcon={ArrowRight}
    >
      {isLoading ? (
        <InlineLoading description={t('STARTING_VISIT')} />
      ) : !isLoadingVisitTypes && defaultVisitType ? (
        (activeVisitLabel ?? t('ENTER_VISIT_DETAILS'))
      ) : (
        ''
      )}
    </Button>
  ) : visitTypesArray.length > 1 ? (
    <div>
      <ComboButton
        data-testid="start-visit-button"
        label={
          isLoading
            ? t('STARTING_VISIT')
            : !isLoadingVisitTypes && defaultVisitType
              ? t('START_VISIT_TYPE', { visitType: defaultVisitType.name })
              : ''
        }
        onClick={() => defaultVisitType && onVisitTypeSelect(defaultVisitType)}
        disabled={isDisabled}
      >
        {visitTypesArray
          .filter((vt) => vt.uuid !== defaultVisitType?.uuid)
          .map((vt) => (
            <MenuItem
              key={vt.uuid}
              label={t('START_VISIT_TYPE', { visitType: vt.name })}
              onClick={() => onVisitTypeSelect(vt)}
            />
          ))}
      </ComboButton>
    </div>
  ) : (
    <Button
      id="visit-button"
      data-testid="start-visit-button"
      kind="tertiary"
      disabled={isDisabled}
      onClick={() => {
        if (defaultVisitType) {
          onVisitTypeSelect(defaultVisitType);
        }
      }}
    >
      {isLoading ? (
        <InlineLoading description={t('STARTING_VISIT')} />
      ) : !isLoadingVisitTypes && defaultVisitType ? (
        t('START_VISIT_TYPE', { visitType: defaultVisitType.name })
      ) : (
        ''
      )}
    </Button>
  );
};

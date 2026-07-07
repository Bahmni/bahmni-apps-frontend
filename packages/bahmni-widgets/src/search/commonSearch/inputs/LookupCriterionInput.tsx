import { ComboBox } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { LookupInput as LookupInputConfig, ScalarValue } from '../models';

interface Props {
  input: LookupInputConfig;
  value: ScalarValue | null;
  onChange: (value: ScalarValue | null) => void;
  validationError: string | null;
}

const LookupCriterionInput = ({
  input,
  value,
  onChange,
  validationError,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div
      id="lookup-criterion-input"
      data-testid="lookup-criterion-input-test-id"
    >
      <ComboBox
        id={`lookup-input-${input.placeholderTranslationKey}`}
        data-testid={`lookup-input-${input.placeholderTranslationKey}-test-id`}
        titleText={t('ENTER_SEARCH_VALUE')}
        placeholder={t(input.placeholderTranslationKey)}
        items={[]}
        selectedItem={value?.value ?? null}
        itemToString={(item: string | null) => item ?? ''}
        onChange={({ selectedItem }: { selectedItem: string | null }) =>
          onChange(selectedItem ? { value: selectedItem } : null)
        }
        invalid={!!validationError}
        invalidText={validationError ?? undefined}
      />
    </div>
  );
};

export default LookupCriterionInput;

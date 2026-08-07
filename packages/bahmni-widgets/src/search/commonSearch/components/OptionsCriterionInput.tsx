import { Dropdown } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import {
  OptionItem,
  OptionsInput as OptionsInputConfig,
  ScalarValue,
} from '../models';

interface Props {
  input: OptionsInputConfig;
  value: ScalarValue | null;
  onChange: (value: ScalarValue | null) => void;
  validationError: string | null;
}

const OptionsCriterionInput = ({
  input,
  value,
  onChange,
  validationError,
}: Props) => {
  const { t } = useTranslation();
  const selectedItem =
    input.options.find((o) => o.value === value?.value) ?? null;

  return (
    <div
      id="options-criterion-input"
      data-testid="options-criterion-input-test-id"
    >
      <Dropdown
        id={`options-input-${input.placeholderTranslationKey}`}
        titleText={t('COMMON_SEARCH_CRITERION_LABEL')}
        label={t(input.placeholderTranslationKey)}
        items={input.options}
        selectedItem={selectedItem}
        itemToString={(item: OptionItem | null) =>
          item ? t(item.translationKey) : ''
        }
        onChange={({
          selectedItem: item,
        }: {
          selectedItem: OptionItem | null;
        }) => onChange(item ? { value: item.value } : null)}
        invalid={!!validationError}
        invalidText={validationError ?? undefined}
      />
    </div>
  );
};

export default OptionsCriterionInput;

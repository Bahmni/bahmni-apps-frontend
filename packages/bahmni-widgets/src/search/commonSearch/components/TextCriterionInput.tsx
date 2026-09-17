import { TextInput } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { ScalarValue, TextInput as TextInputConfig } from '../models';

interface Props {
  input: TextInputConfig;
  value: ScalarValue | null;
  onChange: (value: ScalarValue | null) => void;
  validationError: string | null;
}

const TextCriterionInput = ({
  input,
  value,
  onChange,
  validationError,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div id="text-criterion-input" data-testid="text-criterion-input-test-id">
      <TextInput
        id={`text-input-${input.placeholderTranslationKey}`}
        data-testid={`text-input-${input.placeholderTranslationKey}-test-id`}
        labelText={t('COMMON_SEARCH_CRITERION_LABEL')}
        placeholder={t(input.placeholderTranslationKey)}
        value={value?.value ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value;
          onChange(raw ? { value: raw } : null);
        }}
        invalid={!!validationError}
        invalidText={validationError ?? undefined}
      />
    </div>
  );
};

export default TextCriterionInput;

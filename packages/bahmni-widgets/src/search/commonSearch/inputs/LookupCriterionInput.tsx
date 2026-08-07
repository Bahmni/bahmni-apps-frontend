import { ComboBox } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  LookupInput as LookupInputConfig,
  LookupOption,
  ScalarValue,
} from '../models';
import { LOOKUP_SOURCES } from '../sourceMaps';
import { getLookupComboBoxItems } from '../utils';

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
  const [inputValue, setInputValue] = useState<string | null>(null);
  const loader = LOOKUP_SOURCES[input.lookup.source];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lookup', input.lookup.source],
    queryFn: loader!,
    enabled: !!loader,
    staleTime: 30 * 60 * 1000,
  });

  const options = data ?? [];

  const items = useMemo(() => {
    if (!loader) {
      return [
        {
          uuid: '',
          label: t('COMMON_SEARCH_LOOKUP_UNSUPPORTED_SOURCE'),
          disabled: true,
        },
      ];
    }
    return getLookupComboBoxItems(inputValue, options, isLoading, isError, {
      loading: t('COMMON_SEARCH_LOOKUP_LOADING'),
      error: t('COMMON_SEARCH_LOOKUP_ERROR'),
      empty: t('COMMON_SEARCH_LOOKUP_EMPTY'),
    });
  }, [loader, inputValue, options, isLoading, isError]);

  const selectedItem =
    options.find((option) => option.uuid === value?.value) ?? null;

  return (
    <div
      id="lookup-criterion-input"
      data-testid="lookup-criterion-input-test-id"
    >
      <ComboBox
        id={`lookup-input-${input.placeholderTranslationKey}`}
        data-testid={`lookup-input-${input.placeholderTranslationKey}-test-id`}
        titleText={t('COMMON_SEARCH_CRITERION_LABEL')}
        placeholder={t(input.placeholderTranslationKey)}
        items={items}
        selectedItem={selectedItem}
        itemToString={(item: LookupOption | null) => item?.label ?? ''}
        onChange={({ selectedItem }: { selectedItem: LookupOption | null }) =>
          onChange(
            selectedItem?.uuid
              ? { value: selectedItem.uuid, label: selectedItem.label }
              : null,
          )
        }
        onInputChange={(value: string) => setInputValue(value)}
        invalid={!!validationError}
        invalidText={validationError ?? undefined}
      />
    </div>
  );
};

export default LookupCriterionInput;

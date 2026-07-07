export type Comparator = 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le';

export interface FieldConfig {
  key: string;
  keyType?: string;
}

export interface OptionItem {
  translationKey: string;
  value: string;
}

export interface LookupConfig {
  source: string;
  prefetch?: boolean;
  valueSet?: string;
}

export interface BoundValue {
  value: string | null;
  comparator: Comparator | null;
}

export interface ScalarValue {
  value: string;
}

export interface RangeValue {
  from: BoundValue;
  to?: BoundValue;
}

export type CriterionValue = ScalarValue | RangeValue;

export interface TextInput {
  kind: 'text';
  placeholderTranslationKey: string;
}

export interface NumericInput {
  kind: 'numeric';
  placeholderTranslationKey: string;
  rangeAllowed?: boolean;
}

export interface DateInput {
  kind: 'date';
  placeholderTranslationKey: string;
  rangeAllowed?: boolean;
}

export interface OptionsInput {
  kind: 'options';
  placeholderTranslationKey: string;
  options: OptionItem[];
}

export interface LookupInput {
  kind: 'lookup';
  placeholderTranslationKey: string;
  lookup: LookupConfig;
}

export type InputConfig =
  | TextInput
  | NumericInput
  | DateInput
  | OptionsInput
  | LookupInput;

export interface CriterionConfig {
  field: FieldConfig;
  translationKey: string;
  default?: boolean;
  input: InputConfig;
}

export interface SearchContextConfig {
  context: 'patient' | 'appointment' | 'episodeOfCare';
  translationKey: string;
  requiredPrivileges: string[];
  locationAware: 'loggedInLocation' | 'allowedLocation';
  url: string;
  pageSize: number;
  criteria: CriterionConfig[];
}

export type CommonSearchWidgetConfig = [
  SearchContextConfig,
  ...SearchContextConfig[],
];

export interface CriterionRow {
  rowId: string;
  criterionKey: string | null;
  value: CriterionValue | null;
  validationError: string | null;
}

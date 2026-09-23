/** Default number of most-recent visits shown when config.maximumNoOfVisits is unset (AC 7). */
export const DEFAULT_MAXIMUM_NO_OF_VISITS = 4;

/** Default visit-type display names treated as IPD when config.ipdVisitTypes is unset. */
export const DEFAULT_IPD_VISIT_TYPES = ['IPD'];

/**
 * Translation key for each configurable column. A field name absent from this
 * map is passed to `t()` as-is, so a typo in config surfaces as a column
 * headed by the raw key rather than being silently dropped.
 */
export const VISIT_FIELD_TRANSLATION_MAP: Record<string, string> = {
  visitDate: 'VISIT_DATE',
  visitType: 'VISIT_TYPE',
  status: 'VISIT_STATUS',
  location: 'VISIT_LOCATION',
};

/**
 * Columns shown when `config.fields` is unset — matches the design. `location`
 * is deliberately excluded so it stays opt-in.
 */
export const DEFAULT_VISIT_FIELDS = ['visitDate', 'visitType', 'status'];

/**
 * Parse age in years from a formatted age string
 * @param ageString - Age string like "25 years" or "5 years"
 * @returns The numeric age in years, or 0 if parsing fails
 */
export const parseAgeYears = (ageString: string | undefined): number => {
  const match = ageString?.match(/^(\d+)\s*years?/);
  return parseInt(match?.[1] ?? '0', 10);
};

const DEFAULT_LMP_ELIGIBILITY_MIN_AGE = 10;

interface LmpEligibilityOptions {
  gender?: string;
  age?: string;
  tabLabel?: string;
  eligibleTabLabels?: string[];
}

export const isEligibleForLmp = ({
  gender,
  age,
  tabLabel,
  eligibleTabLabels,
}: LmpEligibilityOptions): boolean => {
  const matchesTab =
    !eligibleTabLabels?.length ||
    (tabLabel ? eligibleTabLabels.includes(tabLabel) : false);

  return (
    gender === 'F' &&
    parseAgeYears(age) >= DEFAULT_LMP_ELIGIBILITY_MIN_AGE &&
    matchesTab
  );
};

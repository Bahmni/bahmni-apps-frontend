import { useTranslation } from '@bahmni/services';

interface UseActionAreaExpandPropsOptions {
  /** Whether the consultation pad's ActionArea is currently expanded. */
  isExpanded?: boolean;
  /** Callback to toggle the expanded state. */
  onToggleExpand?: () => void;
  /**
   * Set when this `ActionArea` instance is hidden/inactive (e.g. the pad-level
   * ActionArea while a form is open). Returns an empty object so the instance
   * renders no expand/collapse toggle, avoiding duplicate
   * `data-testid="action-area-expand-toggle"` elements in the DOM.
   */
  disabled?: boolean;
}

interface ActionAreaExpandProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandAriaLabel?: string;
  collapseAriaLabel?: string;
}

/**
 * Builds the expand/collapse prop block shared by every `ActionArea` instance
 * that participates in the consultation pad's expand/collapse toggle
 * (ConsultationPadContainer, ConsultationPad, ObservationFormsContainer).
 * Centralising it here avoids the 4-prop block drifting out of sync as it's
 * spread across call sites.
 */
export const useActionAreaExpandProps = ({
  isExpanded,
  onToggleExpand,
  disabled = false,
}: UseActionAreaExpandPropsOptions): ActionAreaExpandProps => {
  const { t } = useTranslation();

  if (disabled) return {};

  return {
    isExpanded,
    onToggleExpand,
    expandAriaLabel: t('CONSULTATION_PAD_EXPAND_ARIA_LABEL'),
    collapseAriaLabel: t('CONSULTATION_PAD_COLLAPSE_ARIA_LABEL'),
  };
};

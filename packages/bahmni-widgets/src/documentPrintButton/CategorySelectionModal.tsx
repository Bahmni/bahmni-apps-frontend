import { ClickableTile, InlineLoading, Modal } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useEffect, useState } from 'react';
import type { CategoryPicker } from './categoryPickers/types';
import styles from './styles/CategorySelectionModal.module.scss';

export interface CategorySelectionModalProps<TItem> {
  open: boolean;
  picker: CategoryPicker<TItem>;
  context: Record<string, string>;
  onSelect: (item: TItem) => void;
  onCancel: () => void;
}

// One generic modal serves every category — only CategoryPicker implementations
// grow over time (e.g. a future VISIT_SUMMARY picker reuses this unchanged).
export function CategorySelectionModal<TItem>({
  open,
  picker,
  context,
  onSelect,
  onCancel,
}: CategorySelectionModalProps<TItem>) {
  const { t } = useTranslation();
  const [items, setItems] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    picker
      .fetchItems(context)
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Fetch only when the modal opens — `picker`/`context` are stable for the
    // lifetime of a single open modal; re-running on every parent re-render
    // (context is a freshly-built object each time) would refetch needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onRequestClose={onCancel}
      modalHeading={t(picker.heading)}
      passiveModal
      className={styles.modal}
      testId="category-selection-modal"
    >
      {loading && (
        <InlineLoading description={t('PRINT_MODAL_LOADING_ENCOUNTERS')} />
      )}
      {!loading && error && (
        <div className={styles.stateMessage}>
          {t('PRINT_MODAL_FETCH_ENCOUNTERS_ERROR')}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className={styles.stateMessage}>{t(picker.emptyStateMessage)}</div>
      )}
      {!loading && !error && items.length > 0 && (
        <div className={styles.itemList}>
          {items.map((item) => {
            const { primary, secondary } = picker.renderItem(item, t);
            const key = picker.getItemKey(item);
            return (
              <ClickableTile
                key={key}
                className={styles.item}
                onClick={() => onSelect(item)}
                testId={`category-selection-item-${key}`}
              >
                <div className={styles.itemPrimary}>{primary}</div>
                {secondary && (
                  <div className={styles.itemSecondary}>{secondary}</div>
                )}
              </ClickableTile>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

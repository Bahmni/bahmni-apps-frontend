import { ClickableTile, InlineLoading, Modal } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import type React from 'react';
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
            const accessibleName = [primary, secondary]
              .filter(Boolean)
              .join(', ');
            return (
              <ClickableTile
                key={key}
                className={styles.item}
                onClick={() => onSelect(item)}
                onKeyDown={(event: React.KeyboardEvent) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    if (event.key === ' ') event.preventDefault();
                    onSelect(item);
                  }
                }}
                role="button"
                aria-label={accessibleName}
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

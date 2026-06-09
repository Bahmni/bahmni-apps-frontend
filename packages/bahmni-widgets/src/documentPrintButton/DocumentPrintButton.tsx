import { Button, Dropdown } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { InlineLoading } from '@carbon/react';
import styles from './DocumentPrintButton.module.scss';
import { usePrintDocument } from './usePrintDocument';

export interface PrintOption {
  translationKey: string;
  templateId: string;
  // TODO: shortcutKey is reserved for keyboard shortcut support — not yet implemented
  shortcutKey?: string;
  privileges?: string[];
}

interface DocumentPrintButtonProps {
  printOptions?: PrintOption[];
  renderContext: Record<string, string>;
  renderData?: Record<string, unknown>;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  'data-testid'?: string;
}

export const DocumentPrintButton = ({
  printOptions,
  renderContext,
  renderData,
  size,
  disabled,
  'data-testid': dataTestId,
}: DocumentPrintButtonProps) => {
  const { t } = useTranslation();

  const items = printOptions ?? [];

  const { triggerPrint, isPrinting } = usePrintDocument({
    context: renderContext,
    data: renderData,
  });

  if (items.length === 0) return null;

  if (isPrinting) {
    return <InlineLoading description={t('PRINT_MODAL_PREPARING_DOCUMENT')} />;
  }

  const handlePrint = (option: PrintOption) => {
    triggerPrint(option.templateId);
  };

  return items.length === 1 ? (
    <div className={styles.printButtonBorder}>
      <Button
        kind="ghost"
        size={size}
        disabled={disabled}
        data-testid={dataTestId}
        onClick={() => handlePrint(items[0])}
      >
        {t(items[0].translationKey)}
      </Button>
    </div>
  ) : (
    <div className={styles.printButtonGroup}>
      <Button
        kind="tertiary"
        size={size}
        disabled={disabled}
        className={styles.printButton}
        data-testid={dataTestId}
        onClick={() => handlePrint(items[0])}
      >
        {t(items[0].translationKey)}
      </Button>
      <Dropdown
        id={`print-dropdown-${dataTestId ?? 'default'}`}
        className={styles.printDropdown}
        disabled={disabled}
        items={items.slice(1)}
        itemToString={(item) => (item ? t(item.translationKey) : '')}
        onChange={({ selectedItem }) => {
          if (selectedItem) handlePrint(selectedItem);
        }}
        label=""
        type="inline"
        size={size ?? 'lg'}
        titleText={t('PRINT_MORE_OPTIONS')}
        selectedItem={null}
      />
    </div>
  );
};

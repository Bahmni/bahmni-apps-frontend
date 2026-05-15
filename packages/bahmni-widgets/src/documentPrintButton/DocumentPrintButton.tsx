import { Button, Dropdown } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { InlineLoading } from '@carbon/react';
import { useState } from 'react';
import styles from './DocumentPrintButton.module.scss';
import { usePrintDocument } from './usePrintDocument';

export interface PrintOption {
  translationKey: string;
  templateId: string;
  shortcutKey?: string;
}

interface DocumentPrintButtonProps {
  printOptions?: PrintOption[];
  renderContext: Record<string, string>;
  renderData?: Record<string, unknown>;
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

export const DocumentPrintButton = ({
  printOptions,
  renderContext,
  renderData,
  size,
  'data-testid': dataTestId,
}: DocumentPrintButtonProps) => {
  const { t } = useTranslation();
  const [activeOption, setActiveOption] = useState<PrintOption | null>(null);

  const items = printOptions ?? [];
  const resolvedOption = activeOption ?? items[0] ?? null;

  const { triggerPrint, isPrinting } = usePrintDocument({
    templateId: resolvedOption?.templateId ?? '',
    context: renderContext,
    data: renderData,
  });

  if (items.length === 0) return null;

  if (isPrinting) {
    return <InlineLoading description={t('PRINT_MODAL_PREPARING_DOCUMENT')} />;
  }

  const handlePrint = (option: PrintOption) => {
    setActiveOption(option);
    triggerPrint();
  };

  return items.length === 1 ? (
    <div className={styles.printButtonBorder}>
      <Button
        kind="ghost"
        size={size}
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
        className={styles.printButton}
        data-testid={dataTestId}
        onClick={() => handlePrint(items[0])}
      >
        {t(items[0].translationKey)}
      </Button>
      <Dropdown
        id={`print-dropdown-${dataTestId ?? 'default'}`}
        className={styles.printDropdown}
        items={items.slice(1)}
        itemToString={(item) => (item ? t(item.translationKey) : '')}
        onChange={({ selectedItem }) => {
          if (selectedItem) handlePrint(selectedItem);
        }}
        label=""
        type="inline"
        size={size ?? 'lg'}
        titleText=""
        selectedItem={null}
      />
    </div>
  );
};

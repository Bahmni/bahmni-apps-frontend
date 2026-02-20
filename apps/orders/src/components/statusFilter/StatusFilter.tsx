import { useTranslation } from '@bahmni/services';
import { Checkbox } from '@carbon/react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../../../packages/bahmni-design-system/src/atoms/button';
import { OrderStatusConfig } from '../../models/orderFulfillment';
import styles from './styles/StatusFilter.module.scss';

interface StatusFilterProps {
  availableStatuses: OrderStatusConfig[];
  selectedStatuses: OrderStatusConfig[];
  onApply: (selectedStatuses: OrderStatusConfig[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  availableStatuses,
  selectedStatuses,
  onApply,
  isOpen,
  onToggle,
  anchorRef,
}) => {
  const { t } = useTranslation();
  const [tempSelection, setTempSelection] =
    useState<OrderStatusConfig[]>(selectedStatuses);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempSelection(selectedStatuses);
  }, [selectedStatuses]);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const thElement = anchorRef.current.closest('th');
      const trElement = thElement?.closest('tr');

      if (trElement) {
        const trRect = trElement.getBoundingClientRect();
        const anchorRect = anchorRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: trRect.bottom + window.scrollY,
          left: anchorRect.left + window.scrollX,
        });
      } else {
        const rect = anchorRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle, anchorRef]);

  const handleCheckboxChange = (
    statusConfig: OrderStatusConfig,
    checked: boolean,
  ) => {
    if (checked) {
      setTempSelection([...tempSelection, statusConfig]);
    } else {
      setTempSelection(
        tempSelection.filter((s) => s.value !== statusConfig.value),
      );
    }
  };

  const handleApply = () => {
    onApply(tempSelection);
    onToggle();
  };

  if (!isOpen) return null;

  const dropdown = (
    <div
      ref={dropdownRef}
      className={styles.filterDropdown}
      // eslint-disable-next-line react/forbid-dom-props -- Dynamic positioning requires inline styles
      style={
        {
          '--dropdown-top': `${dropdownPosition.top}px`,
          '--dropdown-left': `${dropdownPosition.left}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.filterContent}>
        <div className={styles.checkboxList}>
          {availableStatuses.map((statusConfig) => (
            <Checkbox
              key={statusConfig.value}
              id={`status-${statusConfig.value}`}
              labelText={t(statusConfig.translationKey)}
              checked={tempSelection.some(
                (s) => s.value === statusConfig.value,
              )}
              onChange={(_, { checked }) =>
                handleCheckboxChange(statusConfig, checked)
              }
            />
          ))}
        </div>
        <Button
          kind="secondary"
          onClick={handleApply}
          className={styles.applyButton}
        >
          <span>{t('APPLY')}</span>
        </Button>
      </div>
    </div>
  );

  return createPortal(dropdown, document.body);
};

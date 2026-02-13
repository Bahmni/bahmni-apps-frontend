import { Checkbox } from '@carbon/react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage } from 'react-intl';
import { Button } from '../../../../../packages/bahmni-design-system/src/atoms/button';
import { OrderStatus } from '../../models/orderFulfillment';
import styles from './styles/StatusFilter.module.scss';

interface StatusFilterProps {
  availableStatuses: OrderStatus[];
  selectedStatuses: OrderStatus[];
  onApply: (selectedStatuses: OrderStatus[]) => void;
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
  const [tempSelection, setTempSelection] =
    useState<OrderStatus[]>(selectedStatuses);
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

  const handleCheckboxChange = (status: OrderStatus, checked: boolean) => {
    if (checked) {
      setTempSelection([...tempSelection, status]);
    } else {
      setTempSelection(tempSelection.filter((s) => s !== status));
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
          {availableStatuses.map((status) => (
            <Checkbox
              key={status}
              id={`status-${status}`}
              labelText={status}
              checked={tempSelection.includes(status)}
              onChange={(_, { checked }) =>
                handleCheckboxChange(status, checked)
              }
            />
          ))}
        </div>
        <Button
          kind="secondary"
          onClick={handleApply}
          className={styles.applyButton}
        >
          <span>
            <FormattedMessage id={'APPLY'} defaultMessage={'Apply'} />
          </span>
        </Button>
      </div>
    </div>
  );

  return createPortal(dropdown, document.body);
};

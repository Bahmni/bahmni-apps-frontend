import { SaveAndCancelButtons } from '@bahmni/design-system';
import { useTranslation, Provider } from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { ComboBox, TextArea } from '@carbon/react';
import React, { useEffect, useState } from 'react';
import { useOrdersConfig } from '../../hooks/useOrdersConfig';
import {
  Order,
  OrderStatus,
  OrderStatusConfig,
} from '../../models/orderFulfillment';
import useOrdersStore from '../../stores/ordersStore';
import styles from './styles/OrderFulfillmentSlider.module.scss';

interface OrderFulfillmentSliderProps {
  order: Order | null;
  onClose: () => void;
  isOpen: boolean;
  tabLabel?: string;
}

export const OrderFulfillmentSlider: React.FC<OrderFulfillmentSliderProps> = ({
  order,
  onClose,
  isOpen,
  tabLabel = '',
}) => {
  const { t } = useTranslation();
  const { ordersTableConfig } = useOrdersConfig();
  const { fetchProviders, providers } = useOrdersStore();
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [owner, setOwner] = useState('');
  const [currentProviders, setCurrentProviders] = useState<Provider[]>([]);

  const availableStatuses: OrderStatusConfig[] =
    (ordersTableConfig?.orderStatusesAvailable as OrderStatusConfig[]) ?? [];

  const patientDetailFields =
    ordersTableConfig?.manageOrdersPanelPatientDetails ?? [];

  useEffect(() => {
    if (isOpen && tabLabel) {
      fetchProviders(tabLabel);
    } else if (!isOpen) {
      setNotes('');
      setStatus('');
      setOwner('');
    }
  }, [isOpen, tabLabel, fetchProviders]);

  useEffect(() => {
    if (tabLabel && providers[tabLabel] && providers[tabLabel].length > 0) {
      setCurrentProviders(providers[tabLabel]);
    }
  }, [tabLabel, providers]);

  const getNestedValue = (obj: Order, key: string): string => {
    const keys = key.split('.');
    let value: unknown = obj;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return '';
      }
    }
    return value !== undefined && value !== null ? String(value) : '';
  };

  const hasChanges = Boolean(owner || status || notes.trim());

  if (!isOpen || !order) {
    return null;
  }

  return (
    <div
      className={styles.orderFulfillmentSlider}
      data-testid="order-fulfillment-slider"
    >
      <div className={styles.sliderHeader}>
        <div className={styles.headerTop}>
          <div className={styles.sliderTitle}>{t('MANAGE_ORDER')}</div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close sidebar"
            type="button"
          >
            <Close size={20} />
          </button>
        </div>
        <div className={styles.sliderTitle}>{order.orderName}</div>
      </div>
      <div className={styles.sliderContent}>
        {order.providerComments && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('PROVIDER_COMMENTS')}</h3>
            <p className={styles.commentsText}>{order.providerComments}</p>
          </section>
        )}

        {patientDetailFields.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('PATIENT_DETAILS')}</h3>
            <div className={styles.patientDetailsGrid}>
              {patientDetailFields.map((field) => {
                const value = getNestedValue(order, field.key);
                return (
                  <div key={field.key} className={styles.patientDetailItem}>
                    <span className={styles.label}>
                      {t(field.translationKey) || field.label}
                    </span>
                    <span className={styles.value}>{value || '-'}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className={styles.separator} />

        <section className={styles.formSection}>
          <div className={styles.formField}>
            <ComboBox
              id="order-owner-select"
              data-testid="order-owner-select"
              titleText={t('ORDER_OWNER')}
              placeholder={t('CHOOSE_AN_OPTION')}
              items={currentProviders}
              itemToString={(item) => (item ? item.name : '')}
              shouldFilterItem={({ item, inputValue }) => {
                if (!inputValue) return true;
                return item.name
                  .toLowerCase()
                  .includes(inputValue.toLowerCase());
              }}
              selectedItem={
                currentProviders.find((p) => p.id === owner) ?? null
              }
              onChange={({ selectedItem }) =>
                setOwner(selectedItem ? selectedItem.id : '')
              }
            />
          </div>

          <div className={styles.formField}>
            <ComboBox
              id="order-status-select"
              data-testid="order-status-select"
              titleText={t('STATUS')}
              placeholder={t('CHOOSE_AN_OPTION')}
              items={availableStatuses}
              itemToString={(item) => (item ? t(item.translationKey) : '')}
              selectedItem={
                availableStatuses.find((s) => s.value === status) ?? null
              }
              onChange={({ selectedItem }) =>
                setStatus(selectedItem ? selectedItem.value : '')
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                const allowedKeys = [
                  'ArrowDown',
                  'ArrowUp',
                  'Enter',
                  'Escape',
                  'Tab',
                ];
                if (!allowedKeys.includes(e.key) && e.key.length === 1) {
                  e.preventDefault();
                }
              }}
              className={styles.statusComboBox}
            />
          </div>

          <TextArea
            id="order-notes"
            data-testid="order-notes"
            labelText=""
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('NOTES')}
            className={styles.notesField}
          />
        </section>
      </div>

      <SaveAndCancelButtons
        onSave={() => {}}
        onClose={onClose}
        isSaveDisabled={!hasChanges}
        primaryButtonText={t('SAVE')}
        cancelButtonText={t('CANCEL')}
      />
    </div>
  );
};

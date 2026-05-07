import {
  useTranslation,
  getUserLoginLocation,
  formatDateTime,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { InputControlAttributes } from '../../../../../providers/clinicalConfig/models';
import { getAvailableStocks } from '../../../../../services/inventoryService';

interface UseBatchNumberLogicProps {
  attributes: InputControlAttributes[] | undefined;
  drugCode: string | undefined;
  isFetchBatchNumberEnabled?: boolean;
}

export const useBatchNumberLogic = ({
  drugCode,
  isFetchBatchNumberEnabled = false,
}: UseBatchNumberLogicProps) => {
  const { t } = useTranslation();
  const [batchSearchTerm, setBatchSearchTerm] = useState('');

  const productUuid = drugCode ?? '';
  const locationUuid = getUserLoginLocation()?.uuid ?? '';

  const { data: availableStocks = [], isLoading: stocksLoading } = useQuery({
    queryKey: ['availableStocks', productUuid, locationUuid],
    queryFn: () => getAvailableStocks(productUuid, locationUuid),
    enabled: isFetchBatchNumberEnabled && !!productUuid && !!locationUuid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const batchComboBoxItems = useMemo(() => {
    const validStocks = availableStocks.filter((stock) => stock.batchNumber);

    const filtered = batchSearchTerm.trim()
      ? validStocks.filter((stock) =>
          stock.batchNumber
            .toLowerCase()
            .includes(batchSearchTerm.toLowerCase()),
        )
      : validStocks;

    return filtered.map((stock) => {
      const formattedDate = formatDateTime(
        stock.expiryDate,
        t,
        false,
        'dd-MMM-yyyy',
      );

      return {
        code: stock.batchNumber,
        display: `${stock.batchNumber} [${formattedDate.formattedResult}] - ${stock.stockLocationName}`,
        expiryDate: stock.expiryDate,
        disabled: false,
      };
    });
  }, [availableStocks, batchSearchTerm, t]);

  return {
    batchComboBoxItems,
    batchSearchTerm,
    setBatchSearchTerm,
    stocksLoading,
    isFetchBatchNumberEnabled,
    productUuid,
  };
};

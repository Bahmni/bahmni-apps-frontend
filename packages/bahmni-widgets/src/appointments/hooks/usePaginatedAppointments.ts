import { type AppointmentPage, useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useNotification } from '../../notification';
import { FormattedAppointment } from '../utils';
import { useFormattedAppointments } from './useFormattedAppointments';

interface UsePaginatedAppointmentsOptions {
  queryKeyPrefix: string;
  patientUUID: string;
  pageSize: number;
  idPrefix: string;
  queryFn: (count: number, page: number) => Promise<AppointmentPage>;
}

interface UsePaginatedAppointmentsResult {
  formattedAppointments: FormattedAppointment[];
  isLoading: boolean;
  currentPage: number;
  selectedPageSize: number;
  serverTotal: number | undefined;
  handlePageChange: (page: number, pageSize: number) => void;
}

export const usePaginatedAppointments = ({
  queryKeyPrefix,
  patientUUID,
  pageSize,
  idPrefix,
  queryFn,
}: UsePaginatedAppointmentsOptions): UsePaginatedAppointmentsResult => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize);
  const [serverTotal, setServerTotal] = useState<number | undefined>(undefined);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [queryKeyPrefix, patientUUID, currentPage, selectedPageSize],
    enabled: !!patientUUID,
    queryFn: () => queryFn(selectedPageSize, currentPage),
  });

  const formattedAppointments = useFormattedAppointments({
    data: data?.bundle,
    idPrefix,
  });

  useEffect(() => {
    if (isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error?.message || t('APPOINTMENTS_ERROR_FETCHING'),
        type: 'error',
      });
    }
  }, [isError, error, addNotification, t]);

  useEffect(() => {
    if (data) {
      setServerTotal(data.total);
    }
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
    setServerTotal(undefined);
  }, [patientUUID]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== selectedPageSize) {
        setSelectedPageSize(newPageSize);
        setCurrentPage(1);
        setServerTotal(undefined);
      } else {
        setCurrentPage(newPage);
      }
    },
    [selectedPageSize],
  );

  return {
    formattedAppointments,
    isLoading,
    currentPage,
    selectedPageSize,
    serverTotal,
    handlePageChange,
  };
};

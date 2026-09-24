import {
  AuditLogListEntry,
  AuditLogQueryParams,
  fetchAuditLogs,
  getTodayDate,
  parseAuditLogEntry,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

export interface AuditLogFilters {
  startDate: Date | null;
  startTime: string;
  username: string;
  patientId: string;
}

type AuditLogAction = 'init' | 'next' | 'prev' | 'runReport';

interface AuditLogRequest {
  action: AuditLogAction;
  params: AuditLogQueryParams;
  // Only the initial/default view (init, or prev when already at the initial
  // default view) reverses the returned rows, mirroring the legacy
  // `defaultView()` helper in auditLogController.js.
  reverseRows: boolean;
  // runReport always replaces the table (even with an empty result); every
  // other action keeps the previously shown rows when the result is empty.
  alwaysReplace: boolean;
  // Fallback first/last index to fall back to when the result is empty.
  defaultFirstIndex: number;
  defaultLastIndex: number;
  emptyMessageKey: string;
  requestId: number;
}

export const NO_EVENTS_FOUND = 'NO_EVENTS_FOUND';
export const NO_MORE_EVENTS_FOUND = 'NO_MORE_EVENTS_FOUND';
export const MATCHING_EVENTS_NOT_FOUND = 'MATCHING_EVENTS_NOT_FOUND';

/**
 * Combines a date and an (optional) `HH:mm` time into a single ISO
 * `startFrom` value, mirroring the legacy screen's two separate
 * date/time inputs feeding a single `startDate` scope value.
 */
export const combineDateAndTime = (
  date: Date | null,
  time: string,
): string | undefined => {
  if (!date) return undefined;
  const combined = new Date(date);
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      combined.setHours(hours, minutes, 0, 0);
    }
  }
  if (Number.isNaN(combined.getTime())) {
    return undefined;
  }
  return combined.toISOString();
};

const AUDIT_LOG_PAGE_SIZE = 50;

export const useAuditLogs = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    startDate: getTodayDate(),
    startTime: '',
    username: '',
    patientId: '',
  });

  const [firstIndex, setFirstIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(0);
  const [logs, setLogs] = useState<AuditLogListEntry[]>([]);
  const [emptyMessageKey, setEmptyMessageKey] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const requestIdRef = useRef(0);
  const [request, setRequest] = useState<AuditLogRequest | null>(null);
  const processedRequestId = useRef<number | null>(null);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['auditLogs', request?.requestId],
    queryFn: () => fetchAuditLogs(request!.params),
    enabled: !!request,
  });

  const dispatchRequest = (
    action: AuditLogAction,
    params: AuditLogQueryParams,
    reverseRows: boolean,
    alwaysReplace: boolean,
    defaultFirstIndex: number,
    defaultLastIndex: number,
    emptyKey: string,
  ) => {
    requestIdRef.current += 1;
    setRequest({
      action,
      params,
      reverseRows,
      alwaysReplace,
      defaultFirstIndex,
      defaultLastIndex,
      emptyMessageKey: emptyKey,
      requestId: requestIdRef.current,
    });
  };

  const startFrom = combineDateAndTime(filters.startDate, filters.startTime);

  const init = () => {
    dispatchRequest(
      'init',
      { startFrom, defaultView: true },
      true,
      false,
      0,
      0,
      NO_EVENTS_FOUND,
    );
  };

  const next = () => {
    dispatchRequest(
      'next',
      {
        lastAuditLogId: lastIndex,
        username: filters.username,
        patientId: filters.patientId,
        startFrom,
      },
      false,
      false,
      firstIndex,
      lastIndex,
      NO_MORE_EVENTS_FOUND,
    );
  };

  const prev = () => {
    if (!firstIndex && !lastIndex) {
      dispatchRequest(
        'prev',
        { defaultView: true, startFrom },
        true,
        false,
        0,
        0,
        NO_MORE_EVENTS_FOUND,
      );
      return;
    }
    dispatchRequest(
      'prev',
      {
        lastAuditLogId: firstIndex,
        username: filters.username,
        patientId: filters.patientId,
        prev: true,
        startFrom,
      },
      false,
      false,
      firstIndex,
      lastIndex,
      NO_MORE_EVENTS_FOUND,
    );
  };

  const runReport = () => {
    dispatchRequest(
      'runReport',
      {
        username: filters.username,
        patientId: filters.patientId,
        startFrom,
      },
      false,
      true,
      0,
      0,
      MATCHING_EVENTS_NOT_FOUND,
    );
  };

  // Clears all filter fields and fetches audit log with default view (no filters).
  const reset = () => {
    setFilters({
      startDate: null,
      startTime: '',
      username: '',
      patientId: '',
    });
    dispatchRequest(
      'init',
      { defaultView: true },
      true,
      false,
      0,
      0,
      NO_EVENTS_FOUND,
    );
  };

  useEffect(() => {
    // Kick off the initial default view once, on mount.
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!request || data === undefined) return;
    if (processedRequestId.current === request.requestId) return;
    processedRequestId.current = request.requestId;

    const rawLogs = request.reverseRows ? [...data].reverse() : data;
    const parsedLogs = rawLogs.map(parseAuditLogEntry);

    if (parsedLogs.length) {
      setLogs(parsedLogs);
      setEmptyMessageKey(null);
      const newFirstIndex = parsedLogs[0].auditLogId;
      const newLastIndex = parsedLogs[parsedLogs.length - 1].auditLogId;
      setFirstIndex(newFirstIndex);
      setLastIndex(newLastIndex);

      // If we got a full page of results, there might be more pages
      setHasNext(parsedLogs.length === AUDIT_LOG_PAGE_SIZE);
      // If we're not at the initial state (indices are 0), we can go back
      setHasPrevious(request.action !== 'init');
    } else {
      if (request.alwaysReplace) {
        setLogs([]);
      }
      setEmptyMessageKey(request.emptyMessageKey);
      setFirstIndex(request.defaultFirstIndex);
      setLastIndex(request.defaultLastIndex);
      setHasNext(false);
      setHasPrevious(request.action !== 'init');
    }
  }, [data, request]);

  return {
    filters,
    setFilters,
    logs,
    isLoading: isLoading || isFetching,
    isFetching,
    isError,
    emptyMessageKey,
    firstIndex,
    lastIndex,
    hasNext,
    hasPrevious,
    next,
    prev,
    runReport,
    reset,
  };
};

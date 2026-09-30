import {
  AuditLogListEntry,
  AuditLogQueryParams,
  fetchAuditLogs,
  getTodayDate,
  parseAuditLogEntry,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { combineDateAndTime } from './utils';

export interface AuditLogFilters {
  startDate: Date | null;
  startTime: string;
  username: string;
  patientId: string;
}

type AuditLogAction = 'init' | 'next' | 'prev' | 'runReport';

// The list is shown newest-first. The backend's default view returns the
// newest page (already newest-first); cursor requests return ascending rows,
// which are reversed for display. "Next" therefore means older events and
// "Previous" means newer events.
interface AuditLogRequest {
  action: AuditLogAction;
  params: AuditLogQueryParams;
  // init, runReport and reset always replace the table (even with an empty
  // result); next/prev keep the previously shown rows when the result is empty.
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

const AUDIT_LOG_PAGE_SIZE = 50;

export const useAuditLogs = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    startDate: getTodayDate(),
    startTime: '00:00',
    username: '',
    patientId: '',
  });

  const [firstIndex, setFirstIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(0);
  const [logs, setLogs] = useState<AuditLogListEntry[]>([]);
  const [emptyMessageKey, setEmptyMessageKey] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPageNumber, setPageNumberState] = useState(1);
  // Mirrors currentPageNumber so the result-processing effect can read the
  // latest page without re-running whenever the page changes.
  const pageNumberRef = useRef(1);
  const setCurrentPageNumber = (page: number) => {
    pageNumberRef.current = page;
    setPageNumberState(page);
  };

  const requestIdRef = useRef(0);
  const [request, setRequest] = useState<AuditLogRequest | null>(null);
  const processedRequestId = useRef<number | null>(null);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['auditLogs', request?.requestId],
    queryFn: () => fetchAuditLogs(request!.params),
    enabled: !!request,
    // requestId is unique per dispatch, so a cached entry can never be reused
    // (and audit logs must always be fetched fresh). Drop entries as soon as
    // they become inactive instead of retaining them for the default gcTime.
    gcTime: 0,
  });

  const dispatchRequest = (
    action: AuditLogAction,
    params: AuditLogQueryParams,
    alwaysReplace: boolean,
    defaultFirstIndex: number,
    defaultLastIndex: number,
    emptyKey: string,
  ) => {
    requestIdRef.current += 1;
    setRequest({
      action,
      params,
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
      0,
      0,
      NO_EVENTS_FOUND,
    );
  };

  // firstIndex is the newest row on screen and lastIndex the oldest, so
  // "next" (older) pages from lastIndex and "prev" (newer) from firstIndex.
  const hasCursor = () => !!firstIndex || !!lastIndex;

  const next = () => {
    if (isFetching) return;
    if (!hasCursor()) {
      runReport();
      return;
    }
    dispatchRequest(
      'next',
      {
        lastAuditLogId: lastIndex,
        prev: true,
        username: filters.username,
        patientId: filters.patientId,
        startFrom,
      },
      false,
      firstIndex,
      lastIndex,
      NO_MORE_EVENTS_FOUND,
    );
  };

  const prev = () => {
    if (isFetching) return;
    if (!hasCursor()) {
      runReport();
      return;
    }
    dispatchRequest(
      'prev',
      {
        lastAuditLogId: firstIndex,
        username: filters.username,
        patientId: filters.patientId,
        startFrom,
      },
      false,
      firstIndex,
      lastIndex,
      NO_MORE_EVENTS_FOUND,
    );
  };

  const runReport = () => {
    if (isFetching) return;
    dispatchRequest(
      'runReport',
      {
        defaultView: true,
        username: filters.username,
        patientId: filters.patientId,
        startFrom,
      },
      true,
      0,
      0,
      MATCHING_EVENTS_NOT_FOUND,
    );
  };

  // Clears all filter fields and fetches audit log with default view (no filters).
  const reset = () => {
    if (isFetching) return;
    setFilters({
      startDate: null,
      startTime: '',
      username: '',
      patientId: '',
    });
    dispatchRequest('init', { defaultView: true }, true, 0, 0, NO_EVENTS_FOUND);
  };

  useEffect(() => {
    // Kick off the initial default view once, on mount.
    init();
    // `init` is intentionally omitted from the deps: it is recreated on every
    // render, so including it would refetch continuously instead of only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!request || data === undefined) return;
    if (processedRequestId.current === request.requestId) return;
    processedRequestId.current = request.requestId;

    const isDefaultView = !!request.params.defaultView;
    const rawLogs = isDefaultView ? data : [...data].reverse();
    const parsedLogs = rawLogs.map(parseAuditLogEntry);
    const isFullPage = parsedLogs.length === AUDIT_LOG_PAGE_SIZE;

    if (parsedLogs.length) {
      setLogs(parsedLogs);
      setEmptyMessageKey(null);
      setFirstIndex(parsedLogs[0].auditLogId);
      setLastIndex(parsedLogs[parsedLogs.length - 1].auditLogId);

      if (isDefaultView) {
        // Newest page: nothing newer to go back to.
        setHasPrevious(false);
        setHasNext(isFullPage);
        setCurrentPageNumber(1);
      } else if (request.action === 'next') {
        setHasPrevious(true);
        setHasNext(isFullPage);
        setCurrentPageNumber(pageNumberRef.current + 1);
      } else {
        // Going back always lands on an earlier page; a full page can't tell
        // us if more newer events exist, so rely on the page number instead.
        setHasNext(true);
        const newPage = Math.max(1, pageNumberRef.current - 1);
        setHasPrevious(newPage > 1);
        setCurrentPageNumber(newPage);
      }
    } else {
      if (request.alwaysReplace) {
        setLogs([]);
      }
      setEmptyMessageKey(request.emptyMessageKey);
      setFirstIndex(request.defaultFirstIndex);
      setLastIndex(request.defaultLastIndex);

      if (isDefaultView) {
        setHasNext(false);
        setHasPrevious(false);
        setCurrentPageNumber(1);
      } else if (request.action === 'next') {
        setHasNext(false);
      } else {
        setHasPrevious(false);
      }
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
    currentPageNumber,
    next,
    prev,
    runReport,
    reset,
  };
};

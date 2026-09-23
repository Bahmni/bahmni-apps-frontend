import {
  AuditLogListEntry,
  AuditLogQueryParams,
  RawAuditLogEntry,
} from './models';

/**
 * Returns true when the given value is neither `undefined` nor an empty string.
 * Mirrors the legacy `isNotEmpty` helper used by `mapParamsForRequest`.
 */
const isNotEmpty = (value: unknown): boolean =>
  value !== undefined && value !== '';

/**
 * Strips out `undefined`/empty-string values from a params object before it is
 * sent as a request query string. Mirrors the legacy
 * `_.pickBy(params, isNotEmpty)` behaviour without pulling in lodash.
 */
export const cleanAuditLogParams = (
  params: AuditLogQueryParams,
): Record<string, string | number | boolean> => {
  const cleaned: Record<string, string | number | boolean> = {};
  (Object.keys(params) as Array<keyof AuditLogQueryParams>).forEach((key) => {
    const value = params[key];
    if (isNotEmpty(value)) {
      cleaned[key] = value as string | number | boolean;
    }
  });
  return cleaned;
};

/**
 * Splits the raw `message` field (`"<messageKey>~<JSON messageParams>"`) into
 * a translation key/plain message and its (optional) interpolation params.
 * The `~<JSON>` suffix is optional — plain messages have no `~`.
 */
export const parseAuditLogMessage = (
  rawMessage: string,
): { message: string; messageParams?: Record<string, unknown> } => {
  const [message, paramsJson] = rawMessage.split('~');
  if (!paramsJson) {
    return { message };
  }
  try {
    return { message, messageParams: JSON.parse(paramsJson) };
  } catch {
    return { message };
  }
};

/**
 * Resolves a possibly-dotted path (`"params.drugName"`) against a context
 * object. Returns `undefined` if any segment along the path is missing.
 */
const resolvePath = (context: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, context);

/**
 * Replaces `{{placeholder}}` tokens in `template` with values from `context`.
 * Unresolved placeholders are left untouched.
 *
 * The write-side `logAuditEvent` (see `auditLogService.ts`) pre-translates
 * the message via i18next *before* sending it to the backend, so the stored
 * `message` is already plain text with unresolved `{{}}` tokens rather than
 * a translation key. A later `t(message, params)` call on read can't
 * interpolate those tokens, since i18next only interpolates values found in
 * its own resource strings, not into an arbitrary already-resolved string.
 * This mirrors what the legacy AngularJS `$translate.instant(message, log)`
 * did (its interpolator runs on the resolved string regardless of whether a
 * translation was found), covering both legacy key-based entries (where an
 * i18next lookup upstream already interpolates matching context) and
 * pre-translated entries from the current write path.
 */
export const interpolateMessage = (
  template: string,
  context: Record<string, unknown>,
): string =>
  template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (token, path: string) => {
    const value = resolvePath(context, path);
    return value === undefined || value === null ? token : String(value);
  });

/**
 * Converts a raw audit log entry (as returned by the backend) into the
 * parsed/display shape consumed by the Audit Log table. Does not translate
 * the message itself — callers should pass the parsed `message`/`messageParams`
 * into their own `t()` call at render/use time.
 */
export const parseAuditLogEntry = (
  log: RawAuditLogEntry,
): AuditLogListEntry => {
  const { message, messageParams } = parseAuditLogMessage(log.message ?? '');
  return {
    id: String(log.auditLogId),
    auditLogId: log.auditLogId,
    dateCreated: log.dateCreated,
    eventType: log.eventType,
    userId: log.userId,
    patientId: log.patientId,
    message,
    messageParams,
    module: log.module,
  };
};

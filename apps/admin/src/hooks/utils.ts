import { set } from 'date-fns';

/**
 * Combines a date and an (optional) `HH:mm` time (24-hour, the native
 * `<input type="time">` value format) into a single ISO `startFrom` value,
 * mirroring the legacy screen's two separate date/time inputs feeding a
 * single `startDate` scope value.
 */
export const combineDateAndTime = (
  date: Date | null,
  time: string,
): string | undefined => {
  if (!date) return undefined;
  let combined = new Date(date);
  if (time?.trim()) {
    const [hours, minutes] = time.split(':').map(Number);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      combined = set(combined, { hours, minutes, seconds: 0, milliseconds: 0 });
    }
  }
  if (Number.isNaN(combined.getTime())) {
    return undefined;
  }
  // Keep the UTC ISO format (`...Z`) the backend already receives from the
  // legacy screen; date-fns `formatISO` would send a local offset instead.
  return combined.toISOString();
};

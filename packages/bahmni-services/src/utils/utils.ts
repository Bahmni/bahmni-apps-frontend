import { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Refreshes React Query cache with advanced options
 * Performs cache operations: cancel, remove, invalidate, and optionally refetch
 *
 * @param queryClient - The React Query client instance
 * @param queryKey - The query key to refresh
 * @param opts - Optional configuration for cache refresh behavior
 * @param opts.exact - Whether to match query key exactly (default: true)
 * @param opts.refetchActiveNow - Whether to immediately refetch active queries (default: true)
 * @returns Promise that resolves when all operations complete
 */
export const refreshQueries = async (
  queryClient: QueryClient,
  queryKey: QueryKey,
  opts?: {
    exact?: boolean;
    refetchActiveNow?: boolean;
  },
): Promise<void> => {
  const { exact = true, refetchActiveNow = true } = opts ?? {};

  await queryClient.cancelQueries({ queryKey, exact });
  await queryClient.removeQueries({ queryKey, exact });
  await queryClient.invalidateQueries({ queryKey, exact });

  if (refetchActiveNow) {
    await queryClient.refetchQueries({ queryKey, exact, type: 'active' });
  }
};

/**
 * Generates a random ID
 * @returns {string} A random ID
 */
export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Converts a string to capital case (e.g., 'foo bar' -> 'Foo Bar')
 * @param input - The string to convert
 * @param delimiters - Optional string of delimiter characters (default: " -", space and hyphen)
 * @returns The string in capital case
 */
export function capitalize(input: string, delimiters: string = ' -'): string {
  if (!input) return '';
  const words = input.toLowerCase().split(new RegExp(`[${delimiters}]+`));
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Gets the cookie value by name
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or empty string if not found
 */
export function getCookieByName(name: string): string {
  const cookieString = document.cookie;
  const cookies = cookieString.split(';');

  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }

  return '';
}

export const isStringEmpty = (input?: string): boolean => {
  return !input || input.trim().length === 0;
};

/**
 * Returns priority index based on position in priority order array
 * Case insensitive matching with whitespace trimming
 * @param value - The value to find priority for
 * @param priorityOrder - Array defining priority order (index 0 = highest priority)
 * @returns Priority number (lower = higher priority), 999 for unknown values
 */
export const getPriorityByOrder = (
  value: string,
  priorityOrder: string[],
): number => {
  if (!value || !priorityOrder || priorityOrder.length === 0) {
    return 999;
  }

  const index = priorityOrder.findIndex(
    (item) => item.toLowerCase() === value.toLowerCase().trim(),
  );

  return index === -1 ? 999 : index;
};

/**
 * Interface for grouped items by date
 */
export interface GroupedByDate<T> {
  date: string;
  items: T[];
}

/**
 * Groups items by date extracted from each item
 * @param items - Array of items to group
 * @param dateExtractor - Function to extract date string from item
 * @returns Array of grouped items by date (no sorting applied)
 */
export function groupByDate<T>(
  items: T[],
  dateExtractor: (item: T) => string,
): GroupedByDate<T>[] {
  if (!items || items.length === 0) {
    return [];
  }

  const dateMap = new Map<string, T[]>();

  items.forEach((item) => {
    const dateKey = dateExtractor(item);

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, []);
    }

    dateMap.get(dateKey)!.push(item);
  });

  return Array.from(dateMap.entries()).map(([date, items]) => ({
    date,
    items,
  }));
}

/**
 * Filters out items that have replacement relationships
 * Removes both the replacing items (have replacement references) and the replaced items (referenced by others)
 * This prevents duplicate entries from showing in the UI where one item replaces another
 *
 * @param items - Array of items to filter
 * @param idExtractor - Function to extract unique identifier from each item
 * @param replacesExtractor - Function to extract array of replaced item IDs from each item
 * @returns Filtered array without replacement-related entries
 */
export function filterReplacementEntries<T>(
  items: T[],
  idExtractor: (item: T) => string,
  replacesExtractor: (item: T) => string[] | undefined,
): T[] {
  if (!items || items.length === 0) {
    return [];
  }

  const replacingIds = new Set<string>();
  const replacedIds = new Set<string>();

  // First pass: collect all replacing and replaced IDs
  items.forEach((item) => {
    const replaces = replacesExtractor(item);
    if (replaces && replaces.length > 0) {
      // This item is replacing others
      replacingIds.add(idExtractor(item));
      // Add all the IDs this item replaces
      replaces.forEach((replacedId) => {
        replacedIds.add(replacedId);
      });
    }
  });

  // Second pass: filter out items that are either replacing or replaced
  return items.filter((item) => {
    const itemId = idExtractor(item);
    const isReplacing = replacingIds.has(itemId);
    const isReplaced = replacedIds.has(itemId);
    return !isReplacing && !isReplaced;
  });
}

/**
 * Parses URL query parameters from a query string
 * @param locationSearchString - Optional query string to parse (defaults to window.location.search)
 * @returns Object containing parsed query parameters as key-value pairs
 */
export function parseQueryParams(
  locationSearchString?: string,
): Record<string, string> {
  const pl = /\+/g; // Regex for replacing addition symbol with a space
  const search = /([^&=]+)=?([^&]*)/g;
  const decode = (s: string) => decodeURIComponent(s.replace(pl, ' '));
  const queryString =
    locationSearchString ?? window.location.search.substring(1);

  const urlParams: Record<string, string> = {};
  let match: RegExpExecArray | null;

  while ((match = search.exec(queryString)) !== null) {
    urlParams[decode(match[1])] = decode(match[2]);
  }

  return urlParams;
}

/**
 * Formats a URL by replacing template placeholders with actual values
 * Template placeholders are in the format {{key}}
 * @param url - The URL template string containing placeholders
 * @param options - Object containing key-value pairs for placeholder replacement
 * @param useQueryParams - Whether to fallback to query parameters if a value is not found in options
 * @returns The formatted URL with all placeholders replaced
 */
export function formatUrl(
  url: string,
  options: Record<string, string>,
  useQueryParams?: boolean,
): string {
  const pattern = /{{([^}]*)}}/g;
  const matches = url.match(pattern);
  let replacedString = url;
  const checkQueryParams = useQueryParams ?? false;
  const queryParameters = checkQueryParams ? parseQueryParams() : {};

  if (matches) {
    matches.forEach((placeholder) => {
      const key = placeholder.replace('{{', '').replace('}}', '');
      let value = options[key];

      if (!value && checkQueryParams) {
        value = queryParameters[key] || '';
      }

      replacedString = replacedString.replace(placeholder, value);
    });
  }

  return replacedString.trim();
}

/**
 * Convert blob to base64 data URL
 * @param blob - The image blob
 * @returns Promise<string> - The base64 data URL
 */
export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Return the data type of the given value
 * @param value - Value for which the type is to be found
 * @returns string of what is the type of the input
 */
export const getValueType = (value: string | number): string => {
  if (typeof value === 'number' && !isNaN(value)) {
    return 'number';
  }

  if (typeof value !== 'string') {
    return typeof value;
  }

  const val = value.toLowerCase();

  if (val.endsWith('.pdf')) return 'PDF';

  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'];
  if (imageExtensions.some((extn) => val.endsWith(extn))) return 'Image';

  const videoExtensions = ['.mp4', '.ogg', '.webm', '.mkv', '.flv'];
  if (videoExtensions.some((extn) => val.endsWith(extn))) return 'Video';

  if (typeof value === 'string') {
    return 'string';
  }

  return 'object';
};

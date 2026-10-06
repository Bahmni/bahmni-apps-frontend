import { getImportedItems, ImportedItem } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

export const IMPORTED_ITEMS_QUERY_KEY = ['admin', 'importedItems'];

// The legacy page fetched the history on every visit, so never serve it stale.
export const useImportedItems = () =>
  useQuery<ImportedItem[]>({
    queryKey: IMPORTED_ITEMS_QUERY_KEY,
    queryFn: getImportedItems,
    staleTime: 0,
    refetchOnMount: 'always',
  });

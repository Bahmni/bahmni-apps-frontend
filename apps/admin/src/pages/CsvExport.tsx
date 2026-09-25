import { Button, ComboBox, InlineLoading, Tile } from '@bahmni/design-system';
import {
  BAHMNI_APP_BASE_PATH,
  BAHMNI_HOME_PATH,
  downloadBlob,
  exportConceptSet,
  getConceptById,
  searchConceptsByQuery,
  useTranslation,
} from '@bahmni/services';
import { useDebounce, useNotification } from '@bahmni/widgets';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { FormEvent, useMemo, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import styles from './styles/CsvExport.module.scss';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;
const NOTIFICATION_TIMEOUT_MS = 5000;

interface ConceptOption {
  uuid: string;
  name: string;
}

export const CsvExport: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [inputValue, setInputValue] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<ConceptOption | null>(
    null,
  );
  const debouncedTerm = useDebounce(inputValue.trim(), SEARCH_DEBOUNCE_MS);

  const breadcrumbs = useMemo(
    () => [
      { id: 'home', label: t('BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
      {
        id: 'admin',
        label: t('BREADCRUMB_ADMIN'),
        href: `${BAHMNI_APP_BASE_PATH}/admin`,
      },
      {
        id: 'csv-export',
        label: t('BREADCRUMB_CSV_EXPORT'),
        isCurrentPage: true,
      },
    ],
    [t],
  );

  const { data: searchResults = [] } = useQuery({
    queryKey: ['csvExportConceptSearch', debouncedTerm],
    queryFn: () => searchConceptsByQuery(debouncedTerm),
    enabled:
      debouncedTerm.length >= MIN_SEARCH_LENGTH &&
      debouncedTerm !== selectedConcept?.name,
  });

  const options = useMemo<ConceptOption[]>(
    () =>
      searchResults.map((concept) => ({
        uuid: concept.uuid,
        name: concept.name.name,
      })),
    [searchResults],
  );

  const exportMutation = useMutation({
    mutationFn: async (option: ConceptOption) => {
      const concept = await getConceptById(option.uuid);
      if (!concept.setMembers?.length) return null;
      return exportConceptSet(option.name);
    },
    onSuccess: (blob, option) => {
      const conceptName = option.name;
      if (!blob || blob.size === 0) {
        addNotification({
          type: 'error',
          title: t('ADMIN_CSV_EXPORT_NO_DATA_TITLE'),
          message: t('ADMIN_CSV_EXPORT_NO_DATA_MESSAGE'),
          timeout: NOTIFICATION_TIMEOUT_MS,
        });
        return;
      }
      downloadBlob(blob, `${conceptName}.zip`);
      addNotification({
        type: 'success',
        title: t('ADMIN_CSV_EXPORT_SUCCESS_TITLE'),
        message: t('ADMIN_CSV_EXPORT_SUCCESS_MESSAGE', { conceptName }),
        timeout: NOTIFICATION_TIMEOUT_MS,
      });
    },
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        title: t('ADMIN_CSV_EXPORT_ERROR_TITLE'),
        message: error.message,
        timeout: NOTIFICATION_TIMEOUT_MS,
      });
    },
  });

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (selectedConcept && value !== selectedConcept.name) {
      setSelectedConcept(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (exportMutation.isPending) return;
    if (!selectedConcept) {
      addNotification({
        type: 'error',
        title: t('ADMIN_CSV_EXPORT_SELECT_CONCEPT_TITLE'),
        message: t('ADMIN_CSV_EXPORT_SELECT_CONCEPT_MESSAGE'),
        timeout: NOTIFICATION_TIMEOUT_MS,
      });
      return;
    }
    exportMutation.mutate(selectedConcept);
  };

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Tile
        id="admin-csv-export-page"
        data-testid="admin-csv-export-page-test-id"
        aria-label="CSV Export Page"
        className={styles.tile}
      >
        <h2 className={styles.title}>{t('ADMIN_CSV_EXPORT_TITLE')}</h2>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.search}>
            <ComboBox<ConceptOption>
              id="csv-export-concept-search"
              data-testid="csv-export-concept-search-test-id"
              titleText=""
              placeholder={t('ADMIN_CSV_EXPORT_SEARCH_PLACEHOLDER')}
              aria-label={t('ADMIN_CSV_EXPORT_SEARCH_ARIA_LABEL')}
              items={options}
              itemToString={(item) => item?.name ?? ''}
              selectedItem={selectedConcept}
              onChange={({ selectedItem }) =>
                setSelectedConcept(selectedItem ?? null)
              }
              onInputChange={handleInputChange}
              disabled={exportMutation.isPending}
              size="md"
            />
          </div>
          <Button
            type="submit"
            kind="primary"
            size="md"
            testId="csv-export-button-test-id"
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <InlineLoading
                description={t('ADMIN_CSV_EXPORT_IN_PROGRESS')}
                testId="csv-export-loading-test-id"
              />
            ) : (
              t('ADMIN_CSV_EXPORT_BUTTON')
            )}
          </Button>
        </form>
      </Tile>
    </AdminLayout>
  );
};

import {
  CodeSnippetSkeleton,
  Icon,
  ICON_SIZE,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@bahmni/design-system';
import { useTranslation, type SearchExtension } from '@bahmni/services';
import { getSearchWidget } from '@bahmni/widgets';
import { Suspense } from 'react';
import styles from './styles/index.module.scss';

const Search = ({ extensions }: { extensions: SearchExtension[] }) => {
  const { t } = useTranslation();

  if (extensions.length === 0) return null;

  return (
    <Tabs>
      <TabList
        id="search-extension-tab-list"
        data-testid="search-extension-tab-list-test-id"
        aria-label="Search Extensions"
      >
        {extensions.map((ext) => (
          <Tab
            key={ext.id}
            id={`search-tab-${ext.id}`}
            data-testid={`search-tab-${ext.id}-test-id`}
            aria-label={`Search Tab ${ext.id}`}
            renderIcon={
              ext.icon
                ? () => (
                    <Icon
                      id={`${ext.id}-icon`}
                      testId={`${ext.id}-icon-test-id`}
                      ariaLabel={`Icon ${ext.id}`}
                      name={ext.icon}
                      size={ICON_SIZE.SM}
                    />
                  )
                : undefined
            }
          >
            {t(ext.translationKey)}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {extensions.map((ext) => {
          const widget = getSearchWidget(
            ext.extensionParams?.searchHandler ?? '',
          );
          const Widget = widget?.component;
          return (
            <TabPanel
              key={ext.id}
              id={`${ext.id}-panel`}
              data-testid={`${ext.id}-panel-test-id`}
              aria-label={`Panel ${ext.id}`}
              className={styles.panel}
            >
              {Widget && ext.extensionParams ? (
                <Suspense
                  fallback={
                    <CodeSnippetSkeleton
                      type="multi"
                      className={styles.loading}
                    />
                  }
                >
                  <Widget extensionParams={ext.extensionParams} />
                </Suspense>
              ) : (
                <p
                  id="extension-widget-not-registered"
                  data-testid="extension-widget-not-registered-test-id"
                  aria-label="Extension widget not registered"
                  className={styles.message}
                >
                  {t('EXTENSION_WIDGET_NOT_REGISTERED')}
                </p>
              )}
            </TabPanel>
          );
        })}
      </TabPanels>
    </Tabs>
  );
};

export default Search;

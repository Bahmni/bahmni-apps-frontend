import {
  Icon,
  ICON_SIZE,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { Suspense } from 'react';
import { useUserPrivilege } from '../../../userPrivileges/useUserPrivilege';
import { useExtensionConfig, getExtensionWidget } from '../../index';
import { filterByPrivileges } from '../../utils';
import styles from './styles/index.module.scss';

const TabView = () => {
  const { t } = useTranslation();
  const { extensions } = useExtensionConfig();
  const { userPrivileges } = useUserPrivilege();

  const filteredExtensions = filterByPrivileges(extensions, userPrivileges);

  if (filteredExtensions.length === 0) return null;

  return (
    <Tabs>
      <TabList
        id="extensions-tab-view"
        data-testid="extensions-tab-view-test-id"
        aria-label="Extensions Tab View"
      >
        {filteredExtensions.map((ext) => (
          <Tab
            id={`extensions-tab-${ext.id}`}
            data-testid={`extensions-tab-${ext.id}-test-id`}
            aria-label={`Extensions Tab ${ext.id}`}
            key={ext.id}
            renderIcon={
              ext.icon
                ? () => (
                    <Icon
                      id={`${ext.id}-icon`}
                      data-testid={`${ext.id}-icon-test-id`}
                      aria-label={`Icon ${ext.id}`}
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
        {filteredExtensions.map((ext) => {
          const registered = getExtensionWidget(ext.type);
          const Widget = registered?.component;

          return (
            <TabPanel
              key={ext.id}
              id={`${ext.id}-panel`}
              data-testid={`${ext.id}-panel-test-id`}
              aria-label={`Panel ${ext.id}`}
            >
              {Widget ? (
                <Suspense fallback={null}>
                  <Widget configUrl={ext.extensionParams.configUrl} />
                </Suspense>
              ) : (
                <p
                  id="no-registered-extension-message"
                  data-testid="no-registered-extension-message-test-id"
                  aria-label="No registered extension message"
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

export default TabView;

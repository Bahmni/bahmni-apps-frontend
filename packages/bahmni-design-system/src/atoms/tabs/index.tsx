import {
  Tab as CarbonTab,
  TabProps as CarbonTabProps,
  TabList as CarbonTabList,
  TabListProps as CarbonTabListProps,
  TabPanel as CarbonTabPanel,
  TabPanelProps as CarbonTabPanelProps,
  TabPanels as CarbonTabPanels,
  TabPanelsProps as CarbonTabPanelsProps,
  Tabs as CarbonTabs,
  TabsProps as CarbonTabsProps,
} from '@carbon/react';
import React from 'react';

export type TabsProps = CarbonTabsProps & {
  testId?: string;
};

export const Tabs: React.FC<TabsProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonTabs {...carbonProps} data-testid={testId}>
      {children}
    </CarbonTabs>
  );
};

export type TabListProps = CarbonTabListProps & {
  testId?: string;
};

export const TabList: React.FC<TabListProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonTabList {...carbonProps} data-testid={testId}>
      {children}
    </CarbonTabList>
  );
};

export type TabProps = CarbonTabProps & {
  testId?: string;
};

export const Tab: React.FC<TabProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonTab {...carbonProps} data-testid={testId}>
      {children}
    </CarbonTab>
  );
};

export type TabPanelsProps = CarbonTabPanelsProps & {
  testId?: string;
};

export const TabPanels: React.FC<TabPanelsProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonTabPanels {...carbonProps} data-testid={testId}>
      {children}
    </CarbonTabPanels>
  );
};

export type TabPanelProps = CarbonTabPanelProps & {
  testId?: string;
};

export const TabPanel: React.FC<TabPanelProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonTabPanel {...carbonProps} data-testid={testId}>
      {children}
    </CarbonTabPanel>
  );
};

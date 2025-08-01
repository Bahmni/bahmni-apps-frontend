import {
  Tab,
  TabProps,
  TabList,
  TabListProps,
  TabPanel,
  TabPanelProps,
  TabPanels,
  TabPanelsProps,
  Tabs as CarbonTabs,
  TabsProps as CarbonTabsProps,
} from '@carbon/react';
import React from 'react';

// Base Tabs wrapper
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

// TabList wrapper
export type TabListWrapperProps = TabListProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TabListWrapper: React.FC<TabListWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TabList {...carbonProps} data-testid={testId}>
      {children}
    </TabList>
  );
};

// Tab wrapper
export type TabWrapperProps = TabProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TabWrapper: React.FC<TabWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <Tab {...carbonProps} data-testid={testId}>
      {children}
    </Tab>
  );
};

// TabPanels wrapper
export type TabPanelsWrapperProps = TabPanelsProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TabPanelsWrapper: React.FC<TabPanelsWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TabPanels {...carbonProps} data-testid={testId}>
      {children}
    </TabPanels>
  );
};

// TabPanel wrapper
export type TabPanelWrapperProps = TabPanelProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const TabPanelWrapper: React.FC<TabPanelWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <TabPanel {...carbonProps} data-testid={testId}>
      {children}
    </TabPanel>
  );
};

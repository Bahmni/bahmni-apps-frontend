import TabView from './components/tabView';
import ExtensionConfigProvider from './provider';

interface ExtensionsProps {
  configUrl: string;
}

const Extensions = ({ configUrl }: ExtensionsProps) => (
  <ExtensionConfigProvider configUrl={configUrl}>
    <TabView />
  </ExtensionConfigProvider>
);

export default Extensions;

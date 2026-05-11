import { Loading } from '@bahmni/design-system';
import { AppContextProvider, NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useRef } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ThemeConfigProvider } from '../providers/themeConfig';
import { LocationProvider } from './context';

const IndexPage = lazy(() =>
  import('./IndexPage').then((module) => ({ default: module.IndexPage })),
);
const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const ClinicalApp = lazy(() =>
  import('@bahmni/clinical-app').then((module) => ({
    default: module.ClinicalApp,
  })),
);
const RegistrationApp = lazy(() =>
  import('@bahmni/registration-app').then((module) => ({
    default: module.RegistrationApp,
  })),
);
const AppointmentsApp = lazy(() =>
  import('@bahmni/appointments-app').then((module) => ({
    default: module.AppointmentsApp,
  })),
);

export function App() {
  const queryClient = useRef(
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
          refetchOnWindowFocus: false,
        },
      },
    }),
  );

  return (
    <LocationProvider>
      <QueryClientProvider client={queryClient.current}>
        <NotificationProvider>
          <ThemeConfigProvider>
            <AppContextProvider>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route index element={<IndexPage />} />
                  <Route path="/clinical/*" element={<ClinicalApp />} />
                  <Route path="/registration/*" element={<RegistrationApp />} />
                  <Route path="/appointments/*" element={<AppointmentsApp />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </AppContextProvider>
          </ThemeConfigProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </LocationProvider>
  );
}

export default App;

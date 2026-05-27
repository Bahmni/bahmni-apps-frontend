import { Loading } from '@bahmni/design-system';
import { AppContextProvider, SessionGate } from '@bahmni/widgets';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const HomeApp = lazy(() =>
  import('@bahmni/home-app').then((module) => ({ default: module.HomeApp })),
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
  return (
    <AppContextProvider>
      <SessionGate>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<Navigate to="/home/" replace />} />
            <Route path="/home/*" element={<HomeApp />} />
            <Route path="/clinical/*" element={<ClinicalApp />} />
            <Route path="/registration/*" element={<RegistrationApp />} />
            <Route path="/appointments/*" element={<AppointmentsApp />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </SessionGate>
    </AppContextProvider>
  );
}

export default App;

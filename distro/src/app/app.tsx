import { Loading } from '@bahmni-frontend/bahmni-design-system';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const IndexPage = lazy(() =>
  import('./IndexPage').then((module) => ({ default: module.IndexPage })),
);
const NotFoundPage = lazy(() =>
  import('./NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const ClinicalApp = lazy(() =>
  import('@bahmni-frontend/clinical').then((module) => ({
    default: module.ClinicalApp,
  })),
);
const RegistrationApp = lazy(() =>
  import('@bahmni-frontend/registration').then((module) => ({
    default: module.RegistrationApp,
  })),
);
export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<IndexPage />} />
        <Route path="/clinical/*" element={<ClinicalApp />} />
        <Route path="/registration/*" element={<RegistrationApp />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;

import { Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Content } from '@bahmni-frontend/bahmni-design-system';

const IndexPage = lazy(() => import('./IndexPage').then(module => ({ default: module.IndexPage })));
const NotFoundPage = lazy(() => import('./NotFoundPage').then(module => ({ default: module.NotFoundPage })));
const ClinicalApp = lazy(() => import('@bahmni-frontend/clinical').then(module => ({ default: module.ClinicalApp })));


const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px'
  }}>
    Loading...
  </div>
);

export function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Content>
        <Routes>
          <Route index element={<IndexPage />} />
          <Route path='/clinical/*' element={<ClinicalApp />} />
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </Content>
    </Suspense>
  );
}

export default App;

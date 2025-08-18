import { Route, Routes } from 'react-router-dom';
import { SamplePage } from './pages/SamplePage';
import { SampleParamPage } from './pages/SamplePageWithParam';

const SampleApp: React.FC = () => {
  return (
    <Routes>
      <Route index element={<SamplePage />} />
      <Route path=":param" element={<SampleParamPage />} />
    </Routes>
  );
};

export { SampleApp };

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Content } from '@carbon/react';
import ConsulationPage from '@pages/ConsultationPage';
import NotFoundPage from '@pages/NotFoundPage';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';

const App: React.FC = () => {
  return (
    <Content>
      <ClinicalConfigProvider>
        <Routes>
          <Route path="/clinical/:patientUuid" element={<ConsulationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ClinicalConfigProvider>
    </Content>
  );
};

export default App;

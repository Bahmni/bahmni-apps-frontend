import { Content } from '@carbon/react';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConsulationPage from '@pages/ConsultationPage';
import NotFoundPage from '@pages/NotFoundPage';
import PatientSearchPage from '@pages/PatientSearchPage';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';

const App: React.FC = () => {
  return (
    <Content>
      <ClinicalConfigProvider>
        <Routes>
          <Route path="/registration" element={<PatientSearchPage />} />
          <Route path="/clinical/:patientUuid" element={<ConsulationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ClinicalConfigProvider>
    </Content>
  );
};

export default App;

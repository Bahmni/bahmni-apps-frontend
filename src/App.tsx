import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Content } from '@carbon/react';
import ConsulationPage from '@pages/ConsultationPage';
import NotFoundPage from '@pages/NotFoundPage';
import CreatePatientPage from '@pages/CreatePatientPage';
import PatientSearchPage from '@pages/PatientSearchPage';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';

const App: React.FC = () => {
  return (
    <Content>
      <ClinicalConfigProvider>
        <Routes>
          <Route path="/clinical/:patientUuid" element={<ConsulationPage />} />
          <Route path="/registration/search" element={<PatientSearchPage />} />
          <Route path="/registration/patient/new" element={<CreatePatientPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ClinicalConfigProvider>
    </Content>
  );
};

export default App;

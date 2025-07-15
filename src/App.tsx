import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles/index.scss';
import { Content } from '@carbon/react';
import ConsulationPage from '@pages/ConsultationPage';
import PatientRegistrationPage from '@pages/PatientRegistrationPage';
import NotFoundPage from '@pages/NotFoundPage';
import RegistrationPage from '@pages/RegistrationPage';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';

const App: React.FC = () => {
  return (
    <ClinicalConfigProvider>
      <Routes>
        {/* Clinical Module Routes */}
        <Route
          path="/clinical/:patientUuid"
          element={
            <Content>
              <ConsulationPage />
            </Content>
          }
        />

        {/* Registration Module Routes */}
        <Route
          path="/registration/new"
          element={<PatientRegistrationPage mode="create" />}
        />
        <Route
          path="/registration/edit/:patientUuid"
          element={<PatientRegistrationPage mode="edit" />}
        />
        <Route path="/registration/search" element={<RegistrationPage />} />

        {/* Default and fallback routes */}
        <Route
          path="*"
          element={
            <Content>
              <NotFoundPage />
            </Content>
          }
        />
      </Routes>
    </ClinicalConfigProvider>
  );
};

export default App;

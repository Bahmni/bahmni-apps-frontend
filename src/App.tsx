import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Content } from '@carbon/react';
import ConsulationPage from '@pages/ConsultationPage';
import NotFoundPage from '@pages/NotFoundPage';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';

const App: React.FC = () => {
  return (
    <Content>
      <Routes>
        <Route
          path="/clinical/:patientUuid"
          element={
            <ClinicalConfigProvider>
              <ConsulationPage />
            </ClinicalConfigProvider>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Content>
  );
};

export default App;

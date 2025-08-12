import { Content } from '@carbon/react';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConsulationPage from '@pages/ConsultationPage';
import NotFoundPage from '@pages/NotFoundPage';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';
import { UserPrivilegeProvider } from '@providers/UserPrivilegeProvider';

const App: React.FC = () => {
  return (
    <Content>
      <ClinicalConfigProvider>
        <UserPrivilegeProvider>
          <Routes>
            <Route
              path="/clinical/:patientUuid"
              element={<ConsulationPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </UserPrivilegeProvider>
      </ClinicalConfigProvider>
    </Content>
  );
};

export default App;

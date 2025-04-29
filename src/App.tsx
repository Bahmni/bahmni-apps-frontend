import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Content } from '@carbon/react';
import ClinicalLayout from './layouts/clinical/ClinicalLayout';
import HomePage from './pages/ConsultationPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <ClinicalLayout>
      <Content>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/clinical/:patientUuid" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Content>
    </ClinicalLayout>
  );
};

export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Content } from '@carbon/react';
import MainLayout from '@layouts/MainLayout';
import ConsultationPage from '@pages/consultationPage/ConsultationPage';
import NotFoundPage from '@pages/notFoundPage/NotFoundPage';

const App: React.FC = () => {
  return (
    <MainLayout>
      <Content>
        <Routes>
          <Route path="/" element={<ConsultationPage />} />
          <Route path="/clinical/:patientUuid" element={<ConsultationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Content>
    </MainLayout>
  );
};

export default App;

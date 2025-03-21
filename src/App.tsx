import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Content } from '@carbon/react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <MainLayout>
      <Content>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/clinical/:patientUuid" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Content>
    </MainLayout>
  );
};

export default App;

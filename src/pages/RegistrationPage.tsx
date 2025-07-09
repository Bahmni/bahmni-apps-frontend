import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SearchPatientPage } from '@/components/registration/search/SearchPatientPage';
import { CreatePatientPage } from '@/components/registration/create/CreatePatientPage';
import { Navigation } from '@/components/registration/common/Navigation';
import { Header } from '@/components/registration/common/Header';

const RegistrationPage: React.FC = () => {
  return (
    <div className="registration-page">
        <Header title="Patient Registration" />
        <Navigation />
        <Routes>
            <Route path="search" element={<SearchPatientPage />} />
            <Route path="patient/new" element={<CreatePatientPage />} />
        </Routes>
    </div>
  );
};

export default RegistrationPage;

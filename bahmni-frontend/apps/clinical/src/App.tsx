import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';

import { initAppI18n, initializeAuditListener } from '@bahmni-frontend/bahmni-services';
import { initFontAwesome } from '@bahmni-frontend/bahmni-design-system';
import { NotificationProvider } from '@bahmni-frontend/bahmni-widgets';
import { ClinicalConfigProvider } from './providers/ClinicalConfigProvider';
import { NotificationServiceComponent } from '@bahmni-frontend/bahmni-widgets';

const ClinicalApp: React.FC = () => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                await initAppI18n();
                initFontAwesome();
                initializeAuditListener();
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize app:', error);
                setIsInitialized(true);
            }
        };

        initializeApp();
    }, []);

    if (!isInitialized) {
        return <div>Loading...</div>;
    }

    return (
        <NotificationProvider>
            <NotificationServiceComponent />
            <ClinicalConfigProvider>
                <Routes>
                    <Route path=":patientUuid" element={<Dashboard />} />
                </Routes>
            </ClinicalConfigProvider>
        </NotificationProvider>
    );
};

export { ClinicalApp };
import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, BreadcrumbItem } from '@carbon/react';
import PatientFormWizard from '../components/registration/patient/PatientFormWizard';
import useNotification from '../hooks/useNotification';
import { OpenMRSPatient } from '../types/registration';
import './CreatePatientPage.scss';

/**
 * CreatePatientPage
 *
 * Main page component for creating new patients in the registration module.
 * Integrates with the PatientFormWizard component and handles navigation,
 * success states, and error handling at the page level.
 *
 * Features:
 * - Breadcrumb navigation for user orientation
 * - Integration with PatientFormWizard component
 * - Success/error handling and navigation
 * - Document title management
 * - Proper accessibility structure
 *
 * @returns React component for patient creation page
 */
const CreatePatientPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Set document title
  useEffect(() => {
    document.title = `${t('registration.patient.create.title')} - ${t('common.appName')}`;
  }, [t]);

  /**
   * Handle successful patient creation
   * Navigates to the patient profile and shows success notification
   */
  const handlePatientCreated = useCallback(
    (patient: OpenMRSPatient) => {
      // Show success notification
      addNotification({
        title: t('common.success'),
        message: t('registration.patient.create.success'),
        type: 'success',
      });

      // Navigate to patient profile in clinical module
      navigate(`/clinical/${patient.uuid}`);
    },
    [addNotification, navigate, t],
  );

  /**
   * Handle cancellation of patient creation
   * Navigates back to the registration search page
   */
  const handleCancel = useCallback(() => {
    navigate('/registration/search');
  }, [navigate]);

  return (
    <div className="create-patient-page">
      {/* Breadcrumb Navigation */}
      <nav
        className="create-patient-page__breadcrumbs"
        aria-label={t('common.breadcrumbNavigation')}
      >
        <Breadcrumb>
          <BreadcrumbItem>
            <a href="/registration/search">{t('registration.title')}</a>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            {t('registration.patient.create.breadcrumb')}
          </BreadcrumbItem>
        </Breadcrumb>
      </nav>

      {/* Main Content */}
      <main className="create-patient-page__content" role="main">
        {/* Page Header */}
        <header className="create-patient-page__header">
          <h1 className="create-patient-page__title">
            {t('registration.patient.create.title')}
          </h1>
          <p className="create-patient-page__description">
            {t('registration.patient.create.description')}
          </p>
        </header>

        {/* Patient Form Wizard */}
        <section className="create-patient-page__wizard">
          <PatientFormWizard
            mode="create"
            onSuccess={handlePatientCreated}
            onCancel={handleCancel}
          />
        </section>
      </main>
    </div>
  );
};

export default CreatePatientPage;

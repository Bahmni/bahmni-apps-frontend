import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Content, Grid, Column, Layer } from '@carbon/react';
import HeaderComponent from '../components/common/header/Header';
import PatientFormWizard from '../components/registration/patient/PatientFormWizard';
import useNotification from '../hooks/useNotification';
import { OpenMRSPatient } from '../types/registration';
import BahmniIcon from '../components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '../constants/icon';
import './CreatePatientPage.scss';

/**
 * CreatePatientPage
 *
 * Main page component for creating new patients in the registration module.
 * Rebuilt to align with Carbon Design System and consistent header pattern.
 *
 * Features:
 * - Integration with new Header component (without sidebar)
 * - Carbon Design System compliant layout
 * - Integration with PatientFormWizard component
 * - Success/error handling and navigation
 * - Document title management
 * - Proper accessibility structure
 * - Responsive design with mobile-first approach
 *
 * @returns React component for patient creation page
 */
const CreatePatientPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Header configuration
  const breadcrumbItems = useMemo(
    () => [
      { id: 'home', label: 'Home', href: '/' },
      {
        id: 'patient-search',
        label: 'Patient Search',
        href: '/bahmni-new/registration/search',
      },
      { id: 'create-patient', label: 'Create Patient', isCurrentPage: true },
    ],
    [],
  );

  const globalActions = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search',
        renderIcon: (
          <BahmniIcon id="search-icon" name="fa-search" size={ICON_SIZE.LG} />
        ),
        onClick: () => {
          navigate('/registration/search');
        },
      },
    ],
    [navigate, t],
  );

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
    navigate('/bahmni-new/registration/search');
  }, [navigate]);

  return (
    <div className="create-patient-page">
      {/* Header with breadcrumbs and global actions */}
      <HeaderComponent
        breadcrumbItems={breadcrumbItems}
        globalActions={globalActions}
        ariaLabel={t('registration.patient.create.title')}
      />

      {/* Main Content */}
      <Content className="create-patient-page__content">
        <Grid className="create-patient-page__grid">
          {/* Patient Form Wizard */}
          <Column span={16} className="create-patient-page__wizard">
            <Layer>
              <div className="create-patient-page__wizard-content">
                <PatientFormWizard />
              </div>
            </Layer>
          </Column>
        </Grid>
      </Content>
    </div>
  );
};

export default CreatePatientPage;

/* eslint-disable no-console */
// TODO: Remove console statements before production deployment
import { Container } from 'bahmni-form-controls-new';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import formData from '../constants/form.json';
import 'bahmni-form-controls-new/dist/bundle.css';
import {
  clinicalFormMetadata,
  existingObservations,
  patientData,
  translationData,
} from '../constants/formData';
import './styles/SamplePage.scss';

function App() {
  const formRef = useRef(null);

  // State management
  const [observations, setObservations] = useState(existingObservations);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [errors, setErrors] = useState([]);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [containerMounted, setContainerMounted] = useState(false);

  // Form configuration state
  const [config, setConfig] = useState({
    validate: true,
    validateForm: false,
    collapse: false,
  });

  useEffect(() => {
    if (formRef.current) {
      setContainerMounted(true);
      console.log('Container component mounted successfully (React 19)');
    }
  }, []);

  const showNotification = useCallback((message: string, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 4000);
  }, []);

  const handleFormValueUpdated = useCallback((controlRecordTree: unknown) => {
    console.log('Form updated (React 19):', controlRecordTree);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formRef.current) {
      showNotification('Form not ready. Please wait...', 'warning');
      return;
    }

    if (!containerMounted) {
      showNotification('Form is still initializing...', 'warning');
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Get current form data
      const formData = formRef.current.getValue();

      if (!formData) {
        throw new Error('Unable to retrieve form data');
      }

      // Check for validation errors
      if (formData.errors && formData.errors.length > 0) {
        setErrors(formData.errors);
        showNotification(
          `Validation failed: ${formData.errors.length} error(s) found`,
          'error',
        );
        setIsLoading(false);
        return;
      }

      // Log observations
      console.log('Saving observations (React 19):', formData.observations);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setLastSavedData(formData.observations);
      showNotification('Form saved successfully! (React 19)', 'success');
    } catch (error) {
      console.error('Error saving form:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      showNotification(`Failed to save form: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification, containerMounted]);

  const handleReset = useCallback(() => {
    setObservations([...existingObservations]);
    setErrors([]);
    setLastSavedData(null);
    showNotification('Form reset to initial data (React 19)', 'info');
  }, [showNotification]);

  const handleClear = useCallback(() => {
    setObservations([]);
    setErrors([]);
    setLastSavedData(null);
    showNotification('Form cleared (React 19)', 'info');
  }, [showNotification]);

  const handleConfigChange = useCallback((key: string) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []); // No external dependencies

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>Clinical Assessment Form</h1>
          <p className="subtitle">React 19 + Bahmni Form Controls Demo</p>
          <span className="react-version">⚛️ React 19.0.0</span>
        </div>
      </header>

      <div className="main-content">
        <div className="container">
          {/* Patient Information Panel */}
          <section className="panel patient-panel">
            <h2>Patient Details</h2>
            <div className="patient-grid">
              <div className="patient-field">
                <label>Name:</label>
                <span>{patientData.name}</span>
              </div>
              <div className="patient-field">
                <label>MRN:</label>
                <span>{patientData.identifier}</span>
              </div>
              <div className="patient-field">
                <label>Age:</label>
                <span>{patientData.age} years</span>
              </div>
              <div className="patient-field">
                <label>Gender:</label>
                <span>{patientData.gender === 'F' ? 'Female' : 'Male'}</span>
              </div>
              <div className="patient-field">
                <label>DOB:</label>
                <span>{patientData.birthdate}</span>
              </div>
              <div className="patient-field">
                <label>UUID:</label>
                <span className="uuid">{patientData.uuid}</span>
              </div>
            </div>
          </section>

          {/* Configuration Panel */}
          <section className="panel config-panel">
            <h3>Form Configuration</h3>
            <div className="config-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.validate}
                  onChange={() => handleConfigChange('validate')}
                />
                <span>Enable Validation</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.validateForm}
                  onChange={() => handleConfigChange('validateForm')}
                />
                <span>Validate on Load</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.collapse}
                  onChange={() => handleConfigChange('collapse')}
                />
                <span>Collapse Sections</span>
              </label>
            </div>
            {!containerMounted && (
              <p className="status-message status-initializing">
                ⏳ Form is initializing...
              </p>
            )}
            {containerMounted && (
              <p className="status-message status-ready">
                ✓ Form ready (React 19)
              </p>
            )}
          </section>

          {/* Notification */}
          {notification.message && (
            <div className={`notification notification-${notification.type}`}>
              <span className="notification-icon">
                {notification.type === 'success' && '✓'}
                {notification.type === 'error' && '✗'}
                {notification.type === 'warning' && '⚠'}
                {notification.type === 'info' && 'ℹ'}
              </span>
              <span>{notification.message}</span>
            </div>
          )}

          {/* Validation Errors */}
          {errors.length > 0 && (
            <section className="panel error-panel">
              <h3>Validation Errors ({errors.length})</h3>
              <ul className="error-list">
                {errors.map((error) => (
                  <li key={error.message ?? JSON.stringify(error)}>
                    {error.message ?? JSON.stringify(error)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Form Container with Error Boundary */}
          <section className="panel form-panel">
            <div className="form-header">
              <h2>Clinical Assessment</h2>
              <span className="form-version">
                v{clinicalFormMetadata.version}
              </span>
            </div>

            <div className="form-wrapper">
              <ErrorBoundary>
                <Container
                  ref={formRef}
                  metadata={formData}
                  observations={observations}
                  patient={patientData}
                  translations={translationData}
                  validate={config.validate}
                  validateForm={config.validateForm}
                  collapse={config.collapse}
                  locale="en"
                  onValueUpdated={handleFormValueUpdated}
                />
              </ErrorBoundary>
            </div>
          </section>

          {/* Action Buttons */}
          <section className="actions">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isLoading || !containerMounted}
            >
              {isLoading ? 'Saving...' : '💾 Save Form'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={isLoading || !containerMounted}
            >
              🔄 Reset
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={isLoading || !containerMounted}
            >
              🗑️ Clear
            </button>
          </section>

          {/* Saved Data Display */}
          {lastSavedData && (
            <section className="panel data-panel">
              <h3>Last Saved Data</h3>
              <div className="data-summary">
                <p>
                  <strong>Total Observations:</strong> {lastSavedData.length}
                </p>
                <details>
                  <summary>View JSON</summary>
                  <pre className="json-output">
                    {JSON.stringify(lastSavedData, null, 2)}
                  </pre>
                </details>
              </div>
            </section>
          )}

          {/* Info Panel */}
          <section className="panel info-panel">
            <h3>About This Demo (React 19)</h3>
            <ul className="info-list">
              <li>
                <strong>Framework:</strong> React 19.0.0
              </li>
              <li>
                <strong>Library:</strong> bahmni-form-controls
              </li>
              <li>
                <strong>Features:</strong> Enhanced hooks, strict dependencies,
                improved performance
              </li>
              <li>
                <strong>Patterns:</strong> Explicit dependencies, error
                boundaries, StrictMode
              </li>
              <li>
                <strong>Form:</strong> Obs Groups, Validation, Pre-filled Data
              </li>
              <li>
                <strong>Console:</strong> Check browser console for React 19
                logs
              </li>
            </ul>
          </section>

          {/* React 19 Improvements Panel */}
          <section className="panel improvement-panel">
            <h3>React 19 Improvements ⚡</h3>
            <ul className="info-list">
              <li>
                <strong>✅ Explicit Dependencies:</strong> All useCallback hooks
                have complete dependency arrays
              </li>
              <li>
                <strong>✅ Stricter Hooks Rules:</strong> ESLint exhaustive-deps
                enforced
              </li>
              <li>
                <strong>✅ Better Performance:</strong> Enhanced batching and
                rendering optimizations
              </li>
              <li>
                <strong>✅ Modern Patterns:</strong> Following React 19 best
                practices
              </li>
              <li>
                <strong>✅ StrictMode:</strong> Enabled for development safety
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          Bahmni Form Controls React 19 Demo | Source:{' '}
          <code>examples/react19-consumer-app/</code> | Port: 3002
        </p>
      </footer>
    </div>
  );
}
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Container Error (React 19):', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>⚠️ Form Error</h3>
          <p className="error-boundary-message">
            <strong>Error:</strong> {this.state.error?.toString()}
          </p>
          <p className="error-boundary-note">
            React 19 error boundary caught this error
          </p>
          <details className="error-boundary-details">
            <summary>Error Details</summary>
            <pre className="error-boundary-stack">
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="error-boundary-reload"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { App as SamplePage };
/* eslint-enable no-console */

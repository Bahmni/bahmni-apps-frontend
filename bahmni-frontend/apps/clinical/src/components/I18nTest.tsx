import React, { useState } from 'react';
import { useTranslation } from '@bahmni-frontend/bahmni-services';

export const I18nTest: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState<string>('User');
  const [itemCount, setItemCount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const changeLanguage = async (lang: string) => {
    setLoading(true);
    try {
      await i18n.changeLanguage(lang);
      // Store language preference in localStorage
      localStorage.setItem('NG_TRANSLATE_LANG_KEY', lang);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLanguage = (): string => {
    return i18n.language || 'en';
  };

  const incrementItems = () => {
    setItemCount(prev => prev + 1);
  };

  const decrementItems = () => {
    setItemCount(prev => Math.max(1, prev - 1));
  };

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '20px',
        margin: '10px',
        borderRadius: '8px',
      }}
    >
      <h2>{t('I18N_TEST_TITLE')}</h2>
      <p>{t('I18N_TEST_DESCRIPTION')}</p>

      <div style={{ marginBottom: '20px' }}>
        <p><strong>{t('I18N_TEST_CURRENT_LANGUAGE', { language: getCurrentLanguage().toUpperCase() })}</strong></p>

        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={() => changeLanguage('en')}
            disabled={loading || getCurrentLanguage() === 'en'}
            style={{
              margin: '5px',
              padding: '8px 16px',
              backgroundColor: getCurrentLanguage() === 'en' ? '#e0e0e0' : '#ffffff',
              cursor: getCurrentLanguage() === 'en' ? 'not-allowed' : 'pointer'
            }}
          >
            {t('I18N_TEST_SWITCH_TO_ENGLISH')}
          </button>
          <button
            onClick={() => changeLanguage('es')}
            disabled={loading || getCurrentLanguage() === 'es'}
            style={{
              margin: '5px',
              padding: '8px 16px',
              backgroundColor: getCurrentLanguage() === 'es' ? '#e0e0e0' : '#ffffff',
              cursor: getCurrentLanguage() === 'es' ? 'not-allowed' : 'pointer'
            }}
          >
            {t('I18N_TEST_SWITCH_TO_SPANISH')}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Translation Examples:</h3>

        <div style={{ marginBottom: '10px' }}>
          <strong>Simple Translation:</strong>
          <p style={{ marginLeft: '20px', fontStyle: 'italic' }}>
            {t('I18N_TEST_SIMPLE_MESSAGE')}
          </p>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Interpolation Example:</strong>
          <div style={{ marginLeft: '20px' }}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              style={{
                padding: '4px 8px',
                marginRight: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <p style={{ fontStyle: 'italic', margin: '5px 0' }}>
              {t('I18N_TEST_WELCOME_USER', { username })}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Pluralization Example:</strong>
          <div style={{ marginLeft: '20px' }}>
            <button
              onClick={decrementItems}
              disabled={itemCount <= 1}
              style={{
                padding: '4px 8px',
                marginRight: '5px',
                cursor: itemCount <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              -
            </button>
            <span style={{ margin: '0 10px', fontWeight: 'bold' }}>
              {itemCount}
            </span>
            <button
              onClick={incrementItems}
              style={{
                padding: '4px 8px',
                marginLeft: '5px',
                cursor: 'pointer'
              }}
            >
              +
            </button>
            <p style={{ fontStyle: 'italic', margin: '5px 0' }}>
              {t('I18N_TEST_ITEM_COUNT', { count: itemCount })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Status:</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '150px',
          }}
        >
          {loading ? 'Switching language...' :
            `Language: ${getCurrentLanguage()}\n` +
            `i18n initialized: ${i18n.isInitialized}\n` +
            `Available languages: ${i18n.languages?.join(', ') || 'Loading...'}\n` +
            `Namespace: ${i18n.options?.defaultNS || 'clinical'}`
          }
        </pre>
      </div>
    </div>
  );
};

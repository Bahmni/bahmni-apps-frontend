import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@carbon/react';

/**
 * Component for switching between available languages
 */
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  // Function to change the language
  const changeLanguage = (selectedItem: { id: string }) => {
    // Change the language in i18n
    i18n.changeLanguage(selectedItem.id);
    
    // Manually set the cookie in case the i18n detection doesn't do it
    document.cookie = `bahmni_locale=${selectedItem.id};path=/;sameSite=strict;max-age=31536000`; // 1 year expiry
  };

  // Get the current language
  const currentLanguage = i18n.language;

  // Language options for the dropdown
  const items = [
    { id: 'ar', text: 'العربية' },
    { id: 'de', text: 'Deutsch' },
    { id: 'el', text: 'Ελληνικά' },
    { id: 'en', text: 'English' },
    { id: 'es', text: 'Español' },
    { id: 'fr', text: 'Français' },
    { id: 'hi', text: 'हिंदी' },
    { id: 'hr', text: 'Hrvatski' },
    { id: 'it', text: 'Italiano' },
    { id: 'km', text: 'ខ្មែរ' },
    { id: 'ko', text: '한국어' },
    { id: 'lo', text: 'ລາວ' },
    { id: 'pt', text: 'Português' },
    { id: 'pt_BR', text: 'Português (Brasil)' },
    { id: 'ru', text: 'Русский' },
    { id: 'te', text: 'తెలుగు' },
    { id: 'zh', text: '中文' }
  ];

  // Find the currently selected language, default to English
  const selectedItem = items.find(item => item.id === currentLanguage) || items.find(item => item.id === 'en') || items[0];

  return (
    <div style={{ margin: '1rem 0', maxWidth: '200px' }}>
      <Dropdown
        id="language-switcher"
        titleText="Language"
        label="Select language"
        items={items}
        itemToString={(item) => (item ? item.text : '')}
        onChange={({ selectedItem }) => selectedItem && changeLanguage(selectedItem)}
        selectedItem={selectedItem}
        size="sm"
      />
    </div>
  );
};

export default LanguageSwitcher;

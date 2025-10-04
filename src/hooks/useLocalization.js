import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

// Import all locales at once to avoid dynamic import complexities in simple setups
import de from '../locales/de.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

const locales = { de, en, fr };
const supportedLanguages = ['de', 'en', 'fr'];

const getLanguage = () => {
    const lang = Cookies.get('wpml_last_lang');
    return lang && supportedLanguages.includes(lang) ? lang : 'de';
};

export const useLocalization = () => {
    const [lang, setLang] = useState(getLanguage);
    const [translations, setTranslations] = useState(locales[lang]);

    useEffect(() => {
        const currentLang = getLanguage();
        if (currentLang !== lang) {
            setLang(currentLang);
        }
        setTranslations(locales[currentLang]);
    }, [lang]); // Re-run if lang changes (e.g., manually)

    const t = useCallback((key) => {
        return translations[key] || key;
    }, [translations]);

    return { t, lang };
};
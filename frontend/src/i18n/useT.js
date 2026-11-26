import { createContext, useContext } from 'react';

export const I18nContext = createContext(null);

export function useT() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useT must be used inside <LanguageProvider>');
    return ctx;
}

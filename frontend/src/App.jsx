import React, { useState } from 'react';
import { MessageCircle, BookOpen, AlertCircle, Map, Store } from 'lucide-react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import FAQSection from './components/FAQSection';
import EmergencyPanel from './components/EmergencyPanel';
import NavigationGuide from './components/NavigationGuide';
import LocalServices from './components/LocalServices';
import CountdownTimer from './components/CountdownTimer';
import TranslationNotice from './components/TranslationNotice';
import OfflineBanner from './components/OfflineBanner';
import LanguageProvider from './i18n/LanguageProvider.jsx';
import { tk } from './i18n/index.js';
import { useT } from './i18n/useT.js';
const TAB_IDS = ['chat', 'faq', 'emergency', 'navigation', 'services'];
const TAB_LABEL_KEYS = {
    chat: tk('tabs.chat'),
    faq: tk('tabs.faq'),
    emergency: tk('tabs.emergency'),
    navigation: tk('tabs.navigation'),
    services: tk('tabs.services'),
};
const TAB_ICONS = {
    chat: MessageCircle,
    faq: BookOpen,
    emergency: AlertCircle,
    navigation: Map,
    services: Store,
};
const TAB_COMPONENTS = {
    chat: ChatInterface,
    faq: FAQSection,
    emergency: EmergencyPanel,
    navigation: NavigationGuide,
    services: LocalServices,
};
export default function App() {
    return (
        <LanguageProvider>
            <AppShell />
        </LanguageProvider>
    );
}
function AppShell() {
    const [activeTab, setActiveTab] = useState('chat');
    const { lang: selectedLanguage, setLang: handleLanguageChange, t } = useT();
    const ActiveComponent = TAB_COMPONENTS[activeTab];
    const isChat = activeTab === 'chat';
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex flex-col">
            {/* Header */}
            <Header
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
            />
            {/* Main layout */}
            <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-0 sm:px-6 pb-24 sm:pb-4">
                <main className="flex-1 flex flex-col bg-white sm:rounded-xl sm:shadow-card sm:border sm:border-orange-100 sm:mt-6 overflow-hidden">
                    {/* Desktop tab strip */}
                    <div className="hidden sm:flex items-stretch px-4 py-3 gap-1.5 border-b border-orange-100">
                        {TAB_IDS.map((id) => {
                            const Icon = TAB_ICONS[id];
                            const label = t(TAB_LABEL_KEYS[id]);
                            return (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    aria-label={label}
                                    aria-current={activeTab === id ? 'page' : undefined}
                                    className={`flex-1 min-w-0 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm leading-tight text-center transition-colors duration-200 ${activeTab === id
                                        ? 'bg-orange-700 text-white shadow-sm'
                                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-800'
                                        }`}
                                >
                                    <Icon size={16} aria-hidden="true" className="flex-shrink-0" />
                                    <span className="min-w-0 break-words">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                    {/* Content */}
                    <div
                        className={`flex-1 overflow-y-auto ${isChat ? 'flex flex-col' : ''}`}
                        style={{
                            height: isChat ? 'calc(100vh - 180px)' : 'auto',
                            minHeight: !isChat ? '0' : undefined,
                        }}
                    >
                        {/* Translation draft notice (non-English languages only). Inside the content area so the chat height is unchanged. */}
                        <TranslationNotice />
                        {/* Connection status: inside the content area, so the chat height and the bottom nav are unaffected. */}
                        <OfflineBanner />
                        {/* Countdown: show at top of all non-chat tabs */}
                        {!isChat && (
                            <div className="px-4 pt-4">
                                <CountdownTimer />
                            </div>
                        )}
                        {ActiveComponent && isChat && (
                            <div className="flex-1 min-h-0">
                                <ActiveComponent
                                    selectedLanguage={selectedLanguage}
                                    onTabChange={setActiveTab}
                                />
                            </div>
                        )}
                        {ActiveComponent && !isChat && (
                            <ActiveComponent
                                selectedLanguage={selectedLanguage}
                                onTabChange={setActiveTab}
                            />
                        )}
                    </div>
                </main>
            </div>
            {/* Mobile bottom navigation */}
            <nav
                className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 shadow-raised z-40 pb-[env(safe-area-inset-bottom)]"
                aria-label={t('app.mainNav')}
            >
                <div className="flex items-stretch">
                    {TAB_IDS.map((id) => {
                        const Icon = TAB_ICONS[id];
                        const label = t(TAB_LABEL_KEYS[id]);
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                aria-label={label}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex-auto min-w-[44px] flex flex-col items-center justify-center min-h-[56px] py-2 px-1 gap-0.5 transition-colors duration-200 relative ${isActive ? 'text-orange-700' : 'text-gray-600 hover:text-orange-700'
                                    }`}
                            >
                                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full transition-colors duration-200 ${isActive ? 'bg-orange-700' : 'bg-transparent'}`} />
                                <Icon
                                    size={isActive ? 22 : 20}
                                    aria-hidden="true"
                                    className="transition-all"
                                />
                                {/* Labels wrap (never ellipsis); two lines of text-xs fit inside the pb-24 reserve above the bar */}
                                <span className={`text-xs leading-tight text-center ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
            {/* Desktop footer */}
            <footer className="hidden sm:block text-center py-4 text-xs text-gray-600">
                {t('app.footer')}
            </footer>
        </div>
    );
}

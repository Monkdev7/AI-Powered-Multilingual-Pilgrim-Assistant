import React, { useState } from 'react';
import { MessageCircle, BookOpen, AlertCircle, Map, Store } from 'lucide-react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import FAQSection from './components/FAQSection';
import EmergencyPanel from './components/EmergencyPanel';
import NavigationGuide from './components/NavigationGuide';
import LocalServices from './components/LocalServices';
import CountdownTimer from './components/CountdownTimer';
import { useLabels } from './data/uiLabels';

const TAB_IDS = ['chat', 'faq', 'emergency', 'navigation', 'services'];
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
    const [activeTab, setActiveTab] = useState('chat');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const labels = useLabels(selectedLanguage);

    const ActiveComponent = TAB_COMPONENTS[activeTab];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col">
            {/* Header */}
            <Header
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
            />

            {/* Main layout */}
            <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-0 sm:px-4 pb-20 sm:pb-4">
                <main className="flex-1 flex flex-col bg-white sm:rounded-2xl sm:shadow-md sm:border sm:border-orange-100 sm:mt-4 overflow-hidden">

                    {/* Desktop tab strip */}
                    <div className="hidden sm:flex items-center px-4 pt-3 pb-1 gap-1.5 overflow-x-auto scrollbar-hide">
                        {TAB_IDS.map((id) => {
                            const Icon = TAB_ICONS[id];
                            const label = labels.tabs[id];
                            return (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    aria-label={label}
                                    aria-current={activeTab === id ? 'page' : undefined}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === id
                                            ? 'bg-orange-500 text-white shadow-sm'
                                            : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                                        }`}
                                >
                                    <Icon size={15} aria-hidden="true" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div
                        className={`flex-1 overflow-y-auto ${activeTab === 'chat' ? 'flex flex-col' : ''}`}
                        style={{
                            height: activeTab === 'chat' ? 'calc(100vh - 180px)' : 'auto',
                            minHeight: activeTab !== 'chat' ? '0' : undefined,
                        }}
                    >
                        {/* Countdown — show at top of all non-chat tabs */}
                        {activeTab !== 'chat' && (
                            <div className="px-4 pt-4">
                                <CountdownTimer />
                            </div>
                        )}
                        {ActiveComponent && (
                            <ActiveComponent
                                selectedLanguage={selectedLanguage}
                                onTabChange={setActiveTab}
                                labels={labels}
                            />
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile bottom navigation */}
            <nav
                className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 shadow-lg z-40"
                aria-label="Main navigation"
            >
                <div className="flex items-stretch">
                    {TAB_IDS.map((id) => {
                        const Icon = TAB_ICONS[id];
                        const label = labels.tabs[id];
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                aria-label={label}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all duration-200 relative ${isActive ? 'text-orange-600' : 'text-gray-400 hover:text-orange-400'
                                    }`}
                            >
                                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full transition-all duration-200 ${isActive ? 'bg-orange-500' : 'bg-transparent'}`} />
                                <Icon
                                    size={isActive ? 22 : 20}
                                    aria-hidden="true"
                                    className="transition-all"
                                />
                                <span className={`text-xs transition-all ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Desktop footer */}
            <footer className="hidden sm:block text-center py-3 text-xs text-gray-400">
                🔱 Simhastha Pilgrim Assistant · Ujjain 2028 · Built with ❤️ for pilgrims
            </footer>
        </div>
    );
}

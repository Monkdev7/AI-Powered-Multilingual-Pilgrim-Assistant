import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, X, BookOpen, Share2 } from 'lucide-react';
import { useFreshApiGet } from '../hooks/useFreshApiGet';
import { LoadingState, ErrorState } from './ApiStates';
import { useT } from '../i18n/useT.js';
import { tk } from '../i18n/index.js';
import UnverifiedNotice from './UnverifiedNotice.jsx';
import { ALL_CATEGORIES, faqParams, categoryOptionsFrom } from '../utils/apiParams.js';

const SEARCH_DEBOUNCE_MS = 300;
const validateFaqResponse = (d) => Array.isArray(d?.faqs) && Array.isArray(d?.categories);
// Plural groups for the results line; "All" is the English-keyed filter value (also sent to the API).
const RESULT_KEYS = {
    plain: tk('faq.results'),
    category: tk('faq.resultsCategory'),
    search: tk('faq.resultsSearch'),
    categorySearch: tk('faq.resultsCategorySearch'),
};

function FAQItem({ faq, isOpen, onToggle }) {
    const { t } = useT();
    const handleShare = () => {
        const text = `*${faq.question}*\n\n${faq.answer}\n\n_${t('share.signature')}_`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className={`card overflow-hidden transition-all duration-200 ${isOpen ? '!border-orange-300 shadow-raised' : 'card-hover'}`}>
            <button
                onClick={onToggle}
                className={`w-full min-h-[48px] flex items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors ${isOpen ? 'bg-orange-50' : 'bg-white hover:bg-orange-50/60'}`}
                aria-expanded={isOpen}
            >
                <span className={`min-w-0 break-words text-sm font-semibold leading-snug ${isOpen ? 'text-orange-800' : 'text-gray-900'}`}>
                    {faq.question}
                </span>
                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${isOpen ? 'bg-orange-100' : 'bg-gray-100'}`} aria-hidden="true">
                    {isOpen ? <ChevronUp size={16} className="text-orange-700" /> : <ChevronDown size={16} className="text-gray-600" />}
                </span>
            </button>
            {isOpen && (
                <div className="bg-white border-t border-orange-100 px-4 py-4 animate-fade-in">
                    <p className="text-sm text-gray-700 leading-relaxed break-words">{faq.answer}</p>
                    <button
                        onClick={handleShare}
                        className="mt-3 -ml-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
                        aria-label={t('faq.shareAria')}
                    >
                        <Share2 size={14} aria-hidden="true" />
                        {t('faq.share')}
                    </button>
                </div>
            )}
        </div>
    );
}

// Keyed by the stable category id sent by the API (never by a translated label).
const CATEGORY_ICONS = {
    'All': '📋',
    'getting-there': '🚂',
    'accommodation': '🏕️',
    'religious-events': '🛕',
    'health-safety': '🏥',
    'general': 'ℹ️',
};

export default function FAQSection() {
    const { t, lang } = useT();
    const [openId, setOpenId] = useState(null);
    // Stable category id (or 'All'); translated labels are display-only.
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce typing so each keystroke does not trigger a backend request
    useEffect(() => {
        const q = searchQuery.trim();
        const timer = setTimeout(() => setDebouncedSearch(q), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data, error, loading, retry } = useFreshApiGet('/api/faq', {
        params: faqParams({ lang, category: selectedCategory, search: debouncedSearch }),
        validate: validateFaqResponse,
        keepPrevious: true,
    });

    // Categories come from the API response (the list is not narrowed by filters). Derived, never held in state,
    // so they disappear together with the data when the browser goes offline.
    const categories = useMemo(() => (data?.categories ? categoryOptionsFrom(data) : []), [data]);

    const faqs = data?.faqs || [];
    const faqCategories = [{ id: ALL_CATEGORIES, label: t('faq.all') }, ...categories];
    const selectedLabel = categories.find((c) => c.id === selectedCategory)?.label || selectedCategory;
    const isInitialLoad = loading && !data;
    const hasCategory = selectedCategory !== 'All';
    const resultsKey = hasCategory
        ? (debouncedSearch ? RESULT_KEYS.categorySearch : RESULT_KEYS.category)
        : (debouncedSearch ? RESULT_KEYS.search : RESULT_KEYS.plain);
    const handleToggle = (id) => {
        setOpenId((prev) => (prev === id ? null : id));
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setOpenId(null);
    };

    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        setOpenId(null);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setDebouncedSearch('');
        setOpenId(null);
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="page-header">
                <div className="text-3xl flex-shrink-0" aria-hidden="true">❓</div>
                <div className="min-w-0">
                    <h2 className="page-title">{t('faq.title')}</h2>
                    <p className="page-subtitle">{t('faq.subtitle')}</p>
                </div>
            </div>

            {/* Search bar */}
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder={t('faq.searchPlaceholder')}
                    aria-label={t('faq.searchPlaceholder')}
                    className="input-field pl-10 pr-10"
                />
                {searchQuery && (
                    <button
                        onClick={clearSearch}
                        aria-label={t('faq.clearSearch')}
                        className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:text-gray-800"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* Category filter */}
            <div>
                <div className="flex flex-wrap gap-2">
                    {faqCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            aria-pressed={selectedCategory === cat.id}
                            className={`chip ${selectedCategory === cat.id ? 'chip-active' : 'chip-idle'}`}
                        >
                            <span aria-hidden="true">{CATEGORY_ICONS[cat.id] || '📌'}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <UnverifiedNotice />
            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <BookOpen size={14} aria-hidden="true" />
                    <span>
                        {data && !error ? (
                            <>
                                {t.plural(resultsKey, faqs.length, { category: selectedLabel, query: debouncedSearch })}
                            </>
                        ) : (
                            t('faq.questions')
                        )}
                    </span>
                </p>
                {(searchQuery || selectedCategory !== 'All') && (
                    <button
                        onClick={() => { clearSearch(); handleCategoryChange('All'); }}
                        className="min-h-[40px] rounded-lg px-2 text-sm font-medium text-orange-800 hover:bg-orange-50"
                    >
                        {t('faq.clearFilters')}
                    </button>
                )}
            </div>

            {/* FAQ list */}
            {error ? (
                <ErrorState error={error} onRetry={retry} />
            ) : isInitialLoad ? (
                <LoadingState label={t('faq.loading')} />
            ) : faqs.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                    <Search size={40} className="mx-auto mb-3 text-orange-300" aria-hidden="true" />
                    <p className="font-semibold text-gray-800">{t('faq.noResults')}</p>
                    <p className="text-sm mt-1">{t('faq.noResultsHint')}</p>
                </div>
            ) : (
                <div className={`space-y-2 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
                    {faqs.map((faq) => (
                        <FAQItem
                            key={faq.id}
                            faq={faq}
                            isOpen={openId === faq.id}
                            onToggle={() => handleToggle(faq.id)}
                        />
                    ))}
                </div>
            )}
            {/* Bottom tip */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5 flex items-start gap-2.5">
                <span className="text-lg flex-shrink-0" aria-hidden="true">💬</span>
                <p className="text-sm text-gray-700">
                    {t('faq.chatTip')}
                </p>
            </div>
        </div>
    );
}

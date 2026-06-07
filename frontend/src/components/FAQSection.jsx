import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, X, BookOpen, Share2 } from 'lucide-react';
import { faqs, faqCategories } from '../data/faqs';

function FAQItem({ faq, isOpen, onToggle }) {
    const handleShare = () => {
        const text = `*${faq.question}*\n\n${faq.answer}\n\n_Simhastha Pilgrim Assistant 2028_`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isOpen ? 'border-orange-300 shadow-md' : 'border-orange-100 hover:border-orange-200'}`}>
            <button
                onClick={onToggle}
                className={`w-full flex items-start justify-between gap-3 px-4 py-4 text-left transition-colors ${isOpen ? 'bg-orange-50' : 'bg-white hover:bg-orange-50/50'}`}
                aria-expanded={isOpen}
            >
                <span className={`text-sm font-semibold leading-snug ${isOpen ? 'text-orange-700' : 'text-gray-800'}`}>
                    {faq.question}
                </span>
                <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
                    {isOpen ? <ChevronUp size={16} className="text-orange-500" /> : <ChevronDown size={16} className="text-gray-400" />}
                </span>
            </button>
            {isOpen && (
                <div className="bg-white border-t border-orange-100 px-4 py-4 animate-fade-in">
                    <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                    <button
                        onClick={handleShare}
                        className="mt-3 flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
                        aria-label="Share this answer on WhatsApp"
                    >
                        <Share2 size={12} />
                        Share on WhatsApp
                    </button>
                </div>
            )}
        </div>
    );
}

const CATEGORY_ICONS = {
    'All': '📋',
    'Getting There': '🚂',
    'Accommodation': '🏕️',
    'Religious Events': '🛕',
    'Health & Safety': '🏥',
    'General': 'ℹ️',
};

export default function FAQSection({ labels = {} }) {
    const L = labels.faq || {};
    const [openId, setOpenId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFaqs = useMemo(() => {
        let result = faqs;

        if (selectedCategory !== 'All') {
            result = result.filter((f) => f.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (f) =>
                    f.question.toLowerCase().includes(q) ||
                    f.answer.toLowerCase().includes(q)
            );
        }

        return result;
    }, [selectedCategory, searchQuery]);

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
        setOpenId(null);
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-md">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">❓</div>
                    <div>
                        <h2 className="text-lg font-bold">Frequently Asked Questions</h2>
                        <p className="text-orange-100 text-sm">{L.subtitle || 'Everything you need to know about Simhastha Kumbh 2028'}</p>
                    </div>
                </div>
            </div>

            {/* Search bar */}
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder={L.searchPlaceholder || 'Search FAQs...'}
                    className="input-field pl-10 pr-10"
                />
                {searchQuery && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Category filter */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2 min-w-max pb-1">
                    {faqCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${selectedCategory === cat
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'
                                }`}
                        >
                            <span>{CATEGORY_ICONS[cat] || '📌'}</span>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <BookOpen size={12} />
                    <span>
                        {filteredFaqs.length} question{filteredFaqs.length !== 1 ? 's' : ''}
                        {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                        {searchQuery && ` matching "${searchQuery}"`}
                    </span>
                </p>
                {(searchQuery || selectedCategory !== 'All') && (
                    <button
                        onClick={() => { clearSearch(); handleCategoryChange('All'); }}
                        className="text-xs text-orange-500 hover:text-orange-700 font-medium"
                    >
                        {L.clearFilters || 'Clear filters'}
                    </button>
                )}
            </div>

            {/* FAQ list */}
            {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Search size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{L.noResults || 'No FAQs found'}</p>
                    <p className="text-sm mt-1">{L.noResultsHint || 'Try a different search term or category'}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredFaqs.map((faq) => (
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
                <span className="text-lg flex-shrink-0">💬</span>
                <p className="text-sm text-gray-700">
                    {L.chatTip || "Didn't find your answer? Ask our AI assistant in the Chat tab — it speaks 8 languages!"}
                </p>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Info } from 'lucide-react';
import { useFreshApiGet } from '../hooks/useFreshApiGet';
import { LoadingState, ErrorState } from './ApiStates';
import { useT } from '../i18n/useT.js';
import { tk } from '../i18n/index.js';
import UnverifiedNotice from './UnverifiedNotice.jsx';
import { servicesParams } from '../utils/apiParams.js';

// The API sends no styling; card colors are keyed by service id (literal Tailwind classes)
const CATEGORY_COLORS = {
    food: 'bg-green-50 border-green-200',
    water: 'bg-blue-50 border-blue-200',
    sanitation: 'bg-purple-50 border-purple-200',
    banking: 'bg-amber-50 border-amber-200',
    charging: 'bg-yellow-50 border-yellow-200',
    'accommodation-nearby': 'bg-orange-50 border-orange-200',
};
const DEFAULT_CATEGORY_COLOR = 'bg-gray-50 border-gray-200';

const validateServicesResponse = (d) =>
    Array.isArray(d?.services) &&
    d.services.every((s) => s && typeof s.category === 'string' && Array.isArray(s.items));
function ServiceItem({ item }) {
    return (
        <div className="card card-hover p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 mb-2">
                <h4 className="min-w-0 break-words font-semibold text-gray-900 text-sm">{item.name}</h4>
                <span className="text-xs font-bold text-green-800 bg-green-100 rounded-full px-2 py-0.5">
                    {item.cost}
                </span>
            </div>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed break-words">{item.detail}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                <span className="flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0 text-orange-500" aria-hidden="true" />
                    {item.location}
                </span>
                <span className="flex items-start gap-1">
                    <Clock size={12} className="mt-0.5 flex-shrink-0 text-orange-500" aria-hidden="true" />
                    {item.timing}
                </span>
            </div>
        </div>
    );
}

function ServiceCategory({ service }) {
    const { t } = useT();
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`rounded-xl border shadow-card ${CATEGORY_COLORS[service.id] || DEFAULT_CATEGORY_COLOR} overflow-hidden transition-all duration-200`}>
            <button
                className="w-full text-left p-4 flex items-center gap-3"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
            >
                <span className="text-2xl flex-shrink-0" aria-hidden="true">{service.icon}</span>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm break-words">{service.category}</h3>
                    <p className="text-xs text-gray-700 mt-0.5">{t.plural('services.available', service.items.length)}</p>
                </div>
                <div className="flex-shrink-0" aria-hidden="true">
                    {expanded ? (
                        <ChevronUp size={16} className="text-orange-700" />
                    ) : (
                        <ChevronDown size={16} className="text-gray-600" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-gray-100 pt-3">
                    {service.warning && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                            <Info size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 break-words">{service.warning}</p>
                        </div>
                    )}
                    {service.tip && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                            <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-900 break-words">{service.tip}</p>
                        </div>
                    )}
                    {service.items.map((item, i) => (
                        <ServiceItem key={i} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Marks where the styled tab name goes inside the translated tip sentence (word order differs per language).
const TAB_SLOT = '\uE000';
function ChatTip() {
    const { t } = useT();
    const [before, after = ''] = t('services.chatTip', { chatTab: TAB_SLOT }).split(TAB_SLOT);
    return (
        <p className="text-sm text-gray-700">
            {before}
            <span className="text-orange-800 font-semibold">{t('services.chatTab')}</span>
            {after}
        </p>
    );
}
export default function LocalServices() {
    const { t, lang } = useT();
    const { data, error, loading, retry } = useFreshApiGet('/api/services', { params: servicesParams(lang), validate: validateServicesResponse });
    const services = data?.services || [];
    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="page-header">
                <div className="text-3xl flex-shrink-0" aria-hidden="true">🏘️</div>
                <div className="min-w-0">
                    <h2 className="page-title">{t('services.title')}</h2>
                    <p className="page-subtitle">{t('services.subtitle')}</p>
                </div>
            </div>

            <UnverifiedNotice />
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { icon: '🍚', labelKey: tk('services.stat.food'), count: '500+' },
                    { icon: '🚻', labelKey: tk('services.stat.toilets'), count: '1,00,000+' },
                    { icon: '🏥', labelKey: tk('services.stat.medical'), count: '40+' },
                ].map((stat) => (
                    <div key={stat.labelKey} className="card p-3 text-center">
                        <div className="text-xl mb-1" aria-hidden="true">{stat.icon}</div>
                        <div className="font-bold text-orange-800 text-sm break-words">{stat.count}</div>
                        <div className="text-xs text-gray-700 break-words">{t(stat.labelKey)}</div>
                    </div>
                ))}
            </div>

            {/* Service categories */}
            <div className="space-y-3">
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Info size={14} className="text-orange-600" aria-hidden="true" />
                    {t('services.tapHint')}
                </p>
                {error ? (
                    <ErrorState error={error} onRetry={retry} />
                ) : loading ? (
                    <LoadingState label={t('services.loading')} />
                ) : services.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                        <Info size={40} className="mx-auto mb-3 text-orange-300" aria-hidden="true" />
                        <p className="font-semibold text-gray-800">{t('services.emptyTitle')}</p>
                        <p className="text-sm mt-1">{t('services.emptyHint')}</p>
                    </div>
                ) : (
                    services.map((service) => (
                        <ServiceCategory key={service.id} service={service} />
                    ))
                )}
            </div>

            {/* Bottom tip */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5 flex items-start gap-2.5">
                <span className="text-lg flex-shrink-0" aria-hidden="true">💬</span>
                <ChatTip />
            </div>
        </div>
    );
}

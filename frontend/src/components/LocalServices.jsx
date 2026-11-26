import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Info } from 'lucide-react';
import { useApiGet } from '../hooks/useApiGet';
import { LoadingState, ErrorState } from './ApiStates';
import { useT } from '../i18n/useT.js';
import { tk } from '../i18n/index.js';
import UnverifiedNotice from './UnverifiedNotice.jsx';

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
        <div className="bg-white rounded-xl border border-gray-100 p-3.5 hover:border-orange-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
                <span className="text-xs font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5 flex-shrink-0">
                    {item.cost}
                </span>
            </div>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">{item.detail}</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <MapPin size={10} className="text-orange-400" />
                    {item.location}
                </span>
                <span className="flex items-center gap-1">
                    <Clock size={10} className="text-orange-400" />
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
        <div className={`rounded-2xl border ${CATEGORY_COLORS[service.id] || DEFAULT_CATEGORY_COLOR} overflow-hidden transition-all duration-200`}>
            <button
                className="w-full text-left p-4 flex items-center gap-3"
                onClick={() => setExpanded(!expanded)}
            >
                <span className="text-2xl flex-shrink-0">{service.icon}</span>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm">{service.category}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t.plural('services.available', service.items.length)}</p>
                </div>
                <div className="flex-shrink-0">
                    {expanded ? (
                        <ChevronUp size={16} className="text-orange-500" />
                    ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-gray-100 pt-3">
                    {service.warning && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                            <Info size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700">{service.warning}</p>
                        </div>
                    )}
                    {service.tip && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                            <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">{service.tip}</p>
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
            <span className="text-orange-600 font-semibold">{t('services.chatTab')}</span>
            {after}
        </p>
    );
}
export default function LocalServices() {
    const { t } = useT();
    const { data, error, loading, retry } = useApiGet('/api/services', { validate: validateServicesResponse });
    const services = data?.services || [];
    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-green-500 rounded-2xl p-4 text-white shadow-md">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">🏘️</div>
                    <div>
                        <h2 className="text-lg font-bold">{t('services.title')}</h2>
                        <p className="text-teal-100 text-sm">{t('services.subtitle')}</p>
                    </div>
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
                    <div key={stat.labelKey} className="bg-white border border-orange-100 rounded-xl p-3 text-center">
                        <div className="text-xl mb-1">{stat.icon}</div>
                        <div className="font-bold text-orange-600 text-sm">{stat.count}</div>
                        <div className="text-xs text-gray-500">{t(stat.labelKey)}</div>
                    </div>
                ))}
            </div>

            {/* Service categories */}
            <div className="space-y-3">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Info size={12} className="text-orange-400" />
                    {t('services.tapHint')}
                </p>
                {error ? (
                    <ErrorState error={error} onRetry={retry} />
                ) : loading ? (
                    <LoadingState label={t('services.loading')} />
                ) : services.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Info size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{t('services.emptyTitle')}</p>
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
                <span className="text-lg flex-shrink-0">💬</span>
                <ChatTip />
            </div>
        </div>
    );
}

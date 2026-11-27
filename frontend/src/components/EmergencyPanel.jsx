import React from 'react';
import {
    Shield,
    Truck,
    Flame,
    Info,
    Radio,
    UserCheck,
    Heart,
    AlertTriangle,
    Search,
    Cross,
    Phone,
    ChevronRight,
    Share2,
} from 'lucide-react';
import { useFreshApiGet } from '../hooks/useFreshApiGet';
import { LoadingState, ErrorState } from './ApiStates';
import { useT } from '../i18n/useT.js';
import { groupContacts, telHref, sourceHost } from '../utils/emergencyGroups.js';
import { emergencyParams } from '../utils/apiParams.js';

// Icon names as sent by the API
const ICON_MAP = {
    shield: Shield,
    ambulance: Truck,
    flame: Flame,
    info: Info,
    radio: Radio,
    user: UserCheck,
    heart: Heart,
    alert: AlertTriangle,
    search: Search,
    cross: Cross,
};

// The API sends only a color name; Tailwind classes are kept here as literal strings
const COLOR_STYLES = {
    blue: { bgColor: 'bg-blue-50', borderColor: 'border-blue-200', iconColor: 'text-blue-600', buttonColor: 'bg-blue-700 hover:bg-blue-800' },
    red: { bgColor: 'bg-red-50', borderColor: 'border-red-200', iconColor: 'text-red-600', buttonColor: 'bg-red-700 hover:bg-red-800' },
    orange: { bgColor: 'bg-orange-50', borderColor: 'border-orange-200', iconColor: 'text-orange-600', buttonColor: 'bg-orange-700 hover:bg-orange-800' },
    green: { bgColor: 'bg-green-50', borderColor: 'border-green-200', iconColor: 'text-green-600', buttonColor: 'bg-green-700 hover:bg-green-800' },
    purple: { bgColor: 'bg-purple-50', borderColor: 'border-purple-200', iconColor: 'text-purple-600', buttonColor: 'bg-purple-700 hover:bg-purple-800' },
    pink: { bgColor: 'bg-pink-50', borderColor: 'border-pink-200', iconColor: 'text-pink-600', buttonColor: 'bg-pink-700 hover:bg-pink-800' },
    yellow: { bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', iconColor: 'text-yellow-600', buttonColor: 'bg-yellow-700 hover:bg-yellow-800' },
    teal: { bgColor: 'bg-teal-50', borderColor: 'border-teal-200', iconColor: 'text-teal-600', buttonColor: 'bg-teal-700 hover:bg-teal-800' },
    amber: { bgColor: 'bg-amber-50', borderColor: 'border-amber-200', iconColor: 'text-amber-600', buttonColor: 'bg-amber-700 hover:bg-amber-800' },
};
const DEFAULT_COLOR_STYLE = { bgColor: 'bg-gray-50', borderColor: 'border-gray-200', iconColor: 'text-gray-600', buttonColor: 'bg-gray-700 hover:bg-gray-800' };

// Unreviewed emergency/medical content stays English in every UI language until a dedicated review
// workflow translates it. These replace the old L.* labels that existed in no language.
const PRIMARY_FALLBACK_NAME = 'National emergency number';
const HEAT_WARNING_TITLE = 'Heat Emergency Warning';
const HEAT_WARNING_TEXT = 'Ujjain in April-May reaches';
const HEAT_WARNING_RISK = 'Heatstroke is a serious risk.';

// Decorative per-detail emoji for the info cards, keyed by card id. The API sends plain
// text details, so these restore the old bullets. Each emoji is matched to a detail by its
// content (first matching rule wins), so reordering details cannot misalign them. A detail
// with no match falls back to the card's icon.
const INFO_CARD_BULLETS = {
    'lost-found': [
        [/loudspeaker/i, '\u{1F4E2}'],
        [/lost children|lost persons/i, '\u{1F466}'],
        [/Lost & Found|Sector 1/i, '\u{1F4CD}'],
        [/photo/i, '\u{1F4F8}'],
        [/band/i, '\u{1F380}'],
    ],
    medical: [
        [/heatstroke/i, '\u{1F321}'],
        [/ORS/, '\u{1F4A7}'],
        [/ambulance/i, '\u{1F691}'],
        [/free treatment/i, '\u{1F48A}'],
        [/medical camps/i, '\u{1F3E5}'],
    ],
};
const getDetailBullet = (cardId, detail) => (INFO_CARD_BULLETS[cardId] || []).find(([re]) => re.test(detail))?.[1];

const validateEmergencyResponse = (d) =>
    Array.isArray(d?.contacts) &&
    d.contacts.every((c) => c && c.id != null && typeof c.name === 'string' && typeof c.number === 'string' && (c.source == null || typeof c.source === 'object')) &&
    Array.isArray(d?.infoCards) &&
    d.infoCards.every((c) => c && c.id != null && typeof c.title === 'string' && Array.isArray(c.details) && c.details.every((x) => typeof x === 'string'));

function EmptyState({ message }) {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center" role="status">
            <p className="text-sm text-gray-600">{message}</p>
        </div>
    );
}

function ContactCard({ contact: apiContact, callLabel }) {
    const { t } = useT();
    const contact = { ...(COLOR_STYLES[apiContact.color] || DEFAULT_COLOR_STYLE), ...apiContact };
    const IconComponent = ICON_MAP[contact.icon] || Shield;
    const href = telHref(contact);
    const host = sourceHost(contact);

    return (
        <div
            className={`${contact.bgColor} ${contact.borderColor} border rounded-xl p-4 flex flex-col gap-3 shadow-card hover:shadow-raised transition-shadow duration-200 animate-fade-in`}
        >
            <div className="flex items-start gap-3">
                <div className={`${contact.bgColor} border ${contact.borderColor} rounded-xl p-2.5 flex-shrink-0`} aria-hidden="true">
                    <IconComponent size={20} className={contact.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug break-words">{contact.name}</h3>
                    <p className="text-sm text-gray-700 mt-0.5 break-words">{contact.description}</p>
                </div>
                {contact.tollFree && (
                    <span className="badge bg-green-100 text-green-800 flex-shrink-0">{t('emergency.free')}</span>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-600" aria-hidden="true" />
                    <span className="font-bold text-gray-900 text-lg tracking-wide">{contact.number}</span>
                </div>
                {href && (
                    <a
                        href={href}
                        className={`${contact.buttonColor} text-white text-sm font-semibold px-4 min-h-[44px] rounded-lg transition-colors shadow-sm inline-flex items-center justify-center gap-1.5`}
                        aria-label={t('emergency.callAria', { name: contact.name, number: contact.number })}
                    >
                        <Phone size={14} aria-hidden="true" />
                        {callLabel}
                    </a>
                )}
            </div>
            {host && (
                <p className="text-xs text-gray-700 break-words">
                    <a href={contact.source.url} target="_blank" rel="noopener noreferrer" className="underline">
                        {t('emergency.source', { source: host })}
                    </a>
                </p>
            )}
        </div>
    );
}

function InfoCard({ card: apiCard, onShare }) {
    const { t } = useT();
    const card = { ...(COLOR_STYLES[apiCard.color] || DEFAULT_COLOR_STYLE), ...apiCard };
    const IconComponent = ICON_MAP[card.icon] || Info;
    const detailPreview = card.details[0] || '';

    return (
        <div className={`${card.bgColor} ${card.borderColor} border rounded-xl p-4 shadow-card animate-fade-in`}>
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className={`${card.bgColor} border ${card.borderColor} rounded-xl p-2.5`} aria-hidden="true">
                        <IconComponent size={20} className={card.iconColor} />
                    </div>
                    <h3 className="font-bold text-gray-900 break-words">{card.title}</h3>
                </div>
                <button
                    type="button"
                    onClick={() => onShare(card)}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-white/70 hover:text-green-700 transition-colors"
                    aria-label={t('emergency.shareInfoAria', { title: card.title })}
                    title={t('emergency.shareTitle')}
                >
                    <Share2 size={16} aria-hidden="true" />
                </button>
            </div>
            <p className="text-sm text-gray-700 mb-2 break-words">{detailPreview}</p>
            <ul className="space-y-2">
                {card.details.map((detail, i) => {
                    const bullet = getDetailBullet(card.id, detail);
                    return (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            {bullet ? (
                                <span className="flex-shrink-0" aria-hidden="true">{bullet}</span>
                            ) : (
                                <IconComponent size={14} className={`flex-shrink-0 mt-0.5 ${card.iconColor}`} aria-hidden="true" />
                            )}
                            <span className="min-w-0 break-words">{detail}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

const SAFETY_TIPS = [
    'Save all emergency numbers BEFORE entering the mela grounds',
    'Keep phone charged — carry a power bank (10,000 mAh+)',
    'Designate a fixed meeting point with your group at Ram Ghat',
    'Drink 3-4 litres of water daily — Ujjain April-May heat is intense',
    'Apply sunscreen (SPF 50+) and carry an umbrella / hat',
    'Avoid going out between 11 AM–4 PM on hot days',
    'Report suspicious activity to the nearest police post immediately',
    'Carry a physical copy of your accommodation address',
];

export default function EmergencyPanel() {
    const { t, lang } = useT();
    const { data, error, loading, retry } = useFreshApiGet('/api/emergency', { params: emergencyParams(lang), validate: validateEmergencyResponse });
    const emergencyContacts = data?.contacts || [];
    const infoCards = data?.infoCards || [];
    const { primary, secondary, local } = groupContacts(emergencyContacts);
    const primaryHref = telHref(primary);
    const primaryHost = primary ? sourceHost(primary) : null;

    const shareToWhatsApp = (text) => {
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        const win = window.open(shareUrl, '_blank', 'noopener,noreferrer');
        if (win) {
            win.opener = null;
        }
    };

    const handleShareAll = () => {
        const lines = emergencyContacts.map(c => `• ${c.name}: ${c.number}`).join('\n');
        const text = `*${t('emergency.shareAllHeading')}*\n\n${lines}\n\n_${t('share.signature')}_`;
        shareToWhatsApp(text);
    };

    const handleShareInfo = (card) => {
        const text = `*${t('emergency.shareInfoHeading', { title: card.title })}*\n\n${card.details.join('\n')}\n\n_${t('share.signature')}_`;
        shareToWhatsApp(text);
    };

    return (
        <div className="p-4 space-y-6">
            {/* Header banner */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="text-3xl flex-shrink-0" aria-hidden="true">🆘</div>
                        <div className="min-w-0">
                            <h2 className="page-title">{t('emergency.title')}</h2>
                            <p className="page-subtitle">{t('emergency.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleShareAll}
                        disabled={!data}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={t('emergency.shareAllAria')}
                        title={t('emergency.shareAllTitle')}
                    >
                        <Share2 size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* Most important */}
                <div className="mt-3 bg-red-700 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs text-red-50 font-medium uppercase tracking-wide">{t('emergency.mostImportant')}</p>
                        <p className="text-white font-bold text-lg leading-snug break-words">{primary?.name || PRIMARY_FALLBACK_NAME}</p>
                    </div>
                    {primaryHref && (
                        <a
                            href={primaryHref}
                            className="bg-white text-red-700 font-extrabold px-5 min-h-[56px] rounded-lg text-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-raised flex-shrink-0"
                            aria-label={t('emergency.callAria', { name: primary.name, number: primary.number })}
                        >
                            <Phone size={20} aria-hidden="true" />
                            {primary.number}
                        </a>
                    )}
                </div>
                {primaryHost && (
                    <p className="mt-2 text-xs text-red-900 break-words">
                        <a href={primary.source.url} target="_blank" rel="noopener noreferrer" className="underline">
                            {t('emergency.source', { source: primaryHost })}
                        </a>
                    </p>
                )}
            </div>

            {/* Contacts grid */}
            <section aria-labelledby="emergency-numbers-heading">
                <h3 id="emergency-numbers-heading" className="section-title mb-3 flex items-center gap-2">
                    <Phone size={16} className="text-orange-600" aria-hidden="true" />
                    {t('emergency.numbersHeading')}
                </h3>
                {error ? (
                    <ErrorState error={error} onRetry={retry} showEmergency />
                ) : loading ? (
                    <LoadingState label={t('emergency.loading')} />
                ) : emergencyContacts.length === 0 ? (
                    <EmptyState message={t('emergency.emptyContacts')} />
                ) : (
                    <>
                        <p className="text-sm text-gray-600 mb-3">{t('emergency.listingNote')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {secondary.map((contact) => (
                                <ContactCard key={contact.id} contact={contact} callLabel={t('emergency.call')} />
                            ))}
                        </div>
                    </>
                )}
            </section>
            {/* Local directory contacts: kept apart from emergency actions */}
            {local.length > 0 && (
                <section aria-labelledby="local-contacts-heading">
                    <h3 id="local-contacts-heading" className="section-title mb-3 flex items-center gap-2">
                        <Info size={16} className="text-orange-500" aria-hidden="true" />
                        {t('emergency.localHeading')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {local.map((contact) => (
                            <ContactCard key={contact.id} contact={contact} callLabel={t('emergency.call')} />
                        ))}
                    </div>
                </section>
            )}

            {/* Info cards (same request as the contacts; shown once loaded) */}
            {data && (
                <section aria-labelledby="services-info-heading">
                    <h3 id="services-info-heading" className="section-title mb-3 flex items-center gap-2">
                        <Info size={16} className="text-orange-500" aria-hidden="true" />
                        {t('emergency.infoHeading')}
                    </h3>
                    {infoCards.length === 0 ? (
                        <EmptyState message={t('emergency.emptyInfo')} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {infoCards.map((card) => (
                                <InfoCard key={card.id} card={card} onShare={handleShareInfo} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Heat warning — Ujjain-specific */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2" id="heat-warning-heading">
                    <span aria-hidden="true">🌡️</span> {HEAT_WARNING_TITLE}
                </h3>
                <p className="text-sm text-red-800 mb-2">
                    {HEAT_WARNING_TEXT} <strong>40-43°C</strong>. {HEAT_WARNING_RISK}
                </p>
                <div className="space-y-1.5" role="list" aria-labelledby="heat-warning-heading">
                    {[
                        'Drink water every 30 minutes — even if not thirsty',
                        'Heatstroke symptoms: dizziness, no sweating, confusion — seek shade immediately',
                        'ORS packets available FREE at all sector entry gates',
                        'Heatstroke treatment centres at every major medical camp',
                    ].map((tip, i) => (
                        <div key={i} role="listitem" className="flex items-start gap-2 text-sm text-red-800">
                            <ChevronRight size={14} className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{tip}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety tips */}
            <section className="bg-amber-50 border border-amber-200 rounded-xl p-4" aria-labelledby="safety-tips-heading">
                <h3 id="safety-tips-heading" className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" aria-hidden="true" />
                    {t('emergency.safetyTips')}
                </h3>
                <div className="space-y-2" role="list" aria-labelledby="safety-tips-heading">
                    {SAFETY_TIPS.map((tip, i) => (
                        <div key={i} role="listitem" className="flex items-start gap-2 text-sm text-gray-700">
                            <ChevronRight size={14} className="text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{tip}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

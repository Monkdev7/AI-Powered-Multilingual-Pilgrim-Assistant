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
import { useApiGet } from '../hooks/useApiGet';
import { LoadingState, ErrorState } from './ApiStates';
import { useT } from '../i18n/useT.js';

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
    blue: { bgColor: 'bg-blue-50', borderColor: 'border-blue-200', iconColor: 'text-blue-600', buttonColor: 'bg-blue-500 hover:bg-blue-600' },
    red: { bgColor: 'bg-red-50', borderColor: 'border-red-200', iconColor: 'text-red-600', buttonColor: 'bg-red-500 hover:bg-red-600' },
    orange: { bgColor: 'bg-orange-50', borderColor: 'border-orange-200', iconColor: 'text-orange-600', buttonColor: 'bg-orange-500 hover:bg-orange-600' },
    green: { bgColor: 'bg-green-50', borderColor: 'border-green-200', iconColor: 'text-green-600', buttonColor: 'bg-green-500 hover:bg-green-600' },
    purple: { bgColor: 'bg-purple-50', borderColor: 'border-purple-200', iconColor: 'text-purple-600', buttonColor: 'bg-purple-500 hover:bg-purple-600' },
    pink: { bgColor: 'bg-pink-50', borderColor: 'border-pink-200', iconColor: 'text-pink-600', buttonColor: 'bg-pink-500 hover:bg-pink-600' },
    yellow: { bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', iconColor: 'text-yellow-600', buttonColor: 'bg-yellow-500 hover:bg-yellow-600' },
    teal: { bgColor: 'bg-teal-50', borderColor: 'border-teal-200', iconColor: 'text-teal-600', buttonColor: 'bg-teal-500 hover:bg-teal-600' },
    amber: { bgColor: 'bg-amber-50', borderColor: 'border-amber-200', iconColor: 'text-amber-600', buttonColor: 'bg-amber-500 hover:bg-amber-600' },
};
const DEFAULT_COLOR_STYLE = { bgColor: 'bg-gray-50', borderColor: 'border-gray-200', iconColor: 'text-gray-600', buttonColor: 'bg-gray-500 hover:bg-gray-600' };

// Stable id of the control-room contact in the /api/emergency response (shown in the banner)
const CONTROL_ROOM_CONTACT_ID = 5;
// Unreviewed emergency/medical content stays English in every UI language until a dedicated review
// workflow translates it. These replace the old L.* labels that existed in no language.
const CONTROL_ROOM_FALLBACK_NAME = 'Simhastha Control Room';
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
    d.contacts.every((c) => c && c.id != null && typeof c.name === 'string' && typeof c.number === 'string') &&
    Array.isArray(d?.infoCards) &&
    d.infoCards.every((c) => c && c.id != null && typeof c.title === 'string' && Array.isArray(c.details) && c.details.every((x) => typeof x === 'string'));

function EmptyState({ message }) {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center" role="status">
            <p className="text-sm text-gray-600">{message}</p>
        </div>
    );
}

function ContactCard({ contact: apiContact, callLabel }) {
    const { t } = useT();
    const contact = { ...(COLOR_STYLES[apiContact.color] || DEFAULT_COLOR_STYLE), ...apiContact };
    const IconComponent = ICON_MAP[contact.icon] || Shield;

    return (
        <div
            className={`${contact.bgColor} ${contact.borderColor} border rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 animate-fade-in`}
        >
            <div className="flex items-start gap-3">
                <div className={`${contact.bgColor} border ${contact.borderColor} rounded-xl p-2.5 flex-shrink-0`} aria-hidden="true">
                    <IconComponent size={20} className={contact.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{contact.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{contact.description}</p>
                </div>
                {contact.tollFree && (
                    <span className="badge bg-green-100 text-green-700 flex-shrink-0 text-xs px-2 py-0.5 rounded-full">{t('emergency.free')}</span>
                )}
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <Phone size={13} className="text-gray-500" aria-hidden="true" />
                    <span className="font-bold text-gray-800 text-base tracking-wide">{contact.number}</span>
                </div>
                <a
                    href={`tel:${contact.number.replace(/[-\s]/g, '')}`}
                    className={`${contact.buttonColor} text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm flex items-center gap-1.5`}
                    aria-label={t('emergency.callAria', { name: contact.name, number: contact.number })}
                >
                    <Phone size={12} aria-hidden="true" />
                    {callLabel}
                </a>
            </div>
        </div>
    );
}

function InfoCard({ card: apiCard, onShare }) {
    const { t } = useT();
    const card = { ...(COLOR_STYLES[apiCard.color] || DEFAULT_COLOR_STYLE), ...apiCard };
    const IconComponent = ICON_MAP[card.icon] || Info;
    const detailPreview = card.details[0] || '';

    return (
        <div className={`${card.bgColor} ${card.borderColor} border rounded-2xl p-4 animate-fade-in`}>
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                    <div className={`${card.bgColor} border ${card.borderColor} rounded-xl p-2.5`} aria-hidden="true">
                        <IconComponent size={20} className={card.iconColor} />
                    </div>
                    <h3 className="font-bold text-gray-800">{card.title}</h3>
                </div>
                <button
                    type="button"
                    onClick={() => onShare(card)}
                    className="text-gray-400 hover:text-green-500 transition-colors flex-shrink-0"
                    aria-label={t('emergency.shareInfoAria', { title: card.title })}
                    title={t('emergency.shareTitle')}
                >
                    <Share2 size={14} />
                </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">{detailPreview}</p>
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
                            <span>{detail}</span>
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
    const { t } = useT();
    const { data, error, loading, retry } = useApiGet('/api/emergency', { validate: validateEmergencyResponse });
    const emergencyContacts = data?.contacts || [];
    const infoCards = data?.infoCards || [];
    const controlRoom = emergencyContacts.find((c) => c.id === CONTROL_ROOM_CONTACT_ID);

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
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white shadow-md">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl" aria-hidden="true">🆘</div>
                        <div>
                            <h2 className="text-lg font-bold">{t('emergency.title')}</h2>
                            <p className="text-red-100 text-sm">{t('emergency.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleShareAll}
                        disabled={!data}
                        className="bg-white/20 hover:bg-white/30 text-white rounded-xl p-2 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('emergency.shareAllAria')}
                        title={t('emergency.shareAllTitle')}
                    >
                        <Share2 size={16} />
                    </button>
                </div>

                {/* Most important */}
                <div className="mt-3 bg-white/20 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs text-red-100 font-medium uppercase tracking-wide">{t('emergency.mostImportant')}</p>
                        <p className="text-white font-bold text-lg leading-tight">{controlRoom?.name || CONTROL_ROOM_FALLBACK_NAME}</p>
                    </div>
                    {controlRoom && (
                        <a
                            href={`tel:${controlRoom.number.replace(/[-\s]/g, '')}`}
                            className="bg-white text-red-600 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-red-50 transition-colors active:scale-95 shadow-sm flex-shrink-0"
                            aria-label={t('emergency.callAria', { name: controlRoom.name, number: controlRoom.number })}
                        >
                            <Phone size={14} aria-hidden="true" />
                            {controlRoom.number}
                        </a>
                    )}
                </div>
            </div>

            {/* Contacts grid */}
            <section aria-labelledby="emergency-numbers-heading">
                <h3 id="emergency-numbers-heading" className="section-title mb-3 flex items-center gap-2">
                    <Phone size={16} className="text-orange-500" aria-hidden="true" />
                    {t('emergency.numbersHeading')}
                </h3>
                {error ? (
                    <ErrorState error={error} onRetry={retry} />
                ) : loading ? (
                    <LoadingState label={t('emergency.loading')} />
                ) : emergencyContacts.length === 0 ? (
                    <EmptyState message={t('emergency.emptyContacts')} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {emergencyContacts.map((contact) => (
                            <ContactCard key={contact.id} contact={contact} callLabel={t('emergency.call')} />
                        ))}
                    </div>
                )}
            </section>

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
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2" id="heat-warning-heading">
                    <span aria-hidden="true">🌡️</span> {HEAT_WARNING_TITLE}
                </h3>
                <p className="text-sm text-red-700 mb-2">
                    {HEAT_WARNING_TEXT} <strong>40-43°C</strong>. {HEAT_WARNING_RISK}
                </p>
                <div className="space-y-1.5" role="list" aria-labelledby="heat-warning-heading">
                    {[
                        'Drink water every 30 minutes — even if not thirsty',
                        'Heatstroke symptoms: dizziness, no sweating, confusion — seek shade immediately',
                        'ORS packets available FREE at all sector entry gates',
                        'Heatstroke treatment centres at every major medical camp',
                    ].map((tip, i) => (
                        <div key={i} role="listitem" className="flex items-start gap-2 text-sm text-red-700">
                            <ChevronRight size={14} className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{tip}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety tips */}
            <section className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4" aria-labelledby="safety-tips-heading">
                <h3 id="safety-tips-heading" className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
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

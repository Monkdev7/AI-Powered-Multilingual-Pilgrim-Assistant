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
import { emergencyContacts, infoCards } from '../data/emergencyContacts';

const ICON_MAP = {
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
};

function ContactCard({ contact, callLabel }) {
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
                    <span className="badge bg-green-100 text-green-700 flex-shrink-0 text-xs px-2 py-0.5 rounded-full">Free</span>
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
                    aria-label={`Call ${contact.name} at ${contact.number}`}
                >
                    <Phone size={12} aria-hidden="true" />
                    {callLabel || 'Call'}
                </a>
            </div>
        </div>
    );
}

function InfoCard({ card, onShare }) {
    const IconComponent = ICON_MAP[card.icon] || Info;
    const firstDetail = card.details[0] || '';
    const detailPreview = firstDetail.includes(' ') ? firstDetail.split(' ').slice(1).join(' ') : firstDetail;

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
                    aria-label={`Share ${card.title} on WhatsApp`}
                    title="Share on WhatsApp"
                >
                    <Share2 size={14} />
                </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">{detailPreview}</p>
            <ul className="space-y-2">
                {card.details.map((detail, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5" aria-hidden="true">{detail.split(' ')[0]}</span>
                        <span>{detail.includes(' ') ? detail.split(' ').slice(1).join(' ') : detail}</span>
                    </li>
                ))}
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

export default function EmergencyPanel({ labels = {} }) {
    const L = labels.emergency || {};

    const shareToWhatsApp = (text) => {
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        const win = window.open(shareUrl, '_blank', 'noopener,noreferrer');
        if (win) {
            win.opener = null;
        }
    };

    const handleShareAll = () => {
        const lines = emergencyContacts.map(c => `• ${c.name}: ${c.number}`).join('\n');
        const text = `*Emergency Contacts — Simhastha Kumbh 2028, Ujjain*\n\n${lines}\n\n_Simhastha Pilgrim Assistant 2028_`;
        shareToWhatsApp(text);
    };

    const handleShareInfo = (card) => {
        const text = `*${card.title} — Simhastha 2028*\n\n${card.details.join('\n')}\n\n_Simhastha Pilgrim Assistant 2028_`;
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
                            <h2 className="text-lg font-bold">{L.title || 'Emergency Contacts'}</h2>
                            <p className="text-red-100 text-sm">{L.subtitle || 'All services available 24/7 — save these numbers!'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleShareAll}
                        className="bg-white/20 hover:bg-white/30 text-white rounded-xl p-2 transition-colors flex-shrink-0"
                        aria-label="Share all emergency contacts on WhatsApp"
                        title="Share all contacts on WhatsApp"
                    >
                        <Share2 size={16} />
                    </button>
                </div>

                {/* Most important */}
                <div className="mt-3 bg-white/20 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs text-red-100 font-medium uppercase tracking-wide">{L.mostImportant || 'Most Important'}</p>
                        <p className="text-white font-bold text-lg leading-tight">{L.controlRoomLabel || 'Simhastha Control Room'}</p>
                    </div>
                    <a
                        href="tel:07342551234"
                        className="bg-white text-red-600 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-red-50 transition-colors active:scale-95 shadow-sm flex-shrink-0"
                        aria-label="Call Simhastha Control Room at 0734-2551234"
                    >
                        <Phone size={14} aria-hidden="true" />
                        0734-2551234
                    </a>
                </div>
            </div>

            {/* Contacts grid */}
            <section aria-labelledby="emergency-numbers-heading">
                <h3 id="emergency-numbers-heading" className="section-title mb-3 flex items-center gap-2">
                    <Phone size={16} className="text-orange-500" aria-hidden="true" />
                    {L.numbersHeading || 'Emergency Numbers'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {emergencyContacts.map((contact) => (
                        <ContactCard key={contact.id} contact={contact} callLabel={L.call} />
                    ))}
                </div>
            </section>

            {/* Info cards */}
            <section aria-labelledby="services-info-heading">
                <h3 id="services-info-heading" className="section-title mb-3 flex items-center gap-2">
                    <Info size={16} className="text-orange-500" aria-hidden="true" />
                    {L.infoHeading || 'Services & Information'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {infoCards.map((card) => (
                        <InfoCard key={card.id} card={card} onShare={handleShareInfo} />
                    ))}
                </div>
            </section>

            {/* Heat warning — Ujjain-specific */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2" id="heat-warning-heading">
                    <span aria-hidden="true">🌡️</span> {L.heatWarningTitle || 'Heat Emergency Warning'}
                </h3>
                <p className="text-sm text-red-700 mb-2">
                    {L.heatWarningText || 'Ujjain in April-May reaches'} <strong>40-43°C</strong>. {L.heatWarningRisk || 'Heatstroke is a serious risk.'}
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
                    {L.safetyTips || 'Quick Safety Tips'}
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

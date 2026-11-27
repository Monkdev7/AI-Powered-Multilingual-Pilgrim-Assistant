import React, { useState } from 'react';
import { MapPin, Calendar, Navigation, Lightbulb, Clock, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { ghats, transportOptions, navigationTips } from '../data/navigationData';
import { useT } from '../i18n/useT.js';
import { tk } from '../i18n/index.js';
import ProposedLabel from './ProposedLabel.jsx';
import { PROPOSED_SNAN_PLAN } from '../constants/facts.js';
import { withoutUnsourcedArrivalAdvice, isUnsourcedArrivalAdvice } from '../utils/arrivalAdvice.js';
// Only static controls and headings are translated here. Ghat facts, dates, distances, transport and
// tips content (and the advice boxes built from them) stay English until the factual-review phase.

function GhatCard({ ghat }) {
    const { t } = useT();
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={`card card-hover ${ghat.highlight ? '!border-orange-300 !bg-orange-50' : ''}`}
        >
            <button
                className="w-full text-left p-4"
                onClick={() => setExpanded(!expanded)}
                type="button"
                aria-expanded={expanded}
                aria-label={t('nav.ghat.details', { name: ghat.name })}
            >
                <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0" aria-hidden="true">{ghat.icon}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm break-words">{ghat.name}</h3>
                            {ghat.highlight && (
                                <span className="badge bg-orange-700 text-white">
                                    {t('nav.ghat.mostSacred')}
                                </span>
                            )}
                        </div>
                        <p className="text-orange-800 text-xs font-medium mt-0.5">{ghat.hindi}</p>
                        <p className="text-gray-700 text-xs mt-1 leading-relaxed break-words">{ghat.significance}</p>
                    </div>
                    <div className="flex-shrink-0" aria-hidden="true">
                        {expanded ? (
                            <ChevronUp size={16} className="text-orange-700" />
                        ) : (
                            <ChevronDown size={16} className="text-gray-600" />
                        )}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 border-t border-orange-100 pt-3 space-y-2 animate-fade-in">
                    <div className="flex items-start gap-2 text-xs text-gray-700">
                        <Clock size={12} className="text-orange-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="min-w-0 break-words"><strong>{t('nav.ghat.timing')}</strong> {ghat.timing}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-700">
                        <MapPin size={12} className="text-orange-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="min-w-0 break-words"><strong>{t('nav.ghat.distance')}</strong> {ghat.distance}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-700">
                        <Lightbulb size={12} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="min-w-0 break-words"><strong>{t('nav.ghat.tip')}</strong> {withoutUnsourcedArrivalAdvice(ghat.tips)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function TransportCard({ option }) {
    const { t } = useT();
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="card card-hover">
            <button
                className="w-full rounded-xl p-4 text-left"
                onClick={() => setExpanded(!expanded)}
                type="button"
                aria-expanded={expanded}
                aria-label={t('nav.transport.travelDetails', { mode: option.mode })}
            >
                {/* Icon | text region (name, route, price) | chevron. The text region wraps; the price sits under the route on narrow widths. */}
                <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0" aria-hidden="true">{option.icon}</div>
                    <div className="min-w-0 flex-1 sm:flex sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                            <h3 className="break-words text-sm font-bold text-gray-900">{option.mode}</h3>
                            <p className="mt-0.5 break-words text-xs leading-relaxed text-gray-600">{option.from} → {option.to}</p>
                        </div>
                        <p className="mt-1.5 break-words text-sm font-semibold text-orange-800 sm:mt-0 sm:max-w-[45%] sm:flex-shrink-0 sm:text-right">{option.cost}</p>
                    </div>
                    <span className="flex-shrink-0 pt-0.5" aria-hidden="true">
                        {expanded ? (
                            <ChevronUp size={16} className="text-orange-700" />
                        ) : (
                            <ChevronDown size={16} className="text-gray-600" />
                        )}
                    </span>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-orange-100 px-4 pb-4 pt-3 animate-fade-in">
                    <div className="mb-3 grid grid-cols-1 gap-3 text-xs min-[400px]:grid-cols-2">
                        <div className="min-w-0 rounded-lg bg-orange-50 p-2.5">
                            <div className="mb-1 flex items-center gap-1 font-medium text-orange-800">
                                <Clock size={12} aria-hidden="true" />
                                {t('nav.transport.duration')}
                            </div>
                            <p className="break-words text-gray-800">{option.duration}</p>
                        </div>
                        <div className="min-w-0 rounded-lg bg-orange-50 p-2.5">
                            <div className="mb-1 flex items-center gap-1 font-medium text-orange-800">
                                <DollarSign size={12} aria-hidden="true" />
                                {t('nav.transport.cost')}
                            </div>
                            <p className="break-words text-gray-800">{option.cost}</p>
                        </div>
                    </div>
                    <div>
                        <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-800">
                            <Lightbulb size={12} className="text-amber-500" aria-hidden="true" />
                            {t('nav.transport.tips')}
                        </p>
                        <ul className="space-y-1.5">
                            {option.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                                    <span className="flex-shrink-0 text-orange-500" aria-hidden="true">•</span>
                                    <span className="min-w-0 break-words">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NavigationGuide() {
    const { t, formatDate } = useT();
    const [activeSection, setActiveSection] = useState('ghats');

    const sections = [
        { id: 'ghats', labelKey: tk('nav.section.ghats'), icon: '🌊' },
        { id: 'dates', labelKey: tk('nav.section.dates'), icon: '📅' },
        { id: 'transport', labelKey: tk('nav.section.transport'), icon: '🚂' },
        { id: 'map', labelKey: tk('nav.section.map'), icon: '📍' },
        { id: 'tips', labelKey: tk('nav.section.tips'), icon: '💡' },
    ];

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="page-header">
                <div className="text-3xl flex-shrink-0" aria-hidden="true">🗺️</div>
                <div className="min-w-0">
                    <h2 className="page-title">{t('navigation.title')}</h2>
                    <p className="page-subtitle">{t('navigation.subtitle')}</p>
                </div>
            </div>

            {/* Section tabs */}
            <div className="flex flex-wrap gap-2">
                {sections.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveSection(s.id)}
                        aria-pressed={activeSection === s.id}
                        className={`chip ${activeSection === s.id ? 'chip-active' : 'chip-idle'}`}
                    >
                        <span aria-hidden="true">{s.icon}</span>
                        {t(s.labelKey)}
                    </button>
                ))}
            </div>

            {/* Ghats section */}
            {activeSection === 'ghats' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-orange-600" aria-hidden="true" />
                        <h3 className="section-title">{t('nav.ghats.heading')}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{t('nav.ghats.hint')}</p>
                    {ghats.map((ghat) => (
                        <GhatCard key={ghat.id} ghat={ghat} />
                    ))}
                </div>
            )}

            {/* Dates section */}
            {activeSection === 'dates' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-orange-600" aria-hidden="true" />
                        <h3 className="section-title">{t('nav.dates.heading')}</h3>
                    </div>
                    <ProposedLabel className="text-amber-800 font-semibold" />
                    <div className="notice">
                        <span className="text-lg flex-shrink-0" aria-hidden="true">⚠️</span>
                        <p data-testid="crowd-notice">{t('nav.dates.crowdNotice')}</p>
                    </div>
                    <div className="notice">
                        <p data-testid="proposed-dates-notice">
                            {t('nav.dates.proposedNotice', {
                                shahi: PROPOSED_SNAN_PLAN.shahi,
                                parv: PROPOSED_SNAN_PLAN.parv,
                                fromDate: formatDate(PROPOSED_SNAN_PLAN.from, { day: 'numeric', month: 'long' }),
                                toDate: formatDate(PROPOSED_SNAN_PLAN.to, { day: 'numeric', month: 'long', year: 'numeric' }),
                            })}
                        </p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm font-bold text-gray-900 mb-1">📅 Simhastha Kumbh 2028 Full Duration</p>
                        <p className="text-sm text-gray-700">March 27, 2028 (Chaitra Purnima) — May 27, 2028 (Vaisakh Purnima)</p>
                        <p className="text-sm text-gray-600 mt-1">Ujjain, Madhya Pradesh · Kshipra River</p>
                        <ProposedLabel className="text-amber-800 mt-1" />
                    </div>
                </div>
            )}

            {/* Transport section */}
            {activeSection === 'transport' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Navigation size={16} className="text-orange-600" aria-hidden="true" />
                        <h3 className="section-title">{t('nav.transport.heading')}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{t('nav.transport.hint')}</p>
                    {transportOptions.map((option) => (
                        <TransportCard key={option.id} option={option} />
                    ))}
                </div>
            )}

            {/* Map section */}
            {activeSection === 'map' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-orange-600" aria-hidden="true" />
                        <h3 className="section-title">{t('nav.map.heading')}</h3>
                    </div>

                    {/* Google Maps embed — Ram Ghat, Ujjain */}
                    <div className="rounded-xl overflow-hidden border border-orange-200 shadow-card">
                        <iframe
                            title={t('nav.map.iframeTitle')}
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3667.5!2d75.7692!3d23.1765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39637469de000001%3A0x9f67d93e3e0e9a5b!2sRam%20Ghat%2C%20Ujjain!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                            width="100%"
                            height="300"
                            style={{ border: 0, display: 'block' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>

                    {/* Key locations */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            <MapPin size={14} className="text-orange-600" aria-hidden="true" />
                            {t('nav.map.keyLocations')}
                        </p>
                        {[
                            { icon: '🌊', name: 'Ram Ghat (Principal Bathing Ghat)', dist: '2 km from station', color: 'bg-orange-50 border-orange-200' },
                            { icon: '🔱', name: 'Mahakaleshwar Jyotirlinga Temple', dist: '1.5 km from station', color: 'bg-purple-50 border-purple-200' },
                            { icon: '🚂', name: 'Ujjain Junction Railway Station', dist: 'City center', color: 'bg-blue-50 border-blue-200' },
                            { icon: '🌳', name: 'Siddhavat Ghat (Pind Daan)', dist: '5 km from station', color: 'bg-green-50 border-green-200' },
                            { icon: '✈️', name: 'Indore Airport (Nearest)', dist: '55 km from Ujjain', color: 'bg-sky-50 border-sky-200' },
                        ].map((loc) => (
                            <div key={loc.name} className={`${loc.color} border rounded-xl px-3 py-2.5 flex items-center gap-3`}>
                                <span className="text-lg flex-shrink-0" aria-hidden="true">{loc.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 break-words">{loc.name}</p>
                                    <p className="text-xs text-gray-600">{loc.dist}</p>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/${encodeURIComponent(loc.name + ' Ujjain')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-[40px] min-w-[40px] flex-shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-white px-3 py-1 text-sm font-semibold text-orange-800 hover:bg-orange-50"
                                    aria-label={t('nav.map.openInMaps', { name: loc.name })}
                                >
                                    {t('nav.map.mapsLink')}
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Offline map tip */}
                    <div className="notice">
                        <span className="text-lg flex-shrink-0" aria-hidden="true">📵</span>
                        <p>
                            <strong>Download offline map</strong> before visiting — open Google Maps, search "Ujjain" and tap Download. Mobile data is unreliable in crowded mela grounds.
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation Tips section */}
            {activeSection === 'tips' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Lightbulb size={16} className="text-orange-600" aria-hidden="true" />
                        <h3 className="section-title">{t('nav.tips.heading')}</h3>
                    </div>
                    <div className="space-y-2.5">
                        {navigationTips.filter((item) => !isUnsourcedArrivalAdvice(item.tip)).map((item, i) => (
                            <div
                                key={i}
                                className="card card-hover p-4 flex items-start gap-3 animate-fade-in"
                            >
                                <div className="text-xl flex-shrink-0" aria-hidden="true">{item.icon}</div>
                                <p className="text-sm text-gray-700 leading-relaxed">{item.tip}</p>
                            </div>
                        ))}
                    </div>

                    {/* Sector map info */}
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 mt-4">
                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                            🗺️ Mela Sector Map
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">
                            The Kumbh Mela grounds are divided into numbered sectors. Each sector has:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                ['🏥', 'Medical camp'],
                                ['🚻', 'Toilet blocks'],
                                ['💧', 'Drinking water'],
                                ['👮', 'Police post'],
                                ['🔦', 'Lost & Found'],
                                ['🍚', 'Food counter'],
                            ].map(([icon, label]) => (
                                <div key={label} className="flex items-center gap-1.5 text-sm text-gray-700">
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-orange-800 font-medium mt-3">
                            📱 Collect the free paper map at any mela entry gate
                        </p>
                    </div>

                    <section className="card p-4" aria-labelledby="ujjain-map-heading">
                        <h4 id="ujjain-map-heading" className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                            {t('nav.liveMap.heading')}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">
                            {t('nav.liveMap.description')}
                        </p>
                        <div className="rounded-lg overflow-hidden border border-orange-200 bg-orange-50">
                            <iframe
                                title={t('nav.liveMap.iframeTitle')}
                                src="https://www.google.com/maps?q=Ujjain,+Madhya+Pradesh&output=embed"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-64"
                                allowFullScreen
                            />
                        </div>
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=Ram+Ghat,+Ujjain"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary mt-3"
                            aria-label={t('nav.liveMap.directions')}
                        >
                            {t('nav.liveMap.directions')}
                        </a>
                    </section>
                </div>
            )}
        </div>
    );
}

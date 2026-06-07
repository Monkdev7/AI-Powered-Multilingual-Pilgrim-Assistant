import React, { useState } from 'react';
import { MapPin, Calendar, Navigation, Lightbulb, Clock, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { ghats, shahiSnanDates, transportOptions, navigationTips } from '../data/navigationData';

function GhatCard({ ghat }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${ghat.highlight
                ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md'
                : 'border-orange-100 bg-white hover:border-orange-200 hover:shadow-sm'
                }`}
        >
            <button
                className="w-full text-left p-4"
                onClick={() => setExpanded(!expanded)}
                type="button"
                aria-expanded={expanded}
                aria-label={`${ghat.name} details`}
            >
                <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{ghat.icon}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-800 text-sm">{ghat.name}</h3>
                            {ghat.highlight && (
                                <span className="badge bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    Most Sacred
                                </span>
                            )}
                        </div>
                        <p className="text-orange-600 text-xs font-medium mt-0.5">{ghat.hindi}</p>
                        <p className="text-gray-600 text-xs mt-1 leading-relaxed">{ghat.significance}</p>
                    </div>
                    <div className="flex-shrink-0">
                        {expanded ? (
                            <ChevronUp size={16} className="text-orange-400" />
                        ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                        )}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 border-t border-orange-100 pt-3 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock size={12} className="text-orange-400 flex-shrink-0" />
                        <span><strong>Timing:</strong> {ghat.timing}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin size={12} className="text-orange-400 flex-shrink-0" />
                        <span><strong>Distance:</strong> {ghat.distance}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                        <Lightbulb size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <span><strong>Tip:</strong> {ghat.tips}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function DateCard({ date }) {
    return (
        <div className={`bg-gradient-to-r ${date.color} rounded-2xl p-4 text-white shadow-md animate-fade-in`}>
            <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{date.icon}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base">{date.name}</h3>
                        <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            {date.importance}
                        </span>
                    </div>
                    <p className="text-white/80 text-xs mb-1.5">{date.hindi}</p>
                    <div className="bg-white/20 rounded-lg px-3 py-2 mb-2">
                        <p className="font-bold text-base">{date.date}</p>
                        <p className="text-white/80 text-xs">{date.day}</p>
                    </div>
                    <p className="text-white/90 text-xs leading-relaxed">{date.significance}</p>
                </div>
            </div>
        </div>
    );
}

function TransportCard({ option }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white border border-orange-100 rounded-2xl overflow-hidden hover:border-orange-200 hover:shadow-sm transition-all">
            <button
                className="w-full text-left p-4"
                onClick={() => setExpanded(!expanded)}
                type="button"
                aria-expanded={expanded}
                aria-label={`${option.mode} travel details`}
            >
                <div className="flex items-center gap-3">
                    <div className="text-2xl">{option.icon}</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm">{option.mode}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{option.from} → {option.to}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-orange-600">{option.cost}</p>
                        {expanded ? (
                            <ChevronUp size={14} className="text-gray-400 ml-auto mt-1" />
                        ) : (
                            <ChevronDown size={14} className="text-gray-400 ml-auto mt-1" />
                        )}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-orange-100 px-4 pb-4 pt-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                        <div className="bg-orange-50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1 text-orange-600 font-medium mb-1">
                                <Clock size={11} />
                                Duration
                            </div>
                            <p className="text-gray-700">{option.duration}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1 text-orange-600 font-medium mb-1">
                                <DollarSign size={11} />
                                Cost
                            </div>
                            <p className="text-gray-700">{option.cost}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Lightbulb size={12} className="text-amber-400" />
                            Tips
                        </p>
                        <ul className="space-y-1.5">
                            {option.tips.map((tip, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <span className="text-orange-400 flex-shrink-0">•</span>
                                    {tip}
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
    const [activeSection, setActiveSection] = useState('ghats');

    const sections = [
        { id: 'ghats', label: 'Ghats', icon: '🌊' },
        { id: 'dates', label: 'Snan Dates', icon: '📅' },
        { id: 'transport', label: 'Transport', icon: '🚂' },
        { id: 'map', label: 'Map', icon: '📍' },
        { id: 'tips', label: 'Nav Tips', icon: '💡' },
    ];

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl p-4 text-white shadow-md">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">🗺️</div>
                    <div>
                        <h2 className="text-lg font-bold">Navigation Guide</h2>
                        <p className="text-blue-100 text-sm">Ghats, dates, transport & navigation tips</p>
                    </div>
                </div>
            </div>

            {/* Section tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {sections.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveSection(s.id)}
                        aria-pressed={activeSection === s.id}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all duration-200 flex-shrink-0 ${activeSection === s.id
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'
                            }`}
                    >
                        <span>{s.icon}</span>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Ghats section */}
            {activeSection === 'ghats' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-orange-500" />
                        <h3 className="section-title">Key Ghats at Ujjain</h3>
                    </div>
                    <p className="text-xs text-gray-500">Tap any ghat for details, timings, and tips</p>
                    {ghats.map((ghat) => (
                        <GhatCard key={ghat.id} ghat={ghat} />
                    ))}
                </div>
            )}

            {/* Dates section */}
            {activeSection === 'dates' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-orange-500" />
                        <h3 className="section-title">Amrit Snan Bathing Dates 2028</h3>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">⚠️</span>
                        <p className="text-xs text-amber-800">
                            These dates see <strong>massive crowds</strong> of tens of millions. Plan accommodation and travel
                            well in advance. Arrive at ghats by <strong>4-5 AM</strong> on Amrit Snan days.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {shahiSnanDates.map((date) => (
                            <DateCard key={date.id} date={date} />
                        ))}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                        <p className="text-xs font-bold text-blue-800 mb-1">📅 Simhastha Kumbh 2028 Full Duration</p>
                        <p className="text-xs text-blue-700">March 27, 2028 (Chaitra Purnima) — May 27, 2028 (Vaisakh Purnima)</p>
                        <p className="text-xs text-blue-600 mt-1">Total: 62 days · Ujjain, Madhya Pradesh · Kshipra River</p>
                    </div>
                </div>
            )}

            {/* Transport section */}
            {activeSection === 'transport' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Navigation size={16} className="text-orange-500" />
                        <h3 className="section-title">Transport Options</h3>
                    </div>
                    <p className="text-xs text-gray-500">Tap any option for detailed tips and booking info</p>
                    {transportOptions.map((option) => (
                        <TransportCard key={option.id} option={option} />
                    ))}
                </div>
            )}

            {/* Map section */}
            {activeSection === 'map' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-orange-500" />
                        <h3 className="section-title">Ujjain Mela Area Map</h3>
                    </div>

                    {/* Google Maps embed — Ram Ghat, Ujjain */}
                    <div className="rounded-2xl overflow-hidden border border-orange-200 shadow-md">
                        <iframe
                            title="Ujjain Ram Ghat - Simhastha 2028 Location"
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
                        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                            <MapPin size={12} className="text-orange-500" />
                            Key Locations in Ujjain
                        </p>
                        {[
                            { icon: '🌊', name: 'Ram Ghat (Principal Bathing Ghat)', dist: '2 km from station', color: 'bg-orange-50 border-orange-200' },
                            { icon: '🔱', name: 'Mahakaleshwar Jyotirlinga Temple', dist: '1.5 km from station', color: 'bg-purple-50 border-purple-200' },
                            { icon: '🚂', name: 'Ujjain Junction Railway Station', dist: 'City center', color: 'bg-blue-50 border-blue-200' },
                            { icon: '🌳', name: 'Siddhavat Ghat (Pind Daan)', dist: '5 km from station', color: 'bg-green-50 border-green-200' },
                            { icon: '✈️', name: 'Indore Airport (Nearest)', dist: '55 km from Ujjain', color: 'bg-sky-50 border-sky-200' },
                        ].map((loc) => (
                            <div key={loc.name} className={`${loc.color} border rounded-xl px-3 py-2.5 flex items-center gap-3`}>
                                <span className="text-lg flex-shrink-0">{loc.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{loc.name}</p>
                                    <p className="text-xs text-gray-500">{loc.dist}</p>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/${encodeURIComponent(loc.name + ' Ujjain')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-orange-600 font-semibold hover:text-orange-700 flex-shrink-0 bg-white border border-orange-200 rounded-lg px-2 py-1"
                                    aria-label={`Open ${loc.name} in Google Maps`}
                                >
                                    Maps ↗
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Offline map tip */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                        <span className="text-lg flex-shrink-0">📵</span>
                        <p className="text-sm text-amber-800">
                            <strong>Download offline map</strong> before visiting — open Google Maps, search "Ujjain" and tap Download. Mobile data is unreliable in crowded mela grounds.
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation Tips section */}
            {activeSection === 'tips' && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Lightbulb size={16} className="text-orange-500" />
                        <h3 className="section-title">Navigation Tips</h3>
                    </div>
                    <div className="space-y-2.5">
                        {navigationTips.map((item, i) => (
                            <div
                                key={i}
                                className="bg-white border border-orange-100 rounded-xl p-4 flex items-start gap-3 hover:border-orange-200 hover:shadow-sm transition-all animate-fade-in"
                            >
                                <div className="text-xl flex-shrink-0">{item.icon}</div>
                                <p className="text-sm text-gray-700 leading-relaxed">{item.tip}</p>
                            </div>
                        ))}
                    </div>

                    {/* Sector map info */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 mt-4">
                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                            🗺️ Mela Sector Map
                        </h4>
                        <p className="text-xs text-gray-700 mb-3">
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
                                <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-orange-600 font-medium mt-3">
                            📱 Collect the free paper map at any mela entry gate
                        </p>
                    </div>

                    <section className="bg-white border border-blue-100 rounded-2xl p-4" aria-labelledby="ujjain-map-heading">
                        <h4 id="ujjain-map-heading" className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                            📍 Ujjain Live Map
                        </h4>
                        <p className="text-xs text-gray-600 mb-3">
                            Use this map to orient yourself around Ujjain and quickly open routes to Ram Ghat, Mahakaleshwar, and key mela sectors.
                        </p>
                        <div className="rounded-xl overflow-hidden border border-blue-200 bg-blue-50">
                            <iframe
                                title="Ujjain city map"
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
                            className="inline-flex mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800"
                            aria-label="Open Ram Ghat directions in Google Maps"
                        >
                            Open Ram Ghat directions in Google Maps
                        </a>
                    </section>
                </div>
            )}
        </div>
    );
}

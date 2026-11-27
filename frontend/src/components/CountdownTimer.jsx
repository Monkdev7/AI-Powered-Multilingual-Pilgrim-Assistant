import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useT } from '../i18n/useT.js';
import { tk } from '../i18n/index.js';
import { SIMHASTHA_START_ISO } from '../constants/event.js';
import { TEMPLE_PORTAL_URL } from '../constants/facts.js';
import ProposedLabel from './ProposedLabel.jsx';
// Simhastha 2028 start: March 27, 2028
const SIMHASTHA_START = new Date('2028-03-27T00:00:00');
const SIMHASTHA_END = new Date('2028-05-27T23:59:59');
const START_DATE_FORMAT = { year: 'numeric', month: 'short', day: 'numeric' };
function getTimeLeft() {
    const now = new Date();
    if (now >= SIMHASTHA_END) return { ended: true };
    if (now >= SIMHASTHA_START) return { ongoing: true };
    const diff = SIMHASTHA_START - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
}
// The digits are Latin and have no stacked marks, so they opt out (!) of the Indic 1.6 line-height override.
function TimeUnit({ value, label }) {
    return (
        <div className="flex min-w-0 flex-1 flex-col items-center">
            <div className="w-full max-w-[72px] rounded-lg bg-black/20 px-1 py-2 text-center">
                <span className="text-2xl font-bold text-white !leading-none">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="mt-1 break-words text-center text-xs font-medium text-orange-50">{label}</span>
        </div>
    );
}
export default function CountdownTimer({ compact = false }) {
    const { t, formatDate } = useT();
    const [timeLeft, setTimeLeft] = useState(getTimeLeft());
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const startDate = formatDate(SIMHASTHA_START_ISO, START_DATE_FORMAT);
    if (timeLeft.ended) {
        return (
            <div className="bg-gray-700 rounded-xl p-3 text-white text-center shadow-card">
                <p className="font-bold text-sm">{t('countdown.concluded')}</p>
            </div>
        );
    }
    if (timeLeft.ongoing) {
        return (
            <div className="bg-green-700 rounded-xl p-3 text-white shadow-card">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse flex-shrink-0"></div>
                    <p className="font-bold text-sm">{t('countdown.live')}</p>
                </div>
            </div>
        );
    }
    // Compact mode: single line for chat tab
    if (compact) {
        return (
            <div className="bg-orange-700 rounded-xl px-4 py-2.5 shadow-card flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0" aria-hidden="true">⏳</span>
                    <div className="min-w-0">
                        <p className="text-white font-bold text-sm break-words">{t('countdown.beginsInShort')}</p>
                        <p className="text-orange-50 text-xs">{t('countdown.dateCompact', { date: startDate })}</p>
                        <ProposedLabel className="text-orange-50" />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {[
                        { v: timeLeft.days, l: 'd', k: tk('countdown.dayShort') },
                        { v: timeLeft.hours, l: 'h', k: tk('countdown.hourShort') },
                        { v: timeLeft.minutes, l: 'm', k: tk('countdown.minuteShort') },
                        { v: timeLeft.seconds, l: 's', k: tk('countdown.secondShort') },
                    ].map(({ v, l, k }, i) => (
                        <React.Fragment key={l}>
                            {i > 0 && <span className="text-white text-xs">:</span>}
                            <div className="bg-black/20 rounded-lg px-1.5 py-1 text-center min-w-[30px]">
                                <span className="text-white font-bold text-sm !leading-none">
                                    {String(v).padStart(2, '0')}
                                </span>
                                <span className="text-orange-50 text-xs block leading-none">{t(k)}</span>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }
    // Full mode: for other tabs
    return (
        <div className="bg-orange-700 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xl" aria-hidden="true">⏳</span>
                <div>
                    <p className="text-white font-bold text-sm">{t('countdown.beginsIn')}</p>
                    <p className="text-orange-50 text-xs">{t('countdown.dateFull', { date: startDate })}</p>
                    <ProposedLabel className="text-orange-50" />
                </div>
            </div>
            <div className="flex items-start justify-center gap-1.5 sm:gap-3">
                <TimeUnit value={timeLeft.days} label={t('countdown.days')} />
                <span className="text-white text-2xl font-bold mt-1">:</span>
                <TimeUnit value={timeLeft.hours} label={t('countdown.hours')} />
                <span className="text-white text-2xl font-bold mt-1">:</span>
                <TimeUnit value={timeLeft.minutes} label={t('countdown.minutes')} />
                <span className="text-white text-2xl font-bold mt-1">:</span>
                <TimeUnit value={timeLeft.seconds} label={t('countdown.seconds')} />
            </div>
            {/* Bhasma Aarti booking */}
            <div className="mt-3 bg-black/20 rounded-lg p-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
                <div className="min-w-0">
                    <p className="text-white text-sm font-bold">{t('countdown.bhasmaTitle')}</p>
                    <p className="text-orange-50 text-xs mt-0.5">{t('countdown.bhasmaPromo')}</p>
                </div>
                <a
                    href={TEMPLE_PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-orange-800 text-sm font-bold px-3 min-h-[40px] rounded-lg inline-flex items-center gap-1 hover:bg-orange-50 transition-colors flex-shrink-0"
                    aria-label={t('countdown.bookAria')}
                >
                    {t('countdown.book')}
                    <ExternalLink size={12} aria-hidden="true" />
                </a>
            </div>
        </div>
    );
}

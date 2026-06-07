import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

// Simhastha 2028 start: March 27, 2028
const SIMHASTHA_START = new Date('2028-03-27T00:00:00');
const SIMHASTHA_END = new Date('2028-05-27T23:59:59');

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

function TimeUnit({ value, label }) {
    return (
        <div className="flex flex-col items-center">
            <div className="bg-white/20 rounded-xl px-3 py-2 min-w-[52px] text-center">
                <span className="text-2xl font-bold text-white leading-none">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-orange-100 text-xs mt-1 font-medium">{label}</span>
        </div>
    );
}

export default function CountdownTimer({ compact = false }) {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (timeLeft.ended) {
        return (
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl p-3 text-white text-center shadow-md">
                <p className="font-bold text-sm">🙏 Simhastha Kumbh 2028 has concluded</p>
            </div>
        );
    }

    if (timeLeft.ongoing) {
        return (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 text-white shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse flex-shrink-0"></div>
                    <p className="font-bold text-sm">🔱 Simhastha Kumbh 2028 is LIVE! · Ujjain, MP</p>
                </div>
            </div>
        );
    }

    // Compact mode — single line for chat tab
    if (compact) {
        return (
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl px-4 py-2.5 shadow-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">⏳</span>
                    <div className="min-w-0">
                        <p className="text-white font-bold text-xs truncate">Simhastha 2028 begins in</p>
                        <p className="text-orange-100 text-xs">Mar 27, 2028 · Ujjain, MP</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {[
                        { v: timeLeft.days, l: 'd' },
                        { v: timeLeft.hours, l: 'h' },
                        { v: timeLeft.minutes, l: 'm' },
                        { v: timeLeft.seconds, l: 's' },
                    ].map(({ v, l }, i) => (
                        <React.Fragment key={l}>
                            {i > 0 && <span className="text-orange-200 text-xs">:</span>}
                            <div className="bg-white/20 rounded-lg px-1.5 py-1 text-center min-w-[30px]">
                                <span className="text-white font-bold text-sm leading-none">
                                    {String(v).padStart(2, '0')}
                                </span>
                                <span className="text-orange-200 text-xs block leading-none">{l}</span>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }

    // Full mode — for other tabs
    return (
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⏳</span>
                <div>
                    <p className="text-white font-bold text-sm">Simhastha Kumbh 2028 begins in</p>
                    <p className="text-orange-100 text-xs">Mar 27, 2028 · Ujjain, Madhya Pradesh</p>
                </div>
            </div>
            <div className="flex items-start justify-center gap-3">
                <TimeUnit value={timeLeft.days} label="Days" />
                <span className="text-white text-2xl font-bold mt-1">:</span>
                <TimeUnit value={timeLeft.hours} label="Hours" />
                <span className="text-white text-2xl font-bold mt-1">:</span>
                <TimeUnit value={timeLeft.minutes} label="Mins" />
                <span className="text-white text-2xl font-bold mt-1">:</span>
                <TimeUnit value={timeLeft.seconds} label="Secs" />
            </div>

            {/* Bhasma Aarti booking */}
            <div className="mt-3 bg-white/15 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                    <p className="text-white text-xs font-bold">📿 Mahakaleshwar Bhasma Aarti</p>
                    <p className="text-orange-100 text-xs mt-0.5">Book your pass now — fills up months in advance!</p>
                </div>
                <a
                    href="https://mahakaleshwar.nic.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-orange-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-orange-50 transition-colors flex-shrink-0 active:scale-95"
                    aria-label="Book Bhasma Aarti pass"
                >
                    Book
                    <ExternalLink size={11} />
                </a>
            </div>
        </div>
    );
}

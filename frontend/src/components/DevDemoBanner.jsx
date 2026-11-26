import React from 'react';
import { Sparkles } from 'lucide-react';

// Developer-only hint, English on purpose. ChatInterface loads this file only when
// import.meta.env.DEV is true, so production bundles never contain it.
export default function DevDemoBanner() {
    return (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2" role="note">
            <Sparkles size={15} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-amber-700">
                <strong>Demo mode (dev only):</strong> Add a valid{' '}
                <code className="bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> (starts with <code className="bg-amber-100 px-1 rounded">AIza...</code>) to{' '}
                <code className="bg-amber-100 px-1 rounded">backend/.env</code> and turn off DEMO_MODE for real AI replies. Get a free key at{' '}
                <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline text-amber-800 font-medium">aistudio.google.com</a>
            </p>
        </div>
    );
}

import React from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '../utils/api';

export function LoadingState({ label = 'Loading...' }) {
    return (
        <div className="text-center py-12 text-gray-400" role="status" aria-live="polite">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin text-orange-400" aria-hidden="true" />
            <p className="text-sm font-medium">{label}</p>
        </div>
    );
}

export function ErrorState({ error, onRetry }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center" role="alert">
            <AlertTriangle size={28} className="mx-auto mb-2 text-red-400" aria-hidden="true" />
            <p className="text-sm text-red-700 mb-3">{getErrorMessage(error)}</p>
            <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
            >
                <RefreshCw size={12} aria-hidden="true" />
                Try again
            </button>
        </div>
    );
}

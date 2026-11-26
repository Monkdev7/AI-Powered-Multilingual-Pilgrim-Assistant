import React, { Suspense, lazy, useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Share2 } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { API_BASE } from '../utils/api';
import { classifyChatError } from '../utils/chatErrors.js';
import {
    STORAGE_KEY,
    createWelcomeMessage,
    createErrorMessage,
    normalizeStoredMessages,
    trimForStorage,
    toApiHistory,
    resolveMessageText,
} from '../utils/chatHistory.js';
import { getLanguage } from '../i18n/languages.js';
import { tk } from '../i18n/index.js';
import { useT } from '../i18n/useT.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import OfflineEmergencyLink from './OfflineEmergencyLink.jsx';

// Developer-only banner. The dynamic import sits in a dead branch in production builds, so the
// banner (and its text) is not shipped to pilgrims.
const DevDemoBanner = import.meta.env.DEV ? lazy(() => import('./DevDemoBanner.jsx')) : null;

// Stable ids; the visible text comes from the catalog and is sent as the user's message.
const SUGGESTED_QUESTIONS = [
    { id: 'amritSnan', key: tk('chat.suggest.amritSnan') },
    { id: 'reach', key: tk('chat.suggest.reach') },
    { id: 'stay', key: tk('chat.suggest.stay') },
    { id: 'pack', key: tk('chat.suggest.pack') },
    { id: 'mahakal', key: tk('chat.suggest.mahakal') },
    { id: 'emergency', key: tk('chat.suggest.emergency') },
];

// Placeholder that marks where the native language name goes inside a translated sentence.
const LANGUAGE_SLOT = '\uE000';

// Timestamps from old or hand-edited storage can be invalid; never let that crash rendering.
function safeTime(formatTime, iso) {
    if (!iso) return '';
    try {
        return formatTime(iso);
    } catch {
        return '';
    }
}

// Lightweight markdown renderer — handles bold, italic, bullets, headers
function MarkdownText({ content, className = '' }) {
    const lines = content.split('\n');

    const parseInline = (text) => {
        // Bold: **text** or __text__
        // Italic: *text* or _text_
        const parts = [];
        let remaining = text;
        let key = 0;

        while (remaining.length > 0) {
            const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*/s);
            const italicMatch = remaining.match(/^(.*?)\*(.*?)\*/s);

            if (boldMatch && (!italicMatch || boldMatch[0].length <= italicMatch[0].length)) {
                if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
                parts.push(<strong key={key++} className="font-semibold">{boldMatch[2]}</strong>);
                remaining = remaining.slice(boldMatch[0].length);
            } else if (italicMatch) {
                if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
                parts.push(<em key={key++} className="italic">{italicMatch[2]}</em>);
                remaining = remaining.slice(italicMatch[0].length);
            } else {
                parts.push(<span key={key++}>{remaining}</span>);
                break;
            }
        }
        return parts;
    };

    return (
        <div className={`text-sm leading-relaxed space-y-1 ${className}`}>
            {lines.map((line, i) => {
                // Bullet: * text or - text
                if (/^[\*\-]\s+/.test(line)) {
                    return (
                        <div key={i} className="flex items-start gap-2">
                            <span className="text-orange-400 flex-shrink-0 mt-0.5 font-bold">•</span>
                            <span>{parseInline(line.replace(/^[\*\-]\s+/, ''))}</span>
                        </div>
                    );
                }
                // Header: ### or ## or #
                if (/^#{1,3}\s+/.test(line)) {
                    const text = line.replace(/^#{1,3}\s+/, '');
                    return <p key={i} className="font-bold text-gray-900 mt-2">{parseInline(text)}</p>;
                }
                // Horizontal rule: ---
                if (/^---+$/.test(line.trim())) {
                    return <hr key={i} className="border-orange-100 my-2" />;
                }
                // Empty line → spacing
                if (line.trim() === '') {
                    return <div key={i} className="h-1" />;
                }
                return <p key={i}>{parseInline(line)}</p>;
            })}
        </div>
    );
}

function MessageBubble({ message }) {
    const { t, formatTime } = useT();
    const isUser = message.role === 'user';
    // Welcome and new error bubbles are rendered from the catalog, so they follow language changes.
    const text = resolveMessageText(message, t);

    const handleShare = () => {
        const shareText = `*${t('chat.shareHeading')}*\n\n${text}\n\n_${t('chat.shareSignature')}_`;
        const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in group`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 shadow-sm">
                    <Bot size={15} className="text-white" aria-hidden="true" />
                </div>
            )}

            <div className={`max-w-[80%] sm:max-w-[70%]`}>
                <div
                    className={
                        isUser
                            ? 'bg-orange-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm'
                            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-orange-100'
                    }
                >
                    {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                    ) : (
                        <MarkdownText content={text} />
                    )}
                </div>
                <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-xs text-gray-400">{safeTime(formatTime, message.timestamp)}</p>
                    {!isUser && (
                        <button
                            onClick={handleShare}
                            title={t('chat.shareWhatsApp')}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-green-500"
                            aria-label={t('chat.shareWhatsApp')}
                        >
                            <Share2 size={12} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 ml-2 mt-1 shadow-sm">
                    <User size={15} className="text-white" aria-hidden="true" />
                </div>
            )}
        </div>
    );
}

function TypingIndicator() {
    const { t } = useT();
    return (
        <div className="flex justify-start mb-4 animate-fade-in" role="status" aria-live="polite">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 shadow-sm">
                <Bot size={15} className="text-white" aria-hidden="true" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-orange-100">
                <div className="flex items-center gap-1.5 min-h-[1.25rem]">
                    <span className="text-xs text-orange-500 mr-1 font-medium">{t('chat.thinking')}</span>
                    <div className="typing-dot" aria-hidden="true"></div>
                    <div className="typing-dot" aria-hidden="true"></div>
                    <div className="typing-dot" aria-hidden="true"></div>
                </div>
            </div>
        </div>
    );
}

// Load saved messages from localStorage (old English welcome/error bubbles are kept and handled by the helpers)
function loadSavedMessages() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return normalizeStoredMessages(saved);
    } catch {
        // ignore storage errors
    }
    return [createWelcomeMessage()];
}

// "Responding in {language}" with the native language name highlighted, in each language's word order.
function LanguageIndicator({ code }) {
    const { t } = useT();
    const language = getLanguage(code);
    const parts = t('chat.respondingIn', { language: LANGUAGE_SLOT }).split(LANGUAGE_SLOT);
    const name = (
        <span lang={language.code} className="text-orange-500 font-medium">{language.nativeName}</span>
    );
    if (parts.length !== 2) return <>{parts.join('')} {name}</>;
    return <>{parts[0]}{name}{parts[1]}</>;
}

export default function ChatInterface({ selectedLanguage }) {
    const { t } = useT();
    const online = useOnlineStatus();
    const [messages, setMessages] = useState(loadSavedMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMockMode, setIsMockMode] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Persist messages to localStorage whenever they change
    useEffect(() => {
        try {
            // Keep only last 50 messages to avoid storage limits
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimForStorage(messages)));
        } catch {
            // ignore storage errors
        }
    }, [messages]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    const sendMessage = useCallback(
        async (text, isRetry = false) => {
            const messageText = (text || input).trim();
            // Offline: nothing is sent and the draft stays in the input (the offline note explains why).
            if (!messageText || isLoading || !online) return;

            setInput('');

            const userMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: messageText,
                timestamp: new Date().toISOString(),
            };

            // Don't add user message again on retry
            if (!isRetry) {
                setMessages((prev) => [...prev, userMessage]);
            }
            setIsLoading(true);

            // No welcome, no error bubbles, last 10 messages
            const history = toApiHistory(messages);

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

                const response = await fetch(`${API_BASE}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: messageText,
                        language: selectedLanguage,
                        history,
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    // Only the stable code and status are kept; the server text is never shown.
                    const errData = await response.json().catch(() => ({}));
                    const apiError = new Error(`Server error: ${response.status}`);
                    apiError.code = typeof errData?.code === 'string' ? errData.code : undefined;
                    apiError.status = response.status;
                    throw apiError;
                }

                let data;
                try {
                    data = await response.json();
                } catch {
                    data = null;
                }
                if (!data || typeof data.reply !== 'string') {
                    const parseError = new Error('Unexpected response');
                    parseError.kind = 'parse';
                    throw parseError;
                }
                setIsMockMode(!!data.mock);
                setRetryCount(0);

                const aiMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.reply,
                    timestamp: data.timestamp || new Date().toISOString(),
                };

                setMessages((prev) => [...prev, aiMessage]);
            } catch (err) {
                setRetryCount((c) => c + 1);

                // Store the stable code/kind; the text is rendered through t() and follows language changes.
                const code = classifyChatError(err);
                setMessages((prev) => [...prev, createErrorMessage(code, (Date.now() + 1).toString())]);
            } finally {
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        },
        [input, isLoading, online, messages, selectedLanguage]
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleClearChat = () => {
        setMessages([createWelcomeMessage()]);
        setRetryCount(0);
        localStorage.removeItem(STORAGE_KEY);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const hasHistory = messages.length > 1;

    return (
        <div className="flex flex-col h-full">
            {/* Mock mode notice: developers get setup hints, pilgrims get a neutral localized note */}
            {isMockMode && (
                DevDemoBanner ? (
                    <Suspense fallback={null}>
                        <DevDemoBanner />
                    </Suspense>
                ) : (
                    <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2" role="note">
                        <Sparkles size={15} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-xs text-amber-700">
                            <strong>{t('chat.demoMode')}:</strong> {t('chat.demoNotice')}
                        </p>
                    </div>
                )
            )}

            {/* Countdown — compact, shown once at top of chat */}
            <div className="px-4 pt-3">
                <CountdownTimer compact />
            </div>

            {/* Chat header bar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-700">KumbhSaathi AI</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">· {t('chat.subtitle')}</span>
                    {hasHistory && (
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-medium">
                            {t.plural('chat.messageCount', messages.length - 1)}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleClearChat}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors px-2 py-1 rounded-lg hover:bg-orange-50"
                    title={t('chat.clearHistory')}
                    aria-label={t('chat.clearHistory')}
                >
                    <RefreshCw size={13} aria-hidden="true" />
                    <span className="hidden sm:inline">{t('chat.newChat')}</span>
                </button>
            </div>

            {/* Restored session notice */}
            {hasHistory && messages[0]?.id === 'welcome' && messages.length > 1 && (
                <div className="mx-4 mb-1 text-center">
                    <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-3 py-1">
                        {t('chat.restored')}
                    </span>
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0 scroll-smooth">
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions (show when only welcome message) */}
            {messages.length === 1 && !isLoading && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium">{t('chat.tryAsking')}</p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map((q) => (
                            <button
                                key={q.id}
                                onClick={() => sendMessage(t(q.key))}
                                disabled={!online}
                                className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t(q.key)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="border-t border-orange-100 bg-white px-4 py-3">
                {!online && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2 flex flex-col gap-2">
                        <p id="chat-offline-note" className="text-xs text-amber-800">{t('offline.chat')}</p>
                        <OfflineEmergencyLink className="w-full" />
                    </div>
                )}
                <div className="flex items-end gap-2 bg-orange-50 rounded-2xl border border-orange-200 px-4 py-2 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('chat.placeholder')}
                        rows={1}
                        maxLength={1000}
                        className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 py-1"
                        style={{ minHeight: '24px' }}
                        disabled={isLoading}
                        aria-label={t('chat.inputLabel')}
                        aria-describedby={!online ? 'chat-offline-note' : undefined}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading || !online}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 disabled:cursor-not-allowed text-white rounded-xl p-2 transition-all active:scale-95 flex-shrink-0 mb-0.5"
                        aria-label={t('chat.send')}
                        title={t('chat.send')}
                    >
                        <Send size={16} aria-hidden="true" />
                    </button>
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">
                    {t('chat.hint')} · <LanguageIndicator code={selectedLanguage} />
                </p>
            </div>
        </div>
    );
}

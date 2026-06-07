import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Share2 } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

const LANGUAGE_LABELS = {
    en: 'English',
    hi: 'Hindi',
    bn: 'Bengali',
    ta: 'Tamil',
    te: 'Telugu',
    mr: 'Marathi',
    gu: 'Gujarati',
    pa: 'Punjabi',
};

const STORAGE_KEY = 'simhastha_chat_history';

const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content:
        'Jai Mahakal! 🙏 I am KumbhSaathi, your Simhastha Kumbh 2028 assistant.\n\nI can help you with:\n• 🗓️ Amrit Snan bathing dates and schedules\n• 🗺️ Finding ghats and navigation tips in Ujjain\n• 🏕️ Accommodation options and booking\n• 🚂 Travel routes to Ujjain, Madhya Pradesh\n• 🛕 Religious rituals at Mahakaleshwar & Kshipra river\n• 🆘 Safety tips and emergency contacts\n\nAsk me anything in your preferred language!',
    timestamp: new Date().toISOString(),
};

const SUGGESTED_QUESTIONS = [
    'What are the Amrit Snan dates?',
    'How to reach Ujjain?',
    'Where can I stay?',
    'What to pack for Simhastha?',
    'Tell me about Mahakaleshwar Temple',
    'Emergency contacts?',
];

function formatTime(isoString) {
    try {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function MessageBubble({ message }) {
    const isUser = message.role === 'user';

    const handleShare = () => {
        const text = `*KumbhSaathi — Simhastha 2028*\n\n${message.content}\n\n_Powered by Simhastha Pilgrim Assistant_`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in group`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 shadow-sm">
                    <Bot size={15} className="text-white" />
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
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-xs text-gray-400">{formatTime(message.timestamp)}</p>
                    {!isUser && (
                        <button
                            onClick={handleShare}
                            title="Share on WhatsApp"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-green-500"
                            aria-label="Share on WhatsApp"
                        >
                            <Share2 size={12} />
                        </button>
                    )}
                </div>
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 ml-2 mt-1 shadow-sm">
                    <User size={15} className="text-white" />
                </div>
            )}
        </div>
    );
}

function TypingIndicator() {
    return (
        <div className="flex justify-start mb-4 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 shadow-sm">
                <Bot size={15} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-orange-100">
                <div className="flex items-center gap-1.5 h-5">
                    <span className="text-xs text-orange-500 mr-1 font-medium">Thinking</span>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                </div>
            </div>
        </div>
    );
}

// Load saved messages from localStorage
function loadSavedMessages() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // ignore parse errors
    }
    return [WELCOME_MESSAGE];
}

export default function ChatInterface({ selectedLanguage, labels = {} }) {
    const L = labels.chat || {};
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
            const toSave = messages.slice(-50);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
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
            if (!messageText || isLoading) return;

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

            const history = messages
                .filter((m) => m.id !== 'welcome')
                .slice(-10)
                .map((m) => ({ role: m.role, content: m.content }));

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

                const response = await fetch('/api/chat', {
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

                if (response.status === 429) {
                    throw new Error('RATE_LIMIT');
                }
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Server error: ${response.status}`);
                }

                const data = await response.json();
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

                let errorContent;
                if (err.name === 'AbortError') {
                    errorContent = '⏱️ Request timed out. The server is taking too long to respond.\n\nPlease try again or check your connection.';
                } else if (err.message === 'RATE_LIMIT') {
                    errorContent = '⚠️ Too many requests. Please wait a moment and try again.\n\nFor immediate help:\n• Police: 100\n• Ambulance: 108\n• Simhastha Control Room: 0734-2551234';
                } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                    errorContent = '📡 No connection to server. Please check that the backend is running.\n\nFor emergencies:\n• Police: 100\n• Ambulance: 108\n• Simhastha Control Room: 0734-2551234';
                } else {
                    errorContent = `⚠️ Something went wrong. Please try again.\n\nFor emergencies:\n• Police: 100\n• Ambulance: 108\n• Simhastha Control Room: 0734-2551234`;
                }

                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: errorContent,
                        timestamp: new Date().toISOString(),
                        isError: true,
                    },
                ]);
            } finally {
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        },
        [input, isLoading, messages, selectedLanguage]
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleClearChat = () => {
        setMessages([WELCOME_MESSAGE]);
        setRetryCount(0);
        localStorage.removeItem(STORAGE_KEY);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const hasHistory = messages.length > 1;

    return (
        <div className="flex flex-col h-full">
            {/* Mock mode notice */}
            {isMockMode && (
                <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
                    <Sparkles size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                        <strong>Demo mode:</strong> Running with mock responses. Add your{' '}
                        <code className="bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> to{' '}
                        <code className="bg-amber-100 px-1 rounded">backend/.env</code> for real AI.
                    </p>
                </div>
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
                    <span className="text-xs text-gray-400 hidden sm:inline">· Multilingual Assistant</span>                    {hasHistory && (
                        <span className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-medium">
                            {messages.length - 1} msg{messages.length > 2 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleClearChat}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors px-2 py-1 rounded-lg hover:bg-orange-50"
                    title="Clear chat history"
                    aria-label="Clear chat history"
                >
                    <RefreshCw size={13} />
                    <span className="hidden sm:inline">{L.newChat || 'New Chat'}</span>
                </button>
            </div>

            {/* Restored session notice */}
            {hasHistory && messages[0]?.id === 'welcome' && messages.length > 1 && (
                <div className="mx-4 mb-1 text-center">
                    <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-3 py-1">
                        {L.restored || '💾 Chat restored from last session'}
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
                    <p className="text-xs text-gray-500 mb-2 font-medium">💡 Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map((q) => (
                            <button
                                key={q}
                                onClick={() => sendMessage(q)}
                                className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-3 py-1.5 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="border-t border-orange-100 bg-white px-4 py-3">
                <div className="flex items-end gap-2 bg-orange-50 rounded-2xl border border-orange-200 px-4 py-2 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={L.placeholder || 'Ask about Simhastha, rituals, travel, safety...'}
                        rows={1}
                        className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 py-1"
                        style={{ minHeight: '24px' }}
                        disabled={isLoading}
                        aria-label="Type your message"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 disabled:cursor-not-allowed text-white rounded-xl p-2 transition-all active:scale-95 flex-shrink-0 mb-0.5"
                        aria-label="Send message"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">
                    Enter to send · Shift+Enter for new line · {L.respondingIn || 'Responding in'}{' '}
                    <span className="text-orange-500 font-medium">{LANGUAGE_LABELS[selectedLanguage] || selectedLanguage}</span>
                </p>
            </div>
        </div>
    );
}

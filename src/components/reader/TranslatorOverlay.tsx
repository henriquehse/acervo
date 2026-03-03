'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, X, ArrowRightLeft, Copy, Volume2, Check, Sparkles } from 'lucide-react';

// Context for global access
interface TranslatorContextType {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

const TranslatorContext = createContext<TranslatorContextType | null>(null);

export function useTranslator() {
    const ctx = useContext(TranslatorContext);
    if (!ctx) throw new Error('useTranslator must be used within TranslatorProvider');
    return ctx;
}

// Provider Component
export function TranslatorProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(!isOpen);

    // Keyboard shortcut: Ctrl/Cmd + Shift + T
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                toggle();
            }
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <TranslatorContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
            <TranslatorOverlay />
        </TranslatorContext.Provider>
    );
}

// Main Overlay
function TranslatorOverlay() {
    const { isOpen, close } = useTranslator();
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState<'pt' | 'en'>('pt');
    const [targetLang, setTargetLang] = useState<'en' | 'pt'>('en');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Swap languages
    const swapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    // Translate
    const translate = async () => {
        if (!sourceText.trim()) return;
        setLoading(true);

        try {
            const langNames = { pt: 'Português', en: 'Inglês' };
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Traduza o seguinte texto de ${langNames[sourceLang]} para ${langNames[targetLang]}. 
Retorne APENAS a tradução, sem explicações ou notas adicionais.

Texto: "${sourceText}"`,
                    max_tokens: 2000
                })
            });

            const data = await res.json();
            setTranslatedText(data.text || data.response || 'Erro na tradução');
        } catch (e) {
            setTranslatedText('❌ Erro ao traduzir. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-translate on typing (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (sourceText.trim().length > 2) {
                translate();
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [sourceText, sourceLang, targetLang]);

    // Copy to clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Speak text
    const speak = (text: string, lang: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'pt' ? 'pt-BR' : 'en-US';
        speechSynthesis.speak(utterance);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[10000] w-full max-w-3xl mx-auto"
                    >
                        <div className="bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                        <Languages size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white">Tradutor Instantâneo</h2>
                                        <p className="text-xs text-gray-500">Powered by Gemini • Sem limites</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-500 border border-white/10">
                                        Ctrl+Shift+T
                                    </kbd>
                                    <button onClick={close} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Language Selector */}
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setSourceLang('pt')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${sourceLang === 'pt'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    🇧🇷 Português
                                </button>

                                <button
                                    onClick={swapLanguages}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all hover:rotate-180 duration-300"
                                >
                                    <ArrowRightLeft size={18} />
                                </button>

                                <button
                                    onClick={() => setSourceLang('en')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${sourceLang === 'en'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'text-gray-400 hover:bg-white/5'
                                        }`}
                                >
                                    🇺🇸 English
                                </button>
                            </div>

                            {/* Translation Areas */}
                            <div className="grid grid-cols-2 divide-x divide-white/5">
                                {/* Source */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-500 font-medium">
                                            {sourceLang === 'pt' ? '🇧🇷 Português' : '🇺🇸 English'}
                                        </span>
                                        <button
                                            onClick={() => speak(sourceText, sourceLang)}
                                            disabled={!sourceText}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                                        >
                                            <Volume2 size={14} />
                                        </button>
                                    </div>
                                    <textarea
                                        ref={inputRef}
                                        value={sourceText}
                                        onChange={(e) => setSourceText(e.target.value)}
                                        placeholder="Digite ou cole o texto aqui..."
                                        className="w-full h-40 bg-transparent text-white placeholder-gray-600 resize-none focus:outline-none text-sm leading-relaxed"
                                    />
                                </div>

                                {/* Target */}
                                <div className="p-4 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-500 font-medium">
                                            {targetLang === 'en' ? '🇺🇸 English' : '🇧🇷 Português'}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => speak(translatedText, targetLang)}
                                                disabled={!translatedText}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                                            >
                                                <Volume2 size={14} />
                                            </button>
                                            <button
                                                onClick={copyToClipboard}
                                                disabled={!translatedText}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                                            >
                                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-full h-40 text-white text-sm leading-relaxed overflow-y-auto">
                                        {loading ? (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Sparkles size={14} className="animate-spin" />
                                                <span>Traduzindo...</span>
                                            </div>
                                        ) : (
                                            translatedText || <span className="text-gray-600">A tradução aparecerá aqui...</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[10px] text-gray-600">
                                    Tradução automática ao digitar • ESC para fechar
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-600">
                                        {sourceText.length} caracteres
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default TranslatorProvider;

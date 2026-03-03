'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Languages, X, ArrowRightLeft, Copy, Volume2,
    Check, Sparkles, GripHorizontal, Minimize2, Maximize2
} from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function DraggableTranslator({ isOpen, onClose }: Props) {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState<'pt' | 'en'>('en'); // Default to English input for students
    const [targetLang, setTargetLang] = useState<'en' | 'pt'>('pt');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Debounce translation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (sourceText.trim().length > 2) handleTranslate();
        }, 600);
        return () => clearTimeout(timer);
    }, [sourceText, sourceLang]);

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;
        setLoading(true);
        try {
            const langNames = { pt: 'Português', en: 'Inglês' };
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Traduza o seguinte texto de ${langNames[sourceLang]} para ${langNames[targetLang]}.
Contexto: Estudante de inglês nível B1, mantenha o tom natural.
Retorne APENAS a tradução.

Texto: "${sourceText}"`,
                    max_tokens: 1000
                })
            });
            const data = await res.json();
            setTranslatedText(data.text || data.response || 'Erro...');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const swapLangs = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#1a1a24] backdrop-blur-xl ${isMinimized ? 'w-64 h-auto' : 'w-[500px]'
                }`}
            style={{
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.45)',
                right: '5%',
                top: '15%'
            }}
        >
            {/* Header / Drag Handle */}
            <div className="h-9 bg-gray-50 dark:bg-[#252532] border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing group">
                <div className="flex items-center gap-2 text-gray-500">
                    <GripHorizontal size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Deep Translator</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-gray-400"
                    >
                        {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                    </button>
                    <button
                        onClick={onClose}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-red-500 hover:text-white rounded text-gray-400 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="flex flex-col h-[320px]">
                    {/* Controls */}
                    <div className="flex items-center justify-center py-2 bg-gray-50/50 dark:bg-[#1a1a24] border-b border-gray-100 dark:border-white/5 relative z-10">
                        <div className="flex items-center gap-2 bg-white dark:bg-[#2a2a35] p-1 rounded-lg border border-gray-200 dark:border-white/5 shadow-sm">
                            <span className="text-xs font-bold px-3 py-1 text-gray-600 dark:text-gray-300">
                                {sourceLang === 'en' ? '🇺🇸 English' : '🇧🇷 Português'}
                            </span>
                            <button onClick={swapLangs} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-gray-400">
                                <ArrowRightLeft size={12} />
                            </button>
                            <span className="text-xs font-bold px-3 py-1 text-blue-600 dark:text-blue-400">
                                {targetLang === 'pt' ? '🇧🇷 Português' : '🇺🇸 English'}
                            </span>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 grid grid-rows-2">
                        {/* Source */}
                        <div className="relative group">
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                placeholder="Digite ou cole aqui (drag me anywhere)..."
                                className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
                            />
                            {sourceText && (
                                <button
                                    onClick={() => setSourceText('')}
                                    className="absolute right-2 top-2 p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Target */}
                        <div className="relative bg-blue-50/50 dark:bg-[#20202b] border-t border-gray-100 dark:border-white/5">
                            {loading && (
                                <div className="absolute top-2 right-2 text-blue-500">
                                    <Sparkles size={14} className="animate-spin" />
                                </div>
                            )}
                            <textarea
                                readOnly
                                value={translatedText}
                                className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-sm text-gray-800 dark:text-gray-100 font-medium"
                                placeholder="..."
                            />
                            {translatedText && (
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-1.5 bg-white dark:bg-[#2a2a35] rounded-md shadow-sm border border-gray-200 dark:border-white/10 text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

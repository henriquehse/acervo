'use client';
import { PageNav } from '@/components/layout/PageNav';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import CleanPDFReader from '@/components/reader/CleanPDFReader';
import {
    BookOpen, Headphones, Mic, MessageSquare, Trophy, Flame, Target,
    ChevronRight, Sparkles, PlayCircle, Languages, Youtube,
    Star, Zap, Clock, TrendingUp, Award, Brain, Volume2, Crown,
    GraduationCap, BarChart3, Calendar, CheckCircle2, ArrowLeftRight,
    Send, Bot, Copy, Check, RefreshCw, ExternalLink, Play, X, ArrowUp
} from 'lucide-react';

// === WORD OF THE DAY DATA ===
const WORD_BANK = [
    { word: "Serendipity", meaning: "Finding something good without looking for it", example: "Meeting you was pure serendipity!" },
    { word: "Ephemeral", meaning: "Lasting for a very short time", example: "The beauty of cherry blossoms is ephemeral." },
    { word: "Resilience", meaning: "The ability to recover quickly from difficulties", example: "Her resilience inspired everyone." },
    { word: "Eloquent", meaning: "Fluent and persuasive in speaking", example: "He gave an eloquent speech." },
    { word: "Ambiguous", meaning: "Open to more than one interpretation", example: "The ending was deliberately ambiguous." },
    { word: "Pragmatic", meaning: "Dealing with things sensibly and realistically", example: "We need a pragmatic approach." },
    { word: "Inevitable", meaning: "Certain to happen; unavoidable", example: "Change is inevitable." },
    { word: "Meticulous", meaning: "Showing great attention to detail", example: "She's meticulous in her work." },
];

// === MAIN STUDY MODULES (Only 4 main cards) ===
const MAIN_MODULES = [
    {
        id: 'immersive',
        name: 'Fundamentals',
        subtitle: 'Complete PDF Course',
        description: 'Master English basics with Bruce\'s comprehensive course',
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
        gradient: 'from-blue-600 to-indigo-600',
        tag: 'POPULAR',
    },
    {
        id: 'english101',
        name: 'Native Immersion',
        subtitle: '101 English & Tiffani',
        description: 'Learn directly from native speakers: Tiffani, EnglishClass101, and more!',
        image: 'https://i.ytimg.com/vi/juKd26qkNAw/hqdefault.jpg',
        gradient: 'from-cyan-500 to-blue-600',
        tag: 'PODCASTS',
    },
    {
        id: 'youtube',
        name: 'YouTube Learning',
        subtitle: 'AI-Curated Playlists',
        description: 'Immersive learning with curated YouTube content',
        image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80',
        gradient: 'from-red-500 to-rose-600',
        tag: '✨ AI',
    },
    {
        id: 'memrise',
        name: 'Memrise',
        subtitle: 'Spaced Repetition',
        description: 'Build vocabulary with scientifically proven methods',
        image: 'https://play-lh.googleusercontent.com/EqkWPEGYgzjwZF1eDJl1pcpf9BG65SIpgJSyDdgRNO4iQzZip_48SoxDIsl_EQHmTQ',
        gradient: 'from-yellow-500 to-amber-500',
        tag: 'EXTERNAL',
    },
];

// === DOCK TOOLS (Quick access) ===
const DOCK_TOOLS = [
    { id: 'translator', name: 'Translator', icon: ArrowLeftRight, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'tutor', name: 'AI Tutor', icon: Bot, gradient: 'from-violet-500 to-purple-600' },
];

// === TRANSLATOR MODAL ===
function TranslatorModal({ onClose }: { onClose: () => void }) {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sourceLang, setSourceLang] = useState('pt');
    const [targetLang, setTargetLang] = useState('en');

    const translate = async () => {
        if (!sourceText.trim()) return;
        setIsTranslating(true);

        try {
            const res = await fetch('http://localhost:8001/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `You are a professional translator. Translate the following text from ${sourceLang === 'pt' ? 'Portuguese' : sourceLang === 'en' ? 'English' : 'Spanish'} to ${targetLang === 'en' ? 'English' : targetLang === 'es' ? 'Spanish' : 'Portuguese'}. Only provide the translation, nothing else.\n\nText: "${sourceText}"`,
                })
            });
            if (!res.ok) throw new Error("Backend offline");
            const data = await res.json();
            setTranslatedText(data.response || data.text || 'Translation failed');
        } catch (error) {
            console.warn("Backend unavailable, using mock translation");
            setTranslatedText(`[Tradução Mockada]: "${sourceText}" -> Resposta simulada devido ao backend offline.`);
        } finally {
            setIsTranslating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const swapLanguages = () => {
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:w-[95%] max-w-5xl h-[90dvh] sm:h-[90vh] bg-[#0a0a0f] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col mt-auto sm:mt-0"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 md:p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20">
                            <ArrowLeftRight className="w-5 h-5 md:w-7 md:h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl font-black text-white">Translator</h2>
                            <p className="text-white/70 text-[10px] md:text-sm uppercase tracking-wider">AI Powered</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/20 transition"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-4 md:p-8 overflow-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6">
                            <select
                                value={sourceLang}
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm"
                            >
                                <option value="pt">🇧🇷 Português</option>
                                <option value="en">🇺🇸 English</option>
                                <option value="es">🇵🇾 Español</option>
                            </select>

                            <button
                                onClick={swapLanguages}
                                className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 transition-transform"
                            >
                                <ArrowLeftRight size={18} />
                            </button>

                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm"
                            >
                                <option value="en">🇺🇸 English</option>
                                <option value="es">🇵🇾 Español</option>
                                <option value="pt">🇧🇷 Português</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-4 md:gap-6">
                            <div className="relative">
                                <textarea
                                    value={sourceText}
                                    onChange={(e) => setSourceText(e.target.value)}
                                    placeholder="Type to translate..."
                                    className="w-full h-40 md:h-64 p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 text-white text-base md:text-lg resize-none focus:outline-none focus:border-emerald-500/50"
                                />
                                <div className="absolute bottom-4 right-4">
                                    <button
                                        onClick={translate}
                                        disabled={isTranslating || !sourceText.trim()}
                                        className="px-4 md:px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm md:text-base font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isTranslating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        Translate
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="w-full h-40 md:h-64 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white text-base md:text-lg overflow-auto">
                                    {isTranslating ? (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <RefreshCw size={16} className="animate-spin" />
                                            Translating...
                                        </div>
                                    ) : (
                                        translatedText || <span className="text-gray-500 text-sm md:text-base">Translation will appear here...</span>
                                    )}
                                </div>
                                {translatedText && (
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute bottom-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                                    >
                                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// === AI TUTOR MODAL ===
function AITutorModal({ onClose }: { onClose: () => void }) {
    const [messages, setMessages] = useState<any[]>([
        {
            role: 'assistant',
            content: "Hello! I'm your English tutor. 🎓 I can help you with:\n\n• Grammar corrections\n• Vocabulary practice\n• Conversation practice\n• Answer any questions\n\nHow can I help you today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const systemPrompt = `You are an expert English language tutor. Your role is to:
1. Correct any grammar mistakes the user makes
2. Explain corrections clearly
3. Teach vocabulary when relevant
4. Encourage the student
5. Always respond in a mix of English and Portuguese (Brazilian) to help learning
6. If the user writes in Portuguese, help them express it in English
7. Be friendly and supportive

Student message: "${input}"`;

            const res = await fetch('http://localhost:8001/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: systemPrompt })
            });

            if (!res.ok) throw new Error("Backend offline");
            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || data.text || 'I apologize, I had trouble processing that. Could you try again?'
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Ops, meu backend neural parece offline na Vercel! Considere ativar o Python. (Mock mode)'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:w-[95%] max-w-5xl h-[90dvh] sm:h-[90vh] bg-[#0a0a0f] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col mt-auto sm:mt-0"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 md:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 md:p-3 rounded-xl bg-white/20">
                            <Bot className="w-5 h-5 md:w-7 md:h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white">AI Tutor</h2>
                            <p className="text-white/70 text-[10px] md:text-sm uppercase tracking-wider">Session Active</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/20 transition"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Chat Area */}
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-tr-sm'
                                : 'bg-white/10 text-gray-200 rounded-tl-sm'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 p-4 rounded-2xl rounded-tl-sm flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-3 md:p-6 border-t border-white/5">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask your tutor..."
                            className="w-full px-6 py-4 pr-14 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading}
                            className="absolute right-2 top-2 p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// === WORD CAROUSEL ===
function WordCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [wordBank, setWordBank] = useState(WORD_BANK);
    const [isLoading, setIsLoading] = useState(false);

    // Load words from backend on mount
    useEffect(() => {
        const loadWords = async () => {
            try {
                setIsLoading(true);
                const res = await fetch('http://localhost:8001/api/ai/vocabulary-bank');
                if (!res.ok) throw new Error("Backend offline");
                const data = await res.json();
                if (data.words && data.words.length > 0) {
                    setWordBank(data.words);
                    console.log(`✅ Loaded ${data.words.length} words from backend`);
                }
            } catch (error) {
                console.log('Backend offline, using default word bank mock');
            } finally {
                setIsLoading(false);
            }
        };
        loadWords();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % wordBank.length);
                setIsVisible(true);
            }, 300);
        }, 45000); // 45 seconds - tempo para ler e reler

        return () => clearInterval(interval);
    }, [wordBank.length]);

    const word = wordBank[currentIndex];

    if (isLoading) {
        return (
            <div className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-center gap-2 text-purple-300">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
                    Loading vocabulary...
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-4 md:p-6 mb-6 md:mb-8"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                    <Sparkles size={24} className="text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-2">
                        <h3 className="text-xl md:text-2xl font-black text-white">{word.word}</h3>
                        <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full w-fit">
                            Word {currentIndex + 1}/{wordBank.length}
                        </span>
                    </div>
                    <p className="text-sm md:text-base text-gray-300 mb-2">{word.meaning}</p>
                    <p className="text-xs md:text-sm text-gray-400 italic">&quot;{word.example}&quot;</p>
                </div>
            </div>
        </motion.div>
    );
}

// === WEEKLY TRACKER ===
function WeeklyTracker() {
    const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

    useEffect(() => {
        const saved = localStorage.getItem('weekly-tracker');
        if (saved) {
            setTimeout(() => setCompletedDays(new Set(JSON.parse(saved))), 0);
        }
    }, []);

    const toggleDay = (day: number) => {
        const newSet = new Set(completedDays);
        if (newSet.has(day)) {
            newSet.delete(day);
        } else {
            newSet.add(day);
        }
        setCompletedDays(newSet);
        localStorage.setItem('weekly-tracker', JSON.stringify(Array.from(newSet)));
    };

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="w-full bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">This Week&apos;s Progress</h3>
                <span className="text-gray-400 text-sm">{completedDays.size}/7 days</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {days.map((day, idx) => (
                    <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`aspect-square rounded-lg md:rounded-xl border md:border-2 transition-all ${completedDays.has(idx)
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 scale-105'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                            }`}
                    >
                        <div className="flex flex-col items-center justify-center h-full p-1">
                            <span className={`text-[10px] md:text-sm font-bold ${completedDays.has(idx) ? 'text-white' : 'text-gray-500'}`}>
                                {day.substring(0, 1)}
                            </span>
                            {completedDays.has(idx) ? (
                                <CheckCircle2 size={12} className="text-white mt-0.5 md:mt-1" />
                            ) : (
                                <div className="w-1 h-1 rounded-full bg-white/10 mt-1 md:hidden" />
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// === LANGUAGE SWITCHER (Orelhinha) ===
function LanguageSwitcher({ currentLang, onSwitch }: { currentLang: string, onSwitch: () => void }) {
    return (
        <motion.button
            onClick={onSwitch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed top-4 right-4 z-[60] p-2 md:p-3 rounded-full bg-[#0a0a0f]/80 border border-white/20 backdrop-blur-2xl shadow-2xl hover:shadow-white/5 transition-all active:scale-90"
            title={currentLang === 'english' ? 'Switch to Español' : 'Switch to English'}
        >
            <span className="text-2xl md:text-3xl">{currentLang === 'english' ? '🇵🇾' : '🇺🇸'}</span>
        </motion.button>
    );
}

// === MAIN PAGE CONTENT ===
function LanguagesPageContent() {
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [currentLang, setCurrentLang] = useState('english');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const mod = searchParams.get('module');
        if (mod) setTimeout(() => setActiveModule(mod), 0);
    }, [searchParams]);

    const handleModuleClick = (moduleId: string) => {
        if (moduleId === 'english101') {
            router.push('/idiomas/youtube');
            return;
        }
        if (moduleId === 'youtube') {
            router.push('/idiomas/youtube');
            return;
        }
        if (moduleId === 'memrise') {
            window.open('https://app.memrise.com/', '_blank');
            return;
        }
        setActiveModule(moduleId);
        router.push(`?module=${moduleId}`);
    };

    const changeModule = (mod: string | null) => {
        setActiveModule(mod);
        if (mod) router.push(`?module=${mod}`);
        else router.push(window.location.pathname);
    };

    const [megaStructure, setMegaStructure] = useState<any>(null);

    useEffect(() => {
        if (activeModule === 'immersive' && !megaStructure) {
            fetch('http://localhost:8001/api/gdrive/structure?path=mega:Henrique')
                .then(res => {
                    if (!res.ok) throw new Error("Backend offline");
                    return res.json();
                })
                .then(data => setMegaStructure(data))
                .catch(() => {
                    console.warn("Backend offline, using empty structure for Mega Courses");
                    setMegaStructure({ standalone_videos: [], modules: [] })
                });
        }
    }, [activeModule, megaStructure]);

    // === RENDER ACTIVE MODULE ===
    if (activeModule === 'immersive') {
        return (
            <div className="flex h-screen bg-[#08080c] overflow-hidden">
                <div
                    className="flex-1 flex flex-col h-full transition-all duration-300 relative z-0"
                >
                    <CleanPDFReader
                        onBack={() => changeModule(null)}
                        megaStructure={megaStructure}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Language Switcher Orelhinha */}
            <LanguageSwitcher
                currentLang="english"
                onSwitch={() => router.push('/idiomas/spanish')}
            />

            <main className="min-h-screen bg-[#08080c] pt-12 transition-all duration-300 overflow-y-auto overflow-x-hidden pb-40 sm:pb-32">
                <PageNav title="Idiomas" />
                {/* === AMERICAN HERO SECTION === */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1600&q=80"
                            alt="New York City"
                            className="w-full h-full object-cover opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#08080c]/50 via-[#08080c]/80 to-[#08080c]" />
                    </div>

                    <div className="relative px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-16">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-center mb-8 md:mb-12"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-4">
                                <div className="text-4xl sm:text-5xl md:text-7xl">🇺🇸</div>
                                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase">
                                    English Studio
                                </h1>
                            </div>
                            <p className="text-xs sm:text-sm md:text-xl text-gray-400 max-w-xl mx-auto font-medium px-4 sm:px-6 text-center leading-relaxed">
                                Master the language of opportunity • Domine o idioma das oportunidades
                            </p>
                        </motion.div>

                        <div className="max-w-4xl mx-auto">
                            <WeeklyTracker />
                            <WordCarousel />
                        </div>
                    </div>
                </div>

                {/* === MAIN STUDY MODULES === */}
                <div className="px-4 sm:px-6 md:px-8 pb-12">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
                            <GraduationCap size={24} className="text-blue-400 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            Learning Paths
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                            {MAIN_MODULES.map((module, idx) => (
                                <motion.button
                                    key={module.id}
                                    onClick={() => handleModuleClick(module.id)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 text-left group h-44 sm:h-52 md:h-64"
                                >
                                    <div className="absolute inset-0">
                                        <img
                                            src={module.image}
                                            alt={module.name}
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity group-hover:scale-105 duration-500"
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-t ${module.gradient} mix-blend-multiply opacity-70`} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    </div>

                                    {module.tag && (
                                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-sm text-[9px] sm:text-[10px] md:text-xs font-bold text-white">
                                            {module.tag}
                                        </div>
                                    )}

                                    <div className="relative h-full flex flex-col justify-end p-4 sm:p-5 md:p-6">
                                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white mb-0.5 sm:mb-1 md:mb-2">{module.name}</h3>
                                        <p className="text-white/80 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">{module.subtitle}</p>
                                        <p className="text-white/60 text-[9px] sm:text-[10px] md:text-xs line-clamp-2">{module.description}</p>

                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className={`p-3 md:p-4 rounded-full bg-gradient-to-r ${module.gradient}`}>
                                                <PlayCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* === MODALS === */}
                <AnimatePresence>
                    {activeTool === 'translator' && (
                        <TranslatorModal onClose={() => setActiveTool(null)} />
                    )}
                    {activeTool === 'tutor' && (
                        <AITutorModal onClose={() => setActiveTool(null)} />
                    )}
                </AnimatePresence>
                {/* === PREMIUM FLOATING DOCK (PERFECTLY ALIGNED) === */}
                <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.5 }}
                    className="fixed bottom-28 sm:bottom-24 md:bottom-10 inset-x-0 z-[100] flex justify-center pointer-events-none md:pl-20 px-4"
                >
                    <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 md:gap-5 p-2.5 sm:p-3 md:p-4 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] bg-[#0a0a0f]/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                        {DOCK_TOOLS.map((tool) => (
                            <motion.button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                whileHover={{ scale: 1.2, y: -10 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className="group relative"
                            >
                                {/* Glow behind */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full`} />

                                {/* Button Body */}
                                <div className={`relative w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg border border-white/10 overflow-hidden`}>
                                    {/* Shine effect */}
                                    <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/20 to-transparent opacity-50" />

                                    <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-[30px] md:h-[30px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                </div>

                                {/* Label Tooltip */}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#1a1a1f] border border-white/10 text-white text-[10px] md:text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl">
                                    {tool.name}
                                </div>

                                {/* Reflection dot */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                        ))}

                        {/* Separator */}
                        <div className="w-px h-5 sm:h-6 md:h-8 bg-white/10 mx-0.5 sm:mx-1 md:mx-2" />

                        {/* Scroll To Top Button */}
                        <motion.button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            whileHover={{ scale: 1.2, y: -10 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="group relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-slate-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                            <div className="relative w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-700 to-slate-800 flex items-center justify-center shadow-lg border border-white/10 overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                                <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-[30px] md:h-[30px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                            </div>
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#1a1a1f] border border-white/10 text-white text-[10px] md:text-xs font-semibold tracking-wide opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl">
                                Topo
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                    </div>
                </motion.div>


            </main >
        </>
    );
}

// === EXPORTED PAGE WITH SUSPENSE ===
export default function LanguagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#08080c] text-white">Loading...</div>}>
            <LanguagesPageContent />
        </Suspense>
    );
}

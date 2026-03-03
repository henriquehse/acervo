'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Brain, GraduationCap, Mic, Zap, Podcast,
    ClipboardList, Send, X, ChevronLeft, ChevronRight,
    Play, Pause, SkipBack, SkipForward, Volume2,
    Moon, Sun, Languages, MessageSquare, ChevronDown, Save, Check,
    Download, FileText, Music, ArrowUp, Trash2, RefreshCw, LayoutTemplate, Copy // Added Icons
} from 'lucide-react';

import DraggableTranslator from './DraggableTranslator';
import { LessonRenderer } from '@/components/study/LessonComponents';
import { useLesson } from '@/hooks/useLesson';

// Interfaces
interface Lesson {
    name: string;
    num: string;
    audio: { path: string; name: string };
    pdf?: { path: string; name: string };
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Props {
    onBack: () => void;
    megaStructure?: any;
}

// AI Quick Actions
const AI_ACTIONS = [
    {
        id: 'story',
        label: 'Story Mode',
        icon: BookOpen,
        gradient: 'from-blue-500 to-cyan-400',
        prompt: 'Crie uma história curta usando o vocabulário desta lição para memorização por contexto.'
    },
    {
        id: 'grammar',
        label: 'Grammar Boost',
        icon: GraduationCap,
        gradient: 'from-emerald-500 to-teal-400',
        prompt: 'Explique a gramática desta lição de forma visual e repetitiva (estilo Kumon).'
    },
    {
        id: 'realuse',
        label: 'Real Talk',
        icon: Mic,
        gradient: 'from-purple-500 to-pink-400',
        prompt: 'Como isso é usado na vida real? Gírias e contrações comuns relacionadas.'
    },
    {
        id: 'flashcards',
        label: 'Flashcards',
        icon: Zap,
        gradient: 'from-amber-500 to-orange-400',
        prompt: 'Gere flashcards: Frente (palavra), Verso (tradução + exemplo + pronúncia).'
    },
    {
        id: 'podcast',
        label: 'Podcast Script',
        icon: Podcast,
        gradient: 'from-rose-500 to-red-400',
        prompt: 'Gere roteiro de podcast estilo NotebookLM analisando esta lição.'
    },
    {
        id: 'quiz',
        label: 'Quick Quiz',
        icon: ClipboardList,
        gradient: 'from-indigo-500 to-blue-600',
        prompt: 'Mini quiz de 3 perguntas sobre esta lição com explicações.'
    }
];

export default function CleanPDFReader({ onBack, megaStructure }: Props) {
    // Lessons State
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [idx, setIdx] = useState(0);
    const lesson = lessons[idx];

    // Audio Player
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currTime, setCurrTime] = useState(0);
    const [dur, setDur] = useState(0);
    const [volume, setVolume] = useState(1);

    // UI State
    const [darkMode, setDarkMode] = useState(false);
    const [copilotOpen, setCopilotOpen] = useState(true);
    const [translatorOpen, setTranslatorOpen] = useState(false);
    const [showLessonSelector, setShowLessonSelector] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showDownloads, setShowDownloads] = useState(false); // New State
    const [showScrollTop, setShowScrollTop] = useState(false); // Scroll Top State
    const [showOriginal, setShowOriginal] = useState(false); // Original PDF Toggle
    const contentRef = useRef<HTMLDivElement>(null); // Ref for scroll container

    // Clean View - Fetch lesson data
    const lessonPath = lesson?.pdf?.path || '';
    const { data: lessonData, loading: lessonLoading, error: lessonError } = useLesson(lessonPath);

    // Chat with AI
    const [msgs, setMsgs] = useState<Message[]>([
        { role: 'assistant', content: '👋 Olá! Bem-vindo. Escolha uma ação para começar.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    // Reset & Regenerate Logic
    const handleRegenerateLesson = async () => {
        if (!lesson || !lesson.pdf || !lesson.pdf.path) {
            console.error("Lesson path verification failed");
            return;
        }
        const lessonPath = lesson.pdf.path;
        console.log("Regenerate Button Clicked for:", lessonPath);

        if (confirm('⚠️ Force regenerate lesson structure?\nThis will delete the AI cache and re-analyze the PDF files to apply latest fixes (images, colors, layout).\n\nWait for the page to reload.')) {
            try {
                // 1. Invalidate Backend Cache (Force Re-extraction)
                await fetch('/api/lesson/invalidate-cache', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: lessonPath })
                });

                // 2. Clear Frontend Cache (Images & Progress)
                Object.keys(localStorage).forEach(key => {
                    if (key.includes('lesson') || key.startsWith('vocab_image_')) {
                        localStorage.removeItem(key);
                    }
                });

                // 3. Reload Page
                window.location.reload();
            } catch (error) {
                console.error("Error regenerating:", error);
                alert("Failed to invalidate cache. Check console.");
            }
        }
    };

    const handleResetProgress = () => {
        console.log("Reset Progress Button Clicked");
        if (confirm('⚠️ Reset all progress (exercises and cached images)? This cannot be undone.')) {
            // Clear all exercise answers and cached images
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('exercise_') || key.startsWith('vocab_image_')) {
                    localStorage.removeItem(key);
                }
            });
            // Reload to reset states
            window.location.reload();
        }
    };

    // Chat Logic with Persistence
    useEffect(() => {
        const savedChat = localStorage.getItem('chat_history');
        if (savedChat) {
            try {
                setMsgs(JSON.parse(savedChat));
            } catch (e) {
                console.error('Failed to load chat history', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('chat_history', JSON.stringify(msgs));
    }, [msgs]);

    const handleClearChat = () => {
        console.log("Clear Chat Button Clicked");
        if (confirm('Clear chat history?')) {
            const initialMsg: Message[] = [{ role: 'assistant', content: '👋 Olá! Bem-vindo. Escolha uma ação para começar.' }];
            setMsgs(initialMsg);
            localStorage.removeItem('chat_history');
        }
    };

    // Load lessons from MEGA structure
    useEffect(() => {
        if (!megaStructure) {
            console.log('Waiting for MEGA structure...');
            return;
        }

        const allFiles: any[] = [];

        // 1. Collect from standalone_videos (root files)
        if (megaStructure.standalone_videos) {
            allFiles.push(...megaStructure.standalone_videos);
        }

        // 2. Collect from modules
        if (megaStructure.modules) {
            megaStructure.modules.forEach((mod: any) => {
                if (mod.videos) {
                    allFiles.push(...mod.videos);
                }
            });
        }

        const lessonsData: Lesson[] = [];
        const pdfs = allFiles.filter((f: any) => f.name.toLowerCase().endsWith('.pdf'));
        const mp3s = allFiles.filter((f: any) => f.name.toLowerCase().endsWith('.mp3'));

        console.log(`Found ${pdfs.length} PDFs and ${mp3s.length} MP3s`);

        // Match PDFs with MP3s by lesson number
        pdfs.forEach((pdf: any) => {
            const match = pdf.name.match(/(\d+)/);
            if (!match) return;

            const num = match[1].padStart(2, '0');
            const audio = mp3s.find((mp3: any) => mp3.name.includes(num));

            // Create lesson even if audio is missing (optional)
            lessonsData.push({
                name: `Lesson ${parseInt(num)}`,
                num,
                pdf: { path: pdf.path, name: pdf.name },
                audio: audio ? { path: audio.path, name: audio.name } : { path: '', name: '' }
            });
        });

        lessonsData.sort((a, b) => parseInt(a.num) - parseInt(b.num));
        setLessons(lessonsData);

        // Auto-select first lesson if none selected
        if (lessonsData.length > 0 && idx === 0) {
            // Load saved progress if exists
            const savedIdx = localStorage.getItem('fundamentals_last_lesson');
            if (savedIdx) {
                const parsed = parseInt(savedIdx);
                if (parsed < lessonsData.length) setIdx(parsed);
            }
        }
    }, [megaStructure]);

    // Audio sync
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            setCurrTime(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const updateDuration = () => setDur(audio.duration);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
        };
    }, [lesson]);

    // Audio controls
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playing) {
            audio.pause();
        } else {
            audio.play();
        }
        setPlaying(!playing);
    };

    const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = (parseFloat(e.target.value) / 100) * dur;
        audio.currentTime = newTime;
        setProgress(parseFloat(e.target.value));
    };

    const skipTime = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, Math.min(dur, audio.currentTime + seconds));
    };

    const changeLesson = (newIdx: number) => {
        if (newIdx < 0 || newIdx >= lessons.length) return;

        setIdx(newIdx);
        setPlaying(false);
        localStorage.setItem('fundamentals_last_lesson', newIdx.toString());

        // Reset audio
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    };

    // Save progress
    const saveProgress = () => {
        // TODO: Implementar salvamento de exercícios preenchidos
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Load saved chat history
    useEffect(() => {
        if (!lesson) return;
        const savedChat = localStorage.getItem(`chat_history_${lesson.name}`);
        if (savedChat) {
            try {
                setMsgs(JSON.parse(savedChat));
            } catch (e) { console.error('Failed to load chat history', e); }
        } else {
            setMsgs([{ role: 'assistant', content: '👋 Olá! Bem-vindo. Escolha uma ação para começar.' }]);
        }
    }, [lesson]);

    // Save chat history on change
    useEffect(() => {
        if (!lesson || msgs.length <= 1) return; // Don't save initial state if empty
        localStorage.setItem(`chat_history_${lesson.name}`, JSON.stringify(msgs));
    }, [msgs, lesson]);

    // NotebookLM Integration
    const openNotebookLM = () => {
        // Copy lesson content to clipboard for easy pasting
        if (lessonData) {
            const allText = lessonData.pages.map(p =>
                p.sections.map(s => JSON.stringify(s.content)).join('\n')
            ).join('\n\n');

            navigator.clipboard.writeText(`Context for this lesson (${lesson.name}):\n\n${allText}`)
                .then(() => alert('Lesson content copied to clipboard! Paste it into NotebookLM source.'))
                .catch(() => { });
        }
        window.open('https://notebooklm.google.com/', '_blank');
    };

    // AI Chat
    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        const newMsgs = [...msgs, { role: 'user', content: userMsg } as Message];
        setMsgs(newMsgs);
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8001/api/pdf-ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: lessonPath,
                    message: userMsg,
                    history: newMsgs
                })
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

            let aiResponse = '';
            setMsgs((prev) => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);

                // Support Raw Streaming (Groq/Gemini Direct)
                if (!chunk.includes('data: ')) {
                    aiResponse += chunk;
                    setMsgs((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1].content = aiResponse;
                        return updated;
                    });
                    continue;
                }

                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    if (line.startsWith('data: ')) {
                        const content = line.slice(6);
                        if (content === '[DONE]') continue;

                        aiResponse += content;
                        setMsgs((prev) => {
                            const updated = [...prev];
                            updated[updated.length - 1].content = aiResponse;
                            return updated;
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMsgs((prev) => [
                ...prev,
                { role: 'assistant', content: 'Erro ao processar. Tente novamente.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const quickAction = (action: typeof AI_ACTIONS[0]) => {
        setInput(action.prompt);
        sendMessage();
    };

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const audioUrl = lesson?.audio?.path
        ? `http://localhost:8001/api/gdrive/stream?path=${encodeURIComponent(lesson.audio.path)}`
        : '';

    // Scroll to Top Logic
    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                setShowScrollTop(contentRef.current.scrollTop > 300);
            }
        };

        const div = contentRef.current;
        if (div) {
            div.addEventListener('scroll', handleScroll);
            return () => div.removeEventListener('scroll', handleScroll);
        }
    }, [lessonData]);

    const scrollToTop = () => {
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Download Logic
    const handleDownloadPdf = () => {
        // Wait for potential re-renders before printing
        setTimeout(() => window.print(), 100);
        setShowDownloads(false);
    };



    const handleDownloadAudio = async () => {
        if (!lesson?.audio?.path) {
            alert("No audio file found for this lesson.");
            return;
        }

        // Force download via backend param
        const downloadUrl = `http://localhost:8001/api/gdrive/stream?path=${encodeURIComponent(lesson.audio.path)}&download=true`;

        // Open in new tab - Backend will force download dialog
        window.open(downloadUrl, '_blank');
        setShowDownloads(false);
    };

    return (
        <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'} print:h-auto print:overflow-visible print:block`}>
            {/* Global Print Styles - CRITICAL FOR FULL PAGE PDF */}
            <style jsx global>{`
                @media print {
                    @page { 
                        margin: 20px; 
                        size: auto; 
                    }
                    
                    /* Reset entire document structure for print */
                    html, body, #__next {
                        height: auto !important;
                        overflow: visible !important;
                        width: 100% !important;
                        position: static !important;
                    }

                    /* Hide ALL UI elements indiscriminately */
                    header, footer, button, nav, .sidebar, .translator, .copilot {
                        display: none !important;
                    }

                    /* Force Content Visibility */
                    #lesson-content-area, .page-sections {
                        display: block !important;
                        height: auto !important;
                        overflow: visible !important;
                        width: 100% !important;
                    }

                    /* Preserve Dark Visuals */
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: #0a0a0a !important; /* Force black bg */
                        color: white !important;
                    }
                }
            `}</style>

            {/* Audio Element */}
            {audioUrl && <audio ref={audioRef} src={audioUrl} />}

            {/* Header */}
            {/* Header */}
            <header className={`relative z-50 border-b ${darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-gray-200 bg-gray-50'} px-6 py-4 print:hidden`}>
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">{lesson?.name || 'Loading...'}</h1>
                            <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                                Fundamentals English • Interactive Study
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Toggle View Mode */}
                        <button
                            onClick={() => setShowOriginal(!showOriginal)}
                            className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${showOriginal
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                            title={showOriginal ? "Switch to Interactive Mode" : "View Original PDF"}
                        >
                            {showOriginal ? <LayoutTemplate size={18} /> : <FileText size={18} />}
                            <span className="hidden sm:inline">{showOriginal ? "Interactive" : "Original"}</span>
                        </button>

                        {/* Backup / Download Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDownloads(!showDownloads)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${showDownloads
                                    ? 'bg-zinc-700 text-white'
                                    : darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                <Download size={16} />
                                <span className="hidden sm:inline">Backup</span>
                            </button>

                            {showDownloads && (
                                <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl overflow-hidden z-50 ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
                                    <div className="p-1">
                                        <button
                                            onClick={handleDownloadPdf}
                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-700'}`}
                                        >
                                            <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">Save Page PDF</div>
                                                <div className="text-[10px] opacity-60">Visual perfect backup</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={handleDownloadAudio}
                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-gray-100 text-gray-700'}`}
                                        >
                                            <div className="p-2 rounded-full bg-pink-500/20 text-pink-400">
                                                <Music size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">Download Audio</div>
                                                <div className="text-[10px] opacity-60">High quality MP3</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Regenerate Button */}
                        <button
                            onClick={handleRegenerateLesson}
                            className={`p-2 mr-2 rounded-lg transition-colors ${darkMode ? 'bg-zinc-800 text-amber-500 hover:bg-zinc-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                            title="Fix Layout / Regenerate"
                        >
                            <RefreshCw size={16} />
                        </button>

                        {/* Reset Progress Button */}
                        <button
                            onClick={handleResetProgress}
                            className={`px-3 py-2 mr-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${darkMode
                                ? 'bg-red-900/40 hover:bg-red-900/60 text-red-400'
                                : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                            title="Reset All Progress"
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Reset</span>
                        </button>

                        {/* Save Button */}
                        <button
                            onClick={saveProgress}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${saved
                                ? 'bg-green-500 text-white'
                                : darkMode
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                }`}
                        >
                            {saved ? <Check size={16} /> : <Save size={16} />}
                            {saved ? 'Saved!' : 'Save Progress'}
                        </button>

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-zinc-800 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Translator Toggle */}
                        <button
                            onClick={() => setTranslatorOpen(!translatorOpen)}
                            className={`p-2 rounded-lg transition-colors ${translatorOpen
                                ? darkMode
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-500 text-white'
                                : darkMode
                                    ? 'bg-zinc-800'
                                    : 'bg-gray-200'
                                }`}
                        >
                            <Languages size={20} />
                        </button>

                        {/* Copilot Toggle */}
                        <button
                            onClick={() => setCopilotOpen(!copilotOpen)}
                            className={`p-2 rounded-lg transition-colors ${copilotOpen
                                ? darkMode
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-purple-500 text-white'
                                : darkMode
                                    ? 'bg-zinc-800'
                                    : 'bg-gray-200'
                                }`}
                        >
                            <MessageSquare size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className={`flex-1 flex overflow-hidden print:overflow-visible print:h-auto print:block`}>

                {showOriginal ? (
                    <iframe
                        src={`http://localhost:8001/api/gdrive/stream?path=${encodeURIComponent(lessonPath)}`}
                        className="flex-1 w-full h-full border-none bg-zinc-900"
                        title="Original PDF"
                    />
                ) : (

                    /* Lesson Content - Added ID for print targeting */
                    <div
                        id="lesson-content-area"
                        ref={contentRef}
                        className="flex-1 overflow-y-auto print:overflow-visible print:h-auto scroll-smooth"
                    >
                        {lessonLoading ? (
                            <div className="h-full flex flex-col items-center justify-center print:hidden">
                                <div className={`w-16 h-16 rounded-full border-4 ${darkMode ? 'border-indigo-500/20 border-t-indigo-500' : 'border-indigo-200 border-t-indigo-600'} animate-spin`} />
                                <p className={`mt-4 text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                                    Extracting lesson structure...
                                </p>
                            </div>
                        ) : lessonError ? (
                            <div className="h-full flex items-center justify-center p-8 text-center print:hidden">
                                <div>
                                    <div className="text-6xl mb-4">⚠️</div>
                                    <h3 className="text-xl font-bold mb-2">Extraction Failed</h3>
                                    <p className={darkMode ? 'text-zinc-500' : 'text-gray-500'}>{lessonError}</p>
                                </div>
                            </div>
                        ) : lessonData ? (
                            <LessonRenderer data={lessonData} currentTime={currTime} darkMode={darkMode} />
                        ) : (
                            <div className="h-full flex items-center justify-center print:hidden">
                                <p className={darkMode ? 'text-zinc-500' : 'text-gray-500'}>No lesson selected</p>
                            </div>
                        )}

                        {/* Scroll To Top Button */}
                        <AnimatePresence>
                            {showScrollTop && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                                    onClick={scrollToTop}
                                    className={`fixed bottom-32 p-4 rounded-full shadow-2xl z-40 print:hidden transition-all duration-300
                                    ${copilotOpen ? 'right-[26rem]' : 'right-8'}
                                    ${darkMode
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'
                                            : 'bg-white hover:bg-gray-50 text-indigo-600 shadow-xl border border-gray-100'
                                        }`}
                                    title="Back to Top"
                                >
                                    <ArrowUp size={24} strokeWidth={2.5} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* AI Copilot Sidebar */}
                <AnimatePresence>
                    {copilotOpen && (
                        <motion.div
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className={`w-96 border-l ${darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-gray-200 bg-gray-50'} flex flex-col print:hidden`}
                        >
                            {/* Copilot Header */}
                            <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-gray-200 bg-white'}`}>
                                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                    <Brain size={16} className="text-purple-500" />
                                    AI Copilot
                                </h3>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClearChat}
                                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-400'}`}
                                        title="Clear Chat History"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={openNotebookLM}
                                        title="Copy content & Open NotebookLM"
                                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold ${darkMode
                                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                    >
                                        <Podcast size={14} />
                                        <span>NotebookLM</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="p-4 grid grid-cols-2 gap-2 border-b">
                                {AI_ACTIONS.map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={() => quickAction(action)}
                                        className={`p-3 rounded-xl text-left transition-all bg-gradient-to-br ${action.gradient} text-white hover:scale-105`}
                                    >
                                        <action.icon size={16} className="mb-1" />
                                        <div className="text-[10px] font-bold uppercase tracking-wider">
                                            {action.label}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {msgs.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-lg relative group ${msg.role === 'user'
                                            ? 'bg-indigo-500 text-white ml-8'
                                            : darkMode
                                                ? 'bg-zinc-800 mr-8'
                                                : 'bg-white border mr-8'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap pr-6">{msg.content}</p>
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(msg.content);
                                                    setCopiedIdx(i);
                                                    setTimeout(() => setCopiedIdx(null), 2000);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {copiedIdx === i ? (
                                                    <Check size={14} className="text-green-500" />
                                                ) : (
                                                    <Copy size={14} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {loading && (
                                    <div className={`p-3 rounded-lg mr-8 ${darkMode ? 'bg-zinc-800' : 'bg-white border'}`}>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Ask about this lesson..."
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm outline-none ${darkMode
                                            ? 'bg-zinc-800 border-zinc-700'
                                            : 'bg-white border-gray-300'
                                            } border`}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={loading || !input.trim()}
                                        className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Translator */}
            <AnimatePresence>
                {translatorOpen && (
                    <div className="print:hidden">
                        <DraggableTranslator isOpen={translatorOpen} onClose={() => setTranslatorOpen(false)} />
                    </div>
                )}
            </AnimatePresence>

            {/* Audio Player Footer */}
            <footer className={`border-t ${darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-gray-200 bg-gray-50'} px-6 py-4 print:hidden`}>
                <div className="max-w-7xl mx-auto flex items-center gap-6">
                    {/* Lesson Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => changeLesson(idx - 1)}
                            disabled={idx === 0}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowLessonSelector(!showLessonSelector)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Lesson {lesson?.num || '01'}
                                <ChevronDown size={14} />
                            </button>

                            {showLessonSelector && (
                                <div className={`absolute bottom-full mb-2 ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-300'} border rounded-lg shadow-xl max-h-64 overflow-y-auto`}>
                                    {lessons.map((l, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                changeLesson(i);
                                                setShowLessonSelector(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-indigo-500 hover:text-white transition-colors ${i === idx ? 'bg-indigo-600 text-white' : ''
                                                }`}
                                        >
                                            {l.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => changeLesson(idx + 1)}
                            disabled={idx === lessons.length - 1}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => skipTime(-10)}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}
                        >
                            <SkipBack size={20} />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        >
                            {playing ? <Pause size={20} /> : <Play size={20} />}
                        </button>

                        <button
                            onClick={() => skipTime(10)}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}
                        >
                            <SkipForward size={20} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 flex items-center gap-3">
                        <span className="text-xs font-mono">{formatTime(currTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={seek}
                            className="flex-1 h-1 rounded-full bg-zinc-700 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500"
                        />
                        <span className="text-xs font-mono">{formatTime(dur)}</span>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                        <Volume2 size={18} />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setVolume(v);
                                if (audioRef.current) audioRef.current.volume = v;
                            }}
                            className="w-20 h-1 rounded-full bg-zinc-700 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        />
                    </div>
                </div>
            </footer>
        </div >
    );
}

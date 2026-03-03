'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Youtube, PlayCircle, ListVideo, StickyNote, Languages,
    Camera, Sparkles, Download, Trash2, Plus,
    RefreshCw, Copy, Check, Maximize2, Minimize2, ChevronRight, X, Brain,
    Wand2, Layers, Mic, Volume2, Repeat, Library, GraduationCap, Play, Activity,
    BookOpen, FileText, Share2, Image as ImageIcon, ExternalLink, Clipboard
} from 'lucide-react';

// ============ TYPES ============
interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    duration: string | number;
    channelTitle?: string;
    level?: string;
    pedagogical_reason?: string;
}

interface Playlist {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    videoCount: number;
    url?: string;
    videos: VideoItem[];
    type: 'simple' | 'smart_merge' | 'mega_merge';
    gradient: string;
    aiSummary?: string;
}

interface JournalBlock {
    id: string;
    type: 'text' | 'snap';
    content: string;
    timestamp?: string;
}

interface TranslationData {
    translation: string;
    context_usage: string;
    context_usage_pt: string;
    synonyms: string[];
    grammatical_note: string;
}

// ============ MAIN COMPONENT (SPANISH VERSION) ============
export default function YouTubeLearningPageES() {
    const router = useRouter();

    // State
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
    const [journal, setJournal] = useState<{ [videoId: string]: JournalBlock[] }>({});

    // Tools State
    const [importUrl, setImportUrl] = useState('');
    const [channelUrl, setChannelUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'notes' | 'flashcards'>('notes');

    // Translator State
    const [translationInput, setTranslationInput] = useState('');
    const [translationResult, setTranslationResult] = useState<TranslationData | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // AI Summary State
    const [summaryData, setSummaryData] = useState<string | null>(null);

    // UI
    const [activeModal, setActiveModal] = useState<'translator' | 'ai-summary' | 'smart-tools' | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    // DeepL Draggable Modal
    const [deeplPosition, setDeeplPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Refs
    const videoRef = useRef<HTMLIFrameElement>(null);

    // Persistence & Intelligence Load
    useEffect(() => {
        const loadInitialData = async () => {
            // Courses
            try {
                // Tenta carregar cursos iniciais (mesmo JSON por enquanto, depois podemos criar courses_es.json)
                // Tenta carregar cursos iniciais de ESPANHOL
                const res = await fetch('/courses_spanish.json', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setPlaylists(prev => {
                            const ids = new Set(prev.map(p => p.id));
                            const newItems = data.filter((p: any) => !ids.has(p.id));
                            return [...newItems, ...prev];
                        });
                    }
                }
            } catch (e) { console.log("No AI data"); }

            // Journal
            const savedJournal = localStorage.getItem('youtube-journal-blocks-es');
            if (savedJournal) setJournal(JSON.parse(savedJournal));


            const savedPlaylists = localStorage.getItem('youtube-playlists-es');
            if (savedPlaylists) {
                const p = JSON.parse(savedPlaylists);
                // Auto-reset: Se detectar playlists de INGLÊS (IDs começando com 'en_' ou canais em inglês), limpar
                const hasEnglishPollution = p.some((playlist: any) =>
                    playlist.id?.startsWith('en_') ||
                    playlist.title?.includes('EngVid') ||
                    playlist.title?.includes('Bob Canadian') ||
                    playlist.channelTitle?.includes('English')
                );

                if (hasEnglishPollution) {
                    console.log('🧹 Detectado lixo de inglês. Limpando e forçando reload do JSON curado...');
                    localStorage.removeItem('youtube-playlists-es');
                    // Não adicionar nada, deixar só o JSON carregar
                } else if (p.length > 0) {
                    setPlaylists(prev => [...prev, ...p.filter((x: any) => !prev.find(y => y.id === x.id))]);
                }
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (Object.keys(journal).length > 0) localStorage.setItem('youtube-journal-blocks-es', JSON.stringify(journal));
    }, [journal]);

    useEffect(() => {
        if (playlists.length > 0) localStorage.setItem('youtube-playlists-es', JSON.stringify(playlists));
    }, [playlists]);

    const handleSyncAI = async () => {
        setIsProcessing(true);
        setStatusMessage('Sincronizando Inteligencia...');
        try {
            const res = await fetch('/courses_spanish.json', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setPlaylists(data);
                setStatusMessage(`¡${data.length} cursos sincronizados!`);
            } else { setStatusMessage('Sin datos nuevos.'); }
        } catch (e) { setStatusMessage('Fallo en sincronización'); }
        finally { setIsProcessing(false); setTimeout(() => setStatusMessage(''), 2000); }
    };

    // Actions
    const handleImportPlaylist = async () => {
        if (!importUrl) return;
        setIsProcessing(true); setStatusMessage('Obteniendo...');
        try {
            const res = await fetch('/api/youtube-learning/fetch-playlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playlist_url: importUrl }) });
            const data = await res.json();
            const newP = { id: Date.now().toString(), title: data.videos[0]?.playlist_title || 'Importado', description: 'Importado', thumbnail: data.videos[0]?.thumbnail, videoCount: data.video_count, videos: data.videos, type: 'simple', gradient: 'from-gray-700 to-gray-900' } as Playlist;
            setPlaylists(prev => [newP, ...prev]); setImportUrl('');
        } catch (e) { setStatusMessage('Error'); } finally { setIsProcessing(false); }
    };

    const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('¿Eliminar este currículo de tu biblioteca?')) {
            setPlaylists(prev => prev.filter(p => p.id !== id));
        }
    };

    // ============ SMART GENERATE HANDLER ============
    const handleSmartGenerate = async () => {
        if (!channelUrl) {
            setStatusMessage('Por favor pega la URL de un canal.');
            return;
        }

        const cleanUrl = channelUrl.replace(/\/((featured|videos|playlists|shorts|streams|community|about).*)/, '');

        setIsProcessing(true);
        setStatusMessage('AI Architect analizando estructura del canal... (~30s)');

        try {
            const res = await fetch('/api/youtube-learning/smart-merge-channel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel_url: cleanUrl,
                    max_videos_per_playlist: 10,
                    target_level: "A1-C1"
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newCourse = {
                    id: `smart-${Date.now()}`,
                    title: data.learning_journey_summary || "Curso Inteligente",
                    description: "Currículo Generado por IA",
                    thumbnail: data.playlist[0]?.thumbnail || "",
                    videoCount: data.playlist.length,
                    videos: data.playlist,
                    type: 'smart_merge',
                    gradient: 'from-purple-600 to-indigo-600'
                } as Playlist;

                setPlaylists(prev => [newCourse, ...prev]);
                setStatusMessage('¡Currículo Construido con Éxito!');
            } else {
                setStatusMessage('Error IA: No se pudo analizar el canal.');
            }
        } catch (e) {
            console.error(e);
            setStatusMessage('Error de Conexión.');
        } finally {
            setIsProcessing(false);
            setTimeout(() => setStatusMessage(''), 4000);
        }
    };

    // ============ TRANSLATOR HANDLER ============
    const handleTranslate = async () => {
        if (!translationInput) return;
        setIsTranslating(true);
        try {
            const res = await fetch('/api/youtube-learning/translate-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: translationInput,
                    context: currentVideo?.title || ""
                })
            });
            const data = await res.json();
            if (data.success) {
                setTranslationResult(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleVideoSelect = (video: VideoItem) => {
        setCurrentVideo(video);
        if (!isFullscreen) window.scrollTo({ top: 0, behavior: 'smooth' });
        if (!journal[video.id]) {
            setJournal(prev => ({ ...prev, [video.id]: [{ id: 'init', type: 'text', content: '' }] }));
        }

        // RESET SCANNER
        setFlashcards([]);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setRecordedText('');
        setSpeakingFeedback(null);
        setScannerSubTab('flashcards');
    };

    // ============ SCANNER STATE ============
    const [scannerSubTab, setScannerSubTab] = useState<'flashcards' | 'speaking' | 'vocabulary'>('flashcards');
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedText, setRecordedText] = useState('');
    const [speakingFeedback, setSpeakingFeedback] = useState<any>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    // ============ VOCABULARY STATE (PERSISTENTE) ============
    const [vocabularyData, setVocabularyData] = useState<{ [videoId: string]: any }>({});
    const [isLoadingVocabulary, setIsLoadingVocabulary] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        const saved = localStorage.getItem('youtube-vocabulary-es');
        if (saved) setVocabularyData(JSON.parse(saved));
    }, []);

    useEffect(() => {
        if (Object.keys(vocabularyData).length > 0) {
            localStorage.setItem('youtube-vocabulary-es', JSON.stringify(vocabularyData));
        }
    }, [vocabularyData]);

    // ============ SNAP ============
    const handleSnap = () => {
        if (!currentVideo || !videoRef.current) return;
        const vidId = currentVideo.id;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const uniqueId = Date.now();
        const screenshotUrl = `https://img.youtube.com/vi/${currentVideo.id}/maxresdefault.jpg`;

        const newBlocks: JournalBlock[] = [
            ...(journal[vidId] || []),
            {
                id: uniqueId.toString(),
                type: 'snap',
                content: screenshotUrl,
                timestamp
            },
            { id: (uniqueId + 1).toString(), type: 'text', content: '' }
        ];
        setJournal({ ...journal, [vidId]: newBlocks });
        setStatusMessage('📸 ¡Captura Guardada!');
        setTimeout(() => setStatusMessage(''), 2000);
    };

    // DELETE SNAP INDIVIDUAL
    const handleDeleteSnap = (videoId: string, blockId: string) => {
        if (!window.confirm('¿Eliminar esta captura?')) return;
        const blocks = journal[videoId]?.filter(b => b.id !== blockId) || [];
        setJournal({ ...journal, [videoId]: blocks });
    };

    // RESET JOURNAL
    const handleResetJournal = () => {
        if (!currentVideo) return;
        if (!window.confirm('⚠️ ¿Estás seguro de restablecer TODAS las notas?\n\nEsta acción no se puede deshacer.')) return;

        setJournal(prev => ({
            ...prev,
            [currentVideo.id]: [{ id: 'init', type: 'text', content: '' }]
        }));
        setStatusMessage('¡Diario Restablecido!');
        setTimeout(() => setStatusMessage(''), 2000);
    };

    // UPDATE TEXT
    const updateTextBlock = (videoId: string, blockIndex: number, text: string) => {
        const blocks = [...(journal[videoId] || [])];
        if (blocks[blockIndex]) {
            blocks[blockIndex].content = text;
            setJournal({ ...journal, [videoId]: blocks });
        }
    };

    const handleNotebookLM = () => {
        if (!currentVideo) return;
        navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${currentVideo.id}`);
        window.open('https://notebooklm.google.com/', '_blank');
        setStatusMessage('¡Enlace Copiado!');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleCopySummary = () => {
        const summaryText = summaryData || `Resumen de ${currentVideo?.title}\n\nPuntos Clave:\n1. Introducción.\n2. Vocabulario.\n3. Conclusión.`;
        navigator.clipboard.writeText(summaryText);
        setStatusMessage('¡Resumen Copiado!');
        setTimeout(() => setStatusMessage(''), 2000);
    };

    // ============ FLASHCARDS FUNCTIONS ============
    const handleGenerateFlashcards = async () => {
        if (!currentVideo) return;
        setIsLoadingFlashcards(true);
        try {
            const res = await fetch('/api/youtube-learning/generate-flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: currentVideo.id,
                    video_title: currentVideo.title,
                    count: 8,
                    target_lang: 'es' // ← Importante para backend saber que é Espanhol
                })
            });
            const data = await res.json();
            if (data.success) {
                setFlashcards(data.flashcards);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setStatusMessage(`¡${data.flashcards.length} tarjetas generadas!`);
            } else {
                setStatusMessage('Error generando tarjetas');
            }
        } catch (e) {
            setStatusMessage('Error generando tarjetas');
        } finally {
            setIsLoadingFlashcards(false);
        }
    };

    const handleFlipCard = () => setIsFlipped(!isFlipped);
    const handleNextCard = () => {
        if (currentCardIndex < flashcards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
            setIsFlipped(false);
        }
    };
    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
            setIsFlipped(false);
        }
    };

    // ============ SPEAKING ============
    const handleStartRecording = async () => {
        try {
            // Web Speech API para transcrição
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setStatusMessage('Navegador não suporta reconhecimento de voz');
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'es-ES'; // Espanhol
            recognition.continuous = true;
            recognition.interimResults = true;

            let finalTranscript = '';

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                setRecordedText(finalTranscript + interimTranscript);
            };

            recognition.onerror = (e: any) => {
                setStatusMessage(`Error: ${e.error}`);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.start();
            setMediaRecorder(recognition as any);
            setIsRecording(true);
        } catch (e) {
            setStatusMessage('Error al iniciar grabación');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            // Analisar depois que parar (texto já foi setado via onresult)
            setTimeout(() => analyzeSpeaking(), 500);
        }
    };

    const analyzeSpeaking = async () => {
        if (!recordedText.trim()) return;
        try {
            const res = await fetch('/api/youtube-learning/analyze-speaking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: recordedText, language: 'es' })
            });
            const data = await res.json();
            if (data.success) setSpeakingFeedback(data.analysis);
        } catch (e) { console.error(e); }
    };

    // ============ VOCABULARY ============
    const handleExtractVocabulary = async () => {
        if (!currentVideo) return;
        setIsLoadingVocabulary(true);
        try {
            const res = await fetch('/api/youtube-learning/extract-vocabulary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: currentVideo.id,
                    video_title: currentVideo.title,
                    language: 'es'
                })
            });
            const data = await res.json();
            if (data.success) {
                setVocabularyData(prev => ({ ...prev, [currentVideo.id]: data.vocabulary }));
                setStatusMessage(`¡${data.total_items} términos extraídos!`);
            }
        } catch (e) { setStatusMessage('Error extrayendo vocabulario'); }
        finally { setIsLoadingVocabulary(false); }
    };

    const toggleExpandItem = (itemKey: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemKey)) newSet.delete(itemKey);
            else newSet.add(itemKey);
            return newSet;
        });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'verbs': return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: '🔴' };
            case 'nouns': return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', icon: '🟢' };
            case 'collocations': return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: '🔵' };
            case 'expressions': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '🟡' };
            case 'connectors': return { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: '🟣' };
            default: return { bg: 'bg-white/10', border: 'border-white/10', text: 'text-white', icon: '⚪' };
        }
    };

    // ============ DEEPL DRAG HANDLERS ============
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({ x: e.clientX - deeplPosition.x, y: e.clientY - deeplPosition.y });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setDeeplPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
            }
        };
        const handleMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // ============ DEEPL FLOATING MODAL ============
    const renderDeeplModal = () => {
        if (activeModal !== 'translator') return null;
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ position: 'fixed', left: deeplPosition.x, top: deeplPosition.y, zIndex: 9999, width: '420px' }}
                className="bg-[#0f0f13] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden font-['Satoshi']"
            >
                <div onMouseDown={handleMouseDown} className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 cursor-move select-none">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Languages className="text-emerald-400" size={18} />
                        <span>Traductor DeepL</span>
                        <span className="text-[10px] text-gray-400 ml-2">⋮⋮ arrastrar</span>
                    </h3>
                    <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-white/10 rounded-full transition"><X size={16} className="text-gray-400 hover:text-white" /></button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex gap-2">
                        <input autoFocus value={translationInput} onChange={e => setTranslationInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTranslate()} placeholder="Palabra o frase..." className="flex-1 bg-black/40 border border-white/10 px-5 py-4 rounded-xl text-white text-xl outline-none focus:border-emerald-500/50 transition" />
                        <button onClick={handleTranslate} disabled={isTranslating} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold transition disabled:opacity-50 text-xl">
                            {isTranslating ? <Activity className="animate-spin" size={22} /> : "→"}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    // ============ RENDER ============
    if (!selectedPlaylist) {
        return (
            <div className="min-h-screen bg-[#08080c] text-white overflow-auto font-['Satoshi']">
                <style jsx global>{` @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Satoshi:wght@300;400;500;700&display=swap'); `}</style>
                <main className="flex-1 overflow-y-auto bg-[#08080c] relative">
                    <div className="p-12 text-white max-w-7xl mx-auto">
                        <button onClick={() => router.push('/idiomas/spanish')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"><ArrowLeft size={20} /> Volver</button>
                        <h1 className="text-5xl font-black mb-4 tracking-tight">Arquitecto de Idiomas IA 🇪🇸</h1>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl">Construye tu currículo completo de español con contenido de YouTube.</p>

                        {playlists.length === 0 ? (
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-gradient-to-br from-[#121216] to-[#0c0c10] p-10 rounded-3xl border border-purple-500/20 hover:border-purple-500/40 transition group">
                                    <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-purple-900/30 rounded-2xl text-purple-400"><Brain size={32} /></div><h3 className="text-3xl font-bold">Arquitecto Inteligente</h3></div>
                                    <p className="text-gray-400 mb-8 leading-relaxed">Pega la URL de un canal. Organizaremos videos por nivel (A1-C1) y tema.</p>
                                    <input value={channelUrl} onChange={e => setChannelUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl mb-4 text-white focus:border-purple-500 outline-none" placeholder="URL Canal (@Ejemplo)" />
                                    <button onClick={handleSmartGenerate} disabled={isProcessing} className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                                        {isProcessing ? <Activity className="animate-spin" size={20} /> : <Wand2 size={20} />} {isProcessing ? "Analizando..." : "Generar Estructura"}
                                    </button>
                                </div>
                                <div className="bg-gradient-to-br from-[#121216] to-[#0c0c10] p-10 rounded-3xl border border-white/5 hover:border-white/10 transition">
                                    <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-white/5 rounded-2xl text-white"><Youtube size={32} /></div><h3 className="text-3xl font-bold">Importación Rápida</h3></div>
                                    <p className="text-gray-400 mb-8 leading-relaxed">Importa una lista de reproducción específica directamente.</p>
                                    <input value={importUrl} onChange={e => setImportUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl mb-4 text-white focus:border-white/30 outline-none" placeholder="URL Lista" />
                                    <button onClick={handleImportPlaylist} disabled={isProcessing} className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                                        {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />} Importar Lista
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                <div onClick={() => setPlaylists([])} className="bg-white/5 border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/10 transition text-gray-500 hover:text-white">
                                    <Plus size={48} className="mb-4" />
                                    <span className="font-bold">Crear Nuevo</span>
                                </div>
                                {playlists.map(p => (
                                    <div key={p.id} onClick={() => { setSelectedPlaylist(p); handleVideoSelect(p.videos[0]) }} className="bg-[#121216] border border-white/5 p-4 rounded-3xl cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition duration-300 group">
                                        <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                                            <img src={p.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                                            {p.type !== 'simple' && <div className="absolute top-3 left-3 bg-purple-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur">IA SMART</div>}
                                            <button onClick={(e) => handleDeletePlaylist(p.id, e)} className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-md" title="Eliminar">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-purple-400 transition">{p.title}</h3>
                                        <p className="text-sm text-gray-500">{p.videoCount} Videos</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="fixed bottom-8 right-8">
                            <button onClick={handleSyncAI} className="bg-white/5 hover:bg-white/10 text-white p-4 rounded-full shadow-2xl border border-white/10 backdrop-blur"><Activity size={24} className={isProcessing ? "animate-spin" : ""} /></button>
                        </div>
                        {statusMessage && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-fade-in">{statusMessage}</div>}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#08080c] text-white overflow-auto font-['Satoshi']">
            <style jsx global>{` @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Satoshi:wght@300;400;500;700&display=swap'); `}</style>


            <div className="flex w-full h-full">
                <div className="flex-1 flex flex-col h-full min-w-0 relative">
                    <div className={`w-full bg-black relative flex-shrink-0 transition-all duration-500 ease-in-out border-b border-white/10 ${isFullscreen ? 'h-full z-[100] absolute inset-0' : 'h-[60vh]'}`}>
                        {currentVideo ? (
                            <>
                                <iframe ref={videoRef} src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0&modestbranding=1`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 hover:opacity-100 transition-opacity p-2 rounded-xl bg-black/50 backdrop-blur">
                                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-white/20 rounded-lg text-white" title="Alternar Barra">{showSidebar ? <Maximize2 size={16} /> : <ListVideo size={16} />}</button>
                                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-white/20 rounded-lg text-white" title="Pantalla Completa">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
                                </div>
                            </>
                        ) : <div className="w-full h-full flex flex-col items-center justify-center text-gray-600"><Youtube size={64} className="mb-4" /><p>Selecciona un video</p></div>}
                    </div>

                    {!isFullscreen && (
                        <div className="flex-1 bg-[#0a0a0f] flex flex-col min-h-0 relative">
                            <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#0a0a0f] shrink-0">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition tracking-wider ${activeTab === 'notes' ? 'bg-[#f5f5dc] text-[#1a237e] shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><BookOpen size={16} /> Diario</button>
                                    <button onClick={() => setActiveTab('flashcards')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition tracking-wider ${activeTab === 'flashcards' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-500 hover:text-gray-300'}`}><Sparkles size={16} /> Escáner</button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleSnap} className="flex flex-col items-center gap-1 group" title="Captura">
                                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition"><Camera size={18} className="text-gray-400 group-hover:text-white" /></div>
                                        <span className="text-[9px] text-gray-600 uppercase font-black">Captura</span>
                                    </button>
                                    <button onClick={() => setActiveModal('translator')} className="flex flex-col items-center gap-1 group" title="Traductor">
                                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition"><Languages size={18} className="text-emerald-400" /></div>
                                        <span className="text-[9px] text-gray-600 uppercase font-black">DeepL</span>
                                    </button>
                                    <button onClick={() => setActiveModal('ai-summary')} className="flex flex-col items-center gap-1 group" title="Resumen IA">
                                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition"><Brain size={18} className="text-purple-400" /></div>
                                        <span className="text-[9px] text-gray-600 uppercase font-black">Resumen</span>
                                    </button>
                                </div>
                            </div>

                            {/* Conteúdo das Abas (Simplificado para poupar espaço no paste) */}
                            <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
                                {activeTab === 'notes' && (
                                    <div className="min-h-full bg-[#f5f5dc] text-[#1a237e] p-8 font-['Kalam'] text-lg leading-relaxed relative">
                                        {/* Journal Content Here - Mesma lógica mas em espanhol */}
                                        <div className="flex flex-col gap-6">
                                            {(journal[currentVideo?.id || ''] || [{ id: 'init', type: 'text', content: '' }]).map((block, index) => (
                                                <div key={block.id} className="group relative">
                                                    {block.type === 'snap' ? (
                                                        <div className="relative rounded-xl overflow-hidden shadow-lg border-4 border-white transform rotate-[-1deg] hover:rotate-0 transition duration-300">
                                                            <img src={block.content} className="w-full" />
                                                            <button onClick={() => handleDeleteSnap(currentVideo!.id, block.id)} className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <textarea
                                                            value={block.content}
                                                            onChange={(e) => updateTextBlock(currentVideo!.id, index, e.target.value)}
                                                            placeholder="Escribe tus notas aquí..."
                                                            className="w-full bg-transparent border-none outline-none resize-none overflow-hidden placeholder-gray-400/50"
                                                            style={{ height: 'auto', minHeight: '60px' }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'flashcards' && (
                                    <div className="flex flex-col h-full">
                                        {/* Sub-Tabs do Scanner */}
                                        <div className="flex justify-center p-4 border-b border-white/5 bg-[#0a0a0f] gap-4">
                                            <button onClick={() => setScannerSubTab('flashcards')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${scannerSubTab === 'flashcards' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}>Tarjetas</button>
                                            <button onClick={() => setScannerSubTab('speaking')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${scannerSubTab === 'speaking' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}>Pronunciación</button>
                                            <button onClick={() => setScannerSubTab('vocabulary')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${scannerSubTab === 'vocabulary' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}>Vocabulario</button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0f] relative">
                                            {scannerSubTab === 'flashcards' && (
                                                <div className="h-full flex flex-col items-center justify-center">
                                                    {flashcards.length === 0 ? (
                                                        <div className="text-center">
                                                            <div className="mb-6 p-8 rounded-full bg-indigo-500/10 inline-block animate-pulse">
                                                                <Sparkles size={48} className="text-indigo-400" />
                                                            </div>
                                                            <h3 className="text-3xl font-bold text-white mb-4">Generador de Flashcards AI</h3>
                                                            <p className="text-gray-400 mb-8 max-w-md mx-auto">La IA analizará el video y creará tarjetas inteligentes con vocabulario clave.</p>
                                                            <button
                                                                onClick={handleGenerateFlashcards}
                                                                disabled={isLoadingFlashcards || !currentVideo}
                                                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                                                            >
                                                                {isLoadingFlashcards ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                                                                {isLoadingFlashcards ? 'Generando...' : 'Generar Tarjetas'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full max-w-xl perspective-1000">
                                                            <div className="relative w-full aspect-[4/3] cursor-pointer group" onClick={handleFlipCard} style={{ perspective: '1000px' }}>
                                                                <motion.div
                                                                    initial={false}
                                                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                                                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                                                                    className="w-full h-full relative preserve-3d shadow-2xl rounded-3xl"
                                                                    style={{ transformStyle: 'preserve-3d' }}
                                                                >
                                                                    {/* FRONT */}
                                                                    <div className="absolute inset-0 rounded-3xl overflow-hidden border-2 border-indigo-500/30 bg-[#15151a]" style={{ backfaceVisibility: 'hidden' }}>
                                                                        {flashcards[currentCardIndex]?.image_url && (
                                                                            <img src={flashcards[currentCardIndex].image_url} alt={flashcards[currentCardIndex].word} className="w-full h-full object-cover opacity-60" />
                                                                        )}
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col items-center justify-end p-8">
                                                                            <h2 className="text-6xl font-black text-white mb-2 shadow-black drop-shadow-lg">{flashcards[currentCardIndex]?.word}</h2>
                                                                            <p className="text-sm text-gray-300 uppercase tracking-wider font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur">Toca para girar</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* BACK */}
                                                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-900 to-purple-900 p-8 flex flex-col justify-center border border-white/10" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                                                        <div className="text-center">
                                                                            <h3 className="text-4xl font-bold text-white mb-4">{flashcards[currentCardIndex]?.translation_pt}</h3>
                                                                            <p className="text-indigo-200 text-lg mb-6 leading-relaxed">{flashcards[currentCardIndex]?.definition}</p>
                                                                            <div className="bg-black/30 rounded-xl p-4 backdrop-blur border border-white/5">
                                                                                <p className="text-white italic mb-2">"{flashcards[currentCardIndex]?.example}"</p>
                                                                                <span className="text-xs text-indigo-300 uppercase font-bold tracking-wider">{flashcards[currentCardIndex]?.difficulty}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-8">
                                                                <button onClick={handlePrevCard} disabled={currentCardIndex === 0} className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold">← Anterior</button>
                                                                <span className="text-gray-500 font-mono text-sm">{currentCardIndex + 1} / {flashcards.length}</span>
                                                                <button onClick={handleNextCard} disabled={currentCardIndex === flashcards.length - 1} className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold">Siguiente →</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {scannerSubTab === 'speaking' && (
                                                <div className="max-w-2xl mx-auto py-8">
                                                    <div className="text-center mb-10">
                                                        <div className="inline-flex items-center justify-center p-4 bg-pink-500/10 rounded-full mb-4">
                                                            <Mic size={32} className="text-pink-500" />
                                                        </div>
                                                        <h3 className="text-3xl font-bold text-white mb-2">Laboratorio de Pronunciación</h3>
                                                        <p className="text-gray-400">Graba tu voz y recibe retroalimentación instantánea de la IA.</p>
                                                    </div>

                                                    <div className="bg-[#15151a] rounded-2xl p-6 mb-8 border border-white/5 shadow-xl">
                                                        <label className="text-xs uppercase font-bold text-gray-500 mb-3 block">Frase de Práctica</label>
                                                        <textarea
                                                            value={recordedText}
                                                            onChange={(e) => setRecordedText(e.target.value)}
                                                            placeholder="Escribe o pega aquí el texto que quieres leer..."
                                                            className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-pink-500 transition text-lg"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-center gap-6 mb-10">
                                                        <button
                                                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                                                            className={`h-16 px-8 rounded-full font-bold flex items-center gap-3 transition-all shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105 hover:shadow-pink-500/25'} text-white text-lg`}
                                                        >
                                                            {isRecording ? <div className="w-3 h-3 bg-white rounded-sm"></div> : <Mic size={24} />}
                                                            {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
                                                        </button>

                                                        <button
                                                            onClick={analyzeSpeaking}
                                                            disabled={!recordedText.trim() || isRecording}
                                                            className="h-16 px-8 bg-white/5 text-white rounded-full hover:bg-white/10 font-bold disabled:opacity-30 border border-white/10 transition flex items-center gap-2"
                                                        >
                                                            <Activity size={20} /> Analizar
                                                        </button>
                                                    </div>

                                                    {speakingFeedback && (
                                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#1a1a20] to-[#15151a] border border-white/10 rounded-3xl p-8 shadow-2xl">
                                                            <div className="flex items-center gap-6 mb-6">
                                                                <div className="relative flex items-center justify-center w-24 h-24">
                                                                    <svg className="w-full h-full transform -rotate-90">
                                                                        <circle cx="48" cy="48" r="40" fill="transparent" stroke="#333" strokeWidth="8" />
                                                                        <circle cx="48" cy="48" r="40" fill="transparent" stroke={speakingFeedback.score >= 80 ? '#4ade80' : speakingFeedback.score >= 60 ? '#facc15' : '#f87171'} strokeWidth="8" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - speakingFeedback.score / 100)}`} strokeLinecap="round" />
                                                                    </svg>
                                                                    <span className="absolute text-2xl font-black text-white">{speakingFeedback.score}%</span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-xl font-bold text-white mb-1">Análisis Completado</h4>
                                                                    <p className="text-gray-400 text-sm leading-relaxed">{speakingFeedback.feedback}</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                                                                <p className="text-pink-400 font-bold text-xs uppercase mb-3 flex items-center gap-2"><Sparkles size={14} /> Consejos de Mejora:</p>
                                                                <ul className="space-y-2">
                                                                    {speakingFeedback.pronunciation_tips?.map((tip: string, i: number) => (
                                                                        <li key={i} className="text-gray-300 text-sm flex gap-2">
                                                                            <span className="text-pink-500/50">•</span> {tip}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}

                                            {scannerSubTab === 'vocabulary' && (
                                                <div className="max-w-3xl mx-auto">
                                                    {!currentVideo?.id || !vocabularyData[currentVideo?.id] ? (
                                                        <div className="text-center py-10">
                                                            <div className="mb-6 p-6 rounded-full bg-emerald-500/10 inline-block">
                                                                <Library size={48} className="text-emerald-400" />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-white mb-3">Banco de Vocabulario</h3>
                                                            <p className="text-gray-400 mb-8 max-w-md mx-auto">Extrae verbos, sustantivos, colocaciones y expresiones del video automáticamente.</p>
                                                            <button
                                                                onClick={handleExtractVocabulary}
                                                                disabled={isLoadingVocabulary}
                                                                className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2 mx-auto"
                                                            >
                                                                {isLoadingVocabulary ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                                                                {isLoadingVocabulary ? 'Extrayendo...' : 'Extraer Vocabulario'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6 pb-20">
                                                            <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#0a0a0f]/95 backdrop-blur p-4 z-10 border-b border-white/5">
                                                                <h3 className="text-xl font-bold text-white flex items-center gap-2">📚 Banco de Vocabulario</h3>
                                                                <button onClick={handleExtractVocabulary} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition uppercase">regenerar</button>
                                                            </div>

                                                            {['verbs', 'nouns', 'collocations', 'expressions', 'connectors'].map(category => {
                                                                const items = vocabularyData[currentVideo?.id]?.[category] || [];
                                                                const colors = getCategoryColor(category);
                                                                if (items.length === 0) return null;

                                                                const catTitles: { [key: string]: string } = { 'verbs': 'Verbos', 'nouns': 'Sustantivos', 'collocations': 'Colocaciones', 'expressions': 'Expresiones', 'connectors': 'Conectores' };

                                                                return (
                                                                    <div key={category} className={`${colors.bg} border ${colors.border} rounded-2xl p-1 overflow-hidden transition-all duration-300`}>
                                                                        <div className="p-4 flex items-center justify-between">
                                                                            <h4 className={`${colors.text} font-black text-sm uppercase tracking-wider flex items-center gap-2`}>
                                                                                {colors.icon} {catTitles[category] || category} <span className="opacity-50">({items.length})</span>
                                                                            </h4>
                                                                        </div>
                                                                        <div className="space-y-1 px-1 pb-1">
                                                                            {items.map((item: any, idx: number) => {
                                                                                const itemKey = `${category}-${idx}`;
                                                                                const isExpanded = expandedItems.has(itemKey);

                                                                                return (
                                                                                    <div key={idx} className="bg-black/40 rounded-xl overflow-hidden border border-white/5">
                                                                                        <button
                                                                                            onClick={() => toggleExpandItem(itemKey)}
                                                                                            className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition group"
                                                                                        >
                                                                                            <div className="flex items-center gap-3">
                                                                                                <span className="text-white font-bold group-hover:text-emerald-300 transition">{item.term}</span>
                                                                                                {item.type && <span className="text-gray-600 text-[10px] bg-white/5 px-2 py-0.5 rounded uppercase font-bold">{item.type}</span>}
                                                                                            </div>
                                                                                            <ChevronRight size={16} className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-white' : ''}`} />
                                                                                        </button>

                                                                                        <AnimatePresence>
                                                                                            {isExpanded && (
                                                                                                <motion.div
                                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                                    className="px-4 pb-4 border-t border-white/5 bg-black/20"
                                                                                                >
                                                                                                    <p className="text-gray-300 text-sm mt-3 mb-4 leading-relaxed border-l-2 border-emerald-500/30 pl-3">{item.explanation_pt}</p>

                                                                                                    <div className="space-y-2 mb-3">
                                                                                                        {item.examples?.map((ex: any, i: number) => (
                                                                                                            <div key={i} className="bg-white/5 rounded-lg p-3 text-sm">
                                                                                                                <p className="text-indigo-200 font-medium">"{ex.en}"</p>
                                                                                                                <p className="text-gray-500 text-xs mt-1">→ {ex.pt}</p>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>

                                                                                                    {item.usage_tip && (
                                                                                                        <div className={`bg-gradient-to-r from-emerald-900/20 to-transparent rounded-lg p-3 border-l-2 border-emerald-500/50`}>
                                                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                                                <span className="text-emerald-400 text-[10px] font-black uppercase">💡 Consejo de Uso</span>
                                                                                                            </div>
                                                                                                            <p className="text-gray-400 text-xs">{item.usage_tip}</p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </motion.div>
                                                                                            )}
                                                                                        </AnimatePresence>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar com Lista de Vídeos */}
                <AnimatePresence>
                    {showSidebar && selectedPlaylist && (
                        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 350, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l border-white/5 bg-[#050507] flex flex-col h-full shrink-0">
                            <div className="p-6 border-b border-white/5 bg-[#0a0a0f]">
                                <button onClick={() => setSelectedPlaylist(null)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold mb-3"><ArrowLeft size={12} /> Volver a Cursos</button>
                                <h2 className="text-lg font-bold line-clamp-1">{selectedPlaylist.title}</h2>
                                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                    <span>{selectedPlaylist.videos.length} videos</span>
                                    <span>Nivel: {selectedPlaylist.videos[0]?.level || 'Mixto'}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {selectedPlaylist.videos.map((vid, idx) => (
                                    <div key={vid.id} onClick={() => handleVideoSelect(vid)} className={`p-4 flex gap-3 cursor-pointer hover:bg-white/5 transition border-b border-white/5 ${currentVideo?.id === vid.id ? 'bg-white/10 border-l-4 border-l-purple-500' : ''}`}>
                                        <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden">
                                            <img src={vid.thumbnail} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded text-white font-mono">{vid.duration}</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-bold line-clamp-2 mb-1 ${currentVideo?.id === vid.id ? 'text-purple-400' : 'text-gray-300'}`}>{vid.title}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {renderDeeplModal()}
        </div>
    );
}

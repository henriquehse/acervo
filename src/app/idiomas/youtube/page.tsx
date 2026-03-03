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

// ============ MAIN COMPONENT ============
export default function YouTubeLearningPage() {
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
                const res = await fetch('/courses_initial.json', { cache: 'no-store' });
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
            const savedJournal = localStorage.getItem('youtube-journal-blocks');
            if (savedJournal) setJournal(JSON.parse(savedJournal));

            const savedPlaylists = localStorage.getItem('youtube-playlists-v6');
            if (savedPlaylists) {
                const p = JSON.parse(savedPlaylists);
                if (p.length > 0) setPlaylists(prev => [...prev, ...p.filter((x: any) => !prev.find(y => y.id === x.id))]);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (Object.keys(journal).length > 0) localStorage.setItem('youtube-journal-blocks', JSON.stringify(journal));
    }, [journal]);

    useEffect(() => {
        if (playlists.length > 0) localStorage.setItem('youtube-playlists-v6', JSON.stringify(playlists));
    }, [playlists]);

    const handleSyncAI = async () => {
        setIsProcessing(true);
        setStatusMessage('Syncing Intelligence...');
        try {
            const res = await fetch('/courses_initial.json', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setPlaylists(data);
                setStatusMessage(`Synced ${data.length} courses!`);
            } else { setStatusMessage('No new AI data.'); }
        } catch (e) { setStatusMessage('Sync failed'); }
        finally { setIsProcessing(false); setTimeout(() => setStatusMessage(''), 2000); }
    };

    // Actions
    const handleImportPlaylist = async () => {
        if (!importUrl) return;
        setIsProcessing(true); setStatusMessage('Fetching...');
        try {
            const res = await fetch('/api/youtube-learning/fetch-playlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playlist_url: importUrl }) });
            const data = await res.json();
            const newP = { id: Date.now().toString(), title: data.videos[0]?.playlist_title || 'Imported', description: 'Imported', thumbnail: data.videos[0]?.thumbnail, videoCount: data.video_count, videos: data.videos, type: 'simple', gradient: 'from-gray-700 to-gray-900' } as Playlist;
            setPlaylists(prev => [newP, ...prev]); setImportUrl('');
        } catch (e) { setStatusMessage('Error'); } finally { setIsProcessing(false); }
    };

    const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Remove this curriculum from your library?')) {
            setPlaylists(prev => prev.filter(p => p.id !== id));
        }
    };

    // ============ SMART GENERATE HANDLER ============
    const handleSmartGenerate = async () => {
        if (!channelUrl) {
            setStatusMessage('Please paste a channel URL first.');
            return;
        }

        // Auto-Clean URL (Remove /featured, /playlists, etc to get Root Channel)
        const cleanUrl = channelUrl.replace(/\/((featured|videos|playlists|shorts|streams|community|about).*)/, '');

        setIsProcessing(true);
        setStatusMessage('AI Architect is analyzing channel structure... (This takes ~30s)');

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
                    title: data.learning_journey_summary || "Smart Channel Course",
                    description: "AI Generated Curriculum",
                    thumbnail: data.playlist[0]?.thumbnail || "",
                    videoCount: data.playlist.length,
                    videos: data.playlist,
                    type: 'smart_merge',
                    gradient: 'from-purple-600 to-indigo-600'
                } as Playlist;

                setPlaylists(prev => [newCourse, ...prev]);
                setStatusMessage('Curriculum Built Successfully!');
            } else {
                setStatusMessage('AI Error: Could not analyze channel. (Check backend logs)');
            }
        } catch (e) {
            console.error(e);
            setStatusMessage('Connection Error. Check backend.');
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

        // 🔄 RESET SCANNER TAB quando trocar de vídeo (mantém journal intacto)
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

    // Carregar vocabulary do localStorage
    useEffect(() => {
        const saved = localStorage.getItem('youtube-vocabulary-v1');
        if (saved) setVocabularyData(JSON.parse(saved));
    }, []);

    // Salvar vocabulary no localStorage quando mudar
    useEffect(() => {
        if (Object.keys(vocabularyData).length > 0) {
            localStorage.setItem('youtube-vocabulary-v1', JSON.stringify(vocabularyData));
        }
    }, [vocabularyData]);

    // ============ SNAP (REAL FRAME CAPTURE via Backend) ============
    const [isCapturing, setIsCapturing] = useState(false);

    const handleSnap = async () => {
        if (!currentVideo || !videoRef.current) return;

        setIsCapturing(true);
        setStatusMessage('📸 Capturing real frame...');

        const vidId = currentVideo.id;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const uniqueId = Date.now();

        try {
            // Tentar obter o tempo atual do player via postMessage para o iframe
            // 1. Obter tempo atual do player YouTube
            let currentTime = 30; // fallback default

            try {
                // Tenta obter via API do iframe (postMessage)
                if (videoRef.current && videoRef.current.contentWindow) {
                    // Precisamos injetar o script de comunicação ou usar postMessage
                    // Método alternativo: buscar o elemento iframe e pegar o tempo se possível
                    // Mas iframe cross-origin bloqueia acesso direto ao DOM.
                    // Solução: O usuario clica SNAP, nós tentamos pegar o tempo via YT Player API se disponível
                    // Se não, usamos um fallback ou pedimos para o usuário digitar (opção futura)

                    // IMPLEMENTAÇÃO DE MENSAGEM DO PLAYER
                    // Enviamos um comando para pedir o status (se o player suportar listener, difícil sem API JS carregada)
                    // Por hora, vamos tentar manter o timestamp síncrono ou usar o START time se definirmos via props
                }

                // Melhoria: Tentar pegar via YT Player Object se ele existir no window (global)
                // Como estamos usando iframe direto, não temos o objeto player fácil.

                // hack: tentar ler do elemento se for youtube-react (não é o caso)

                // NOVA ABORDAGEM: Solicitamos o current time via postMessage (requer enablejsapi=1)
                // O iframe já tem enablejsapi? Vamos verificar.
                // Ajuste: A nossa src do iframe não tem enablejsapi=1. Vamos adicionar.
            } catch (e) {
                console.warn("Could not get time from player", e);
            }

            // Tenta pegar o tempo real via postMessage assíncrona
            const getCurrentTime = new Promise<number>((resolve) => {
                const handler = (event: MessageEvent) => {
                    if (event.source === videoRef.current?.contentWindow) {
                        const data = JSON.parse(event.data);
                        if (data.event === 'infoDelivery' && data.info && data.info.currentTime) {
                            window.removeEventListener('message', handler);
                            resolve(data.info.currentTime);
                        }
                    }
                };
                window.addEventListener('message', handler);

                // Solicita info
                videoRef.current?.contentWindow?.postMessage(JSON.stringify({
                    event: 'listening',
                    id: 1,
                    channel: 'widget'
                }), '*');

                videoRef.current?.contentWindow?.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'getCurrentTime',
                    args: []
                }), '*');

                setTimeout(() => {
                    window.removeEventListener('message', handler);
                    resolve(0); // Timeout
                }, 500);
            });

            const timeFromPlayer = await getCurrentTime;
            if (timeFromPlayer > 0) currentTime = timeFromPlayer;

            const estimatedTimestamp = currentTime;

            const response = await fetch('/api/tools/extract-frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: currentVideo.id,
                    timestamp: estimatedTimestamp
                })
            });

            const data = await response.json();

            let screenshotUrl: string;

            if (data.success && data.image) {
                // Frame real extraído!
                screenshotUrl = data.image;
                setStatusMessage(data.fallback ? '📸 Captured (thumbnail fallback)' : '📸 Real frame captured!');
            } else {
                // Fallback para thumbnail se backend falhar
                screenshotUrl = `https://img.youtube.com/vi/${currentVideo.id}/maxresdefault.jpg`;
                setStatusMessage('📸 Captured (fallback)');
            }

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

        } catch (error) {
            console.error('Snap error:', error);
            // Fallback total para thumbnail
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
            setStatusMessage('📸 Captured (offline mode)');
        } finally {
            setIsCapturing(false);
            setTimeout(() => setStatusMessage(''), 3000);
        }
    };

    // DELETE SNAP INDIVIDUAL
    const handleDeleteSnap = (videoId: string, blockId: string) => {
        if (!window.confirm('Delete this snapshot?')) return;

        const blocks = journal[videoId]?.filter(b => b.id !== blockId) || [];
        setJournal({ ...journal, [videoId]: blocks });
    };

    // RESET JOURNAL (com confirmação)
    const handleResetJournal = () => {
        if (!currentVideo) return;
        if (!window.confirm('⚠️ Are you sure you want to reset ALL notes for this lesson?\n\nThis action cannot be undone.')) return;

        setJournal(prev => ({
            ...prev,
            [currentVideo.id]: [{ id: 'init', type: 'text', content: '' }]
        }));
        setStatusMessage('Journal reset!');
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
        setStatusMessage('Link Copied to Clipboard!');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleCopySummary = () => {
        const summaryText = summaryData || `Summary of ${currentVideo?.title}\n\nKey Points:\n1. Main concept introduction.\n2. Key vocabulary usage.\n3. Conclusion and takeaways.`;
        navigator.clipboard.writeText(summaryText);
        setStatusMessage('Summary Copied!');
        setTimeout(() => setStatusMessage(''), 2000);
    };

    // ============ FLASHCARDS FUNCTIONS ============
    const handleGenerateFlashcards = async () => {
        if (!currentVideo) return;
        console.log('🎴 Starting flashcard generation for:', currentVideo.title);
        setIsLoadingFlashcards(true);
        try {
            const res = await fetch('/api/youtube-learning/generate-flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: currentVideo.id,
                    video_title: currentVideo.title,
                    count: 8
                })
            });
            console.log('🎴 Response status:', res.status);
            const data = await res.json();
            console.log('🎴 Response data:', data);
            if (data.success) {
                setFlashcards(data.flashcards);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setStatusMessage(`${data.flashcards.length} flashcards generated!`);
                setTimeout(() => setStatusMessage(''), 3000);
            } else {
                console.error('🎴 Error:', data);
                setStatusMessage('Error: ' + (data.detail || 'Unknown error'));
                setTimeout(() => setStatusMessage(''), 5000);
            }
        } catch (e) {
            console.error('🎴 Catch error:', e);
            setStatusMessage('Error generating flashcards');
            setTimeout(() => setStatusMessage(''), 3000);
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

    // ============ SPEAKING FUNCTIONS ============
    const handleStartRecording = async () => {
        try {
            // Web Speech API para transcrição em tempo real
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setStatusMessage('Browser does not support speech recognition');
                setTimeout(() => setStatusMessage(''), 3000);
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US'; // Inglês
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
                setTimeout(() => setStatusMessage(''), 3000);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.start();
            setMediaRecorder(recognition as any);
            setIsRecording(true);
        } catch (e) {
            setStatusMessage('Error starting recording');
            setTimeout(() => setStatusMessage(''), 3000);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            // Aguardar um pouco para garantir que o texto foi setado
            setTimeout(() => analyzeSpeaking(), 500);
        }
    };

    const analyzeSpeaking = async () => {
        if (!recordedText.trim()) return;
        try {
            const res = await fetch('/api/youtube-learning/analyze-speaking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: recordedText })
            });
            const data = await res.json();
            if (data.success) {
                setSpeakingFeedback(data.analysis);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // ============ VOCABULARY FUNCTIONS ============
    const handleExtractVocabulary = async () => {
        if (!currentVideo) return;
        setIsLoadingVocabulary(true);
        try {
            const res = await fetch('/api/youtube-learning/extract-vocabulary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: currentVideo.id,
                    video_title: currentVideo.title
                })
            });
            const data = await res.json();
            if (data.success) {
                setVocabularyData(prev => ({
                    ...prev,
                    [currentVideo.id]: data.vocabulary
                }));
                setStatusMessage(`${data.total_items} vocabulary items extracted!`);
                setTimeout(() => setStatusMessage(''), 3000);
            }
        } catch (e) {
            setStatusMessage('Error extracting vocabulary');
            setTimeout(() => setStatusMessage(''), 3000);
        } finally {
            setIsLoadingVocabulary(false);
        }
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
        setDragOffset({
            x: e.clientX - deeplPosition.x,
            y: e.clientY - deeplPosition.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setDeeplPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
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
                style={{
                    position: 'fixed',
                    left: deeplPosition.x,
                    top: deeplPosition.y,
                    zIndex: 9999,
                    width: '420px'
                }}
                className="bg-[#0f0f13] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden font-['Satoshi']"
            >
                {/* Drag Handle Header */}
                <div
                    onMouseDown={handleMouseDown}
                    className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 cursor-move select-none"
                >
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Languages className="text-emerald-400" size={18} />
                        <span>DeepL Context</span>
                        <span className="text-[10px] text-gray-400 ml-2">⋮⋮ drag me</span>
                    </h3>
                    <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-white/10 rounded-full transition">
                        <X size={16} className="text-gray-400 hover:text-white" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            autoFocus
                            value={translationInput}
                            onChange={e => setTranslationInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleTranslate()}
                            placeholder="English word or phrase..."
                            className="flex-1 bg-black/40 border border-white/10 px-5 py-4 rounded-xl text-white text-xl outline-none focus:border-emerald-500/50 transition"
                        />
                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold transition disabled:opacity-50 text-xl"
                        >
                            {isTranslating ? <Activity className="animate-spin" size={22} /> : "→"}
                        </button>
                    </div>

                    {/* Results */}
                    {translationResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-black/30 rounded-xl p-5 border border-white/5 space-y-5"
                        >
                            {/* Translation */}
                            <div>
                                <div className="text-xs uppercase font-bold text-emerald-400 mb-2">Portuguese</div>
                                <div className="text-4xl font-black text-white">{translationResult.translation}</div>
                                {translationResult.grammatical_note && (
                                    <p className="text-sm text-gray-400 mt-2 italic">{translationResult.grammatical_note}</p>
                                )}
                            </div>

                            {/* Context & Usage */}
                            {translationResult.context_usage && (
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-xs uppercase font-bold text-emerald-400/70 mb-3">Example in Context</div>
                                    <p className="text-white text-lg leading-relaxed">"{translationResult.context_usage}"</p>
                                    <p className="text-emerald-300/80 text-base mt-2">→ "{translationResult.context_usage_pt}"</p>
                                </div>
                            )}

                            {/* Synonyms */}
                            {translationResult.synonyms && translationResult.synonyms.length > 0 && (
                                <div>
                                    <div className="text-xs uppercase font-bold text-gray-500 mb-3">Synonyms & Related</div>
                                    <div className="flex flex-wrap gap-2">
                                        {translationResult.synonyms.map((syn: string) => (
                                            <span
                                                key={syn}
                                                onClick={() => { setTranslationInput(syn); handleTranslate(); }}
                                                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/30 rounded-xl text-base text-emerald-300 border border-emerald-500/20 cursor-pointer transition font-medium"
                                            >
                                                {syn}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        );
    };

    // ============ OTHER MODALS (AI Summary, etc) ============
    const renderModal = () => {
        if (!activeModal || activeModal === 'translator') return null;
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-['Satoshi']">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[201] flex flex-col">
                    <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {activeModal === 'smart-tools' ? <><Wand2 className="text-purple-400" /> Smart Studio</> : <><Brain className="text-blue-400" /> AI Summary</>}
                        </h3>
                        <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={18} className="text-gray-400 hover:text-white" /></button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[80vh]">
                        {activeModal === 'ai-summary' && (
                            <div className="space-y-6">
                                <div className="bg-[#1a1a20] p-6 rounded-xl border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Brain size={24} className="text-purple-400" />
                                        <h4 className="text-white font-bold">Auto-Generated Summary</h4>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <div className="text-gray-300 space-y-2 text-sm leading-relaxed font-sans">
                                        <p><span className="text-purple-300 font-bold">Introduction:</span> This video explores the core concepts of {currentVideo?.title}.</p>
                                        <p><span className="text-purple-300 font-bold">Key Points:</span></p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Overview of main topic.</li>
                                            <li>Critical vocabulary analysis.</li>
                                            <li>Practical examples and usage.</li>
                                        </ul>
                                        <p><span className="text-purple-300 font-bold">Conclusion:</span> A solid foundation for intermediate learners.</p>
                                    </div>
                                </div>
                                <button onClick={handleCopySummary} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                                    <Copy size={18} /> Copy Summary
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    };

    // ============ RENDER ============
    if (!selectedPlaylist) {
        return (
            <div className="min-h-screen bg-[#08080c] text-white overflow-auto font-['Satoshi']">
                <style jsx global>{` @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Satoshi:wght@300;400;500;700&display=swap'); `}</style>
                <main className="flex-1 overflow-y-auto bg-[#08080c] relative">
                    <div className="p-12 text-white max-w-7xl mx-auto">
                        <button onClick={() => router.push('/idiomas')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"><ArrowLeft size={20} /> Back</button>
                        <h1 className="text-5xl font-black mb-4 tracking-tight">AI Language Architect</h1>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl">Build your comprehensive language curriculum from YouTube content.</p>

                        {playlists.length === 0 ? (
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-gradient-to-br from-[#121216] to-[#0c0c10] p-10 rounded-3xl border border-purple-500/20 hover:border-purple-500/40 transition group">
                                    <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-purple-900/30 rounded-2xl text-purple-400"><Brain size={32} /></div><h3 className="text-3xl font-bold">Smart Architect</h3></div>
                                    <p className="text-gray-400 mb-8 leading-relaxed">Paste a channel URL. We'll organize videos by level (A1-C1), topic, and difficulty into a structured course.</p>
                                    <input value={channelUrl} onChange={e => setChannelUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl mb-4 text-white focus:border-purple-500 outline-none" placeholder="Channel URL (@Example)" />
                                    <button onClick={handleSmartGenerate} disabled={isProcessing} className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                                        {isProcessing ? <Activity className="animate-spin" size={20} /> : <Wand2 size={20} />} {isProcessing ? "Analyzing..." : "Generate Structure"}
                                    </button>
                                </div>
                                <div className="bg-gradient-to-br from-[#121216] to-[#0c0c10] p-10 rounded-3xl border border-white/5 hover:border-white/10 transition">
                                    <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-white/5 rounded-2xl text-white"><Youtube size={32} /></div><h3 className="text-3xl font-bold">Quick Import</h3></div>
                                    <p className="text-gray-400 mb-8 leading-relaxed">Import a specific playlist directly. Perfect for valid series or collections you already follow.</p>
                                    <input value={importUrl} onChange={e => setImportUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl mb-4 text-white focus:border-white/30 outline-none" placeholder="Playlist URL" />
                                    <button onClick={handleImportPlaylist} disabled={isProcessing} className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                                        {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />} Import Playlist
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                <div onClick={() => setPlaylists([])} className="bg-white/5 border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/10 transition text-gray-500 hover:text-white">
                                    <Plus size={48} className="mb-4" />
                                    <span className="font-bold">Create New</span>
                                </div>
                                {playlists.map(p => (
                                    <div key={p.id} onClick={() => { setSelectedPlaylist(p); handleVideoSelect(p.videos[0]) }} className="bg-[#121216] border border-white/5 p-4 rounded-3xl cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition duration-300 group">
                                        <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                                            <img src={p.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                                            {p.type !== 'simple' && <div className="absolute top-3 left-3 bg-purple-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur">AI SMART</div>}
                                            <button
                                                onClick={(e) => handleDeletePlaylist(p.id, e)}
                                                className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-md"
                                                title="Delete Playlist"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-purple-400 transition">{p.title}</h3>
                                        <p className="text-sm text-gray-500">{p.videoCount} Videos</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sync Button */}
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
        <div className="h-screen bg-[#08080c] text-white overflow-hidden font-['Satoshi']">
            {/* INJECT FONTS */}
            <style jsx global>{` @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Satoshi:wght@300;400;500;700&display=swap'); `}</style>

            <div className="flex w-full h-full">

                <div className="flex-1 flex flex-col h-full min-w-0 relative">
                    <div className={`w-full bg-black relative flex-shrink-0 transition-all duration-500 ease-in-out border-b border-white/10 ${isFullscreen ? 'h-full z-[100] absolute inset-0' : 'h-[60vh]'}`}>
                        {currentVideo ? (
                            <>
                                <iframe ref={videoRef} src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 hover:opacity-100 transition-opacity p-2 rounded-xl bg-black/50 backdrop-blur">
                                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-white/20 rounded-lg text-white" title="Toggle Sidebar">{showSidebar ? <Maximize2 size={16} /> : <ListVideo size={16} />}</button>
                                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-white/20 rounded-lg text-white" title="Fullscreen">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
                                </div>
                            </>
                        ) : <div className="w-full h-full flex flex-col items-center justify-center text-gray-600"><Youtube size={64} className="mb-4" /><p>Select a video</p></div>}
                    </div>

                    {!isFullscreen && (
                        <div className="flex-1 bg-[#0a0a0f] flex flex-col min-h-0 relative">
                            <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#0a0a0f] shrink-0">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition tracking-wider ${activeTab === 'notes' ? 'bg-[#f5f5dc] text-[#1a237e] shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><BookOpen size={16} /> Journal</button>
                                    <button onClick={() => setActiveTab('flashcards')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition tracking-wider ${activeTab === 'flashcards' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-500 hover:text-gray-300'}`}><Sparkles size={16} /> Scanner</button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleSnap} className="flex flex-col items-center gap-1 group" title="Snap to Journal">
                                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition"><Camera size={18} className="text-gray-400 group-hover:text-white" /></div>
                                        <span className="text-[9px] text-gray-600 uppercase font-black">Snap</span>
                                    </button>
                                    <button onClick={() => setActiveModal('translator')} className="flex flex-col items-center gap-1 group" title="Translator">
                                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition"><Languages size={18} className="text-emerald-400" /></div>
                                        <span className="text-[9px] text-gray-600 uppercase font-black">DeepL</span>
                                    </button>
                                    <button onClick={() => setActiveModal('ai-summary')} className="flex flex-col items-center gap-1 group" title="AI Summary (Auto-Copy)">
                                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition"><Brain size={18} className="text-purple-400" /></div>
                                        <span className="text-[9px] text-gray-600 uppercase font-black">Summary</span>
                                    </button>
                                    <button onClick={handleNotebookLM} className="flex flex-col items-center gap-1 group" title="Open NotebookLM">
                                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition"><ExternalLink size={18} className="text-emerald-400" /></div>
                                        <span className="text-[9px] text-gray-600 uppercase font-black">NotebLM</span>
                                    </button>
                                    <button onClick={handleResetJournal} className="flex flex-col items-center gap-1 group" title="Reset Journal">
                                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-red-500/20 transition"><Trash2 size={18} className="text-gray-400 group-hover:text-red-400" /></div>
                                        <span className="text-[9px] text-gray-600 uppercase font-black">Reset</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 relative overflow-hidden">
                                {activeTab === 'notes' ? (
                                    <div className="w-full h-full relative bg-[#f5f5dc] overflow-y-auto custom-scrollbar">
                                        <div className="absolute inset-0 opacity-10 pointer-events-none sticky top-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")' }}></div>
                                        <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-red-400/30 z-10 pointer-events-none sticky"></div>
                                        <div className="min-h-full p-8 pl-14 relative z-20">
                                            {/* Render Journal Blocks */}
                                            {currentVideo && journal[currentVideo.id]?.map((block, idx) => (
                                                <div key={block.id} className="mb-4">
                                                    {block.type === 'snap' ? (
                                                        <div className="my-6 relative group inline-block">
                                                            <div className="absolute -left-10 top-2 text-[10px] font-mono text-gray-400 bg-white/80 px-1 rounded transform -rotate-2">{block.timestamp}</div>
                                                            <div className="relative rounded-sm overflow-hidden border-4 border-white shadow-xl rotate-1 transform hover:rotate-0 transition-transform w-[280px] bg-white">
                                                                <img src={block.content} alt="Snap" className="w-full object-cover grayscale-[20%] hover:grayscale-0 transition" />
                                                                <div className="absolute bottom-1 right-2 text-black/50 text-[9px] font-bold uppercase tracking-widest font-sans">Snapshot</div>
                                                                {/* DELETE BUTTON */}
                                                                <button
                                                                    onClick={() => handleDeleteSnap(currentVideo.id, block.id)}
                                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                    title="Delete snapshot"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <textarea
                                                            value={block.content}
                                                            onChange={(e) => updateTextBlock(currentVideo.id, idx, e.target.value)}
                                                            placeholder={idx === 0 ? `Subject: ${currentVideo.title}\n\nStart writing...` : "Continue your thoughts..."}
                                                            className="w-full bg-transparent text-[#1a237e] resize-none focus:outline-none font-['Kalam'] font-bold text-3xl leading-[3.5rem] min-h-[70px] overflow-hidden placeholder:text-[#1a237e]/30"
                                                            style={{ height: 'auto', minHeight: block.content.length > 50 ? '100px' : '70px' }}
                                                            onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            {(!currentVideo || !journal[currentVideo?.id]) && <div className="text-[#1a237e]/40 italic mt-10 font-['Kalam'] font-bold text-3xl">Select a video to open your journal...</div>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col bg-[#0a0a0f]">
                                        {/* Sub-tabs */}
                                        <div className="flex items-center gap-2 p-4 border-b border-white/10">
                                            <button onClick={() => setScannerSubTab('flashcards')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${scannerSubTab === 'flashcards' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>🎴 Flashcards</button>
                                            <button onClick={() => setScannerSubTab('speaking')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${scannerSubTab === 'speaking' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>🎤 Speaking</button>
                                            <button onClick={() => setScannerSubTab('vocabulary')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${scannerSubTab === 'vocabulary' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'}`}>📚 Vocabulary</button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 overflow-y-auto p-6">
                                            {scannerSubTab === 'flashcards' && (
                                                <div className="h-full flex flex-col items-center justify-center">
                                                    {flashcards.length === 0 ? (
                                                        <div className="text-center">
                                                            <div className="mb-6 p-8 rounded-full bg-indigo-500/10 inline-block">
                                                                <Sparkles size={48} className="text-indigo-400" />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-white mb-3">Generate AI Flashcards</h3>
                                                            <p className="text-gray-400 mb-6 max-w-md">Create intelligent flashcards with AI-generated images based on this video's vocabulary</p>
                                                            <button
                                                                onClick={handleGenerateFlashcards}
                                                                disabled={isLoadingFlashcards}
                                                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2 mx-auto"
                                                            >
                                                                {isLoadingFlashcards ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                                                                {isLoadingFlashcards ? 'Generating...' : 'Generate Flashcards'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full max-w-2xl">
                                                            <div className="text-center mb-4">
                                                                <span className="text-gray-400 text-sm">Card {currentCardIndex + 1} / {flashcards.length}</span>
                                                            </div>

                                                            <motion.div
                                                                key={currentCardIndex}
                                                                initial={{ rotateY: 0 }}
                                                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                                                transition={{ duration: 0.6 }}
                                                                onClick={handleFlipCard}
                                                                className="relative w-full aspect-[16/9] cursor-pointer mb-6"
                                                                style={{ transformStyle: 'preserve-3d' }}
                                                            >
                                                                <div className="absolute inset-0 rounded-3xl overflow-hidden border-2 border-indigo-500/30" style={{ backfaceVisibility: 'hidden' }}>
                                                                    {flashcards[currentCardIndex]?.image_url && (
                                                                        <img src={flashcards[currentCardIndex].image_url} alt={flashcards[currentCardIndex].word} className="w-full h-full object-cover" />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col items-center justify-end p-8">
                                                                        <h2 className="text-6xl font-black text-white mb-2">{flashcards[currentCardIndex]?.word}</h2>
                                                                        <p className="text-sm text-gray-300 uppercase tracking-wider">Tap to flip</p>
                                                                    </div>
                                                                </div>

                                                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 flex flex-col justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                                                    <div className="text-center">
                                                                        <h3 className="text-4xl font-bold text-white mb-4">{flashcards[currentCardIndex]?.translation_pt}</h3>
                                                                        <p className="text-white/80 text-lg mb-6">{flashcards[currentCardIndex]?.definition}</p>
                                                                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                                                                            <p className="text-white italic mb-2">"{flashcards[currentCardIndex]?.example}"</p>
                                                                            <span className="text-xs text-white/60 uppercase">{flashcards[currentCardIndex]?.difficulty}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>

                                                            <div className="flex items-center justify-between">
                                                                <button onClick={handlePrevCard} disabled={currentCardIndex === 0} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">← Previous</button>
                                                                <button onClick={handleGenerateFlashcards} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm">🔄 Regenerate</button>
                                                                <button onClick={handleNextCard} disabled={currentCardIndex === flashcards.length - 1} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">Next →</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {scannerSubTab === 'speaking' && (
                                                <div className="max-w-2xl mx-auto">
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-bold text-white mb-2">Speaking Practice</h3>
                                                        <p className="text-gray-400">Practice your pronunciation and get AI feedback</p>
                                                    </div>

                                                    <div className="bg-white/5 rounded-2xl p-6 mb-6">
                                                        <label className="text-sm text-gray-400 mb-2 block">Practice Sentence:</label>
                                                        <textarea
                                                            value={recordedText}
                                                            onChange={(e) => setRecordedText(e.target.value)}
                                                            placeholder="Type what you want to practice saying..."
                                                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-purple-500"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-center gap-4 mb-8">
                                                        <button
                                                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                                                            className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105'} text-white`}
                                                        >
                                                            <Mic size={20} />
                                                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                                                        </button>
                                                        <button onClick={analyzeSpeaking} disabled={!recordedText.trim()} className="px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 font-bold disabled:opacity-30">
                                                            Analyze
                                                        </button>
                                                    </div>

                                                    {speakingFeedback && (
                                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className={`text-4xl font-black ${speakingFeedback.score >= 80 ? 'text-green-400' : speakingFeedback.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                    {speakingFeedback.score}%
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-white font-bold">Feedback</h4>
                                                                    <p className="text-gray-300 text-sm">{speakingFeedback.feedback}</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-white font-bold text-sm">Tips:</p>
                                                                {speakingFeedback.pronunciation_tips?.map((tip: string, i: number) => (
                                                                    <p key={i} className="text-gray-300 text-sm">• {tip}</p>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}

                                            {scannerSubTab === 'vocabulary' && (
                                                <div className="max-w-3xl mx-auto">
                                                    {!currentVideo?.id || !vocabularyData[currentVideo?.id] ? (
                                                        <div className="text-center">
                                                            <div className="mb-6 p-8 rounded-full bg-pink-500/10 inline-block">
                                                                <Library size={48} className="text-pink-400" />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-white mb-3">Extract Vocabulary</h3>
                                                            <p className="text-gray-400 mb-6 max-w-md mx-auto">Extract verbs, nouns, collocations, expressions and connectors with explanations and examples</p>
                                                            <button
                                                                onClick={handleExtractVocabulary}
                                                                disabled={isLoadingVocabulary}
                                                                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2 mx-auto"
                                                            >
                                                                {isLoadingVocabulary ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                                                                {isLoadingVocabulary ? 'Extracting...' : 'Extract Vocabulary'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h3 className="text-xl font-bold text-white">📚 Vocabulary Bank</h3>
                                                                <button onClick={handleExtractVocabulary} className="text-sm text-gray-400 hover:text-white">🔄 Regenerate</button>
                                                            </div>

                                                            {['verbs', 'nouns', 'collocations', 'expressions', 'connectors'].map(category => {
                                                                const items = vocabularyData[currentVideo?.id]?.[category] || [];
                                                                const colors = getCategoryColor(category);
                                                                if (items.length === 0) return null;

                                                                return (
                                                                    <div key={category} className={`${colors.bg} border ${colors.border} rounded-2xl p-4`}>
                                                                        <h4 className={`${colors.text} font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2`}>
                                                                            {colors.icon} {category} ({items.length})
                                                                        </h4>
                                                                        <div className="space-y-2">
                                                                            {items.map((item: any, idx: number) => {
                                                                                const itemKey = `${category}-${idx}`;
                                                                                const isExpanded = expandedItems.has(itemKey);

                                                                                return (
                                                                                    <div key={idx} className="bg-black/20 rounded-xl overflow-hidden">
                                                                                        <button
                                                                                            onClick={() => toggleExpandItem(itemKey)}
                                                                                            className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition"
                                                                                        >
                                                                                            <div>
                                                                                                <span className="text-white font-bold">{item.term}</span>
                                                                                                <span className="text-gray-500 text-xs ml-2">({item.type})</span>
                                                                                            </div>
                                                                                            <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                                        </button>

                                                                                        {isExpanded && (
                                                                                            <motion.div
                                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                                className="px-4 pb-4 border-t border-white/5"
                                                                                            >
                                                                                                <p className="text-gray-300 text-sm mt-3 mb-4">{item.explanation_pt}</p>

                                                                                                <div className="space-y-2 mb-3">
                                                                                                    {item.examples?.map((ex: any, i: number) => (
                                                                                                        <div key={i} className="bg-white/5 rounded-lg p-3">
                                                                                                            <p className="text-white text-sm">"{ex.en}"</p>
                                                                                                            <p className="text-gray-400 text-xs mt-1">→ {ex.pt}</p>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>

                                                                                                {item.usage_tip && (
                                                                                                    <div className={`${colors.bg} rounded-lg p-3`}>
                                                                                                        <span className={`${colors.text} text-xs font-bold`}>💡 Tip:</span>
                                                                                                        <p className="text-gray-300 text-xs mt-1">{item.usage_tip}</p>
                                                                                                    </div>
                                                                                                )}
                                                                                            </motion.div>
                                                                                        )}
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

                {/* Playlist Sidebar */}
                {showSidebar && selectedPlaylist && (
                    <div className="w-80 bg-[#08080c] border-l border-white/10 flex flex-col h-full flex-shrink-0 z-40 shadow-2xl">
                        <div className="p-4 border-b border-white/10 bg-[#0a0a0f]">
                            <button onClick={() => setSelectedPlaylist(null)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold mb-3"><ArrowLeft size={12} /> Back</button>
                            <h2 className="font-bold text-base leading-tight line-clamp-2 mb-1 text-white">{selectedPlaylist.title}</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {selectedPlaylist.videos.map((video, idx) => (
                                <button key={idx} onClick={() => handleVideoSelect(video)} className={`w-full text-left p-3 rounded-xl mb-1 transition-all group relative border ${currentVideo?.id === video.id ? 'bg-white/5 border-red-500/30' : 'hover:bg-white/5 border-transparent'}`}>
                                    <div className="flex gap-3 relative z-10">
                                        <div className="w-6 text-gray-600 font-mono text-xs pt-0.5">{(idx + 1).toString().padStart(2, '0')}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold leading-snug mb-1 ${currentVideo?.id === video.id ? 'text-red-400' : 'text-gray-300 group-hover:text-white'}`}>{video.title}</p>
                                        </div>
                                    </div>
                                    {currentVideo?.id === video.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>{activeModal && renderModal()}</AnimatePresence>
            <AnimatePresence>{activeModal === 'translator' && renderDeeplModal()}</AnimatePresence>
        </div>
    );
}

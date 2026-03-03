
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
    ChevronRight, Clock, CheckCircle, Circle, BookMarked,
    StickyNote, Plus, Trash2, ChevronDown, ChevronUp, Pencil,
    Flame, SkipBack, SkipForward, Settings, Camera,
    Repeat, Zap, Brain, LayoutTemplate, MessageSquare,
    PanelRightClose, PanelRightOpen, Download, Share2,
    PictureInPicture2, HelpCircle, Keyboard, FileText, Copy, PlayCircle, ExternalLink, Hourglass, Sparkles
} from 'lucide-react';
import { Suspense } from 'react';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { Folder, File as FileIcon } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// --- TYPES ---
interface Video {
    name: string;
    path: string;
    duration?: number;
    watched?: boolean;
    file_type?: 'video' | 'document';
}

interface Module {
    name: string;
    videos: Video[];
    expanded: boolean;
}

interface Annotation {
    id: string;
    time: number;
    text: string;
    createdAt: Date;
}

interface Note {
    id: string;
    timestamp: number;
    text: string;
    image?: string;
    createdAt: Date;
}
// --- VIEWER COMPONENTS ---

const TXTViewer = ({ url, filename }: { url: string; filename: string }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setContent('');

        fetch(url, { signal: controller.signal })
            .then(async res => {
                if (!res.ok) throw new Error('Falha ao carregar');
                // Check content length if available
                const contentLength = res.headers.get('content-length');
                if (contentLength && parseInt(contentLength) > 1024 * 1024 * 5) { // > 5MB
                    throw new Error('Arquivo muito grande para visualização online.');
                }
                return res.text();
            })
            .then(text => {
                // Safety trim if text is huge (over 50kb for DOM performance)
                if (text.length > 50000) {
                    setContent(text.slice(0, 50000) + '\n\n... (Conteúdo truncado para performance. Baixe o arquivo para ler tudo.)');
                    setIsTruncated(true);
                } else {
                    setContent(text);
                    setIsTruncated(false);
                }
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setContent(`Erro: ${err.message}`);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [url]);

    if (loading) return (
        <div className="flex items-center justify-center h-full text-white/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
            Carregando texto...
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#1a1a1e]">
                <span className="text-xs text-white/60 uppercase tracking-widest font-bold">{filename}</span>
                <a href={url} download={filename} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                    <Download size={14} /> Baixar Arquivo
                </a>
            </div>
            <div className="flex-1 overflow-auto p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                {content}
                {isTruncated && (
                    <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-center">
                        <p>Visualização parcial. O arquivo é muito grande.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Mammoth import moved to top

const DOCXViewer = ({ url, filename }: { url: string; filename: string }) => {
    const [html, setHtml] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(url)
            .then(res => res.arrayBuffer())
            .then(buffer => mammoth.convertToHtml({ arrayBuffer: buffer }))
            .then(result => {
                setHtml(result.value);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setHtml('<div class="text-red-400">Erro ao renderizar documento Word.</div>');
                setLoading(false);
            });
    }, [url]);

    if (loading) return <div className="flex items-center justify-center h-full text-white/50">Renderizando documento...</div>;

    return (
        <div className="w-full h-full overflow-auto bg-white text-black p-12">
            <div className="prose max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
};

// JSZip import moved to top

const ZIPViewer = ({ url, filename }: { url: string; filename: string }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(url)
            .then(res => res.arrayBuffer())
            .then(buffer => JSZip.loadAsync(buffer))
            .then(zip => {
                const fileList: any[] = [];
                zip.forEach((relativePath, zipEntry) => {
                    fileList.push(zipEntry);
                });
                setFiles(fileList.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1)));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [url]);

    const handleFileClick = async (file: any) => {
        if (file.dir) return;

        try {
            const content = await file.async('string');
            // Basic detection for text-like files
            if (file.name.match(/\.(txt|md|json|js|ts|css|html|xml|yml|ini|py|java|c|cpp|h)$/i)) {
                setSelectedFileContent(content);
                setSelectedFileName(file.name);
            } else {
                alert('Visualização disponível apenas para arquivos de texto dentro do ZIP.');
            }
        } catch (e) {
            alert('Erro ao ler arquivo.');
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-white/50">Analisando pacote ZIP...</div>;

    if (selectedFileContent !== null) {
        return (
            <div className="flex flex-col h-full bg-[#1e1e1e]">
                <div className="h-10 flex items-center px-4 border-b border-white/10 bg-[#252525]">
                    <button onClick={() => { setSelectedFileContent(null); setSelectedFileName(null); }} className="mr-4 hover:bg-white/10 p-1 rounded">
                        <ArrowLeft size={16} className="text-white" />
                    </button>
                    <span className="text-sm text-white/70">{selectedFileName}</span>
                </div>
                <div className="flex-1 overflow-auto p-6 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                    {selectedFileContent}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto bg-[#0a0a0f] p-8">
            <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500"><Folder size={20} /></span>
                    {filename}
                </h3>
                <div className="grid gap-2">
                    {files.map((file) => (
                        <div
                            key={file.name}
                            onClick={() => handleFileClick(file)}
                            className={`p-3 rounded-lg flex items-center gap-3 border border-white/5 transition-colors ${file.dir ? 'bg-white/5 opacity-70' : 'bg-[#111] hover:bg-white/10 cursor-pointer'}`}
                        >
                            {file.dir ? <Folder size={18} className="text-blue-400" /> : <FileIcon size={18} className="text-white/40" />}
                            <span className="text-sm text-white/80 font-mono">{file.name}</span>
                            {!file.dir && <span className="ml-auto text-xs text-white/20">{(file._data.uncompressedSize / 1024).toFixed(1)} KB</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- HELPER FUNCTIONS ---
const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (num: number) => num.toString().padStart(2, '0');
    if (h > 0) {
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
};



// --- COMPONENT ---
function PlayerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const coursePath = searchParams.get('path');
    const courseTitle = searchParams.get('title') || 'Curso';
    const sourceType = searchParams.get('source_type');

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);

    // Data State
    const [modules, setModules] = useState<Module[]>([]);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

    // Advanced Player State
    const [loopRange, setLoopRange] = useState<{ start: number | null, end: number | null }>({ start: null, end: null });
    const [isFocusMode, setIsFocusMode] = useState(false);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'notes' | 'ai' | 'pomodoro' | 'transcript' | 'related'>('transcript');
    const [newNote, setNewNote] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Video annotations state
    const [annotations, setAnnotations] = useState<Annotation[]>([]);

    // AI State
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isAiExpanded, setIsAiExpanded] = useState(false);

    // Pomodoro State
    const [pomoTime, setPomoTime] = useState(25 * 60);
    const [pomoActive, setPomoActive] = useState(false);
    const [pomoMode, setPomoMode] = useState<'focus' | 'short' | 'long'>('focus');

    // AutoPlay State
    const [showAutoPlayOverlay, setShowAutoPlayOverlay] = useState(false);
    const [autoPlayTimer, setAutoPlayTimer] = useState(10);
    const [nextVideo, setNextVideo] = useState<Video | null>(null);
    const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);

    // 🎓 Premium Learning Features
    const [showShortcutsOverlay, setShowShortcutsOverlay] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);


    const [isPiPActive, setIsPiPActive] = useState(false);
    const [watchProgress, setWatchProgress] = useState<Record<string, number>>({});
    const [totalStudyTime, setTotalStudyTime] = useState(0);
    const [sessionStartTime] = useState(Date.now());

    // 🔧 CRITICAL FIX: Metadata Duration Override
    const [metadataDuration, setMetadataDuration] = useState<number | null>(null);
    const [seekOffset, setSeekOffset] = useState(0);
    const [streamUrl, setStreamUrl] = useState('');

    // 🔄 RESET PLAYER STATE ON VIDEO CHANGE (CRITICAL FIX)
    // 🔄 RESET PLAYER STATE ON VIDEO CHANGE (CRITICAL FIX)
    const isAutoPlayEnabledRef = useRef(isAutoPlayEnabled);
    const modulesRef = useRef(modules);
    const currentVideoRef = useRef(currentVideo);

    useEffect(() => {
        isAutoPlayEnabledRef.current = isAutoPlayEnabled;
    }, [isAutoPlayEnabled]);

    useEffect(() => {
        modulesRef.current = modules;
    }, [modules]);

    useEffect(() => {
        currentVideoRef.current = currentVideo;
    }, [currentVideo]);

    // Track if we should auto-play the next video
    const pendingAutoPlayRef = useRef(false);

    useEffect(() => {
        if (!currentVideo) return;

        console.log("🎥 Video changed:", currentVideo.name);

        // Reset all state
        setDuration(0);
        setMetadataDuration(null);
        setSeekOffset(0);
        setCurrentTime(0);
        setShowAutoPlayOverlay(false);
        setNextVideo(null);
        setLoopRange({ start: null, end: null });

        // Set initial stream URL
        const isPathApi = currentVideo.path.startsWith('/api/') || currentVideo.path.includes('/api/stream');
        const baseUrl = (currentVideo.path.startsWith('http') || isPathApi) ? currentVideo.path : `${API_URL}/api/study/stream/video?path=${encodeURIComponent(currentVideo.path)}`;
        setStreamUrl(baseUrl);

        // 🔥 AUTO-PLAY: Start playing if pending or if autoplay is enabled (first load)
        if (pendingAutoPlayRef.current || isAutoPlayEnabledRef.current) {
            setIsPlaying(true);
            pendingAutoPlayRef.current = false;

            // Actually play the video after a short delay to let React update
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
                }
            }, 200);
        } else {
            setIsPlaying(false);
        }

        // 🔧 CRITICAL: Fetch metadata duration from backend
        const fetchMetadata = async () => {
            try {
                // Extract path from stream URL
                const url = new URL(currentVideo.path, window.location.origin);
                const pathParam = url.searchParams.get('path');

                if (pathParam && currentVideo.path.includes('/api/gdrive/')) {
                    const metaResponse = await fetch(`${API_URL}/api/gdrive/metadata?path=${encodeURIComponent(pathParam)}`);
                    const metaData = await metaResponse.json();

                    if (metaData.duration > 0) {
                        console.log(`📏 Metadata Duration: ${metaData.duration}s`);
                        setMetadataDuration(metaData.duration);
                        setDuration(metaData.duration);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch metadata:", error);
            }
        };

        // 🧠 History & Recommendations
        try {
            // Log Access: Log the COURSE instead of individual video
            if (coursePath && courseTitle) {
                fetch(`${API_URL}/api/study/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: courseTitle,
                        path: coursePath,
                        source_type: sourceType || 'unknown',
                        thumbnail_url: null // Backend can enrich this
                    })
                }).catch(e => console.error("History log error", e));
            }
        } catch (e) {
            console.error("Smart logic error", e);
        }

        // Fetch Related (Use courseTitle instead of video name for better results)
        if (courseTitle) {
            fetch(`${API_URL}/api/study/recommendations?title=${encodeURIComponent(courseTitle)}&limit=6`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setRecommendations(data);
                })
                .catch(e => console.error("Recs error", e));
        }

    }, [currentVideo?.path]);

    // 🎬 Video Element Event Handlers
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            console.log(`📺 Video loadedmetadata: duration=${video.duration}`);

            // Priorizar metadata duration do backend
            if (metadataDuration && metadataDuration > 0) {
                setDuration(metadataDuration);
                console.log(`✅ Using backend duration: ${metadataDuration}s`);
            } else if (video.duration && isFinite(video.duration)) {
                setDuration(video.duration);
                console.log(`✅ Using video element duration: ${video.duration}s`);
            }

            // Restaurar progresso salvo
            if (currentVideo?.path && watchProgress[currentVideo.path]) {
                const savedTime = watchProgress[currentVideo.path];
                const activeDuration = metadataDuration || video.duration;

                if (activeDuration > 0 && savedTime < activeDuration * 0.95 && (activeDuration - savedTime) > 10) {
                    video.currentTime = savedTime;
                    console.log(`⏩ Restored to ${savedTime}s`);
                }
            }
        };

        const handleTimeUpdate = () => {
            // Calculate absolute time (Offset from server seek + current segment time)
            setCurrentTime(seekOffset + video.currentTime);
            handleLoopLogic();
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => handleVideoEnd();

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
        };
    }, [currentVideo, metadataDuration, watchProgress, seekOffset, isAutoPlayEnabled, modules]);

    // Load saved annotations for current video
    useEffect(() => {
        if (!currentVideo?.path) return;
        const key = `bruces_ann_${currentVideo.path}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try { setAnnotations(JSON.parse(saved)); } catch (e) { console.error('Failed to parse annotations', e); }
        } else {
            setAnnotations([]);
        }
    }, [currentVideo?.path]);

    // Persist annotations
    useEffect(() => {
        if (!currentVideo?.path) return;
        const key = `bruces_ann_${currentVideo.path}`;
        localStorage.setItem(key, JSON.stringify(annotations));
    }, [annotations, currentVideo?.path]);

    // --- NOTES PERSISTENCE ---
    useEffect(() => {
        if (!currentVideo?.path) return;
        const key = `bruces_notes_${currentVideo.path}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try { setNotes(JSON.parse(saved)); } catch (e) { }
        } else {
            setNotes([]);
        }
    }, [currentVideo?.path]);

    useEffect(() => {
        if (!currentVideo?.path) return;
        const key = `bruces_notes_${currentVideo.path}`;
        localStorage.setItem(key, JSON.stringify(notes));
    }, [notes, currentVideo?.path]);

    // Pomodoro Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (pomoActive && pomoTime > 0) {
            interval = setInterval(() => setPomoTime(t => t - 1), 1000);
        } else if (pomoTime === 0) {
            setPomoActive(false);
        }
        return () => clearInterval(interval);
    }, [pomoActive, pomoTime]);

    // AutoPlay Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showAutoPlayOverlay && autoPlayTimer > 0) {
            interval = setInterval(() => setAutoPlayTimer(t => t - 1), 1000);
        } else if (showAutoPlayOverlay && autoPlayTimer === 0) {
            playNextVideo();
        }
        return () => clearInterval(interval);
    }, [showAutoPlayOverlay, autoPlayTimer]);

    // 🎓 Load saved progress from localStorage
    useEffect(() => {
        const savedProgress = localStorage.getItem('bruces_watch_progress');
        if (savedProgress) {
            try {
                setWatchProgress(JSON.parse(savedProgress));
            } catch (e) { }
        }
        const savedStudyTime = localStorage.getItem('bruces_total_study_time');
        if (savedStudyTime) {
            setTotalStudyTime(parseInt(savedStudyTime, 10) || 0);
        }

        // Load Autoplay Setting
        const savedAutoPlay = localStorage.getItem('bruces_autoplay');
        if (savedAutoPlay !== null) {
            setIsAutoPlayEnabled(savedAutoPlay === 'true');
        }
    }, []);

    // Save Autoplay Setting
    useEffect(() => {
        localStorage.setItem('bruces_autoplay', String(isAutoPlayEnabled));
    }, [isAutoPlayEnabled]);


    // 🎓 Save progress every 5 seconds while playing (Local + Backend Sync)
    useEffect(() => {
        if (!isPlaying || !currentVideo?.path) return;

        const interval = setInterval(() => {
            // 1. Save video progress locally
            const newProgress = { ...watchProgress, [currentVideo.path]: currentTime };
            setWatchProgress(newProgress);
            localStorage.setItem('bruces_watch_progress', JSON.stringify(newProgress));

            // 2. Update total study time locally
            const sessionSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
            localStorage.setItem('bruces_total_study_time', String(totalStudyTime + sessionSeconds));

            // 3. Sync with Backend History (Resume Feature)
            // Only sync if we have valid course context
            if (coursePath && courseTitle) {
                const payload = {
                    title: courseTitle,
                    path: coursePath,
                    source_type: sourceType || 'unknown',
                    thumbnail_url: null, // Backend handles this
                    // Resume Data
                    last_video_path: currentVideo.path,
                    last_video_title: currentVideo.name,
                    last_timestamp: currentTime,
                    last_duration: duration || 0
                };

                // 4. Save to local storage for "Continue Watching" feature
                const savedCourses = JSON.parse(localStorage.getItem('bruces_recent_courses') || '[]');
                const filteredCourses = savedCourses.filter((c: any) => c.path !== coursePath);
                filteredCourses.unshift(payload); // add to top
                localStorage.setItem('bruces_recent_courses', JSON.stringify(filteredCourses.slice(0, 20))); // keep max 20

                // Fire and forget (don't await to avoid UI jank)
                fetch(`${API_URL}/api/study/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(e => console.error("History sync error:", e));
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isPlaying, currentVideo?.path, currentTime, coursePath, courseTitle, sourceType, duration]);

    // --- INITIALIZATION ---
    // Resume State
    const [resumeData, setResumeData] = useState<any>(null);
    const hasResumedRef = useRef(false);

    // 🔄 Fetch Resume Data on Init
    useEffect(() => {
        if (!coursePath) return;

        const fetchResume = async () => {
            try {
                // First check local storage for recent history (preferred for serverless)
                const savedCourses = JSON.parse(localStorage.getItem('bruces_recent_courses') || '[]');
                const cleanPath = coursePath.trim();
                let entry = savedCourses.find((h: any) => h.path === cleanPath || cleanPath.includes(h.path));

                // Fallback to backend
                if (!entry) {
                    const res = await fetch(`${API_URL}/api/study/history?limit=20`);
                    if (res.ok) {
                        const history = await res.json();
                        entry = history.find((h: any) => h.path === cleanPath || cleanPath.includes(h.path));
                    }
                }

                if (entry && entry.last_video_path) {
                    console.log("📜 Found resume point:", entry.last_video_title, "@", entry.last_timestamp);
                    setResumeData(entry);
                }
            } catch (e) {
                console.error("Failed to fetch history for resume:", e);
            }
        };

        fetchResume();
    }, [coursePath]);

    // 🔄 Load Course Structure on Init
    useEffect(() => {
        if (coursePath) {
            // Reset state for new course navigation
            setModules([]);
            setCurrentVideo(null); // Clear video to prevent ghosting
            setResumeData(null);   // Clear old resume data
            hasResumedRef.current = false; // ALLOW RESUME TO RUN AGAIN

            loadCourseStructure();
        }
    }, [coursePath, sourceType]);

    // 🔄 Apply Resume Logic when Modules Load
    useEffect(() => {
        if (modules.length === 0 || hasResumedRef.current) return;

        // Helper to find video in modules
        const findVideo = (targetPath: string, targetName: string) => {
            for (const mod of modules) {
                const match = mod.videos.find(v =>
                    v.path === targetPath ||
                    v.name === targetName ||
                    (targetPath && v.path.includes(targetPath)) // Fuzzy match
                );
                if (match) return match;
            }
            return null;
        };

        if (resumeData) {
            const video = findVideo(resumeData.last_video_path, resumeData.last_video_title);
            if (video) {
                console.log("⏩ Resuming to video:", video.name);
                setCurrentVideo(video);

                // Set initial seek time (handled by video loaded metadata or manual set)
                // We use a small timeout to ensure player is ready
                setTimeout(() => {
                    const vidElement = videoRef.current;
                    if (vidElement && resumeData.last_timestamp > 5) {
                        vidElement.currentTime = resumeData.last_timestamp;
                        // Show toast or visual cue here if desired
                    }
                }, 800);

                hasResumedRef.current = true;
                return;
            }
        }

        // Default: If no resume data (or strictly new course), selecting first video
        // ONLY if we haven't selected anything yet (currentVideo is null)
        if (!currentVideo && modules[0].videos.length > 0) {
            console.log("▶️ No history, starting fresh.");
            setCurrentVideo(modules[0].videos[0]);
            hasResumedRef.current = true; // Mark as "handled"
        }

    }, [modules, resumeData, currentVideo]);

    const loadCourseStructure = async () => {
        try {
            setIsLoading(true);

            const isTelegramPath = /^\-?\d+$/.test(coursePath || '');

            if ((sourceType === 'telegram' || isTelegramPath) && coursePath) {
                const res = await fetch(`${API_URL}/api/telegram/courses/${coursePath}/videos`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.videos) {
                        const telegramVideos = data.videos.map((v: any) => ({
                            name: v.filename || `Vídeo ${v.id}`,
                            path: `${API_URL}/api/telegram/stream/${coursePath}/${v.id}`,
                            duration: 0,
                            watched: false
                        }));

                        setModules([
                            {
                                name: 'Vídeos do Canal',
                                expanded: true,
                                videos: telegramVideos
                            }
                        ]);
                        // Logic removed here -> Handled by new UseEffect
                    }
                }
                return;
            }

            if ((sourceType === 'google_drive' || sourceType === 'mega') && coursePath) {
                const res = await fetch(`${API_URL}/api/gdrive/structure?path=${encodeURIComponent(coursePath)}`);
                if (res.ok) {
                    const data = await res.json();

                    const playerModules: Module[] = [];

                    if (data.standalone_videos && data.standalone_videos.length > 0) {
                        playerModules.push({
                            name: 'Aulas',
                            expanded: true,
                            videos: data.standalone_videos.map((v: any) => ({
                                name: v.name,
                                path: `${API_URL}/api/gdrive/stream?path=${encodeURIComponent(v.path)}`,
                                duration: 0,
                                watched: false
                            }))
                        });
                    }

                    if (data.modules) {
                        for (const mod of data.modules) {
                            if (mod.videos && mod.videos.length > 0) {
                                playerModules.push({
                                    name: mod.name,
                                    expanded: playerModules.length === 0,
                                    videos: mod.videos.map((v: any) => ({
                                        name: v.name,
                                        path: `${API_URL}/api/gdrive/stream?path=${encodeURIComponent(v.path)}`,
                                        duration: 0,
                                        watched: false
                                    }))
                                });
                            }
                        }
                    }


                    // 🎯 SMART SORTING V2: Numbers First -> Alphabetical -> Bonus Last
                    playerModules.sort((a, b) => {
                        const nameA = a.name || '';
                        const nameB = b.name || '';
                        const lowerA = nameA.toLowerCase();
                        const lowerB = nameB.toLowerCase();

                        // 1. Detect Bonus (Always Last)
                        const isABonus = /bônus|bonus/i.test(lowerA);
                        const isBBonus = /bônus|bonus/i.test(lowerB);

                        if (isABonus && !isBBonus) return 1;
                        if (!isABonus && isBBonus) return -1;

                        // 2. Extract Leading Numbers (e.g., "1 - Intro", "02. Setup", "10. Advanced")
                        const getNumber = (str: string) => {
                            const match = str.match(/^(\d+)/);
                            return match ? parseInt(match[1]) : null;
                        };

                        const numA = getNumber(nameA);
                        const numB = getNumber(nameB);

                        // Compare numbers if both exist
                        if (numA !== null && numB !== null) {
                            return numA - numB;
                        }

                        // If only one has number, prioritize it (unless it's 0 which might be special, but usually fine)
                        if (numA !== null) return -1;
                        if (numB !== null) return 1;

                        // 3. Natural Sort (fallback)
                        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                    });

                    // 🔄 FORCE EXPAND ONLY THE FIRST MODULE
                    playerModules.forEach((mod, index) => {
                        mod.expanded = (index === 0);
                    });

                    setModules(playerModules);
                    // Lógica de seleção padrão removida daqui, agora controlada pelo useEffect de Resume
                    return;
                }
            }


            const res = await fetch(`${API_URL}/api/study/course-structure?path=${encodeURIComponent(coursePath || '')}`);
            if (res.ok) {
                const data = await res.json();

                // 🎯 SMART MODULE SORTING - Organize by number, Bônus last
                const sortedModules = [...(data.modules || [])].sort((a, b) => {
                    const nameA = a.name || '';
                    const nameB = b.name || '';

                    // Check if Bônus - ALWAYS goes last (regardless of number prefix)
                    const isABonus = /bônus|bonus/i.test(nameA);
                    const isBBonus = /bônus|bonus/i.test(nameB);

                    if (isABonus && !isBBonus) return 1;  // A is bonus, B is not -> A goes after
                    if (!isABonus && isBBonus) return -1; // B is bonus, A is not -> B goes after
                    if (isABonus && isBBonus) {
                        // Both are bonus - sort by leading number if exists
                        const numA = parseInt(nameA.match(/^(\d+)/)?.[1] || '999');
                        const numB = parseInt(nameB.match(/^(\d+)/)?.[1] || '999');
                        return numA - numB;
                    }

                    // Extract leading number - more flexible regex
                    // Matches: "1.", "1 ", "01.", "01 ", "1-", etc.
                    const leadingNumA = nameA.match(/^(\d+)/);
                    const leadingNumB = nameB.match(/^(\d+)/);

                    if (leadingNumA && leadingNumB) {
                        return parseInt(leadingNumA[1]) - parseInt(leadingNumB[1]);
                    }
                    if (leadingNumA) return -1; // A has number, B doesn't -> A goes first
                    if (leadingNumB) return 1;  // B has number, A doesn't -> B goes first

                    // Both don't have numbers - alphabetical
                    return nameA.localeCompare(nameB);
                });

                setModules(sortedModules);
                // Default selection is now handled by the Resume useEffect
                // if (sortedModules?.[0]?.videos?.[0]) {
                //    setCurrentVideo(sortedModules[0].videos[0]);
                // }
            } else {
                setModules([
                    { name: 'Módulo 1', expanded: true, videos: [{ name: 'Aula 01', path: '' }] }
                ]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    // --- PLAYER LOGIC ---

    // Controls Visibility
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout) clearTimeout(controlsTimeout);
        if (isPlaying) {
            const timeout = setTimeout(() => setShowControls(false), 3000);
            setControlsTimeout(timeout);
        }
    };

    // Play/Pause
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    // 🔧 CRITICAL FIX: Robust Seek Function
    const seek = useCallback((time: number) => {
        if (!videoRef.current) return;

        const activeDuration = metadataDuration || duration || 3600;
        const newTime = Math.max(0, Math.min(time, activeDuration));

        console.log(`⏩ Seeking to ${newTime}s (duration: ${activeDuration}s)`);

        // Check file extension for TS indicating transmuxing needed
        const pathLower = currentVideo?.path.toLowerCase() || '';
        const isTsFile = pathLower.endsWith('.ts') || pathLower.endsWith('.m2ts') || pathLower.endsWith('.mts') || pathLower.endsWith('.m3u8');

        // Only use server-side seeking if it IS a TS file AND it's a GDrive stream
        const isTransmuxed = currentVideo?.path.includes('/api/gdrive/stream') && isTsFile;

        if (isTransmuxed && currentVideo) {
            // Server-side seeking for TS files
            const baseUrl = currentVideo.path.startsWith('http') ? currentVideo.path : `${API_URL}/api/study/stream/video?path=${encodeURIComponent(currentVideo.path)}`;

            // Construct new URL with start param
            const urlObj = new URL(baseUrl);
            urlObj.searchParams.set('start', newTime.toString());

            // Update Offset Tracking
            setSeekOffset(newTime);
            console.log(`📍 Server Seek to ${newTime}s (Offset: ${newTime})`);

            // REACT STATE UPDATE for Source (Prevents React from reverting to base URL)
            setStreamUrl(urlObj.toString());

            // Allow React to update src, then reset current time
            // We set currentTime to 0 immediately to reflect that the NEW stream starts at 0
            // The UI uses seekOffset + videoTime, so UI will show 'newTime' + 0 = newTime.
            videoRef.current.currentTime = 0;
            setCurrentTime(newTime);

            // Play after a slight delay
            setTimeout(() => videoRef.current?.play().catch(console.error), 100);
        } else {
            // Standard seeking (Telegram, Local, MP4) - Browser handles Range Request
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }

    }, [duration, metadataDuration, currentVideo]);

    // Speed
    const changeSpeed = (speed: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackRate(speed);
        }
    };

    // Fullscreen
    const toggleFullscreen = () => {
        if (!playerContainerRef.current) return;
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Screenshot
    const takeScreenshot = () => {
        if (!videoRef.current) return;

        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            try {
                const dataUrl = canvas.toDataURL('image/jpeg');
                addNoteWithImage(dataUrl);
            } catch (e) {
                console.error("Screenshot failed (likely CORS)", e);
                alert("Não foi possível capturar a tela (Restrição de Segurança do Navegador)");
            }
        }
    };

    // Loop
    const handleLoopLogic = () => {
        if (!videoRef.current || loopRange.start === null || loopRange.end === null) return;
        if (videoRef.current.currentTime >= loopRange.end) {
            videoRef.current.currentTime = loopRange.start;
        }
    };

    const toggleLoopPoint = () => {
        if (loopRange.start === null) {
            setLoopRange({ start: currentTime, end: null });
        } else if (loopRange.end === null) {
            setLoopRange({ ...loopRange, end: currentTime });
        } else {
            setLoopRange({ start: null, end: null });
        }
    };

    // 🎓 Picture-in-Picture functions
    const togglePiP = async () => {
        if (!videoRef.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiPActive(false);
            } else {
                await videoRef.current.requestPictureInPicture();
                setIsPiPActive(true);
            }
        } catch (e) {
            console.error('PiP error:', e);
        }
    };

    // Helpers
    const findNextVideo = (current: Video | null, moduleList: Module[]): Video | null => {
        if (!current || !moduleList.length) return null;
        let found = false;
        for (const mod of moduleList) {
            for (const vid of mod.videos) {
                if (found) return vid;
                if (vid.path === current.path && vid.name === current.name) found = true;
            }
        }
        return null;
    };

    const findPreviousVideo = (current: Video | null, moduleList: Module[]): Video | null => {
        if (!current || !moduleList.length) return null;
        let previousVid: Video | null = null;
        for (const mod of moduleList) {
            for (const vid of mod.videos) {
                if (vid.path === current.path && vid.name === current.name) return previousVid;
                previousVid = vid;
            }
        }
        return null;
    };

    const handleVideoEnd = () => {
        if (!videoRef.current) return;

        const time = videoRef.current.currentTime;
        const dur = metadataDuration || videoRef.current.duration;

        console.log(`🎬 Video Ended. Autoplay Enabled (Ref): ${isAutoPlayEnabledRef.current}`);
        console.log(`🎬 Modules (Ref): ${modulesRef.current.length}, Current (Ref): ${currentVideoRef.current?.name}`);

        if (isNaN(dur) || dur < 1) {
            console.warn(`🚫 Prevented premature skip: Invalid duration (${dur})`);
            return;
        }

        const percent = (time / dur) * 100;
        if (time < 10 && percent < 5) {
            console.warn(`🚫 Prevented premature skip: Playback too short (${time.toFixed(1)}s / ${percent.toFixed(1)}%)`);
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(console.error);
            return;
        }

        if (isAutoPlayEnabledRef.current) {
            console.log(`🔍 Finding next video... Modules: ${modulesRef.current.length}, Current: ${currentVideoRef.current?.name}`);
            const next = findNextVideo(currentVideoRef.current, modulesRef.current);

            if (next) {
                console.log(`⏭️ Autoplay: Next video found: ${next.name}`);
                setNextVideo(next);
                setShowAutoPlayOverlay(true);
                setAutoPlayTimer(10);
                setIsPlaying(false);
            } else {
                console.warn("⏹️ Autoplay: No next video found (End of course?).");
                setIsPlaying(false);
            }
        } else {
            console.log("⏹️ Autoplay Disabled by User. Stopping.");
            setIsPlaying(false);
        }
    };

    const playNextVideo = () => {
        if (nextVideo) {
            setShowAutoPlayOverlay(false);
            pendingAutoPlayRef.current = true; // Signal that we want to auto-play
            setCurrentVideo(nextVideo);
        }
    };

    const goToNextVideo = () => {
        const next = findNextVideo(currentVideo, modules);
        if (next) {
            setCurrentVideo(next);
            setIsPlaying(true);
        }
    };

    const goToPreviousVideo = () => {
        const prev = findPreviousVideo(currentVideo, modules);
        if (prev) {
            setCurrentVideo(prev);
            setIsPlaying(true);
        }
    };

    const cancelAutoPlay = () => {
        setShowAutoPlayOverlay(false);
        setNextVideo(null);
    };

    // --- SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.key === 'k' || e.key === 'K') {
                togglePlay();
            } else if (e.key === 'j' || e.key === 'J') {
                seek(currentTime - 10);
            } else if (e.key === 'l' || e.key === 'L') {
                seek(currentTime + 10);
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 's' || e.key === 'S') {
                takeScreenshot();
            } else if (e.key === 'm' || e.key === 'M') {
                if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                }
            } else if (e.key === '[') {
                changeSpeed(Math.max(0.25, playbackRate - 0.25));
            } else if (e.key === ']') {
                changeSpeed(Math.min(4, playbackRate + 0.25));
            } else if (e.key === '?' || e.key === '/') {
                setShowShortcutsOverlay(prev => !prev);
            } else if (e.key === 'p' || e.key === 'P') {
                togglePiP();
            } else if (e.key === 'n' || e.key === 'N') {
                goToNextVideo();
            } else if (e.key === 'b' || e.key === 'B') {
                goToPreviousVideo();
            } else if (e.key === 'Escape') {
                setShowShortcutsOverlay(false);
                setShowSpeedMenu(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, currentTime, isMuted, playbackRate, isFullscreen]);

    // --- NOTES LOGIC ---
    const addAnnotation = () => {
        if (!videoRef.current) return;
        const time = videoRef.current.currentTime;
        const id = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newAnn: Annotation = { id, time, text: '', createdAt: new Date() };
        setAnnotations(prev => [...prev, newAnn]);
        setNoteText('');
        setShowNoteModal(true);
    };

    const addNoteWithImage = (imageUrl?: string) => {
        const note: Note = {
            id: Date.now().toString(),
            timestamp: currentTime,
            text: newNote || (imageUrl ? 'Captura de tela' : 'Nota rápida'),
            image: imageUrl,
            createdAt: new Date(),
        };
        setNotes(prev => [note, ...prev]);
        setNewNote('');
    };

    const handleDownload = async () => {
        if (!currentVideo?.path || sourceType !== 'telegram') return;
        try {
            const urlParts = currentVideo.path.split('/');
            const messageId = urlParts[urlParts.length - 1];
            const channelId = urlParts[urlParts.length - 2];

            const res = await fetch(`${API_URL}/api/telegram/download/${channelId}/${messageId}`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                alert(`Download iniciado!\nSalvo em: ${data.path}`);
            } else {
                alert(`Erro: ${data.detail || 'Falha no download'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao solicitar download.');
        }
    };

    const handleGenerateSummary = async () => {
        if (!currentVideo) return;
        setIsGeneratingAI(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${apiUrl}/api/ai/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentVideo.name,
                    module: "Geral",
                    description: "Gerado automaticamente pelo Bruce's Hub"
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                alert(`Erro (${response.status}): ${errorText.substring(0, 100)}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setAiSummary(data.summary);
            } else {
                alert('Erro ao gerar resumo: ' + (data.error || JSON.stringify(data)));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão com o cérebro.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    // --- RENDER JSX ---
    return (
        <div className={`flex min-h-screen bg-[#050508] text-white ${isFocusMode ? 'fullscreen-mode' : ''}`}>

            <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 relative`}>

                {/* Header (Hidden in Focus Mode) */}
                {!isFocusMode && (
                    <header className="h-12 md:h-16 px-3 md:px-6 flex items-center justify-between border-b border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl z-40">
                        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                            <button onClick={() => {
                                if (courseTitle.toLowerCase().includes('english 101')) {
                                    router.push('/idiomas');
                                    return;
                                }
                                const tabMap: Record<string, string> = {
                                    'telegram': 'telegram',
                                    'google_drive': 'cloud',
                                    'mega': 'cloud',
                                    'local': 'local',
                                };
                                const tab = tabMap[sourceType || ''] || 'courses';
                                router.push(`/estudos?tab=${tab}`);
                            }} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg flex-shrink-0">
                                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-[10px] md:text-sm font-medium text-white/50 truncate">{courseTitle}</h1>
                                <p className="text-xs md:text-base text-white font-semibold truncate">{currentVideo?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
                            {sourceType === 'telegram' && (
                                <button
                                    onClick={handleDownload}
                                    className="p-1.5 md:p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Baixar vídeo para HD local"
                                >
                                    <Download size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-1.5 md:p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title={isSidebarOpen ? "Fechar painel lateral" : "Abrir painel lateral"}
                            >
                                {isSidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                            </button>

                            <button
                                onClick={() => setIsFocusMode(true)}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 rounded-lg text-sm border border-purple-500/30 transition-all"
                            >
                                <Zap size={16} /> Focus Mode
                            </button>
                            <button
                                onClick={() => setIsFocusMode(true)}
                                className="flex md:hidden p-1.5 text-purple-300 hover:bg-purple-600/20 rounded-lg transition-colors"
                                title="Focus Mode"
                            >
                                <Zap size={18} />
                            </button>
                        </div>
                    </header>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left: Player */}
                    <div className="flex-1 flex flex-col h-full bg-[#030303] overflow-hidden group" ref={playerContainerRef} onMouseMove={handleMouseMove} onClick={() => setShowSpeedMenu(false)}>
                        {/* Mesh Background */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
                            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
                        </div>
                        {/* Add Note Button (top-right) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); addNoteWithImage(); }}
                            className="absolute top-2 right-2 z-20 p-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-full border border-purple-500/30 transition-colors"
                        >
                            <Plus size={20} className="text-white" />
                        </button>

                        {/* Universal Document Viewer */}
                        <div className="flex-1 relative">
                            {(() => {
                                const fileName = currentVideo?.name?.toLowerCase() || currentVideo?.path?.toLowerCase() || '';
                                const isPDF = fileName.endsWith('.pdf');
                                const isTXT = fileName.endsWith('.txt');
                                const isDOCX = fileName.endsWith('.docx') || fileName.endsWith('.doc');
                                const isZIP = fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z');
                                const isDocument = isPDF || isTXT || isDOCX || isZIP;

                                if (isDocument) {
                                    return (
                                        <div className="w-full h-full bg-[#0a0a0f] flex flex-col relative">
                                            {/* PDF Viewer */}
                                            {isPDF && (
                                                <iframe
                                                    src={streamUrl}
                                                    className="w-full h-full border-none"
                                                    title={currentVideo?.name}
                                                />
                                            )}

                                            {/* TXT Viewer */}
                                            {isTXT && (
                                                <TXTViewer url={streamUrl} filename={currentVideo?.name || 'file.txt'} />
                                            )}

                                            {/* DOCX Viewer */}
                                            {isDOCX && (
                                                <DOCXViewer url={streamUrl} filename={currentVideo?.name || 'file.docx'} />
                                            )}

                                            {/* ZIP Viewer */}
                                            {isZIP && (
                                                <ZIPViewer url={streamUrl} filename={currentVideo?.name || 'file.zip'} />
                                            )}
                                        </div>
                                    );
                                }

                                // Video Player (default)
                                return (
                                    <video
                                        ref={videoRef}
                                        src={streamUrl}
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-contain"
                                        onClick={togglePlay}
                                    />
                                );
                            })()}


                            {/* Flash Effect Overlay */}
                            <AnimatePresence>
                                {isFlashing && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.8 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-white z-[60] pointer-events-none"
                                    />
                                )}
                            </AnimatePresence>

                            {/* AutoPlay Overlay */}
                            <AnimatePresence>
                                {showAutoPlayOverlay && nextVideo && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                                    >
                                        <div className="text-center p-8 max-w-md w-full">
                                            <p className="text-purple-400 mb-2 font-bold uppercase tracking-widest text-xs">Próxima aula em {autoPlayTimer}s</p>
                                            <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-tight">{nextVideo.name}</h3>

                                            <div className="flex items-center justify-center gap-4 mb-8">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); cancelAutoPlay(); }}
                                                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all w-32"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); playNextVideo(); }}
                                                    className="px-6 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 flex-1"
                                                >
                                                    <Play size={18} fill="black" />
                                                    Reproduzir
                                                </button>
                                            </div>

                                            {/* Circular Timer Visualization */}
                                            <div className="relative w-16 h-16 mx-auto">
                                                <svg className="w-full h-full -rotate-90 transform">
                                                    <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                                                    <motion.circle
                                                        cx="32" cy="32" r="28"
                                                        stroke="#a855f7"
                                                        strokeWidth="4"
                                                        fill="none"
                                                        strokeDasharray="176"
                                                        initial={{ strokeDashoffset: 0 }}
                                                        animate={{ strokeDashoffset: 176 }}
                                                        transition={{ duration: 10, ease: "linear" }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm text-white/50">
                                                    {autoPlayTimer}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 🎓 KEYBOARD SHORTCUTS OVERLAY */}
                            <AnimatePresence>
                                {showShortcutsOverlay && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
                                        onClick={() => setShowShortcutsOverlay(false)}
                                    >
                                        <div className="max-w-2xl w-full p-8 bg-[#0a0a0f]/90 border border-white/10 rounded-2xl" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                                    <Keyboard className="text-purple-400" />
                                                    Atalhos do Teclado
                                                </h2>
                                                <button onClick={() => setShowShortcutsOverlay(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                {[
                                                    { key: 'Space / K', action: 'Play / Pause' },
                                                    { key: 'J', action: 'Voltar 10s' },
                                                    { key: 'L', action: 'Avançar 10s' },
                                                    { key: 'F', action: 'Tela cheia' },
                                                    { key: 'M', action: 'Mute / Unmute' },
                                                    { key: 'S', action: 'Screenshot' },
                                                    { key: '[ / ]', action: 'Velocidade -/+' },
                                                    { key: 'P', action: 'Picture-in-Picture' },
                                                    { key: 'N', action: 'Próximo vídeo' },
                                                    { key: 'B', action: 'Vídeo anterior' },
                                                    { key: '?', action: 'Mostrar atalhos' },
                                                    { key: 'Esc', action: 'Fechar overlays' },
                                                ].map((shortcut) => (
                                                    <div key={shortcut.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                        <span className="text-white/60">{shortcut.action}</span>
                                                        <kbd className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded border border-purple-500/30 font-mono text-xs">
                                                            {shortcut.key}
                                                        </kbd>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Player Controls */}
                            <AnimatePresence>
                                {showControls && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 md:p-4 z-50"
                                    >
                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max={metadataDuration || duration || 100}
                                                value={currentTime}
                                                onChange={(e) => seek(parseFloat(e.target.value))}
                                                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((currentTime / (metadataDuration || duration || 1)) * 100)}%, rgba(255,255,255,0.2) ${((currentTime / (metadataDuration || duration || 1)) * 100)}%, rgba(255,255,255,0.2) 100%)`
                                                }}
                                            />
                                            <div className="flex justify-between text-xs text-white/60 mt-1">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(metadataDuration || duration)}</span>
                                            </div>
                                        </div>

                                        {/* Control Buttons */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 md:gap-2">
                                                <button onClick={goToPreviousVideo} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition" title="Vídeo Anterior">
                                                    <SkipBack size={16} className="md:hidden" />
                                                    <SkipBack size={20} className="hidden md:block" />
                                                </button>

                                                {/* Skip Backward Buttons - -30 and -20 hidden on mobile */}
                                                <button
                                                    onClick={() => seek(currentTime - 30)}
                                                    className="hidden lg:flex p-2 hover:bg-white/10 rounded-lg transition items-center justify-center gap-1 min-w-[44px]"
                                                    title="Voltar 30s"
                                                >
                                                    <span className="text-[10px] font-bold">-30</span>
                                                </button>

                                                <button
                                                    onClick={() => seek(currentTime - 20)}
                                                    className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition items-center justify-center gap-1 min-w-[44px]"
                                                    title="Voltar 20s"
                                                >
                                                    <span className="text-[10px] font-bold">-20</span>
                                                </button>

                                                <button
                                                    onClick={() => seek(currentTime - 10)}
                                                    className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition flex items-center justify-center gap-1 min-w-[36px] md:min-w-[44px]"
                                                    title="Voltar 10s (J)"
                                                >
                                                    <span className="text-[10px] font-bold">-10</span>
                                                </button>

                                                <button onClick={togglePlay} className="p-2 md:p-3 bg-white text-black hover:bg-gray-200 rounded-full transition shadow-lg hover:scale-105">
                                                    {isPlaying ? <Pause size={20} fill="black" className="md:hidden" /> : <Play size={20} fill="black" className="md:hidden" />}
                                                    {isPlaying ? <Pause size={24} fill="black" className="hidden md:block" /> : <Play size={24} fill="black" className="hidden md:block" />}
                                                </button>

                                                {/* Skip Forward Buttons - +20 and +30 hidden on mobile */}
                                                <button
                                                    onClick={() => seek(currentTime + 10)}
                                                    className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition flex items-center justify-center gap-1 min-w-[36px] md:min-w-[44px]"
                                                    title="Avançar 10s (L)"
                                                >
                                                    <span className="text-[10px] font-bold">+10</span>
                                                </button>

                                                <button
                                                    onClick={() => seek(currentTime + 20)}
                                                    className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition items-center justify-center gap-1 min-w-[44px]"
                                                    title="Avançar 20s"
                                                >
                                                    <span className="text-[10px] font-bold">+20</span>
                                                </button>

                                                <button
                                                    onClick={() => seek(currentTime + 30)}
                                                    className="hidden lg:flex p-2 hover:bg-white/10 rounded-lg transition items-center justify-center gap-1 min-w-[44px]"
                                                    title="Avançar 30s"
                                                >
                                                    <span className="text-[10px] font-bold">+30</span>
                                                </button>

                                                <button onClick={goToNextVideo} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition" title="Próximo Vídeo">
                                                    <SkipForward size={16} className="md:hidden" />
                                                    <SkipForward size={20} className="hidden md:block" />
                                                </button>

                                                <div className="hidden md:block w-px h-6 bg-white/10 mx-2" />

                                                {/* Autoplay Toggle */}
                                                <button
                                                    onClick={() => setIsAutoPlayEnabled(!isAutoPlayEnabled)}
                                                    className={`hidden md:flex p-2 hover:bg-white/10 rounded-full transition items-center gap-2 ${isAutoPlayEnabled ? 'text-purple-400' : 'text-white/30'}`}
                                                    title={`Autoplay: ${isAutoPlayEnabled ? 'ON' : 'OFF'}`}
                                                >
                                                    <PlayCircle size={20} />
                                                </button>
                                                <button onClick={() => {
                                                    if (videoRef.current) {
                                                        videoRef.current.muted = !isMuted;
                                                        setIsMuted(!isMuted);
                                                    }
                                                }} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition">
                                                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                                </button>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.1"
                                                    value={volume}
                                                    onChange={(e) => {
                                                        const vol = parseFloat(e.target.value);
                                                        setVolume(vol);
                                                        if (videoRef.current) videoRef.current.volume = vol;
                                                    }}
                                                    className="hidden md:block w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>

                                            <div className="flex items-center gap-1 md:gap-4">
                                                <button onClick={takeScreenshot} className="hidden md:block p-2 hover:bg-white/10 rounded-full transition" title="Capturar tela (S)">
                                                    <Camera size={20} />
                                                </button>
                                                <button onClick={toggleLoopPoint} className={`hidden md:block p-2 hover:bg-white/10 rounded-full transition ${loopRange.start !== null ? 'text-purple-400' : ''}`} title="Loop A-B">
                                                    <Repeat size={20} />
                                                </button>
                                                <div className="relative">
                                                    <button onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }} className="px-2 md:px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs md:text-sm transition">
                                                        {playbackRate}x
                                                    </button>
                                                    {showSpeedMenu && (
                                                        <div className="absolute bottom-full mb-2 right-0 bg-black/95 border border-white/10 rounded-lg p-2 min-w-[100px] z-[60]">
                                                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                                                                <button
                                                                    key={speed}
                                                                    onClick={() => { changeSpeed(speed); setShowSpeedMenu(false); }}
                                                                    className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 transition ${playbackRate === speed ? 'bg-purple-600/20 text-purple-300' : ''}`}
                                                                >
                                                                    {speed}x
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => setShowShortcutsOverlay(true)} className="hidden md:block p-2 hover:bg-white/10 rounded-full transition" title="Atalhos (?)">
                                                    <Keyboard size={20} />
                                                </button>
                                                <button onClick={togglePiP} className={`hidden md:block p-2 hover:bg-white/10 rounded-full transition ${isPiPActive ? 'text-purple-400' : ''}`} title="Picture-in-Picture (P)">
                                                    <PictureInPicture2 size={20} />
                                                </button>
                                                <button onClick={toggleFullscreen} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition">
                                                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right: Modules Sidebar - Full overlay on mobile, side panel on desktop */}
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <>
                                {/* Mobile backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="md:hidden fixed inset-0 bg-black/60 z-40"
                                    onClick={() => setIsSidebarOpen(false)}
                                />
                                <motion.div
                                    initial={{ x: 400 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: 400 }}
                                    className="fixed md:relative right-0 top-0 bottom-0 w-[85vw] md:w-96 bg-[#0a0a0f] border-l border-white/5 flex flex-col overflow-hidden z-50 md:z-auto"
                                >
                                    {/* Tabs */}
                                    <div className="flex border-b border-white/5">
                                        {[
                                            { id: 'transcript', icon: PlayCircle, label: 'Módulos' },
                                            { id: 'notes', icon: StickyNote, label: 'Notas' },
                                            { id: 'ai', icon: Brain, label: 'IA' },
                                            { id: 'related', icon: Sparkles, label: 'Relacionados' },
                                            { id: 'pomodoro', icon: Hourglass, label: 'Pomodoro' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                title={tab.label}
                                                className={`flex-1 min-w-0 px-2 py-3 transition-all flex items-center justify-center ${activeTab === tab.id
                                                    ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
                                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <tab.icon size={20} className="flex-shrink-0" />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div className="flex-1 overflow-y-auto p-4">
                                        {activeTab === 'transcript' && (
                                            <div className="space-y-3">
                                                {modules.map((module, mIdx) => (
                                                    <div key={mIdx} className="bg-white/5 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => {
                                                                const newModules = [...modules];
                                                                newModules[mIdx].expanded = !newModules[mIdx].expanded;
                                                                setModules(newModules);
                                                            }}
                                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition"
                                                        >
                                                            <span className="font-medium text-sm">{module.name}</span>
                                                            {module.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                        </button>

                                                        <AnimatePresence>
                                                            {module.expanded && (
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: 'auto' }}
                                                                    exit={{ height: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    {module.videos.map((video, vIdx) => (
                                                                        <button
                                                                            key={vIdx}
                                                                            onClick={() => {
                                                                                setCurrentVideo(video);
                                                                                setIsPlaying(true);
                                                                            }}
                                                                            className={`w-full px-4 py-2.5 text-left text-sm flex items-start gap-3 hover:bg-white/10 transition ${currentVideo?.path === video.path ? 'bg-purple-600/20 text-purple-300' : 'text-white/70'
                                                                                }`}
                                                                        >
                                                                            {video.watched ? (
                                                                                <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-400" />
                                                                            ) : (
                                                                                <Circle size={16} className="mt-0.5 flex-shrink-0" />
                                                                            )}
                                                                            <span className="flex-1">{video.name}</span>
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'notes' && (
                                            <div className="space-y-4">
                                                <div className="bg-white/5 rounded-lg p-3">
                                                    <textarea
                                                        value={newNote}
                                                        onChange={(e) => setNewNote(e.target.value)}
                                                        placeholder="Escreva uma nota..."
                                                        className="w-full bg-transparent text-sm outline-none resize-none h-20 mb-2"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => addNoteWithImage()}
                                                            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                                        >
                                                            <Plus size={16} /> Adicionar
                                                        </button>
                                                        <button
                                                            onClick={takeScreenshot}
                                                            className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                                            title="Capturar Slide"
                                                        >
                                                            <Camera size={16} /> Snap
                                                        </button>
                                                    </div>
                                                </div>

                                                {notes.map((note) => (
                                                    <div key={note.id} className="bg-white/5 rounded-lg p-3">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <span className="text-xs text-purple-400 font-mono">{formatTime(note.timestamp)}</span>
                                                            <button onClick={() => setNotes(notes.filter(n => n.id !== note.id))} className="p-1 hover:bg-white/10 rounded">
                                                                <Trash2 size={14} className="text-red-400" />
                                                            </button>
                                                        </div>
                                                        {note.image && <img src={note.image} alt="Screenshot" className="w-full rounded mb-2 border border-white/10" />}
                                                        <p className="text-sm text-white/80">{note.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'ai' && (
                                            <div className="space-y-4">
                                                <button
                                                    onClick={handleGenerateSummary}
                                                    disabled={isGeneratingAI}
                                                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isGeneratingAI ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                            Gerando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Brain size={18} />
                                                            Gerar Análise com IA
                                                        </>
                                                    )}
                                                </button>

                                                {aiSummary && (
                                                    <div className="bg-white/5 rounded-lg p-4 relative group">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-semibold flex items-center gap-2 text-sm text-purple-300">
                                                                <Zap size={14} /> Resumo Gerado
                                                            </h3>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => { navigator.clipboard.writeText(aiSummary); alert('Copiado!'); }}
                                                                    className="p-1.5 hover:bg-white/10 rounded-md transition text-white/60 hover:text-white"
                                                                    title="Copiar texto"
                                                                >
                                                                    <Copy size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className={`text-sm text-white/80 whitespace-pre-wrap relative ${!isAiExpanded ? 'max-h-40 overflow-hidden' : ''}`}>
                                                            {aiSummary}
                                                            {!isAiExpanded && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0e0e12] to-transparent" />
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => setIsAiExpanded(!isAiExpanded)}
                                                            className="w-full mt-2 pt-2 border-t border-white/5 text-xs text-white/40 hover:text-white transition flex items-center justify-center gap-1 uppercase tracking-wider font-medium"
                                                        >
                                                            {isAiExpanded ? 'Mostrar menos' : 'Ler tudo'}
                                                            {isAiExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-white/5 rounded-lg p-4 mt-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                                            <BookMarked className="text-blue-400" size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-sm text-blue-200">NotebookLM</h4>
                                                            <p className="text-xs text-white/50">Potencialize seus estudos com o Google</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href="https://notebooklm.google.com/"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-3 flex items-center justify-center w-full py-2 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-xs font-medium transition gap-2 text-blue-300/80 hover:text-blue-300"
                                                    >
                                                        Abrir NotebookLM <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'related' && (
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Você também pode gostar</h3>

                                                {recommendations.length === 0 ? (
                                                    <div className="p-8 text-center bg-white/5 rounded-lg border border-white/5 border-dashed">
                                                        <Sparkles className="mx-auto text-white/20 mb-3" size={24} />
                                                        <p className="text-white/40 text-sm">Sem sugestões no momento.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-3">
                                                        {recommendations.map((rec, i) => (
                                                            <div
                                                                key={i}
                                                                className="group relative bg-[#13131a] hover:bg-white/5 rounded-lg overflow-hidden transition-all cursor-pointer border border-white/5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Rec clicked:", rec); // DEBUG
                                                                    const path = rec.path || rec.source_path;
                                                                    if (!path) {
                                                                        console.error("Rec path missing!", rec);
                                                                        alert("Erro: Caminho do curso não encontrado.");
                                                                        return;
                                                                    }
                                                                    router.push(`/estudos/player?path=${encodeURIComponent(path)}&title=${encodeURIComponent(rec.title || 'Curso')}&source_type=${rec.source_type || 'google_drive'}`);
                                                                }}
                                                            >
                                                                <div className="flex gap-3 p-3">
                                                                    {/* Thumb */}
                                                                    <div className="w-20 h-14 bg-black/50 rounded overflow-hidden flex-shrink-0 relative">
                                                                        <img
                                                                            src={rec.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'}
                                                                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                                                            alt=""
                                                                        />
                                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                                                            <PlayCircle size={16} className="text-white drop-shadow" />
                                                                        </div>
                                                                    </div>

                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                        <h4 className="font-medium text-sm text-gray-200 group-hover:text-white line-clamp-2 leading-tight mb-1 transition-colors">
                                                                            {rec.title}
                                                                        </h4>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50 uppercase tracking-wide">
                                                                                {rec.category || 'Curso'}
                                                                            </span>
                                                                            {rec.hot_score > 80 && (
                                                                                <span className="text-[10px] text-orange-400 font-medium flex items-center gap-0.5">
                                                                                    <Flame size={8} /> Hot
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'pomodoro' && (
                                            <div className="space-y-6">
                                                <div className="text-center pt-6">
                                                    <div className="relative inline-block">
                                                        <div className="text-7xl font-mono font-bold tracking-tighter tabular-nums bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                                                            {formatTime(pomoTime)}
                                                        </div>
                                                        {pomoActive && (
                                                            <span className="absolute -top-2 -right-4 flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-white/30 text-xs mt-2 uppercase tracking-widest font-medium">
                                                        {pomoMode === 'focus' ? 'Modo Foco' : pomoMode === 'short' ? 'Pausa Curta' : 'Descanso Longo'}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                                                    {[
                                                        { mode: 'focus', time: 25 * 60, label: 'Foco' },
                                                        { mode: 'short', time: 5 * 60, label: 'Curta' },
                                                        { mode: 'long', time: 15 * 60, label: 'Longa' },
                                                    ].map((preset) => (
                                                        <button
                                                            key={preset.mode}
                                                            onClick={() => {
                                                                setPomoMode(preset.mode as any);
                                                                setPomoTime(preset.time);
                                                                setPomoActive(false);
                                                            }}
                                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${pomoMode === preset.mode ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => setPomoActive(!pomoActive)}
                                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${pomoActive
                                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                                        : 'bg-white text-black hover:bg-gray-200'}`}
                                                >
                                                    {pomoActive ? <Pause size={20} /> : <Play size={20} />}
                                                    {pomoActive ? 'Pausar' : 'Iniciar Foco'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                </div>

                {/* Focus Mode Exit Button */}
                {isFocusMode && (
                    <button
                        onClick={() => setIsFocusMode(false)}
                        className="absolute top-4 right-4 z-50 px-4 py-2 bg-black/80 hover:bg-black/90 text-white rounded-lg flex items-center gap-2 transition-all border border-white/10"
                    >
                        Sair do Focus Mode
                    </button>
                )}
            </main>
        </div>
    );
}

// --- EXPORT ---
export default function PlayerPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#050508] text-white">Carregando player...</div>}>
            <PlayerContent />
        </Suspense>
    );
}

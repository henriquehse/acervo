'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ChevronLeft, ChevronRight, Type,
    ZoomIn, ZoomOut, BookOpen, Maximize, Minimize,
    Palette, CheckCircle,
    Eye, EyeOff, BookMarked
} from 'lucide-react';

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// STORAGE KEY FOR READING PROGRESS
const READING_PROGRESS_KEY = 'bunker_reading_progress';

// Theme presets
const THEMES = {
    dark: {
        name: 'Noturno',
        background: '#0a0a0f',
        paper: '#13131a',
        text: '#e5e5e5',
        accent: '#C9A96E',
    },
    light: {
        name: 'Claro',
        background: '#f5f5f5',
        paper: '#ffffff',
        text: '#1a1a1a',
        accent: '#6366f1',
    },
    sepia: {
        name: 'Sépia',
        background: '#f4ecd8',
        paper: '#faf8f0',
        text: '#5c4b37',
        accent: '#b8860b',
    },
    midnight: {
        name: 'Meia-noite',
        background: '#0f172a',
        paper: '#1e293b',
        text: '#cbd5e1',
        accent: '#38bdf8',
    }
};

// Save progress helper
const saveReadingProgress = (filePath: string, data: { page?: number; scrollPosition?: number; progress: number }) => {
    try {
        const key = `book_${filePath}`;
        const allProgress = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || '{}');
        allProgress[key] = {
            ...allProgress[key],
            ...data,
            lastRead: new Date().toISOString()
        };
        localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(allProgress));
        return true;
    } catch (e) {
        console.error('Error saving progress:', e);
        return false;
    }
};

// Load progress helper
const loadReadingProgress = (filePath: string) => {
    try {
        const key = `book_${filePath}`;
        const allProgress = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || '{}');
        return allProgress[key] || null;
    } catch {
        return null;
    }
};

function EbookReaderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filePath = searchParams.get('path') || '';
    const title = searchParams.get('title') || 'E-book';
    const resumePage = searchParams.get('resumePage');

    // Reader state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [zoom, setZoom] = useState(100);
    const [theme, setTheme] = useState<keyof typeof THEMES>('dark');
    const [fontSize, setFontSize] = useState(18);
    const [showSettings, setShowSettings] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [progressSaved, setProgressSaved] = useState(false);
    const [lastSavedPage, setLastSavedPage] = useState(0);

    // ═══ ULTRA FOCUS MODE ═══
    const [ultraFocus, setUltraFocus] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const focusTimeout = useRef<NodeJS.Timeout | null>(null);
    const [bookmarkSaved, setBookmarkSaved] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

    const currentTheme = THEMES[theme];

    // PDF URL
    const pdfUrl = filePath ? `${API_URL}/api/study/stream/pdf?path=${encodeURIComponent(filePath)}` : '';

    // Detect mobile
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Load saved progress on mount
    useEffect(() => {
        if (filePath) {
            const savedProgress = loadReadingProgress(filePath);
            if (savedProgress) {
                if (savedProgress.page) {
                    setCurrentPage(savedProgress.page);
                    setLastSavedPage(savedProgress.page);
                }
                // Restore settings
                if (savedProgress.fontSize) setFontSize(savedProgress.fontSize);
                if (savedProgress.zoom) setZoom(savedProgress.zoom);
                if (savedProgress.theme) setTheme(savedProgress.theme);
            } else if (resumePage) {
                setCurrentPage(parseInt(resumePage, 10));
            }
        }
    }, [filePath, resumePage]);

    // Auto-save progress
    useEffect(() => {
        if (!filePath || currentPage === lastSavedPage) return;

        if (autoSaveTimeout.current) {
            clearTimeout(autoSaveTimeout.current);
        }

        autoSaveTimeout.current = setTimeout(() => {
            const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
            const saved = saveReadingProgress(filePath, {
                page: currentPage,
                progress: progress,
                // Also save reader preferences
                ...(({ fontSize, zoom, theme }) as any)
            });
            if (saved) {
                setProgressSaved(true);
                setLastSavedPage(currentPage);
                setTimeout(() => setProgressSaved(false), 2000);
            }
        }, 2000);

        return () => {
            if (autoSaveTimeout.current) {
                clearTimeout(autoSaveTimeout.current);
            }
        };
    }, [currentPage, totalPages, filePath, lastSavedPage]);

    // Save on unmount (persist everything)
    useEffect(() => {
        const saveOnExit = () => {
            if (filePath && currentPage > 0) {
                const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
                saveReadingProgress(filePath, {
                    page: currentPage,
                    progress: progress,
                });
            }
        };

        window.addEventListener('beforeunload', saveOnExit);
        return () => {
            saveOnExit();
            window.removeEventListener('beforeunload', saveOnExit);
        };
    }, [filePath, currentPage, totalPages]);

    // Ultra Focus: auto-hide controls after 3s of no touch
    useEffect(() => {
        if (!ultraFocus) {
            setShowControls(true);
            return;
        }
        const hideControls = () => {
            if (focusTimeout.current) clearTimeout(focusTimeout.current);
            setShowControls(true);
            focusTimeout.current = setTimeout(() => setShowControls(false), 3000);
        };
        hideControls();
        window.addEventListener('touchstart', hideControls);
        window.addEventListener('mousemove', hideControls);
        return () => {
            window.removeEventListener('touchstart', hideControls);
            window.removeEventListener('mousemove', hideControls);
            if (focusTimeout.current) clearTimeout(focusTimeout.current);
        };
    }, [ultraFocus]);

    // Navigation
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    // Manual save with bookmark
    const manualSave = () => {
        const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
        const saved = saveReadingProgress(filePath, {
            page: currentPage,
            progress: progress,
        });
        if (saved) {
            setBookmarkSaved(true);
            setLastSavedPage(currentPage);
            setTimeout(() => setBookmarkSaved(false), 2500);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextPage();
            } else if (e.key === 'ArrowLeft') {
                prevPage();
            } else if (e.key === 'Escape') {
                if (ultraFocus) setUltraFocus(false);
                else if (isFullscreen) setIsFullscreen(false);
                else if (showSettings) setShowSettings(false);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                manualSave();
            } else if (e.key === 'f' || e.key === 'F') {
                if (!e.ctrlKey && !e.metaKey) setUltraFocus(!ultraFocus);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages, isFullscreen, showSettings, ultraFocus]);

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Calculate reading progress
    const readingProgress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

    if (!filePath) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
                <div className="text-center">
                    <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h1 className="text-white text-xl mb-2">Nenhum e-book selecionado</h1>
                    <button
                        onClick={() => router.push('/estudos')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                    >
                        Voltar à Biblioteca
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex h-screen overflow-hidden transition-colors duration-300"
            style={{ backgroundColor: currentTheme.background }}
        >
            <main className="flex-1 ml-0 flex flex-col" style={{ height: '100dvh' }}>

                {/* ═══ TOP BAR ═══ */}
                <AnimatePresence>
                    {(!ultraFocus || showControls) && (
                        <motion.div
                            initial={{ y: -60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -60, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="px-3 py-2 flex items-center justify-between border-b backdrop-blur-xl sticky top-0 z-50"
                            style={{
                                backgroundColor: `${currentTheme.paper}ee`,
                                borderColor: `${currentTheme.text}15`,
                                minHeight: ultraFocus ? 44 : 52,
                            }}
                        >
                            {/* Left - Navigation */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.push('/estudos')}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all hover:opacity-80"
                                    style={{ color: currentTheme.text }}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="text-xs hidden md:inline">Biblioteca</span>
                                </button>

                                <div className="w-px h-5" style={{ backgroundColor: `${currentTheme.text}20` }} />

                                <h1
                                    className="font-medium text-xs md:text-sm line-clamp-1 max-w-[40vw] md:max-w-md"
                                    style={{ color: currentTheme.text }}
                                >
                                    {title}
                                </h1>
                            </div>

                            {/* Right - Controls */}
                            <div className="flex items-center gap-1.5">
                                {/* Bookmark / Save */}
                                <button
                                    onClick={manualSave}
                                    className="relative p-1.5 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                        backgroundColor: bookmarkSaved ? `${currentTheme.accent}25` : `${currentTheme.text}10`,
                                        color: bookmarkSaved ? currentTheme.accent : currentTheme.text
                                    }}
                                    title="Marcar posição (Ctrl+S)"
                                >
                                    <BookMarked className="w-4 h-4" />
                                    {bookmarkSaved && (
                                        <motion.span
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
                                            style={{ background: '#22c55e' }}
                                        >
                                            <CheckCircle className="w-2 h-2 text-white" />
                                        </motion.span>
                                    )}
                                </button>

                                {/* Ultra Focus Toggle */}
                                <button
                                    onClick={() => setUltraFocus(!ultraFocus)}
                                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                        backgroundColor: ultraFocus ? `${currentTheme.accent}25` : `${currentTheme.text}10`,
                                        color: ultraFocus ? currentTheme.accent : currentTheme.text,
                                    }}
                                    title="Ultra Focus (F)"
                                >
                                    {ultraFocus ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>

                                {/* Font Size Quick Controls */}
                                <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-lg" style={{ backgroundColor: `${currentTheme.text}08` }}>
                                    <button
                                        onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                        className="p-1 rounded hover:opacity-70 transition-opacity"
                                        style={{ color: currentTheme.text }}
                                    >
                                        <Type className="w-3 h-3" />
                                    </button>
                                    <span className="text-[10px] w-7 text-center font-bold" style={{ color: currentTheme.accent }}>
                                        {fontSize}
                                    </span>
                                    <button
                                        onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                        className="p-1 rounded hover:opacity-70 transition-opacity"
                                        style={{ color: currentTheme.text }}
                                    >
                                        <Type className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Zoom (visible on desktop) */}
                                <div className="hidden md:flex items-center gap-0.5 px-1 py-0.5 rounded-lg" style={{ backgroundColor: `${currentTheme.text}08` }}>
                                    <button
                                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                                        className="p-1 rounded hover:opacity-70 transition-opacity"
                                        style={{ color: currentTheme.text }}
                                    >
                                        <ZoomOut className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-[10px] w-8 text-center" style={{ color: currentTheme.text }}>
                                        {zoom}%
                                    </span>
                                    <button
                                        onClick={() => setZoom(Math.min(250, zoom + 10))}
                                        className="p-1 rounded hover:opacity-70 transition-opacity"
                                        style={{ color: currentTheme.text }}
                                    >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Theme Toggle */}
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                        backgroundColor: showSettings ? currentTheme.accent : `${currentTheme.text}10`,
                                        color: showSettings ? '#fff' : currentTheme.text
                                    }}
                                >
                                    <Palette className="w-4 h-4" />
                                </button>

                                {/* Fullscreen */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-1.5 rounded-lg transition-all hover:opacity-80 hidden md:flex"
                                    style={{ backgroundColor: `${currentTheme.text}10`, color: currentTheme.text }}
                                >
                                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Settings Panel */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-14 right-3 z-50 p-4 rounded-xl shadow-2xl border w-64"
                            style={{
                                backgroundColor: currentTheme.paper,
                                borderColor: `${currentTheme.text}15`
                            }}
                        >
                            <h3 className="font-medium mb-3 text-sm" style={{ color: currentTheme.text }}>
                                Configurações de Leitura
                            </h3>

                            {/* Theme Selection */}
                            <div className="mb-3">
                                <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: `${currentTheme.text}80` }}>
                                    Tema
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(THEMES).map(([key, t]) => (
                                        <button
                                            key={key}
                                            onClick={() => setTheme(key as keyof typeof THEMES)}
                                            className={`p-2.5 rounded-lg border-2 transition-all ${theme === key ? 'ring-2 ring-offset-1' : ''}`}
                                            style={{
                                                backgroundColor: t.paper,
                                                borderColor: theme === key ? t.accent : `${t.text}20`,
                                            }}
                                            title={t.name}
                                        >
                                            <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: t.accent }} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="mb-3">
                                <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: `${currentTheme.text}80` }}>
                                    Fonte: {fontSize}px
                                </label>
                                <input
                                    type="range"
                                    min="12"
                                    max="32"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full"
                                    style={{ accentColor: currentTheme.accent }}
                                />
                            </div>

                            {/* Zoom (Mobile) */}
                            <div className="mb-3 md:hidden">
                                <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: `${currentTheme.text}80` }}>
                                    Zoom: {zoom}%
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="250"
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full"
                                    style={{ accentColor: currentTheme.accent }}
                                />
                            </div>

                            {/* Desktop Zoom */}
                            <div className="hidden md:block">
                                <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: `${currentTheme.text}80` }}>
                                    Zoom: {zoom}%
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="200"
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full"
                                    style={{ accentColor: currentTheme.accent }}
                                />
                            </div>

                            {/* Reading Info */}
                            <div className="mt-3 pt-3 border-t" style={{ borderColor: `${currentTheme.text}15` }}>
                                <div className="text-xs" style={{ color: `${currentTheme.text}60` }}>
                                    <div className="flex justify-between mb-1">
                                        <span>Progresso:</span>
                                        <span className="font-bold" style={{ color: currentTheme.accent }}>{readingProgress}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Página atual:</span>
                                        <span>{currentPage} / {totalPages || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ MAIN READER AREA ═══ */}
                <div
                    className="flex-1 flex items-center justify-center relative overflow-hidden"
                    style={{ padding: ultraFocus && isMobile ? 0 : (isMobile ? '4px 2px' : '16px') }}
                    onClick={() => {
                        if (ultraFocus) setShowControls(prev => !prev);
                    }}
                >
                    {/* Book Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl"
                        style={{
                            backgroundColor: currentTheme.paper,
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                            maxWidth: ultraFocus ? '100%' : '5xl',
                            borderRadius: ultraFocus && isMobile ? 0 : undefined,
                        }}
                    >
                        {/* PDF Viewer */}
                        <iframe
                            ref={iframeRef}
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            className="w-full h-full border-0"
                            style={{
                                filter: theme === 'dark' ? 'invert(0.9) hue-rotate(180deg)' :
                                    theme === 'midnight' ? 'invert(0.85) hue-rotate(180deg) saturate(1.2)' :
                                        theme === 'sepia' ? 'sepia(0.3)' : 'none'
                            }}
                            onLoad={() => setIsLoading(false)}
                        />

                        {/* Loading Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: currentTheme.paper }}>
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: currentTheme.accent }} />
                                    <p style={{ color: `${currentTheme.text}60` }}>Carregando e-book...</p>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Navigation Arrows — hidden in ultra focus unless controls visible */}
                    <AnimatePresence>
                        {(!ultraFocus || showControls) && (
                            <>
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={prevPage}
                                    className="absolute left-1 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: `${currentTheme.paper}dd`,
                                        color: currentTheme.text,
                                        opacity: currentPage <= 1 ? 0.3 : 1,
                                        backdropFilter: 'blur(8px)',
                                    }}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                                </motion.button>

                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={nextPage}
                                    className="absolute right-1 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: `${currentTheme.paper}dd`,
                                        color: currentTheme.text,
                                        opacity: currentPage >= totalPages ? 0.3 : 1,
                                        backdropFilter: 'blur(8px)',
                                    }}
                                    disabled={currentPage >= totalPages}
                                >
                                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                                </motion.button>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* ═══ BOTTOM BAR ═══ */}
                <AnimatePresence>
                    {(!ultraFocus || showControls) && (
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="px-3 flex items-center justify-between border-t"
                            style={{
                                backgroundColor: `${currentTheme.paper}ee`,
                                borderColor: `${currentTheme.text}15`,
                                minHeight: 44,
                                paddingBottom: 'env(safe-area-inset-bottom, 4px)',
                            }}
                        >
                            {/* Progress bar */}
                            <div className="flex items-center gap-2 flex-1">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${currentTheme.text}15` }}>
                                    <div
                                        className="h-full transition-all duration-500"
                                        style={{
                                            width: `${readingProgress}%`,
                                            background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.accent}88)`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-bold whitespace-nowrap" style={{ color: currentTheme.accent }}>
                                    {readingProgress}%
                                </span>
                            </div>

                            {/* Page indicator */}
                            <div className="flex items-center gap-2 ml-3">
                                <span className="text-[10px] font-medium hidden sm:inline" style={{ color: `${currentTheme.text}50` }}>
                                    Setas ← → | Ctrl+S salvar | F = foco
                                </span>

                                {/* Save indicator */}
                                <AnimatePresence>
                                    {(progressSaved || bookmarkSaved) && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                            style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}
                                        >
                                            <CheckCircle className="w-2.5 h-2.5" />
                                            {bookmarkSaved ? '📌 Posição Marcada!' : 'Salvo'}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ ULTRA FOCUS FLOATING TOGGLE (always visible) ═══ */}
                {ultraFocus && !showControls && (
                    <button
                        onClick={() => setShowControls(true)}
                        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center shadow-xl"
                        style={{
                            background: `${currentTheme.accent}40`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${currentTheme.accent}50`,
                            color: currentTheme.accent,
                        }}
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                )}
            </main>
        </div>
    );
}

export default function PremiumEbookReaderPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
            </div>
        }>
            <EbookReaderContent />
        </Suspense>
    );
}

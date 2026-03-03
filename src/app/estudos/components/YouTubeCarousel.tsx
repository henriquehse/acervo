'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, ChevronLeft, ChevronRight, Youtube, Sparkles,
    X, Brain, Bot, ExternalLink
} from 'lucide-react';

// === CURSO EM VÍDEO - GUSTAVO GUANABARA ===
// IDs validados via thumbnail check (primeiro vídeo de cada playlist)
const CURSO_EM_VIDEO = [
    { title: "Python 3 - Mundo 1", videoId: "S9uPNppGsGo", playlist: "PLHz_AreHm4dlKP6QQCekuIPky1CiwmdI6", videos: 40, category: "Python" },
    { title: "Python 3 - Mundo 2", videoId: "nJkVHusJp6E", playlist: "PLHz_AreHm4dk_nZHmxxf_J0WRAqy5Czye", videos: 40, category: "Python" },
    { title: "Python 3 - Mundo 3", videoId: "0LB3FSfjvao", playlist: "PLHz_AreHm4dksnH2jVTIVNviIMBVYyFnH", videos: 31, category: "Python" },
    { title: "Java POO", videoId: "KlIL63MeyMY", playlist: "PLHz_AreHm4dkqe2aR0tQK74m8SFe-aGwY", videos: 20, category: "Java" },
    { title: "Java Básico", videoId: "sTX0UEplF54", playlist: "PLHz_AreHm4dk56gRST_p7bThvV9mHT1VL", videos: 40, category: "Java" },
    { title: "JavaScript", videoId: "1-w1RfGIov4", playlist: "PLHz_AreHm4dlsK3Nr9GVvXCbpQyHQl1o1", videos: 46, category: "JS" },
    { title: "HTML5 e CSS3 - Módulo 1", videoId: "Ejkb_YpuHWs", playlist: "PLHz_AreHm4dkZ9-atkcmcBaMZdmLHft8n", videos: 12, category: "Web" },
    { title: "HTML5 e CSS3 - Módulo 2", videoId: "vPNIAJ9B4hg", playlist: "PLHz_AreHm4dlUpEXkY1AyVLQGcpSgVF8s", videos: 15, category: "Web" },
    { title: "HTML5 e CSS3 - Módulo 3", videoId: "ofFgnDtn_1c", playlist: "PLHz_AreHm4dmcAviDwiGgHbeEJToxbOpZ", videos: 12, category: "Web" },
    { title: "HTML5 e CSS3 - Módulo 4", videoId: "zHKHMmEG9vE", playlist: "PLHz_AreHm4dkcVCk2Bn_fdVQ81Fkrh6WT", videos: 11, category: "Web" },
    { title: "PHP Básico", videoId: "F7KzJ7e6EAc", playlist: "PLHz_AreHm4dm4beCCCmW4xwpmLf6EHY9k", videos: 40, category: "PHP" },
    { title: "MySQL", videoId: "Ofktsne-utM", playlist: "PLHz_AreHm4dkBs-795Dsgvau_ekxg8g1r", videos: 16, category: "SQL" },
    { title: "Algoritmo", videoId: "8mei6uVttho", playlist: "PLHz_AreHm4dmSj0MHol_aoNYCSGFqvfXV", videos: 15, category: "Lógica" },
    { title: "Git e GitHub", videoId: "xEKo29OWILE", playlist: "PLHz_AreHm4dm7ZULPAmadvNhH6vk9oNZA", videos: 20, category: "Git" },
    { title: "WordPress", videoId: "JPR4OK4c35Q", playlist: "PLHz_AreHm4dmDP_RWdiKekjTEmCuq_MW2", videos: 21, category: "CMS" },
    { title: "Linux", videoId: "6nN2EglOqCM", playlist: "PLHz_AreHm4dlIXleu20uwPWFOSswqLYbV", videos: 22, category: "Linux" },
];

// === CANAIS BRASILEIROS DE AUTOMAÇÃO/IA ===
// IDs atualizados com vídeos reais e válidos 
const CANAIS_BR_AUTOMACAO = [
    { title: "Python Automação", channel: "Hashtag Programação", videoId: "VuKvR1J2LQE", category: "Python", lang: "PT-BR" },
    { title: "Machine Learning", channel: "Didática Tech", videoId: "JyGGMyR3x5I", category: "ML", lang: "PT-BR" },
    { title: "Tailwind CSS", channel: "Rocketseat", videoId: "1nVUfZg2dSA", category: "CSS", lang: "PT-BR" },
    { title: "Docker Completo", channel: "Fabricio Veronez", videoId: "np_vyd7QlXk", category: "Docker", lang: "PT-BR" },
    { title: "TypeScript", channel: "Rocketseat", videoId: "mRixno_uE2o", category: "TS", lang: "PT-BR" },
    { title: "React do Zero", channel: "Rocketseat", videoId: "pDbcC-xSat4", category: "React", lang: "PT-BR" },
    { title: "Node.js Completo", channel: "Rocketseat", videoId: "hHM-hr9q4mo", category: "Node", lang: "PT-BR" },
    { title: "Next.js 14", channel: "Rocketseat", videoId: "Ot0C0dXhk14", category: "Next.js", lang: "PT-BR" },
    { title: "API REST", channel: "Balta.io", videoId: "GF7q8J0Dtuw", category: "API", lang: "PT-BR" },
    { title: "Git Avançado", channel: "Akita", videoId: "6Czd1Yetaac", category: "Git", lang: "PT-BR" },
];

// === CANAIS AMERICANOS DE AUTOMAÇÃO/IA ===
const CANAIS_US_AUTOMACAO = [
    { title: "Build GPT from Scratch", channel: "Andrej Karpathy", videoId: "kCc8FmEb1nY", category: "LLM", lang: "EN+LEG" },
    { title: "LangChain Agents", channel: "freeCodeCamp", videoId: "HSZ_uaif57o", category: "LangChain", lang: "EN+LEG" },
    { title: "CrewAI Full Course", channel: "freeCodeCamp", videoId: "sPzc6hMg7So", category: "CrewAI", lang: "EN+LEG" },
    { title: "AI Agents Crash Course", channel: "AI Jason", videoId: "F8NKVhkZZWI", category: "Agentes", lang: "EN+LEG" },
    { title: "ChatGPT API Course", channel: "freeCodeCamp", videoId: "uRQH2CFvedY", category: "OpenAI", lang: "EN+LEG" },
    { title: "LangChain Masterclass", channel: "freeCodeCamp", videoId: "lG7Uxts9SXs", category: "LangChain", lang: "EN+LEG" },
    { title: "Python Automation", channel: "Tech With Tim", videoId: "s8XjEuplx_U", category: "Python", lang: "EN+LEG" },
    { title: "RAG from Scratch", channel: "freeCodeCamp", videoId: "sVcwVQRHIc8", category: "RAG", lang: "EN+LEG" },
    { title: "Vector DBs Explained", channel: "Fireship", videoId: "klTvEwg3oJ4", category: "VectorDB", lang: "EN+LEG" },
    { title: "Fine-tuning LLMs", channel: "Weights & Biases", videoId: "eC6Hd1hFvos", category: "LLM", lang: "EN+LEG" },
];

// === THUMBNAIL COM FALLBACK ===
const VideoThumbnail = ({ videoId, title }: { videoId: string; title: string }) => {
    const [imgError, setImgError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    if (imgError) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-[#1a0a0a] via-[#0f0a1a] to-[#050508] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Youtube className="w-8 h-8 text-red-500/40" />
                    <span className="text-[9px] text-white/30 font-medium text-center px-4 line-clamp-2">{title}</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {!imgLoaded && (
                <div className="absolute inset-0 bg-[#0a0a0f] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                </div>
            )}
            <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt={title}
                className={`w-full h-full object-cover transition-all duration-500 brightness-75 group-hover/card:brightness-100 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onError={() => setImgError(true)}
                onLoad={() => setImgLoaded(true)}
            />
        </>
    );
};

// === VIDEO PLAYER MODAL ===
const VideoPlayer = ({ video, onClose }: { video: any; onClose: () => void }) => {
    const embedUrl = video.playlist
        ? `https://www.youtube.com/embed/videoseries?list=${video.playlist}&autoplay=1`
        : `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-red-600 rounded-full transition-colors group"
                >
                    <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                </button>

                {/* Title + Open in YT */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur rounded-lg border border-white/5">
                        <h3 className="text-white font-bold text-sm">{video.title}</h3>
                    </div>
                    <a
                        href={video.playlist
                            ? `https://www.youtube.com/playlist?list=${video.playlist}`
                            : `https://www.youtube.com/watch?v=${video.videoId}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-black/60 hover:bg-white/20 rounded-full transition-colors"
                        title="Abrir no YouTube"
                    >
                        <ExternalLink className="w-4 h-4 text-white" />
                    </a>
                </div>

                <iframe
                    src={embedUrl}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </motion.div>
        </motion.div>
    );
};

// === CAROUSEL HORIZONTAL ESTILO NETFLIX ===
const Carousel = ({
    items,
    title,
    subtitle,
    icon: Icon,
    iconColor,
    onPlay
}: {
    items: any[];
    title: string;
    subtitle: string;
    icon: any;
    iconColor: string;
    onPlay: (video: any) => void;
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [items]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -340 : 340;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    }, []);

    if (!items?.length) return null;

    return (
        <div className="group relative space-y-3 py-4 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-3">
                    <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${iconColor} bg-opacity-20 border border-white/5`}>
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            {title}
                        </h2>
                        <p className="text-white/40 text-[10px] sm:text-xs font-medium">{subtitle}</p>
                    </div>
                </div>

                {/* Navigation Buttons - Hidden on XS mobile, visible on SM+ */}
                <div className="hidden sm:flex items-center gap-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${canScrollLeft
                            ? 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'
                            : 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed'
                            }`}
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${canScrollRight
                            ? 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'
                            : 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed'
                            }`}
                        aria-label="Próximo"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Scrollable List */}
                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex gap-4 md:gap-5 overflow-x-auto pb-6 pt-2 px-2 scroll-smooth no-scrollbar cursor-grab active:cursor-grabbing"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {items.map((video, idx) => (
                        <div
                            key={idx}
                            onClick={() => onPlay(video)}
                            className="flex-shrink-0 w-[240px] md:w-[300px] aspect-video relative rounded-2xl overflow-hidden cursor-pointer bg-[#0f0f15] border border-white/5 group/card hover:scale-[1.03] hover:border-red-500/30 transition-all duration-500 shadow-2xl"
                        >
                            {/* Thumbnail with Fallback */}
                            <VideoThumbnail videoId={video.videoId} title={video.title} />

                            {/* Content Overlays */}
                            <div className="absolute inset-0 p-3 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/50 border border-white/10 text-white/90">
                                        {video.category}
                                    </span>
                                    {video.lang && (
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 ${video.lang === 'PT-BR'
                                            ? 'bg-green-600/40 text-green-200'
                                            : 'bg-blue-600/40 text-blue-200'
                                            }`}>
                                            {video.lang}
                                        </span>
                                    )}
                                    {video.videos && (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold backdrop-blur-md bg-red-600/40 border border-red-500/20 text-white">
                                            {video.videos} aulas
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-white font-bold text-xs leading-tight line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                        {video.title}
                                    </h3>
                                    {video.channel && (
                                        <div className="flex items-center gap-1 text-[10px] text-white/60">
                                            <span className="truncate max-w-[150px]">{video.channel}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Play Button */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300">
                                <div className="w-12 h-12 rounded-full bg-red-600/90 backdrop-blur-md border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-110 transition-transform">
                                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="w-4 flex-shrink-0" />
                </div>
            </div>
        </div>
    );
};

// === COMPONENTE PRINCIPAL ===
export const YouTubeTab = () => {
    const [activeVideo, setActiveVideo] = useState<any>(null);

    return (
        <div className="space-y-6 w-full pb-20 fade-in animate-in">
            {/* Hero */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-[#1a0b0b] via-[#0f0a1a] to-[#050508] border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-red-500/5" />
                <div className="p-3 bg-red-600 rounded-xl relative z-10 shadow-lg shadow-red-900/40">
                    <Youtube className="w-8 h-8 text-white fill-white" />
                </div>
                <div className="relative z-10 flex-1">
                    <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 mb-1">
                        YouTube Academy <Sparkles className="w-5 h-5 text-yellow-500" />
                    </h1>
                    <p className="text-white/60 text-sm md:text-base font-medium">
                        Player 100% integrado • Assista, anote e aprenda sem sair do Bunker
                    </p>
                </div>
                <div className="relative z-10 flex items-center gap-4 text-white/40 ml-auto sm:ml-0">
                    <div className="text-center">
                        <p className="text-xl sm:text-2xl font-black text-white">{CURSO_EM_VIDEO.length + CANAIS_BR_AUTOMACAO.length + CANAIS_US_AUTOMACAO.length}</p>
                        <p className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold">Playlists</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                        <p className="text-xl sm:text-2xl font-black text-white">{CURSO_EM_VIDEO.reduce((a, b) => a + (b.videos || 0), 0)}+</p>
                        <p className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold">Aulas</p>
                    </div>
                </div>
            </div>

            {/* Curso em Vídeo */}
            <Carousel
                items={CURSO_EM_VIDEO}
                title="Curso em Vídeo"
                subtitle="Gustavo Guanabara • 16 cursos completos grátis"
                icon={Youtube}
                iconColor="bg-red-500"
                onPlay={setActiveVideo}
            />

            {/* Canais BR */}
            <Carousel
                items={CANAIS_BR_AUTOMACAO}
                title="Dev & Automação 🇧🇷"
                subtitle="Rocketseat, Hashtag, Balta.io • PT-BR nativo"
                icon={Bot}
                iconColor="bg-green-500"
                onPlay={setActiveVideo}
            />

            {/* Canais US */}
            <Carousel
                items={CANAIS_US_AUTOMACAO}
                title="AI Elite 🇺🇸"
                subtitle="Karpathy, freeCodeCamp, Fireship • Legendas PT"
                icon={Brain}
                iconColor="bg-blue-500"
                onPlay={setActiveVideo}
            />

            {/* Player Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <VideoPlayer
                        video={activeVideo}
                        onClose={() => setActiveVideo(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default YouTubeTab;


'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, BookOpen, Target, Flame,
    TrendingUp, Play, Search, ChevronRight, ChevronLeft, Zap, Star,
    Video, Library, Sparkles, ArrowRight,
    RefreshCw, Download, LayoutGrid, Eye, Rocket, Compass, PenTool,
    Youtube, Coins, Languages, CheckCircle, HardDrive, Share2, Cloud, X
} from 'lucide-react';
import { Dock } from '@/components/ui/Dock';
import { LibraryHub } from './components/LibraryHub';
import { YouTubeTab } from './components/YouTubeCarousel';

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Hot Area Icons & Colors (Updated for Dark Mode Contrast)
const HOT_AREA_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    ia: { icon: Brain, color: '#a855f7', label: 'IA & Automação' },
    low_ticket: { icon: Zap, color: '#f59e0b', label: 'Low Ticket' },
    trafego_pago: { icon: Target, color: '#10b981', label: 'Tráfego Pago' },
    web_design: { icon: LayoutGrid, color: '#0ea5e9', label: 'Design & UI' },
    copywriting: { icon: PenTool, color: '#ec4899', label: 'Copywriting' },
    artista_digital: { icon: Eye, color: '#c084fc', label: 'VFX & 3D' },
    youtube: { icon: Youtube, color: '#ef4444', label: 'YouTube' },
    ecommerce: { icon: Library, color: '#3b82f6', label: 'E-commerce' },
    programacao: { icon: Rocket, color: '#6366f1', label: 'Programação' },
    financeiro: { icon: Coins, color: '#fcd34d', label: 'Financeiro' },
    idiomas: { icon: Languages, color: '#60a5fa', label: 'Idiomas' },
    produtividade: { icon: CheckCircle, color: '#34d399', label: 'Produtividade' },
    outros: { icon: Star, color: '#9ca3af', label: 'Geral' },
    vendas: { icon: Target, color: '#f87171', label: 'Vendas' },
    modelagem_3d: { icon: Compass, color: '#fb923c', label: 'Arquitetura' },
};

// Interface types (KEEPING LOGIC INTACT)
interface Course {
    title: string;
    source_type: string;
    source_path: string;
    category: string;
    hot_area: string;
    hot_score: number;
    total_modules: number;
    total_videos: number;
    total_ebooks?: number;
    total_audio?: number;
    content_type?: 'course' | 'ebook_collection' | 'audiobook';
    tags: string[];
    is_remote?: boolean;
    thumbnail_url?: string;
}

interface TelegramCourse {
    id: number;
    title: string;
    video_count: number;
    doc_count: number;
    audio_count?: number;
    content_type?: 'course' | 'ebook_collection' | 'audiobook';
    keywords: string[];
}

interface Ebook {
    title: string;
    file_path: string;
    file_type: string;
    category: string;
    hot_score: number;
    hot_area?: string;
}

interface LearningPath {
    id: string;
    name: string;
    description: string;
    estimated_hours: number;
    difficulty: string;
    hot_score: number;
    total_steps: number;
}

interface DashboardStats {
    total_courses: number;
    total_ebooks: number;
    total_videos: number;
    total_hours_available: number;
    hot_areas: Record<string, number>;
    categories: Record<string, number>;
    total_local?: number;
    total_telegram?: number;
    total_remote?: number;
    recent_history?: any[];
}

// --- NEW COMPONENT DESIGNS (2025 AESTHETIC REWORK) ---

const PremiumBackground = () => (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020205]">
        {/* Deep Space Base */}
        <div className="absolute inset-0 bg-[#020205]" />

        {/* HYPER-VIBRANT MESH ORBS */}
        <motion.div
            animate={{
                x: [-100, 100, -100],
                y: [-50, 50, -50],
                opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-purple-600/40 rounded-full blur-[160px] mix-blend-screen"
        />
        <motion.div
            animate={{
                x: [100, -100, 100],
                y: [50, -50, 50],
                opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-blue-600/30 rounded-full blur-[180px] mix-blend-screen"
        />

        {/* THE "GRADEADO" (GRID) - VIBRANT & ANIMATED */}
        <div className="absolute inset-0 opacity-40">
            {/* Primary Sharp Grid */}
            <motion.div
                animate={{
                    backgroundPosition: ["0px 0px", "0px 80px"]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[length:40px_40px]"
            />
            {/* Secondary Large Grid */}
            <motion.div
                animate={{
                    backgroundPosition: ["0px 0px", "0px 160px"]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_2px,transparent_2px),linear-gradient(to_bottom,#ffffff0a_2px,transparent_2px)] bg-[length:200px_200px]"
            />

            {/* Glow Horizontal Scanner */}
            <motion.div
                animate={{
                    top: ["-5%", "105%"]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-24 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent pointer-events-none"
            />
        </div>

        {/* Grain & Noise Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay" />

        {/* Dark Vignette for Contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#020205_100%)]" />
    </div>
);

const CourseCard = ({ course, onClick }: { course: Course; onClick: (c: Course) => void }) => {
    const config = HOT_AREA_CONFIG[course.hot_area] || HOT_AREA_CONFIG.outros;

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative w-full aspect-[4/5] sm:aspect-[3/4.2] cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/5 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
            onClick={() => onClick(course)}
        >
            {/* Image Layer with Parallax-like Zoom */}
            <div className="absolute inset-0 overflow-hidden">
                {(course as any).thumbnail_url ? (
                    <img
                        src={(course as any).thumbnail_url.startsWith('/static') ? `${API_URL}${(course as any).thumbnail_url}` : (course as any).thumbnail_url}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                        alt={course.title}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#050505] flex items-center justify-center relative">
                        {/* Abstract Pattern Fallback */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                        <config.icon size={48} className="text-white/20 group-hover:text-white/80 transition-all duration-500" />
                    </div>
                )}
                {/* Cinematic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-300" />
            </div>

            {/* Content Layer (Glassmorphism) */}
            <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4 md:p-5 flex flex-col justify-end z-20">
                {/* Badge Pills */}
                <div className="flex gap-2 mb-2 translate-y-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300 delay-75">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border backdrop-blur-md ${course.source_type === 'telegram' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                        course.is_remote ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' :
                            'bg-green-500/10 border-green-500/20 text-green-300'
                        }`}>
                        {course.source_type === 'telegram' ? 'Telegram' : course.is_remote ? 'Cloud' : 'Local'}
                    </span>
                    {course.hot_score > 80 && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 rounded-md border border-red-500/20 flex items-center gap-1">
                            <Flame size={8} className="fill-red-500" /> HOT
                        </span>
                    )}
                </div>

                <h3 className="text-xs sm:text-sm md:text-base font-bold text-white leading-snug line-clamp-2 mb-1 group-hover:text-white transition-colors">
                    {course.title}
                </h3>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/[0.03] group-hover:border-purple-500/20 transition-all duration-500">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Video size={10} className="text-purple-500" />
                        {course.total_videos || 0} aulas
                    </span>

                    <div className="w-9 h-9 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transform sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-500">
                        <Play size={12} className="fill-white text-white ml-0.5" />
                    </div>
                </div>
            </div>

            {/* Inner Border Glow on Hover */}
            <div className="absolute inset-0 border border-white/5 rounded-2xl group-hover:border-purple-500/30 transition-colors pointer-events-none z-30" />
        </motion.div>
    );
};

const SectionCarousel = ({
    title,
    subtitle,
    courses,
    onCourseClick
}: {
    title: string;
    subtitle?: string;
    courses: Course[];
    onCourseClick: (course: Course) => void;
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const amount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    if (!courses || courses.length === 0) return null;

    return (
        <div className="space-y-4 py-6 animate-in fade-in duration-700">
            <div className="flex items-end justify-between px-1">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h2>
                    {subtitle && <p className="text-white/40 text-xs font-medium mt-1">{subtitle}</p>}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => scroll('left')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    <button onClick={() => scroll('right')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x"
                style={{ scrollbarWidth: 'none' }}
            >
                {courses.map((course, idx) => (
                    <div key={`${course.title}-${idx}`} className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] snap-start">
                        <CourseCard course={course} onClick={onCourseClick} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MODALS ---
const DocumentationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0f0f13] border border-white/10 rounded-2xl w-full max-w-2xl p-8 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={24} /></button>
                <h2 className="text-2xl font-bold text-white mb-4">Manual de Operações</h2>
                <p className="text-white/60">Integrações de sistema:</p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-white/50">
                    <li><strong className="text-white">Local:</strong> Arquivos em disco físico.</li>
                    <li><strong className="text-white">Cloud:</strong> Google Drive e Mega via Rclone.</li>
                    <li><strong className="text-white">Telegram:</strong> Canais indexados pelo bot.</li>
                </ul>
            </div>
        </div>
    );
};

const TerminalModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-black border border-white/20 rounded-lg w-full max-w-3xl h-[500px] flex flex-col font-mono text-sm shadow-2xl">
                <div className="flex-1 p-4 text-green-500 overflow-y-auto">
                    <p>{'>'} System diagnostics...</p>
                    <p>{'>'} Connectivity check: OK</p>
                    <p>{'>'} Rclone status: ONLINE</p>
                    <p className="animate-pulse">{'>'} _</p>
                </div>
                <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 text-white border-t border-white/10">Close Terminal</button>
            </div>
        </div>
    );
};

const renderLearningPaths = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mock Data for now - will be replaced by real data */}
            {[
                { id: '1', name: 'Fullstack Developer', description: 'Do zero ao profissional em desenvolvimento web moderno.', steps: 12 },
                { id: '2', name: 'Traffic Manager', description: 'Domine Meta Ads e Google Ads para escalar negócios.', steps: 8 },
                { id: '3', name: 'AI Engineer', description: 'Fundamentos de LLMs, Python e automação com IA.', steps: 15 },
            ].map((path) => (
                <motion.div key={path.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111] rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                            <Target className="w-6 h-6 text-purple-400" />
                        </div>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/50">{path.steps} Etapas</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{path.name}</h2>
                    <p className="text-white/50 mb-4 text-sm">{path.description}</p>
                    <button className="w-full py-3 bg-white/5 rounded-xl text-white font-bold text-xs hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                        CONTINUAR TRILHA <ArrowRight size={14} />
                    </button>
                </motion.div>
            ))}
        </div>
    </div>
);

function EstudosContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State (PRESERVED)
    const [activeTab, setActiveTab] = useState<'dashboard' | 'cursos' | 'biblioteca' | 'trilhas' | 'youtube'>('dashboard');
    const [showDocs, setShowDocs] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [courseSourceFilter, setCourseSourceFilter] = useState<'todos' | 'local' | 'remote' | 'telegram'>('todos');
    const [activeCategoryTab, setActiveCategoryTab] = useState('programacao');

    // Data (PRESERVED)
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [coursesByArea, setCoursesByArea] = useState<Record<string, Course[]>>({});
    const [telegramCourses, setTelegramCourses] = useState<TelegramCourse[]>([]);
    const [cloudCoursesCounts, setCloudCoursesCounts] = useState<{ total: number; drive: number; mega: number }>({ total: 0, drive: 0, mega: 0 });
    const [ebooks, setEbooks] = useState<Ebook[]>([]);
    const [cloudEbooks, setCloudEbooks] = useState<Ebook[]>([]); // New State
    const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Library params
    const [selectedLibraryChannel, setSelectedLibraryChannel] = useState<TelegramCourse | null>(null);
    const [libraryFiles, setLibraryFiles] = useState<any[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

    // Initialization check
    const [isMounted, setIsMounted] = useState(false);
    const [recentCourses, setRecentCourses] = useState<any[]>([]);

    useEffect(() => {
        setIsMounted(true);
        try {
            const saved = JSON.parse(localStorage.getItem('bruces_recent_courses') || '[]');
            setRecentCourses(saved);
        } catch (e) { }
    }, []);

    // URL Params Handling
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            if (tabParam === 'telegram') { setActiveTab('cursos'); setCourseSourceFilter('telegram'); }
            else if (tabParam === 'cloud') { setActiveTab('cursos'); setCourseSourceFilter('remote'); }
            else if (tabParam === 'local') { setActiveTab('cursos'); setCourseSourceFilter('local'); }
            else if (tabParam === 'courses') { setActiveTab('cursos'); }
        }
    }, [searchParams]);

    // Data Fetching Functions (COMPLETELY REWRITTEN FOR CLIENT-SIDE DRIVE API)
    const fetchDashboard = async () => {
        setStats({
            total_courses: coursesByArea ? Object.values(coursesByArea).flat().length : 0,
            total_ebooks: 4,
            total_videos: 120,
            total_hours_available: 350,
            hot_areas: { programacao: 2, web_design: 1, vendas: 3 },
            categories: { programacao: 2, web_design: 1, vendas: 3 },
            total_local: 0,
            total_remote: cloudCoursesCounts.total,
            total_telegram: 0,
            recent_history: []
        });
    };

    // Obsolete functions removed

    const fetchCoursesCloud = async (isBackground = false) => {
        try {
            if (!isBackground) setIsLoading(true);
            const tk = localStorage.getItem("acervo_token");
            if (!tk) return; // Need Google Drive Auth from Acervo Settings

            const h = { Authorization: `Bearer ${tk}` };
            const fields = "nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink)";

            // Get Subfolders from Acervo-mapped folders
            const names = ["[04]", "[07]", "2024", "Seus 50 Livros explicados e resumidos", "CONTROLE FINANCEIRO", "Canal Enriquecendo a Mente", "AudioBook"];
            const cond = names.map(n => `name='${n}'`).join(" or ");
            const q = `(${cond}) and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

            const res = await fetch(searchUrl, { headers: h });
            const data = await res.json();

            if (data.files && data.files.length > 0) {
                // Map fetched folders to 'Courses' UI
                const list = data.files.map((c: any) => ({
                    title: c.name,
                    source_type: 'google_drive',
                    source_path: c.id,
                    category: 'programacao', // Mock category
                    hot_area: 'programacao', // Mock area
                    hot_score: 95,
                    total_modules: 5,
                    total_videos: 20,
                    content_type: 'course',
                    tags: [],
                    is_remote: true,
                    thumbnail_url: c.thumbnailLink?.replace("=s220", "=s600") || ""
                }));

                setCoursesByArea({ programacao: list });
                setCloudCoursesCounts({ total: list.length, drive: list.length, mega: 0 });
            }

        } catch (e) { console.error(e); } finally { if (!isBackground) setIsLoading(false); }
    };

    // Telegram functional placeholder

    const handleScan = async () => {
        setIsScanning(true);
        try {
            await fetchCoursesCloud();
            await fetchDashboard();
        } catch (e) { console.error(e); } finally { setIsScanning(false); }
    };

    useEffect(() => {
        fetchDashboard(); fetchCoursesCloud();
        // Removed unnecessary polling for front-end implementation
    }, []);

    const openCourse = (course: Course) => {
        const rawPath = course.source_type === 'telegram' ? (course as any).id : (course.source_path || (course as any).path);
        const encodedPath = encodeURIComponent(rawPath);
        const encodedTitle = encodeURIComponent(course.title);
        const url = `/estudos/player?path=${encodedPath}&title=${encodedTitle}&source_type=${course.source_type}`;
        router.push(url);

    };

    const handleDownloadFile = async (channelId: number, fileId: number, filename: string) => {
        try {
            alert(`Iniciando download: ${filename}`);
            await fetch(`${API_URL}/api/telegram/download/${channelId}/${fileId}`, { method: 'POST' });
        } catch (e) { alert("Erro no download"); }
    };

    // SEARCH LOGIC
    const getFilteredCourses = () => {
        const all: Course[] = [];
        Object.values(coursesByArea).forEach(l => all.push(...l));
        telegramCourses.forEach(tc => {
            all.push({
                title: tc.title,
                id: tc.id,
                source_type: 'telegram',
                source_path: `${tc.id}`,
                hot_area: (tc as any).hot_area || 'outros',
                hot_score: 80,
                total_modules: 0,
                total_videos: tc.video_count,
                is_remote: true,
                thumbnail_url: (tc as any).thumbnail_url
            } as any);
        });

        // Anti-Junk Filter
        let filtered = all.filter(c => {
            const title = c.title.toUpperCase();
            return !title.includes('$RECYCLE.BIN') &&
                !title.includes('SYSTEM VOLUME INFORMATION') &&
                !title.startsWith('$');
        });

        // Search Filter
        if (searchQuery) {
            filtered = filtered.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Tab Filter
        if (activeCategoryTab !== 'todos') {
            const normalizedTab = activeCategoryTab === 'design' ? 'web_design' : activeCategoryTab;
            filtered = filtered.filter(c =>
                c.hot_area === normalizedTab ||
                (normalizedTab === 'programacao' && (c.hot_area?.includes('prog') || false)) ||
                (normalizedTab === 'web_design' && (c.hot_area === 'design' || c.hot_area === 'web_design'))
            );
        }

        // Source Filter
        if (courseSourceFilter !== 'todos') {
            if (courseSourceFilter === 'telegram') filtered = filtered.filter(c => c.source_type === 'telegram');
            else if (courseSourceFilter === 'remote') filtered = filtered.filter(c => ['google_drive', 'mega', 'rclone'].includes(c.source_type));
            else filtered = filtered.filter(c => c.source_type === 'local');
        }

        return filtered;
    };

    const renderDashboard = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            {recentCourses.length > 0 && (
                <div className="mb-8">
                    <SectionCarousel
                        title="Continue Assistindo"
                        subtitle="Retome de onde parou"
                        courses={recentCourses.map(rc => ({
                            title: rc.title,
                            source_type: rc.source_type,
                            source_path: rc.path,
                            category: 'recent',
                            hot_area: 'outros',
                            hot_score: 100,
                            total_modules: 0,
                            total_videos: 0,
                            tags: [],
                            is_remote: true,
                            thumbnail_url: rc.thumbnail_url || ''
                        })) as Course[]}
                        onCourseClick={openCourse}
                    />
                </div>
            )}
            {/* Hero / System Status */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 min-w-0 max-w-full">
                <div className="flex-1 min-w-0 bg-gradient-to-br from-[#0c0c16]/95 to-[#05050a]/98 backdrop-blur-[20px] rounded-2xl sm:rounded-3xl md:rounded-[3rem] p-4 sm:p-8 md:p-12 border border-white/[0.05] relative overflow-hidden group shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7)]">
                    {/* Pulsing Atmosphere */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    {/* Animated Glow Orbs */}
                    <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full group-hover:bg-purple-600/15 group-hover:scale-110 transition-all duration-1000" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full group-hover:bg-blue-600/15 group-hover:scale-110 transition-all duration-1000" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
                                <span className="text-[10px] uppercase tracking-[0.3em] font-black text-purple-400">Sistema Ativo</span>
                            </div>
                        </div>

                        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight leading-[0.95] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/20 select-none break-words max-w-full">
                            Bunker<br className="sm:hidden" /> <span className="text-purple-500 whitespace-normal break-words">Intelligence v12.5</span>
                        </h2>
                        <p className="text-white/40 mb-6 sm:mb-8 md:mb-14 w-full md:max-w-lg text-xs sm:text-sm md:text-xl font-medium leading-relaxed tracking-tight group-hover:text-white/60 transition-colors duration-500 break-words">
                            Central neural de aprendizado acelerado. Integrando {stats?.total_courses || 0} cursos em uma interface de alta performance.
                        </p>

                        <div className="flex gap-6 sm:gap-8 md:gap-12 items-end flex-wrap">
                            <div className="relative group/stat min-w-0">
                                <p className="text-[9px] md:text-[10px] text-white/30 uppercase font-black tracking-[0.15em] mb-1 md:mb-2 group-hover/stat:text-purple-400 transition-colors">Cursos</p>
                                <div className="flex items-baseline gap-1 sm:gap-2">
                                    <p className="text-2xl sm:text-3xl md:text-4xl font-mono font-black text-white truncate">{stats?.total_courses || 0}</p>
                                    <TrendingUp size={14} className="text-green-500 mb-1 flex-shrink-0" />
                                </div>
                            </div>
                            <div className="hidden sm:block w-px h-8 md:h-12 bg-white/10" />
                            <div className="relative group/stat min-w-0">
                                <p className="text-[9px] md:text-[10px] text-white/30 uppercase font-black tracking-[0.15em] mb-1 md:mb-2 group-hover/stat:text-blue-400 transition-colors">Aulas</p>
                                <div className="flex items-baseline gap-1 sm:gap-2">
                                    <p className="text-2xl sm:text-3xl md:text-4xl font-mono font-black text-white truncate">{stats?.total_videos || 0}</p>
                                    <Sparkles size={14} className="text-blue-400 mb-1 flex-shrink-0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Grid - Horizontal on mobile */}
                <div className="w-full md:w-80 grid grid-cols-3 md:grid-cols-1 gap-2 sm:gap-3 shrink-0">
                    <div className="bg-[#111] rounded-xl p-2 sm:p-3 md:p-4 flex items-center justify-between border border-white/5 relative group min-w-0 overflow-hidden">
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                            <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg flex-shrink-0"><HardDrive size={14} className="text-green-500 sm:w-4 sm:h-4" /></div>
                            <div className="text-left min-w-0">
                                <p className="text-[11px] sm:text-sm font-bold text-white truncate">Local</p>
                                <p className="text-[8px] sm:text-[10px] text-white/40 truncate hidden sm:block">Storage OK</p>
                            </div>
                        </div>
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] flex-shrink-0" />
                    </div>
                    <div className="bg-[#111] rounded-xl p-2 sm:p-3 md:p-4 flex items-center justify-between border border-white/5 relative group min-w-0 overflow-hidden">
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                            <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg flex-shrink-0"><Cloud size={14} className="text-orange-500 sm:w-4 sm:h-4" /></div>
                            <div className="text-left min-w-0">
                                <p className="text-[11px] sm:text-sm font-bold text-white truncate">Cloud</p>
                                <p className="text-[8px] sm:text-[10px] text-white/40 truncate hidden sm:block">Rclone</p>
                            </div>
                        </div>
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316] flex-shrink-0" />
                    </div>
                    <div className="bg-[#111] rounded-xl p-2 sm:p-3 md:p-4 flex items-center justify-between border border-white/5 relative group min-w-0 overflow-hidden">
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                            <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0"><Share2 size={14} className="text-blue-500 sm:w-4 sm:h-4" /></div>
                            <div className="text-left min-w-0">
                                <p className="text-[11px] sm:text-sm font-bold text-white truncate">Telegram</p>
                                <p className="text-[8px] sm:text-[10px] text-white/40 truncate hidden sm:block">{telegramCourses.length} Canais</p>
                            </div>
                        </div>
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] flex-shrink-0" />
                    </div>
                </div>
            </div>

            {/* Recents */}
            {stats?.recent_history && stats.recent_history.length > 0 && (
                <SectionCarousel
                    title="Continuar Assistindo"
                    courses={stats.recent_history.map(h => ({
                        title: h.title,
                        source_type: h.source_type || 'local',
                        source_path: h.path,
                        category: '',
                        hot_area: 'outros',
                        hot_score: 90,
                        total_modules: h.total_modules || 0,
                        total_videos: h.total_videos || 0,
                        thumbnail_url: h.thumbnail_url
                    } as any))}
                    onCourseClick={openCourse}
                />
            )}

            {/* Trending / Hot Areas */}
            <div className="space-y-4 mb-32">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-tight">Categorias em Alta</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                    {stats?.hot_areas && Object.entries(stats.hot_areas)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 6)
                        .map(([area, count]) => {
                            const conf = HOT_AREA_CONFIG[area] || HOT_AREA_CONFIG.outros;
                            return (
                                <button key={area} onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategoryTab(area as any);
                                    setActiveTab('cursos'); // <--- CRITICAL FIX: Switch tab immediately
                                }}
                                    className="flex flex-col items-center justify-center p-2.5 sm:p-3 md:p-4 bg-[#111] border border-white/5 hover:border-white/20 hover:bg-[#16161c] rounded-xl sm:rounded-2xl transition-all group min-w-0 overflow-hidden">
                                    <conf.icon className="mb-1.5 sm:mb-2 text-white/50 group-hover:text-white transition-colors flex-shrink-0" size={18} />
                                    <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider sm:tracking-widest text-white/70 group-hover:text-white text-center truncate w-full">{conf.label}</span>
                                    <span className="text-[7px] sm:text-[8px] md:text-[10px] text-white/30 font-bold">{count} CURSOS</span>
                                </button>
                            )
                        })}
                </div>
            </div>

            {/* Explicit Spacer for Dock */}
            <div className="h-[150px] w-full" aria-hidden="true" />

        </div>
    );

    const renderCourses = () => {
        const filtered = getFilteredCourses();
        return (
            <div className="pb-20">
                {/* Source Filters Restored */}
                <div className="flex items-center gap-1 mb-6 p-1 bg-[#0a0a0f] w-full overflow-x-auto rounded-lg border border-white/10 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                    {[
                        { id: 'todos', label: 'TODOS' },
                        { id: 'local', label: 'LOCAL' },
                        { id: 'remote', label: 'CLOUD' },
                        { id: 'telegram', label: 'TELEGRAM' }
                    ].map(source => (
                        <button
                            key={source.id}
                            onClick={() => setCourseSourceFilter(source.id as any)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${courseSourceFilter === source.id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            {source.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
                    {/* Category Tabs Redesigned */}
                    {[
                        { id: 'todos', label: 'TODOS' },
                        { id: 'programacao', label: 'PROGRAMAÇÃO' },
                        { id: 'web_design', label: 'DESIGN' },
                        { id: 'marketing', label: 'MARKETING' },
                        { id: 'vendas', label: 'VENDAS' },
                        { id: 'ia', label: 'IA' }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategoryTab(cat.id)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategoryTab === cat.id ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-white/40 border border-white/5 hover:text-white hover:bg-white/10'}`}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                        <Search size={40} className="mb-4 opacity-50" />
                        <p>Nenhum resultado encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
                        {filtered.map((c, i) => (
                            <CourseCard key={i} course={c} onClick={openCourse} />
                        ))}
                    </div>
                )}
            </div>
        )
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen w-full text-white selection:bg-purple-500/30 overflow-x-hidden relative">
            <PremiumBackground />

            <DocumentationModal isOpen={showDocs} onClose={() => setShowDocs(false)} />
            <TerminalModal isOpen={showTerminal} onClose={() => setShowTerminal(false)} />

            {/* Library Modal Logic (Kept Simple for rewrite) */}
            <AnimatePresence>
                {selectedLibraryChannel && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/90">
                        <div className="bg-[#111] w-full sm:max-w-4xl h-[85dvh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl border-t sm:border border-white/10 p-4 sm:p-6 overflow-y-auto">
                            <div className="flex justify-between mb-6">
                                <h2 className="text-2xl font-bold">{selectedLibraryChannel.title}</h2>
                                <button onClick={() => setSelectedLibraryChannel(null)}><X /></button>
                            </div>
                            <div className="grid gap-2">
                                {libraryFiles.map(f => (
                                    <div key={f.id} className="p-3 bg-white/5 rounded hover:bg-white/10 flex justify-between items-center cursor-pointer" onClick={() => handleDownloadFile(selectedLibraryChannel.id, f.id, f.filename)}>
                                        <div className="flex items-center gap-3">
                                            <BookOpen size={16} />
                                            <span className="text-sm">{f.filename}</span>
                                        </div>
                                        <Download size={16} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <Dock
                onOpenDocs={() => setShowDocs(true)}
                onOpenCmds={() => setShowTerminal(true)}
            />

            <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-8 pb-32 sm:pb-72 relative z-10 overflow-x-hidden">
                {/* Header Actions */}
                <header className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12 max-w-full">
                    <div className="flex-1 w-full relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-colors"><Search size={18} /></div>
                        <input
                            type="text"
                            placeholder="Buscar no Bunker..."
                            className="w-full bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl py-3.5 md:py-4.5 pl-14 pr-4 text-sm md:text-base text-white placeholder:text-white/20 focus:border-purple-500/50 outline-none transition-all shadow-xl focus:ring-1 focus:ring-purple-500/20"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value.length > 0 && activeTab !== 'cursos') {
                                    setActiveTab('cursos');
                                }
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none' }}>
                        <button onClick={() => setActiveTab('dashboard')} className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-black tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap uppercase ${activeTab === 'dashboard' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                            <Sparkles size={14} className={activeTab === 'dashboard' ? "fill-white" : ""} /> INTELIGÊNCIA
                        </button>
                        <button onClick={() => setActiveTab('cursos')} className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-black tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap uppercase ${activeTab === 'cursos' ? 'bg-white text-black shadow-lg shadow-white/20' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                            <Play size={14} className={activeTab === 'cursos' ? "fill-black" : "fill-white"} /> EXPLORAR
                        </button>
                        <button onClick={() => setActiveTab('trilhas')} className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-black tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap uppercase ${activeTab === 'trilhas' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                            <Target size={14} /> TRILHAS
                        </button>
                        <button onClick={() => setActiveTab('biblioteca')} className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-black tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap uppercase ${activeTab === 'biblioteca' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                            <BookOpen size={14} /> BIBLIOTECA
                        </button>
                        <button onClick={() => setActiveTab('youtube')} className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-black tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap uppercase ${activeTab === 'youtube' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                            <Youtube size={14} /> YOUTUBE
                        </button>

                        <div className="hidden xl:block w-px h-8 bg-white/10 mx-1 flex-shrink-0" />

                        <button onClick={handleScan} disabled={isScanning} className="flex-shrink-0 px-4 md:px-6 py-2 md:py-2.5 bg-white text-black font-bold rounded-full text-[10px] md:text-xs hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.3)] whitespace-nowrap">
                            <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} /> {isScanning ? "SYNCING..." : "SYNC"}
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-x-hidden min-w-0">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'cursos' && renderCourses()}
                    {activeTab === 'trilhas' && renderLearningPaths()}
                    {activeTab === 'youtube' && <YouTubeTab />}

                    {activeTab === 'biblioteca' && (
                        <LibraryHub
                            localEbooks={ebooks}
                            cloudEbooks={cloudEbooks}
                            onOpenReader={(book) => alert(`Abrindo leitor para: ${book.title}`)}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

export default function EstudosPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black text-white font-mono">INITIALIZING BUNKER...</div>}>
            <EstudosContent />
        </Suspense>
    );
}

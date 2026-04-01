import React, { useState, useEffect, useMemo } from 'react';
import { BookReader } from './BookReader';
import { BookOpen, Coffee, Star, Zap, Search, Filter, Headphones, FileText, ChevronUp, ChevronDown, Bookmark, Clock, TrendingUp, AudioLines, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Mock types needed locally
interface Ebook {
    title: string;
    file_path: string;
    file_type: string;
    category: string;
    hot_score: number;
    hot_area?: string;
    is_comic?: boolean;
    elite_metadata?: any;
    source?: 'telegram' | 'drive' | 'local';
}

interface Audiobook {
    id: string;
    title: string;
    author?: string;
    narrator?: string;
    duration?: string;
    channel_id?: number;
    message_id?: number;
    channel_name?: string;
    file_name?: string;
    size_mb?: number;
    category?: string;
    progress?: number;
    platform?: string;
    source?: string;
    cover?: string;
}

interface LibraryHubProps {
    localEbooks: Ebook[];
    cloudEbooks: any[];
    onOpenReader: (book: Ebook) => void;
}

// STORAGE KEYS
const FAVORITES_KEY = 'bunker_favorites';
const READING_PROGRESS_KEY = 'bunker_reading_progress';

// Utility to clean filenames
const cleanTitle = (rawTitle: string) => {
    return rawTitle
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\.pdf$/i, '')
        .replace(/\.epub$/i, '')
        .replace(/\.mobi$/i, '')
        .replace(/^\+/, '') // Remove leading +
        .replace(/^@[\w]+\s?/, '') // Remove Telegram channel usernames at start
        .replace(/\[.*?\]/g, '') // Remove [brackets] content
        .replace(/\(.*\)/g, '') // Remove (parentheses) content
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
};

// Utility to clean filenames and normalize for deduplication
const normalizeTitle = (rawTitle: string) => {
    return rawTitle
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\.pdf$/i, '')
        .replace(/\.epub$/i, '')
        .replace(/\.mobi$/i, '')
        .replace(/^\+/, '')
        .replace(/^@[\w]+\s?/, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// Get unique ID for a book
const getBookId = (book: Ebook | Audiobook): string => {
    if ('file_path' in book) {
        return `book_${book.file_path}`;
    }
    return `audio_${(book as Audiobook).id || book.title}`;
};

export const LibraryHub: React.FC<LibraryHubProps> = ({ localEbooks, cloudEbooks, onOpenReader }) => {
    const router = useRouter();
    const [section, setSection] = useState<'study' | 'audiobook' | 'leisure' | 'favorites'>('study');
    const [search, setSearch] = useState('');
    const [selectedBook, setSelectedBook] = useState<Ebook | null>(null);

    // FAVORITES SYSTEM
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    // READING PROGRESS SYSTEM
    const [readingProgress, setReadingProgress] = useState<Record<string, { page?: number; location?: string; lastRead: string; progress: number }>>({});

    // AUDIOBOOKS FROM TELEGRAM
    const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
    const [isLoadingAudiobooks, setIsLoadingAudiobooks] = useState(false);

    // Load favorites from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(FAVORITES_KEY);
            if (saved) {
                setFavorites(new Set(JSON.parse(saved)));
            }
        } catch (e) {
            console.error('Error loading favorites:', e);
        }
    }, []);

    // Load reading progress from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(READING_PROGRESS_KEY);
            if (saved) {
                setReadingProgress(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading reading progress:', e);
        }
    }, []);

    // Fetch audiobooks from Telegram
    useEffect(() => {
        const fetchAudiobooks = async () => {
            setIsLoadingAudiobooks(true);
            try {
                const response = await fetch(`${API_URL}/api/telegram/library/audiobooks-index`);
                if (!response.ok) throw new Error("Backend offline");
                const data = await response.json();
                if (data.success && data.audiobooks) {
                    setAudiobooks(data.audiobooks);
                    console.log(`🎧 Loaded ${data.audiobooks.length} audiobooks from Telegram`);
                }
            } catch (e) {
                console.warn('Backend offline, using mock audiobooks');
                setAudiobooks([
                    { id: '1', title: 'Hábitos Atômicos - James Clear', size_mb: 150 },
                    { id: '2', title: 'O Monge e o Executivo', size_mb: 85 },
                    { id: '3', title: 'A Única Coisa - Gary Keller', size_mb: 120 }
                ]);
            } finally {
                setIsLoadingAudiobooks(false);
            }
        };

        fetchAudiobooks();
    }, []);

    // Save favorites to localStorage
    const saveFavorites = (newFavorites: Set<string>) => {
        setFavorites(newFavorites);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(newFavorites)));
    };

    // Toggle favorite
    const toggleFavorite = (bookId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFavorites = new Set(favorites);
        if (newFavorites.has(bookId)) {
            newFavorites.delete(bookId);
        } else {
            newFavorites.add(bookId);
        }
        saveFavorites(newFavorites);
    };

    // Get reading progress for a book
    const getProgress = (bookId: string) => {
        return readingProgress[bookId];
    };

    // Open book with resume
    const openBookWithResume = (book: Ebook) => {
        const bookId = getBookId(book);
        const progress = readingProgress[bookId];

        // Update last read
        const updatedProgress = {
            ...readingProgress,
            [bookId]: {
                ...progress,
                lastRead: new Date().toISOString()
            }
        };
        setReadingProgress(updatedProgress);
        localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(updatedProgress));

        // Navigate to ebook reader with resume info
        const params = new URLSearchParams({
            path: book.file_path,
            title: book.title,
            ...(progress?.location ? { resumeLocation: progress.location } : {}),
            ...(progress?.page ? { resumePage: String(progress.page) } : {})
        });

        router.push(`/estudos/ebook?${params.toString()}`);
    };

    // Open audiobook for streaming
    const openAudiobook = (audiobook: Audiobook) => {
        if (audiobook.channel_id && audiobook.message_id) {
            window.open(`${API_URL}/api/telegram/library/stream-audio/${audiobook.channel_id}/${audiobook.message_id}`, '_blank');
        }
    };

    // Refresh audiobooks index
    const refreshAudiobooks = async () => {
        setIsLoadingAudiobooks(true);
        try {
            const response = await fetch(`${API_URL}/api/telegram/library/index-audiobooks`, { method: 'POST' });
            if (!response.ok) throw new Error("Backend offline");
            const data = await response.json();
            if (data.success) {
                console.log(`✅ Indexed ${data.indexed} audiobooks`);
                // Refetch
                const indexResponse = await fetch(`${API_URL}/api/telegram/library/audiobooks-index`);
                const indexData = await indexResponse.json();
                if (indexData.success) {
                    setAudiobooks(indexData.audiobooks);
                }
            }
        } catch (e) {
            console.warn('Backend offline, simulated audiobook refresh');
            setTimeout(() => {
                setAudiobooks([
                    { id: '1', title: 'Hábitos Atômicos - James Clear', size_mb: 150 },
                    { id: '2', title: 'O Monge e o Executivo', size_mb: 85 },
                    { id: '3', title: 'A Única Coisa - Gary Keller', size_mb: 120 },
                    { id: '4', title: 'Essencialismo - Greg Mckeown', size_mb: 110 }
                ]);
            }, 1000);
        } finally {
            setIsLoadingAudiobooks(false);
        }
    };

    // 🔍 Advanced Deduplication & Quality Filtering
    const processBooks = (books: any[]) => {
        const seen = new Map<string, Ebook>();

        // Sort: Best metadata and covers first so they win the dedup battle
        const prioritySorted = [...books].sort((a, b) => {
            const scoreA = (a.elite_metadata?.thumbnail_remote ? 10 : 0) + (a.hot_score || 0);
            const scoreB = (b.elite_metadata?.thumbnail_remote ? 10 : 0) + (b.hot_score || 0);
            return scoreB - scoreA;
        });

        const whitelistKeywords = [
            'vendas em tempos de crise',
            'trabalhe 4h por semana',
            'inteligencia emocional em vendas',
            'alcançando excelência em vendas',
            'alcançando excelencia em vendas',
            'chet holmes',
            'napoleon hill',
            'pai rico',
            'robert kiyosaki',
            'mais esperto que o diabo',
            'segredos da mente milionária',
            'habitos atomicos',
            'desperte o seu gigante interior',
            'como fazer amigos'
        ];

        prioritySorted.forEach(book => {
            const titleRaw = (book.title || '').toLowerCase();
            const titleClean = normalizeTitle(book.title).toLowerCase();

            // 💡 Whitelist Check First
            const isWhitelisted = whitelistKeywords.some(k => titleRaw.includes(k) || titleClean.includes(k));

            // 🚫 GLOBAL NUCLEAR BLOCKER (Modules, Courses, Sales Fluff)
            if (!isWhitelisted) {
                const isCourseJunk = /m.dulo|aula|fase|semana|chapter|cap.tulo|part|parte|bloco/i.test(titleRaw);
                const isMarketingTrash = /comoga|carta de vendas|alavancar suas vendas|faturad|lucrativ|milion.r|f.cil|r\$\s?\d+|\+\d+k/i.test(titleRaw);

                if ((isCourseJunk || isMarketingTrash)) return;

                // 💡 TELEGRAM PREMIUM SOURCE STRICTNESS
                const isFromPremiumChannel = book.file_path && book.file_path.includes('-1001677408401');
                if (isFromPremiumChannel) return;
            }

            // 🗑️ Generic Trash
            const trashKeywords = ['chelle rose', 'jessica ames', 'romance', 'dark romance', 'mafia', 'kage', 'reaper', 'psycho'];
            if (trashKeywords.some(k => titleClean.includes(k))) return;

            if (!seen.has(titleClean)) {
                seen.set(titleClean, book);
            }
        });

        return Array.from(seen.values());
    };

    const allBooks = [...localEbooks, ...cloudEbooks];
    const uniqueBooks = processBooks(allBooks);

    // SORT WITH FAVORITES ON TOP
    const sortedBooks = useMemo(() => {
        const sorted = [...uniqueBooks].sort((a, b) => {
            const aId = getBookId(a);
            const bId = getBookId(b);
            const aIsFav = favorites.has(aId);
            const bIsFav = favorites.has(bId);

            // Favorites first
            if (aIsFav && !bIsFav) return -1;
            if (!aIsFav && bIsFav) return 1;

            // Then by hot_score
            return (b.hot_score || 0) - (a.hot_score || 0);
        });
        return sorted;
    }, [uniqueBooks, favorites]);

    // Filter books
    const filtered = sortedBooks.filter(b => {
        const titleLower = b.title.toLowerCase();
        const matchesSearch = titleLower.includes(search.toLowerCase());
        const isComic = b.is_comic || b.file_type === 'cbr' || b.file_type === 'cbz';
        const isAudio = b.file_type === 'audiobook' || b.category === 'Audiobook' || b.file_type === 'mp3';

        if (section === 'favorites') {
            const bookId = getBookId(b);
            return favorites.has(bookId) && matchesSearch;
        }
        if (section === 'study') return matchesSearch && !isComic && !isAudio;
        if (section === 'audiobook') return matchesSearch && isAudio;
        return matchesSearch && isComic;
    });

    // Filter audiobooks
    const filteredAudiobooks = audiobooks.filter(a => {
        return a.title.toLowerCase().includes(search.toLowerCase());
    });

    // Recently Read (sort by lastRead)
    const recentlyRead = useMemo(() => {
        const withProgress = uniqueBooks.filter(b => {
            const bookId = getBookId(b);
            return readingProgress[bookId]?.progress > 0;
        });

        return withProgress.sort((a, b) => {
            const aProgress = readingProgress[getBookId(a)];
            const bProgress = readingProgress[getBookId(b)];
            return new Date(bProgress?.lastRead || 0).getTime() - new Date(aProgress?.lastRead || 0).getTime();
        }).slice(0, 6);
    }, [uniqueBooks, readingProgress]);

    // Get favorites count
    const favoritesCount = favorites.size;

    return (
        <div className="w-full pb-20">
            {/* Book Reader Modal */}
            {selectedBook && (
                <BookReader
                    book={selectedBook}
                    onClose={() => setSelectedBook(null)}
                />
            )}

            {/* Library Header */}
            <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-600/30 flex-shrink-0">
                        <BookOpen size={24} className="text-white sm:w-8 sm:h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter mb-1 md:mb-2 italic uppercase">Bunker Library</h2>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            <p className="text-white/40 font-bold text-[9px] sm:text-[10px] md:text-sm tracking-widest uppercase">{uniqueBooks.length} Títulos de Elite Indexados</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        placeholder="Buscar títulos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-[#111114] border border-white/5 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Section Toggle */}
            <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 bg-[#111114] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/5 shadow-inner overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                <button
                    onClick={() => setSection('study')}
                    className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black tracking-wider sm:tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${section === 'study' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                    <Zap size={16} /> ESTUDO
                </button>
                <button
                    onClick={() => setSection('audiobook')}
                    className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black tracking-wider sm:tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${section === 'audiobook' ? 'bg-orange-600 text-white shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                    <Headphones size={16} /> AUDIOBOOKS
                    {audiobooks.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{audiobooks.length}</span>}
                </button>
                <button
                    onClick={() => setSection('leisure')}
                    className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black tracking-wider sm:tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${section === 'leisure' ? 'bg-pink-600 text-white shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                    <Coffee size={16} /> LAZER & HQs
                </button>
                <button
                    onClick={() => setSection('favorites')}
                    className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black tracking-wider sm:tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${section === 'favorites' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                >
                    <Star size={16} fill={section === 'favorites' ? 'currentColor' : 'none'} /> FAVORITOS
                    {favoritesCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-black/20 rounded text-[10px]">{favoritesCount}</span>}
                </button>
            </div>

            {/* Recently Read Section */}
            {section === 'study' && recentlyRead.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock size={20} className="text-purple-400" />
                        <h3 className="text-white font-black text-lg tracking-tight uppercase">Continuar Lendo</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {recentlyRead.map((book, i) => {
                            const title = normalizeTitle(book.title);
                            const bookId = getBookId(book);
                            const progress = readingProgress[bookId];
                            const hasCover = book.elite_metadata?.thumbnail_remote && !book.elite_metadata.thumbnail_remote.includes('unsplash');

                            return (
                                <motion.div
                                    key={`recent-${bookId}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex-shrink-0 w-48 cursor-pointer group"
                                    onClick={() => openBookWithResume(book)}
                                >
                                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#0a0a0c] border border-white/5 group-hover:border-purple-500/50 transition-all shadow-xl">
                                        {hasCover ? (
                                            <img src={book.elite_metadata.thumbnail_remote} alt={title} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-black">
                                                <BookOpen size={32} className="text-purple-400/50" />
                                            </div>
                                        )}

                                        {/* Progress Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                                                style={{ width: `${progress?.progress || 0}%` }}
                                            />
                                        </div>

                                        {/* Resume Badge */}
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[10px] text-purple-400 font-bold">
                                            {progress?.progress || 0}%
                                        </div>
                                    </div>
                                    <p className="mt-3 text-white/80 text-xs font-bold line-clamp-2 group-hover:text-purple-400 transition-colors">{title}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Audiobooks Section */}
            {section === 'audiobook' && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <AudioLines size={20} className="text-orange-400" />
                            <h3 className="text-white font-black text-lg tracking-tight uppercase">Audiobooks do Telegram</h3>
                        </div>
                        <button
                            onClick={refreshAudiobooks}
                            disabled={isLoadingAudiobooks}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isLoadingAudiobooks ? 'animate-spin' : ''} />
                            {isLoadingAudiobooks ? 'Indexando...' : 'Atualizar Índice'}
                        </button>
                    </div>

                    {filteredAudiobooks.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-4 md:gap-6">
                            <AnimatePresence mode='popLayout'>
                                {filteredAudiobooks.map((audiobook, i) => (
                                    <motion.div
                                        key={audiobook.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: i * 0.03 }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        className="group relative cursor-pointer"
                                        onClick={() => openAudiobook(audiobook)}
                                    >
                                        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-orange-900/40 to-black border border-white/5 group-hover:border-orange-500/30 shadow-2xl transition-all flex items-center justify-center">
                                            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-all">
                                                    <Headphones size={32} className="text-orange-400" />
                                                </div>
                                                <p className="text-[10px] text-white font-bold uppercase tracking-wider line-clamp-3 leading-relaxed">
                                                    {cleanTitle(audiobook.title)}
                                                </p>
                                            </div>

                                            {/* Play overlay on hover */}
                                            <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transform scale-75 group-hover:scale-100 transition-all">
                                                    <div className="w-0 h-0 border-l-[14px] border-l-white border-y-[10px] border-y-transparent ml-1" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 px-1">
                                            <h3 className="text-white/80 font-bold text-xs leading-none line-clamp-2 group-hover:text-orange-400 transition-colors">{cleanTitle(audiobook.title)}</h3>
                                            {audiobook.size_mb && (
                                                <p className="text-white/20 text-[10px] mt-1 font-medium">{audiobook.size_mb} MB</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-white/10 border-2 border-dashed border-white/5 rounded-3xl bg-[#0a0a0c]">
                            <Headphones size={48} className="mb-4 opacity-50" />
                            <p className="text-sm font-bold uppercase tracking-wider">Nenhum audiobook indexado</p>
                            <p className="text-xs mt-2 text-white/30">Clique em "Atualizar Índice" para escanear o Telegram</p>
                        </div>
                    )}
                </div>
            )}

            {/* Content Grid (Books) */}
            {section !== 'audiobook' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-4 md:gap-6 lg:gap-8">
                    <AnimatePresence mode='popLayout'>
                        {filtered.map((book, i) => {
                            const title = normalizeTitle(book.title);
                            const bookId = getBookId(book);
                            const isFavorite = favorites.has(bookId);
                            const progress = readingProgress[bookId];
                            const hasCover = book.elite_metadata?.thumbnail_remote && !book.elite_metadata.thumbnail_remote.includes('unsplash');
                            const isBestSeller = book.hot_score >= 90 || title.toLowerCase().includes('pai rico') || title.toLowerCase().includes('napoleon');

                            return (
                                <motion.div
                                    key={`${book.title}-${i}`}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.03 }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="group relative"
                                    onClick={() => openBookWithResume(book)}
                                >
                                    {/* Card Container */}
                                    <div className={`aspect-[3/4.5] rounded-2xl overflow-hidden bg-[#0a0a0c] border border-white/5 shadow-2xl transition-all relative cursor-pointer group-hover:border-purple-500/30 group-hover:shadow-purple-500/5 ${!hasCover ? 'flex flex-col items-center justify-center p-6 text-center' : ''}`}>
                                        {hasCover ? (
                                            <img
                                                src={book.elite_metadata.thumbnail_remote}
                                                alt={title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                                onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1543003923-4416bc0adfc3?w=800')}
                                            />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-black" />
                                                <div className="z-10 flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all">
                                                        <BookOpen size={24} className="text-purple-400" />
                                                    </div>
                                                    <p className="text-[10px] text-white font-black uppercase tracking-[0.2em] leading-relaxed line-clamp-4 px-2 italic">
                                                        {title}
                                                    </p>
                                                </div>
                                                <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/30 group-hover:bg-purple-500 transition-all" />
                                            </>
                                        )}

                                        {/* Favorite Star Button */}
                                        <button
                                            onClick={(e) => toggleFavorite(bookId, e)}
                                            className={`absolute top-3 left-3 z-30 p-2 rounded-xl transition-all transform hover:scale-110 ${isFavorite
                                                ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                                                : 'bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100'
                                                }`}
                                        >
                                            <Star
                                                size={14}
                                                className={isFavorite ? 'text-black' : 'text-white/60'}
                                                fill={isFavorite ? 'currentColor' : 'none'}
                                            />
                                        </button>

                                        {/* Progress Bar (if reading) */}
                                        {progress && progress.progress > 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                                    style={{ width: `${progress.progress}%` }}
                                                />
                                            </div>
                                        )}

                                        {/* Glass Overlay (Revealed on hover) */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                <button className="w-full py-3 bg-white text-black font-black text-[10px] tracking-widest uppercase rounded-xl shadow-xl active:scale-95 transition-all">
                                                    {progress && progress.progress > 0 ? 'Continuar' : 'Ler Agora'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Elite Badges */}
                                        {(book.hot_score > 95 || isBestSeller) && (
                                            <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
                                                <div className="bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded shadow-xl flex items-center gap-1">
                                                    <TrendingUp size={8} /> BEST SELLER
                                                </div>
                                                {book.hot_score > 98 && (
                                                    <div className="bg-purple-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-xl uppercase tracking-tighter">
                                                        Elite Class
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 px-1">
                                        <div className="flex items-start gap-2">
                                            {isFavorite && (
                                                <Star size={12} className="text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" />
                                            )}
                                            <h3 className="text-white/90 font-bold text-xs leading-none line-clamp-1 group-hover:text-purple-400 transition-colors tracking-tight flex-1" title={title}>
                                                {title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">
                                                {book.file_type || 'PDF'}
                                            </span>
                                            {book.hot_area && (
                                                <span className="text-purple-500/40 text-[9px] font-bold capitalize truncate max-w-[80px]">
                                                    {book.hot_area}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {filtered.length === 0 && section !== 'audiobook' && (
                <div className="h-96 flex flex-col items-center justify-center text-white/5 border-2 border-dashed border-white/5 rounded-[40px] bg-[#0a0a0c] group hover:bg-[#0f0f12] transition-all">
                    <div className="p-8 bg-white/5 rounded-full mb-6 group-hover:scale-110 transition-transform">
                        {section === 'favorites' ? <Star size={64} className="opacity-20" /> : <Search size={64} className="opacity-20" />}
                    </div>
                    <p className="text-xl font-bold tracking-tighter italic uppercase">
                        {section === 'favorites' ? 'Nenhum favorito ainda' : 'Nenhum tesouro encontrado'}
                    </p>
                    <p className="text-xs mt-4 tracking-widest font-medium opacity-30">
                        {section === 'favorites' ? 'CLIQUE NA ⭐ PARA ADICIONAR FAVORITOS' : 'TENTE OUTRO TERMO OU RE-SCANEIE O SISTEMA'}
                    </p>
                </div>
            )}
        </div>
    );
};

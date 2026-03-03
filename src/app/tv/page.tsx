'use client';
import { PageNav } from '@/components/layout/PageNav';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Hls from 'hls.js';
import {
    Tv, Film, Search, RefreshCw,
    Eye, EyeOff, Zap, LayoutGrid, ChevronRight,
    Play, ShieldCheck, Server, User, Lock,
    ArrowLeft, LogIn, LogOut, Home,
    Maximize2, SkipBack, SkipForward, Minimize2, MoveDiagonal, Radio, History, Settings, Check,
    Filter, ChevronDown, Activity, X
} from 'lucide-react';
import Link from 'next/link';

// --- TYPES ---
interface Channel {
    id?: string | number;
    num: string | number;
    name: string;
    stream_id: string | number;
    stream_icon?: string;
    category_id?: string;
    direct_url?: string;
    cover?: string;
    series_id?: string | number;
    groupName?: string;
    variants?: any[];
    plot?: string;
    cast?: string;
    director?: string;
}

interface Episode {
    id: string;
    episode_num: string | number;
    title: string;
    container_extension: string;
    info: any;
}

interface Season {
    [key: string]: Episode[];
}

interface ChannelGroup {
    name: string;
    variants: (Channel & { qualityLabel: string })[];
}

interface Category {
    category_id: string;
    category_name: string;
}

// --- WALLPAPERS ---
const WALLPAPERS = [
    "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    "https://image.tmdb.org/t/p/original/rULWuutDCN5PvxsVnzGTAbCqydo.jpg",
    "https://image.tmdb.org/t/p/original/xOMB0OA3kbP4G9L0Z07v0TqGB4D.jpg",
    "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg"
];

// --- UTILS ---
const getInitials = (name: string) => {
    if (!name) return 'TV';
    return name
        .replace(/[0-9]/g, '') // Remove números para pegar letras
        .split(/[\s-]/) // Divide por espaço ou traço
        .filter(w => w.length > 0)
        .map(w => w[0])
        .join('')
        .substring(0, 3)
        .toUpperCase();
};

const getChannelGradient = (name: string) => {
    const gradients = [
        'from-emerald-600 to-teal-800',
        'from-blue-600 to-indigo-800',
        'from-purple-600 to-fuchsia-800',
        'from-rose-600 to-pink-800',
        'from-amber-600 to-orange-800',
        'from-cyan-600 to-blue-800',
    ];
    // Hash simples para escolher sempre a mesma cor para o mesmo canal
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
};

const ChannelThumb = ({ item, className = "w-full h-full object-cover" }: { item: any, className?: string }) => {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setError(false);
        setLoaded(false);
    }, [item.stream_icon]);

    if (error || !item.stream_icon) {
        return (
            <div className={`w-full h-full bg-gradient-to-br ${getChannelGradient(item.name || '')} flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-700`}>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <span className="text-3xl font-black text-white/90 tracking-tighter drop-shadow-lg scale-100 group-hover:scale-110 transition-transform duration-500">
                    {getInitials(item.name || 'TV')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-[#1a1a20]">
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a20]">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            )}
            <img
                src={getProxiedImage(item.stream_icon)}
                className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                alt={item.name}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
            />
        </div>
    );
};
const getProxiedImage = (url: string) => {
    if (!url) return '';
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&default=https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/master/icons/television.svg`;
};

// --- COMPONENTS ---


function TVPageContent() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const freezeTimer = useRef<NodeJS.Timeout | null>(null);
    const cache = useRef<Record<string, { channels: Channel[], categories: Category[] }>>({});
    const searchParams = useSearchParams();
    const router = useRouter();

    const [viewMode, setViewMode] = useState<'dashboard' | 'grid'>('dashboard');
    const [activeSection, setActiveSection] = useState<'live' | 'movies' | 'series' | 'free'>('live');
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const [channels, setChannels] = useState<Channel[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [url, setUrl] = useState('');
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [activeQuality, setActiveQuality] = useState<string>('');

    const [selectedSeries, setSelectedSeries] = useState<Channel | null>(null);
    const [seasons, setSeasons] = useState<Season>({});
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);

    const [creds, setCreds] = useState({ host: 'http://2025easy.lat', user: 'Pauloroberto1', pass: '984223935' });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);

    const [isShieldActive, setIsShieldActive] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [lastTimePos, setLastTimePos] = useState(0);
    const [freezeCount, setFreezeCount] = useState(0);

    const [isFullscreen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // --- STATE & UTILS (Moved to top to avoid hoisting issues) ---
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const h = localStorage.getItem('bunker_iptv_history');
        if (h) setHistory(JSON.parse(h));
    }, []);

    const isAdultContent = (name: string, category: string = '') => {
        const forbidden = ['adult', 'xxx', 'porn', 'sex', 'erotic', '18+', 'adulto', 'hot'];
        const target = (name + ' ' + category).toLowerCase();
        return forbidden.some(w => target.includes(w));
    };

    // --- RESUME LOGIC ---
    useEffect(() => {
        const resumeId = searchParams.get('resume');
        if (resumeId && isLoggedIn && history.length > 0) {
            console.log("🚀 Tentando retomar item ID:", resumeId);
            const item = history.find(h => String(h.id) === String(resumeId));
            if (item) {
                resumeFromHistory(item);
                // Limpa o param
                const params = new URLSearchParams(searchParams.toString());
                params.delete('resume');
                router.replace(`/tv?${params.toString()}`);
            }
        }
    }, [isLoggedIn, history, searchParams]);
    // ------------------------------------------------------------

    // --- LOGIN CAROUSEL & DASHBOARD LOGIC ---
    useEffect(() => { const i = setInterval(() => setBgIndex(p => (p + 1) % WALLPAPERS.length), 8000); return () => clearInterval(i); }, []);
    useEffect(() => { const s = localStorage.getItem('bunker_iptv_creds'); if (s) setCreds(JSON.parse(s)); }, []);

    // --- AUTO-REFRESH WATCHDOG FIX ---
    useEffect(() => {
        // Limpa timer anterior ao mudar URL
        if (freezeTimer.current) clearInterval(freezeTimer.current);

        if (url) {
            let lastTime = 0;
            let stuckCycles = 0;

            console.log("🛡️ Watchdog Ativo para:", url);

            freezeTimer.current = setInterval(() => {
                const video = videoRef.current;

                // Só monitora se o vídeo deveria estar tocando (não pausado, não finalizado)
                if (!video || video.paused || video.ended || video.readyState < 2) {
                    stuckCycles = 0; // Reset se pausado ou carregando
                    return;
                }

                const currentTime = video.currentTime;

                // Se o tempo não mudou significativamente (menos de 0.1s em 1s)
                if (Math.abs(currentTime - lastTime) < 0.1) {
                    stuckCycles++;
                    console.warn(`❄️ Congelamento detectado: ${stuckCycles}/3`);
                } else {
                    stuckCycles = 0; // Reset, vídeo fluiu
                }

                lastTime = currentTime;

                // GATILHO: 3 ciclos (3 segundos) travado
                if (stuckCycles >= 3 && isShieldActive) {
                    console.log("🛡️ SHIELD TRIGGERED: Reiniciando stream...");
                    stuckCycles = 0; // Reset para evitar loops loucos imediatos
                    reloadStream();
                }
            }, 1000); // Verifica a cada segundo
        }

        return () => { if (freezeTimer.current) clearInterval(freezeTimer.current); };
    }, [url, isShieldActive]); // eslint-disable-line react-hooks/exhaustive-deps


    useEffect(() => {
        if (!url || !videoRef.current) return;
        const video = videoRef.current;
        const isHls = url.includes('.m3u8') || activeSection === 'live' || activeSection === 'free';
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        const start = async () => {
            try {
                if (isHls && Hls.isSupported()) {
                    const hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: false,
                        backBufferLength: 90,
                        maxBufferLength: 60,
                        maxMaxBufferLength: 120,
                        liveSyncDurationCount: 3,
                        liveMaxLatencyDurationCount: 10,
                        enableSoftwareAES: true
                    });

                    hls.loadSource(url);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        if (lastTimePos > 0 && activeSection !== 'live') {
                            video.currentTime = lastTimePos;
                            setLastTimePos(0);
                        }
                        video.play().catch(() => { });
                    });

                    hls.on(Hls.Events.ERROR, (_, data) => {
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                                case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                                default: hls.destroy(); break;
                            }
                        }
                    });
                    hlsRef.current = hls;
                } else {
                    video.src = url;
                    video.load();

                    // CORREÇÃO CRÍTICA: Aguardar metadados antes de buscar posição (Seek)
                    const onLoaded = () => {
                        if (lastTimePos > 0 && activeSection !== 'live') {
                            console.log("🎯 Resuming to:", lastTimePos);
                            video.currentTime = lastTimePos;
                            setLastTimePos(0);
                        }
                        video.play().catch(() => { });
                        video.removeEventListener('loadedmetadata', onLoaded);
                    };

                    video.addEventListener('loadedmetadata', onLoaded);
                }
            } catch (e) { console.error(e); }
        };
        start();
        return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
    }, [url]);

    const normalizeData = (data: any[]) => {
        if (!Array.isArray(data)) return [];
        return data.map(item => ({
            ...item,
            stream_icon: item.cover || item.stream_icon || item.logo || '',
            name: item.name || item.title || 'Sem Título',
            stream_id: item.stream_id || item.series_id || item.url
        }));
    };

    const reloadStream = () => {
        if (!url) return;
        const v = videoRef.current;
        const t = v ? v.currentTime : 0;
        if (activeSection !== 'live') setLastTimePos(t);
        const cur = url;
        setUrl('');
        setTimeout(() => { setUrl(cur); setFreezeCount(p => p + 1); }, 100);
    };

    const handleLogin = async () => {
        if (!creds.host || !creds.user || !creds.pass) return;
        setIsLoading(true);
        try {
            const baseUrl = creds.host.endsWith('/') ? creds.host.slice(0, -1) : creds.host;
            const loginUrl = `${baseUrl}/player_api.php?username=${creds.user}&password=${creds.pass}`;
            const res = await fetch(`/api/iptv/proxy?url=${encodeURIComponent(loginUrl)}`);
            const data = await res.json();
            if (data.user_info?.auth === 1) {
                setIsLoggedIn(true);
                localStorage.setItem('bunker_iptv_creds', JSON.stringify(creds));
                setViewMode('dashboard');
            } else { alert('Erro de Login'); }
        } catch { alert('Erro de Conexão'); } finally { setIsLoading(false); }
    };

    const loadSectionContent = async (section: 'live' | 'movies' | 'series' | 'free') => {
        setActiveSection(section);
        setViewMode('grid');
        setChannels([]);
        setCategories([]);
        setSelectedCategory('all');
        setSearchQuery('');
        setSelectedSeries(null);
        setIsLoading(true);

        try {
            if (section === 'free') {
                const [cRes, catRes] = await Promise.all([fetch('/api/iptv/free/channels'), fetch('/api/iptv/free/categories')]);
                const cData = await cRes.json();
                const catData = await catRes.json();
                if (Array.isArray(catData)) catData.unshift({ category_id: 'VIRTUAL_ESPN', category_name: 'ESPN' });
                setChannels(normalizeData(cData));
                setCategories(catData);
            } else {
                if (cache.current[section]) {
                    setChannels(cache.current[section].channels);
                    setCategories(cache.current[section].categories);
                    setIsLoading(false);
                    return;
                }
                const baseUrl = creds.host.endsWith('/') ? creds.host.slice(0, -1) : creds.host;
                const map = { live: { s: 'get_live_streams', c: 'get_live_categories' }, movies: { s: 'get_vod_streams', c: 'get_vod_categories' }, series: { s: 'get_series', c: 'get_series_categories' } };
                const act = map[section];
                const [sRes, cRes] = await Promise.all([
                    fetch(`/api/iptv/proxy?url=${encodeURIComponent(`${baseUrl}/player_api.php?username=${creds.user}&password=${creds.pass}&action=${act.s}`)}`),
                    fetch(`/api/iptv/proxy?url=${encodeURIComponent(`${baseUrl}/player_api.php?username=${creds.user}&password=${creds.pass}&action=${act.c}`)}`)
                ]);
                const sData = await sRes.json();
                const cData = await cRes.json();

                if (Array.isArray(cData)) {
                    cData.sort((a: Category, b: Category) => {
                        const score = (name: string) => {
                            const n = name.toLowerCase();
                            if (n.includes('espn')) return 1000;
                            if (n.includes('sport') || n.includes('futebol') || n.includes('premiere') || n.includes('combate')) return 500;
                            if (n.includes('cine') || n.includes('filme') || n.includes('hbo') || n.includes('telecine')) return 400;
                            if (n.includes('serie')) return 300;
                            return 0;
                        };
                        const scoreA = score(a.category_name);
                        const scoreB = score(b.category_name);
                        if (scoreA !== scoreB) return scoreB - scoreA;
                        return a.category_name.localeCompare(b.category_name);
                    });
                    cData.unshift({ category_id: 'VIRTUAL_ESPN', category_name: 'ESPN' });
                }
                const normalized = normalizeData(sData);
                if (Array.isArray(sData)) setChannels(normalized);
                if (Array.isArray(cData)) setCategories(cData);
                cache.current[section] = { channels: normalized, categories: Array.isArray(cData) ? cData : [] };
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const loadSeriesInfo = async (series: Channel) => {
        setSelectedSeries(series);
        setSelectedCategory('1');
        setLoadingEpisodes(true);
        setSeasons({});
        try {
            const baseUrl = creds.host.endsWith('/') ? creds.host.slice(0, -1) : creds.host;
            const infoUrl = `${baseUrl}/player_api.php?username=${creds.user}&password=${creds.pass}&action=get_series_info&series_id=${series.stream_id}`;
            const res = await fetch(`/api/iptv/proxy?url=${encodeURIComponent(infoUrl)}`);
            const data = await res.json();
            if (data.episodes) setSeasons(data.episodes);
        } catch (e) { console.error(e); }
        finally { setLoadingEpisodes(false); }
    };

    const addToHistory = (item: any, time: number, isSeries: boolean = false) => {
        if (!item || time < 10) return;
        if (isAdultContent(item.name, item.category_name)) return;

        // Determina o tipo
        let type = 'live';
        if (isSeries) type = 'series';
        else if (item.container_extension) type = 'movie';

        setHistory(prev => {
            const newEntry = {
                id: item.stream_id || item.id,
                name: item.name || item.title,
                icon: item.stream_icon || item.cover,
                time,
                total_duration: videoRef.current?.duration || 0,
                type,
                extension: item.container_extension || 'mp4',
                timestamp: Date.now(),
                fullData: item
            };

            // Backend Sync
            if (time > 30) {
                fetch("/api/leisure/update_progress", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        item_id: String(newEntry.id),
                        last_timestamp: time,
                        total_duration: videoRef.current?.duration || 0
                    })
                }).catch(() => { });
            }

            const filtered = prev.filter(p => p.id !== newEntry.id);
            const updated = [newEntry, ...filtered].slice(0, 10);
            localStorage.setItem('bunker_iptv_history', JSON.stringify(updated));
            return updated;
        });
    };

    // Salva progresso a cada 10s se estiver tocando
    useEffect(() => {
        if (!url || !videoRef.current) return;
        const interval = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused) {
                if (activeChannel) addToHistory(activeChannel, videoRef.current.currentTime, activeSection === 'series' || !!activeChannel.series_id);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [url, activeChannel, activeSection]);

    // Resume logic (ao clicar no histórico)
    const resumeFromHistory = async (hItem: any) => {
        console.log("🎬 Retomando:", hItem.name, "do ponto:", hItem.time, "tipo:", hItem.type);

        // Se for Live, apenas toca (não tem ponto para retomar)
        if (hItem.type === 'live') {
            setActiveSection('live');
            // Aguarda estado propagar
            await new Promise(r => setTimeout(r, 150));
            playStream(hItem.fullData || {
                stream_id: hItem.id,
                name: hItem.name,
                stream_icon: hItem.icon
            }, false, undefined, 0); // Live sempre começa do início
            return;
        }

        if (hItem.type === 'series') {
            if (hItem.fullData && (hItem.fullData.series_id || hItem.fullData.id)) {
                setActiveSection('series');
                playStream(hItem.fullData, true, undefined, hItem.time, 'series');
            } else {
                alert("Dados insuficientes para retomar. Navegue manualmente para a série.");
            }
            return;
        }

        // Filme
        if (hItem.type === 'movie') {
            setActiveSection('movies');
            playStream(hItem.fullData || {
                stream_id: hItem.id,
                name: hItem.name,
                stream_icon: hItem.icon,
                container_extension: hItem.extension || 'mp4'
            }, false, undefined, hItem.time, 'movies');
            return;
        }

        // Fallback genérico
        console.warn("Tipo não reconhecido, tentando reprodução genérica:", hItem.type);
        playStream(hItem.fullData || hItem, false, undefined, hItem.time);
    };

    const playStream = (item: any, isEpisode = false, forceQuality?: string, startTime?: number, sectionOverride?: string) => {
        const id = isEpisode ? item.id : item.stream_id;
        const currentSection = sectionOverride || activeSection;

        // Lógica de extensão
        let ext = 'mp4';
        if (isEpisode) ext = item.container_extension || 'mp4';
        else if (item.container_extension) ext = item.container_extension;
        else if (currentSection === 'live' || currentSection === 'free') ext = 'm3u8';

        // Lógica de tipo de caminho
        let typePath = 'live';
        if (currentSection === 'movies' || (item.type && item.type === 'movie')) typePath = 'movie';
        else if (currentSection === 'series' || isEpisode) typePath = 'series';

        const baseUrl = creds.host.endsWith('/') ? creds.host.slice(0, -1) : creds.host;
        let targetUrl = '';

        if (currentSection === 'free') targetUrl = item.direct_url;
        else if (isEpisode) targetUrl = `${baseUrl}/series/${creds.user}/${creds.pass}/${id}.${ext}`;
        else targetUrl = `${baseUrl}/${typePath}/${creds.user}/${creds.pass}/${id}.${ext}`;

        const proxyUrl = `/api/iptv/stream?url=${encodeURIComponent(targetUrl)}`;

        // Define tempo inicial
        if (startTime) setLastTimePos(startTime);
        else if (forceQuality && videoRef.current) setLastTimePos(videoRef.current.currentTime);
        else setLastTimePos(0);

        setUrl(proxyUrl);

        const variantsToKeep = item.variants || activeChannel?.variants || [];
        // Atualiza activeChannel com dados suficientes para o History
        const channelData = isEpisode
            ? { ...selectedSeries!, name: `${selectedSeries?.name} - ${item.title}`, variants: item.variants, series_id: selectedSeries?.stream_id, id: item.id, container_extension: ext }
            : { ...item, variants: variantsToKeep, container_extension: ext };

        setActiveChannel(channelData);

        if (item.variants?.[0]?.qualityLabel || forceQuality) {
            setActiveQuality(forceQuality || item.variants[0].qualityLabel);
        } else if (!forceQuality) {
            setActiveQuality('');
        }

        setFreezeCount(0);
        setShowQualityMenu(false);
    };

    const getProcessedContent = useMemo(() => {
        let list = channels;
        if (selectedCategory === 'VIRTUAL_ESPN') list = list.filter(c => c.name.toLowerCase().includes('espn'));
        else if (selectedCategory !== 'all') list = list.filter(c => c.category_id === selectedCategory);
        if (searchQuery) list = list.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

        if (activeSection === 'live' || activeSection === 'free') {
            const groups: Record<string, ChannelGroup> = {};
            list.forEach(c => {
                let quality = 'SD';
                if (/\b(4K|UHD|2160p)\b/i.test(c.name)) quality = '4K';
                else if (/\b(FHD|1080p)\b/i.test(c.name)) quality = 'FHD';
                else if (/\b(HD|720p)\b/i.test(c.name)) quality = 'HD';
                else if (/\b(SD|480p)\b/i.test(c.name)) quality = 'SD';

                // Limpeza mais inteligente para não confundir canais (ex: ESPN vs ESPN 2)
                const baseName = c.name
                    .replace(/\b(4K|UHD|2160p|FHD|1080p|HD|720p|SD|480p)\b/gi, '')
                    .replace(/(\(|\[).*?(\)|\])/g, '')
                    .replace(/[²³¹⁰]/g, '')
                    .replace(/[-|]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (!groups[baseName]) groups[baseName] = { name: baseName, variants: [] };
                groups[baseName].variants.push({ ...c, qualityLabel: quality });
            });

            return Object.values(groups).map(g => {
                g.variants.sort((a, b) => {
                    const qPriority: Record<string, number> = { '4K': 4, 'FHD': 3, 'HD': 2, 'SD': 1 };
                    return (qPriority[b.qualityLabel] || 0) - (qPriority[a.qualityLabel] || 0);
                });
                return { ...g.variants[0], groupName: g.name, variants: g.variants };
            }).slice(0, 1000);
        }
        return list.slice(0, 1000);
    }, [channels, selectedCategory, searchQuery, activeSection]);

    // --- NAVEGAÇÃO UNIVERSAL: LIVE, FILMES E EPISÓDIOS ---
    const getNavigationList = (): any[] => {
        // Se estiver em série com episódios carregados, navega entre episódios
        if (activeSection === 'series' && selectedSeries && Object.keys(seasons).length > 0) {
            const currentSeason = selectedCategory === 'all' ? '1' : selectedCategory;
            return seasons[currentSeason] || [];
        }
        // Caso contrário, usa a lista processada (canais/filmes)
        return getProcessedContent;
    };

    const findCurrentIndex = (list: any[]): number => {
        if (!activeChannel || list.length === 0) return -1;

        return list.findIndex(item => {
            // Match por ID (funciona para episódios e canais)
            if (item.id && activeChannel.id && item.id === activeChannel.id) return true;
            if (item.stream_id && activeChannel.stream_id && item.stream_id === activeChannel.stream_id) return true;
            if (item.direct_url && activeChannel.direct_url && item.direct_url === activeChannel.direct_url) return true;

            // Match por variantes (para canais com múltiplas qualidades)
            if (item.variants?.some((v: any) =>
                v.stream_id === activeChannel.stream_id ||
                v.direct_url === activeChannel.direct_url
            )) return true;

            // Fallback por nome do grupo
            if (item.groupName && activeChannel.groupName === item.groupName) return true;

            return false;
        });
    };

    const handlePrevious = () => {
        const list = getNavigationList();
        if (list.length === 0) {
            console.log("⚠️ Lista de navegação vazia");
            return;
        }

        const currentIdx = findCurrentIndex(list);
        const targetIdx = currentIdx > 0 ? currentIdx - 1 : list.length - 1;

        const target = list[targetIdx];
        const isEpisode = !!(activeSection === 'series' && selectedSeries);

        console.log(`⏮️ Anterior: ${currentIdx} → ${targetIdx} | ${target.name || target.title}`);
        playStream(target, isEpisode);
    };

    const handleNext = () => {
        const list = getNavigationList();
        if (list.length === 0) {
            console.log("⚠️ Lista de navegação vazia");
            return;
        }

        const currentIdx = findCurrentIndex(list);
        const targetIdx = (currentIdx >= 0 && currentIdx < list.length - 1) ? currentIdx + 1 : 0;

        const target = list[targetIdx];
        const isEpisode = !!(activeSection === 'series' && selectedSeries);

        console.log(`⏭️ Próximo: ${currentIdx} → ${targetIdx} | ${target.name || target.title}`);
        playStream(target, isEpisode);
    };

    const toggleFullscreenMode = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(e => console.error(e));
        } else {
            document.exitFullscreen();
        }
    };

    const toggleVideoStretch = () => {
        setIsZoomed(!isZoomed);
    };

    if (isLoggedIn && url) {
        return (
            <div ref={containerRef} className="flex h-screen bg-black text-white overflow-hidden relative font-sans group/player">
                {/* HEADER OVERLAY */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/60 to-transparent flex items-start pt-6 justify-between px-8 z-[60] opacity-0 group-hover/player:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                        <button onClick={() => {
                            if (activeSection === 'series' && activeChannel?.series_id) {
                                // Se for episódio, volta para a lista daquela série
                                setUrl('');
                            } else {
                                setUrl('');
                            }
                        }} className="bg-black/40 hover:bg-emerald-500/20 border border-white/10 rounded-full p-2 backdrop-blur-md transition-all flex items-center gap-2 px-4 shadow-xl">
                            <ArrowLeft size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Fechar Player</span>
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-white drop-shadow-md">{activeChannel?.name}</h2>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-black uppercase tracking-tighter">{activeSection}</span>
                                {activeQuality && <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter border border-white/20">{activeQuality}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsShieldActive(!isShieldActive)} className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all ${isShieldActive ? 'bg-blue-600/30 border-blue-500 text-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}><ShieldCheck size={16} /> <span className="text-[10px] font-black">{isShieldActive ? 'SHIELD ON' : 'ESCUDO OFF'}</span></button>
                        {activeChannel?.variants && activeChannel.variants.length > 1 && (
                            <div className="relative">
                                <button onClick={() => setShowQualityMenu(!showQualityMenu)} className={`p-3 rounded-full backdrop-blur-md border transition-all ${showQualityMenu ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black/40 border-white/10 text-white hover:border-emerald-500/50'}`}><Settings size={18} /></button>
                                {showQualityMenu && (
                                    <div className="absolute top-full right-0 mt-3 w-48 bg-[#0a0a0f] border-2 border-emerald-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-2 animate-in slide-in-from-top-2 z-[999]">
                                        <p className="text-[10px] font-black text-gray-500 p-3 uppercase tracking-widest border-b border-white/5">Trocar Qualidade</p>
                                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 p-1">
                                            {activeChannel.variants.map((v, i) => (
                                                <button key={i} onClick={() => playStream(v, false, v.qualityLabel)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1 ${activeQuality === v.qualityLabel ? 'bg-emerald-500 text-black font-black' : 'hover:bg-white/10 text-gray-300'}`}>
                                                    <span className="text-sm">{v.qualityLabel}</span>
                                                    {activeQuality === v.qualityLabel && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
                    <video
                        ref={videoRef}
                        className={`w-full h-full transition-all duration-300 ${isZoomed ? 'object-cover scale-100' : 'object-contain'}`}
                        controls
                        autoPlay
                        onDoubleClick={toggleFullscreenMode}
                    />
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-3xl opacity-0 group-hover/player:opacity-100 transition-all duration-500 translate-y-4 group-hover/player:translate-y-0 z-[60]">
                    <div className="flex flex-col items-center gap-1 border-r border-white/10 pr-6 mr-2">
                        <span className="text-[8px] font-black text-gray-500 uppercase">Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={handlePrevious} className="text-gray-400 hover:text-emerald-400 transition-all active:scale-90" title="Voltar Canal"><SkipBack size={26} /></button>
                        <button onClick={() => reloadStream()} className={`transition-all hover:scale-110 ${freezeCount > 0 ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}><RefreshCw size={20} className={isLoading ? 'animate-spin text-emerald-500' : ''} /></button>
                        <button onClick={handleNext} className="text-gray-400 hover:text-emerald-400 transition-all active:scale-90" title="Próximo Canal"><SkipForward size={26} /></button>

                        <div className="h-6 w-px bg-white/10 mx-2" />

                        {/* BOTÃO DE ESTICAR / ZOOM (REFORMULADO) */}
                        <button
                            onClick={toggleVideoStretch}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 ${isZoomed ? 'bg-emerald-500 text-black font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            title={isZoomed ? "Tirar Zoom (Modo Original)" : "Esticar Tela (Preencher)"}
                        >
                            <MoveDiagonal size={20} className={isZoomed ? 'rotate-90' : ''} />
                            {isZoomed && <span className="text-[9px] font-black mr-1">ESTICADO</span>}
                        </button>

                        {/* BOTÃO DE TELA CHEIA */}
                        <button
                            className={`p-2 rounded-lg transition-all ${isFullscreen ? 'text-emerald-400 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            onClick={toggleFullscreenMode}
                            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                        >
                            {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }



    if (isLoggedIn) {
        return (
            <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">

                <main className="flex-1 flex flex-col relative">
                    <header className="h-16 flex items-center justify-between px-6 shrink-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <div className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer mr-2" title="Voltar ao Início">
                                    <Home size={16} />
                                </div>
                            </Link>

                            <div className="flex items-center gap-3">
                                {viewMode === 'grid' && (
                                    <button
                                        onClick={() => {
                                            if (selectedSeries) setSelectedSeries(null);
                                            else setViewMode('dashboard');
                                        }}
                                        className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center"
                                        title="Voltar"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                )}
                                <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase">
                                    {viewMode === 'dashboard' ? 'BUNKER TV' : activeSection === 'live' ? 'TV AO VIVO' : activeSection === 'movies' ? 'FILMES' : activeSection === 'series' ? 'SÉRIES' : 'CANAIS ABERTOS'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                <User size={14} className="text-emerald-500" />
                                <span className="text-xs font-bold text-gray-300">{creds.user}</span>
                            </div>
                            <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('bunker_iptv_creds'); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-emerald-500/30">
                        {viewMode === 'dashboard' ? (
                            <div className="flex-1 flex flex-col relative overflow-hidden font-sans group/dashboard">
                                {/* DYNAMIC AMBIENT BACKGROUND */}
                                <div className="absolute inset-0 z-0 select-none pointer-events-none">
                                    {/* Base Dark Layer */}
                                    <div className="absolute inset-0 bg-[#050505]" />

                                    {/* Active Category Hero Image - Transitions Smoothly */}
                                    {Object.entries({
                                        live: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=2500&auto=format&fit=crop",
                                        movies: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2500&auto=format&fit=crop",
                                        series: "https://images.unsplash.com/photo-1511875762315-c773eb98eec0?q=80&w=2500&auto=format&fit=crop",
                                        free: "https://images.unsplash.com/photo-1596727147705-54a9d0c35706?q=80&w=2500&auto=format&fit=crop"
                                    }).map(([key, url]) => (
                                        <div
                                            key={key}
                                            className={`absolute inset-0 bg-cover bg-center transition-all duration-[1200ms] ease-out ${hoveredCategory === key ? 'opacity-40 scale-105' : 'opacity-0 scale-100 blur-xl'}`}
                                            style={{ backgroundImage: `url(${url})` }}
                                        />
                                    ))}

                                    {/* Cinematic Vignette & Grain */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
                                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                </div>

                                {/* CONTENT CONTAINER */}
                                <div className="relative z-10 flex-1 flex flex-col p-8 md:p-12 overflow-y-auto scrollbar-none">

                                    {/* Header */}
                                    <header className="flex items-center justify-between mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                                        <div>
                                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                                BUNKER <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-400">TV</span>
                                            </h1>
                                            <p className="text-white/40 font-medium text-sm md:text-base tracking-wide flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                SISTEMA DE ENTRETENIMENTO OPERACIONAL
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex flex-col items-end mr-4">
                                                <span className="text-white font-bold text-sm">{creds.user}</span>
                                                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Premium Access</span>
                                            </div>
                                            <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('bunker_iptv_creds'); }} className="w-12 h-12 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 flex items-center justify-center text-white/70 hover:text-red-400 transition-all duration-300 group">
                                                <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </header>

                                    {/* CONTINUE WATCHING - Styled as "Next Up" rail */}
                                    {history.length > 0 && (
                                        <section className="mb-16 animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-1 h-6 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                                <h2 className="text-xl font-bold text-gray-200 tracking-wide">CONTINUAR ASSISTINDO</h2>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-8">
                                                {history.map((item, idx) => (
                                                    <div key={idx} onClick={() => resumeFromHistory(item)} className="group cursor-pointer relative animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                                        <div className="aspect-video relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-white/5 group-hover:border-white/20">

                                                            {/* Image */}           <div className="absolute inset-0 bg-gray-800 animate-pulse" />
                                                            <div className="w-full h-full transform transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100">
                                                                <ChannelThumb item={item} />
                                                            </div>

                                                            {/* Overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                                            {/* Play Button Overlay */}
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-50 group-hover:scale-100">
                                                                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center ring-0 group-hover:ring-4 ring-white/10 transition-all">
                                                                    <Play size={24} className="text-white fill-white ml-1" />
                                                                </div>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                                                <div
                                                                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                                                    style={{ width: `${item.total_duration ? Math.min((item.time / item.total_duration) * 100, 100) : 0}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 px-1">
                                                            <h4 className="text-white font-bold truncate text-base group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{item.name}</h4>
                                                            <p className="text-[10px] text-gray-500 font-bold mt-1 flex items-center gap-2 uppercase tracking-widest">
                                                                <History size={10} className="text-emerald-500" />
                                                                {item.total_duration ? `Faltam ${Math.round((item.total_duration - item.time) / 60)} min` : 'Continuar Assistindo'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* MAIN CATEGORIES - THE PORTALS */}
                                    <section className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-1 h-6 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                                            <h2 className="text-xl font-bold text-gray-200 tracking-wide">CANVAS DE ENTRETENIMENTO</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-96">
                                            {[
                                                { id: 'live', label: 'TV Ao Vivo', icon: Tv, count: '1000+ Canais', color: 'from-emerald-500 to-green-600', desc: 'Notícias, Esportes e Variedades em tempo real' },
                                                { id: 'movies', label: 'Cinefilia', icon: Film, count: '4K HDR', color: 'from-purple-500 to-pink-600', desc: 'Os maiores lançamentos do cinema mundial' },
                                                { id: 'series', label: 'Séries', icon: LayoutGrid, count: 'Box Sets', color: 'from-blue-500 to-indigo-600', desc: 'Maratonas completas das suas séries favoritas' },
                                                { id: 'free', label: 'Canais Abertos', icon: Radio, count: 'Sinal Aberto', color: 'from-amber-500 to-orange-600', desc: 'São Paulo, Pluto TV e Redes Locais' },
                                            ].map((cat) => (
                                                <div
                                                    key={cat.id}
                                                    onMouseEnter={() => setHoveredCategory(cat.id)}
                                                    onMouseLeave={() => setHoveredCategory(null)}
                                                    onClick={() => loadSectionContent(cat.id as any)}
                                                    className="group relative h-full rounded-3xl cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2"
                                                >
                                                    {/* Glass Background */}
                                                    <div className="absolute inset-0 bg-[#121212]/40 backdrop-blur-xl border border-white/5 group-hover:border-white/20 transition-all duration-500" />

                                                    {/* Gradient Glow on Hover */}
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                                                    {/* Content */}
                                                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                                                        <div>
                                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                                                <cat.icon size={28} className="text-white drop-shadow-md" />
                                                            </div>
                                                            <h3 className="text-3xl font-black text-white leading-tight mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                                                                {cat.label}
                                                            </h3>
                                                            <p className="text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">
                                                                {cat.desc}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center justify-between border-t border-white/5 pt-6 group-hover:border-white/20 transition-colors">
                                                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest group-hover:text-white/90 transition-colors">{cat.count}</span>
                                                            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                                                <ChevronRight size={16} className="text-white/50 group-hover:text-black transition-colors" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Shine Effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine" />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        ) : (
                            /* NETFLIX-STYLE LAYOUT FOR ALL SECTIONS */
                            <div className="flex-1 flex overflow-hidden bg-[#050505]">
                                {/* LEFT SIDEBAR - Categories */}
                                <div className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col bg-[#08080c]">
                                    <div className="p-4 border-b border-white/10">
                                        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                            {activeSection === 'movies' ? <Film size={16} className="text-purple-500" /> : <LayoutGrid size={16} className="text-blue-500" />}
                                            {activeSection === 'movies' ? 'Categorias' : 'Fornecedores'}
                                        </h2>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            Todos
                                        </button>
                                        {categories.map((cat: any) => (
                                            <button
                                                key={cat.category_id}
                                                onClick={() => setSelectedCategory(cat.category_id)}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all truncate ${selectedCategory === cat.category_id ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                {cat.category_name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-4 border-t border-white/5">
                                        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
                                            <ArrowLeft size={16} /> Voltar ao Menu
                                        </button>
                                    </div>
                                </div>

                                {/* MAIN CONTENT Area */}
                                <div className="flex-1 overflow-y-auto p-6 bg-[#050505]">
                                    {selectedSeries ? (
                                        /* SERIES DETAIL VIEW (Episodes) */
                                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                            {/* Header info */}
                                            <div className="flex flex-col md:flex-row gap-8 mb-10">
                                                <div className="w-64 flex-shrink-0">
                                                    <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                                                        <ChannelThumb item={selectedSeries} className="w-full h-full object-cover" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-end">
                                                    <button
                                                        onClick={() => setSelectedSeries(null)}
                                                        className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-bold mb-4 transition-colors"
                                                    >
                                                        <ArrowLeft size={20} /> Voltar para Catálogo
                                                    </button>
                                                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">{selectedSeries.name}</h2>
                                                    <div className="flex items-center gap-4 text-sm font-bold text-gray-500 mb-6">
                                                        <span className="px-2 py-1 bg-white/5 rounded border border-white/10">{Object.keys(seasons).length} Temporadas</span>
                                                        <span className="text-emerald-500/50">•</span>
                                                        <span className="text-gray-400">Gênero: {activeSection || 'Série'}</span>
                                                    </div>
                                                    <p className="text-gray-400 max-w-2xl leading-relaxed line-clamp-3">
                                                        {selectedSeries.plot || 'Uma série épica disponível na Bunker TV. Selecione uma temporada abaixo para começar a assistir.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Season Selection & Episode List */}
                                            <div className="space-y-8">
                                                <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
                                                    {Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b)).map(seasonNum => (
                                                        <button
                                                            key={seasonNum}
                                                            onClick={() => setSelectedCategory(seasonNum)} // Reuso do estado de categoria para temporada
                                                            className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === seasonNum || (selectedCategory === 'all' && seasonNum === '1') ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                                        >
                                                            Temporada {seasonNum}
                                                        </button>
                                                    ))}
                                                </div>

                                                {loadingEpisodes ? (
                                                    <div className="flex items-center justify-center h-48 col-span-full">
                                                        <RefreshCw className="animate-spin text-emerald-500" size={32} />
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                        {(seasons[selectedCategory === 'all' ? '1' : selectedCategory] || []).map((ep: any) => (
                                                            <div
                                                                key={ep.id}
                                                                onClick={() => playStream(ep, true)}
                                                                className="group bg-[#0a0a0f] border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                                                            >
                                                                <div className="aspect-video relative rounded-xl overflow-hidden mb-4">
                                                                    <img
                                                                        src={ep.info?.movie_image || selectedSeries.stream_icon}
                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                        alt={ep.title}
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <Play size={24} className="text-white fill-white" />
                                                                    </div>
                                                                </div>
                                                                <h4 className="text-white font-bold text-sm truncate">{ep.title}</h4>
                                                                <p className="text-[10px] text-gray-500 mt-1 font-medium">{ep.info?.duration || '23:00'}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* GRID VIEW */
                                        <>
                                            {/* Search Bar */}
                                            <div className="mb-6">
                                                <div className="relative max-w-md">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Buscar filme, série ou canal..."
                                                        className="w-full bg-[#12121a] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                                                    />
                                                    {searchQuery && (
                                                        <button
                                                            onClick={() => setSearchQuery('')}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                                {searchQuery && (
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        {(getProcessedContent as any[]).length} resultados para &quot;{searchQuery}&quot;
                                                    </p>
                                                )}
                                            </div>

                                            {isLoading ? (
                                                <div className="flex items-center justify-center h-64">
                                                    <RefreshCw className="animate-spin text-emerald-500" size={48} />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                                    {(getProcessedContent as any[]).map((item: any) => (
                                                        <div
                                                            key={item.stream_id || item.id}
                                                            onClick={() => activeSection === 'series' ? loadSeriesInfo(item) : playStream(item)}
                                                            className="group cursor-pointer"
                                                        >
                                                            <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-gray-800 border border-white/5 group-hover:border-emerald-500/50 transition-all group-hover:scale-105">
                                                                <ChannelThumb item={item} className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Play size={32} className="text-white" />
                                                                </div>
                                                            </div>
                                                            <p className="mt-2 text-sm font-bold text-gray-300 group-hover:text-white truncate">{item.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div >
        );
    }

    return (
        <div className="flex h-screen w-full items-center justify-center relative bg-black overflow-hidden font-sans">
            <PageNav title="Bunker TV" />
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                {WALLPAPERS.map((wall, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${bgIndex === idx ? 'opacity-40 scale-105' : 'opacity-0 scale-100'}`}
                        style={{ backgroundImage: `url(${wall})` }}
                    />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>

            <div className="w-full max-w-md p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8 relative">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-4">
                        <Tv size={32} className="text-black fill-black" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">BUNKER TV</h1>
                    <p className="text-gray-400 text-sm font-medium mt-2">Acesso Restrito ao Sistema de IPTV</p>
                </div>


                <div className="space-y-4">
                    <div className="relative group">
                        <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Host URL"
                            value={creds.host}
                            onChange={e => setCreds({ ...creds, host: e.target.value })}
                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-4 pl-12 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                        />
                    </div>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Usuário"
                            value={creds.user}
                            onChange={e => setCreds({ ...creds, user: e.target.value })}
                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-4 pl-12 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                        />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            value={creds.pass}
                            onChange={e => setCreds({ ...creds, pass: e.target.value })}
                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                        />
                        <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoading ? <RefreshCw className="animate-spin" /> : <LogIn size={20} />}
                        <span>{isLoading ? 'CONECTANDO...' : 'ACESSAR SISTEMA'}</span>
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 text-center w-full">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Bunker Operating System • v3.0</p>
            </div>
        </div>
    );
}

export default function TVPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center bg-[#08080c] min-h-screen">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <TVPageContent />
        </Suspense>
    );
}

import { useMemo, useRef } from 'react'
import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { formatDuration } from '../utils/helpers'
import {
    CloudOff, Database, RefreshCw, Loader2, PlayCircle,
    BookOpen, Video, DollarSign, ChevronRight, ChevronLeft
} from 'lucide-react'

// Elegant Item Card
function ItemCard({ item, onPlay }) {
    const subtitle = useMemo(() => {
        if (item.type === 'audiobook') return item.duration ? formatDuration(item.duration) : '🎧 Áudio'
        if (item.type === 'ebook') return item.pages ? `${item.pages} pág.` : '📖 Ler'
        if (item.type === 'video-summary') return '📹 Vídeo'
        if (item.type === 'finance') return '� Finanças'
        return '📁 Arquivo'
    }, [item])

    return (
        <button
            onClick={() => onPlay(item)}
            className="group flex-shrink-0 w-32 sm:w-44 flex flex-col items-start gap-2.5 text-left transition-transform active:scale-95 focus:outline-none snap-start"
        >
            <div className="relative w-full aspect-[3/4] sm:aspect-square rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all border border-black/5 bg-white">
                {item.thumbnail ? (
                    <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div
                        className="w-full h-full flex flex-col items-center justify-center p-4 text-white text-center text-[10px] sm:text-xs font-bold leading-tight"
                        style={{ background: item.coverGradient }}
                    >
                        <div className="opacity-20 mb-2">
                            {item.type === 'audiobook' && <PlayCircle size={32} />}
                            {item.type === 'ebook' && <BookOpen size={32} />}
                            {item.type === 'video-summary' && <Video size={32} />}
                            {item.type === 'finance' && <DollarSign size={32} />}
                        </div>
                        <span className="line-clamp-3">{item.title}</span>
                    </div>
                )}
                {/* Glass Overlay on Hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                        {item.type === 'audiobook' ? <PlayCircle size={20} /> : <BookOpen size={20} />}
                    </div>
                </div>
            </div>
            <div className="w-full flex flex-col gap-0.5">
                <h3 className="text-xs sm:text-sm font-bold truncate text-foreground leading-snug">{item.title}</h3>
                <span className="text-[10px] sm:text-xs font-semibold text-primary/80 uppercase tracking-tighter">
                    {subtitle}
                </span>
            </div>
        </button>
    )
}

// Fluid Carousel with scroll buttons
function SectionCarousel({ title, items, onPlay, icon: Icon }) {
    const scrollRef = useRef(null)

    const scroll = (dir) => {
        if (!scrollRef.current) return
        const amt = dir === 'left' ? -300 : 300
        scrollRef.current.scrollBy({ left: amt, behavior: 'smooth' })
    }

    if (!items || items.length === 0) return null

    return (
        <section className="mb-12 group/sec relative">
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-2.5">
                    {Icon && <div className="p-2 bg-primary/10 rounded-lg text-primary"><Icon size={18} strokeWidth={2.5} /></div>}
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{title}</h2>
                    <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground opacity-70">
                        {items.length}
                    </span>
                </div>

                <div className="flex gap-2 opacity-0 group-hover/sec:opacity-100 transition-opacity hidden sm:flex">
                    <button onClick={() => scroll('left')} className="p-1.5 bg-white border border-border rounded-full hover:bg-muted transition shadow-sm"><ChevronLeft size={16} /></button>
                    <button onClick={() => scroll('right')} className="p-1.5 bg-white border border-border rounded-full hover:bg-muted transition shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5 snap-x snap-mandatory scroll-smooth"
            >
                {items.map(item => <ItemCard key={item.id} item={item} onPlay={onPlay} />)}
            </div>
        </section>
    )
}

export default function Home() {
    const { playItem } = usePlayer()
    const { driveItems, isConnected, isLoading, error, login, refresh } = useDrive()

    // Categorization
    const collections = useMemo(() => {
        return {
            audiobooks: driveItems.filter(i => i.type === 'audiobook'),
            ebooks: driveItems.filter(i => i.type === 'ebook'),
            videos: driveItems.filter(i => i.type === 'video-summary'),
            finance: driveItems.filter(i => i.type === 'finance')
        }
    }, [driveItems])

    const greeting = useMemo(() => {
        const h = new Date().getHours()
        if (h < 12) return 'Bom dia'
        if (h < 18) return 'Boa tarde'
        return 'Boa noite'
    }, [])

    return (
        <div className="w-full max-w-5xl mx-auto px-5 pt-8 pb-32 animate-in fade-in duration-700">
            {/* Minimal Elegant Header */}
            <header className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg rotate-3">
                        A
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground">{greeting} ✨</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium">Sua biblioteca digital, refinada.</p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm cursor-pointer hover:border-primary transition-colors">
                    HS
                </div>
            </header>

            {/* Sync Alert (Only if error) */}
            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between text-red-600 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <CloudOff size={18} />
                        <span className="text-xs font-bold">{error}</span>
                    </div>
                    <button onClick={() => login()} className="text-xs font-black uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm hover:bg-red-50">Logar</button>
                </div>
            )}

            {/* Connection Banner (Premium Style) */}
            {!isConnected && (
                <div className="mb-12 relative overflow-hidden bg-[#2d2a26] text-white rounded-3xl p-8 shadow-2xl group cursor-pointer" onClick={() => login()}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:bg-primary/40"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-2">Conecte seu Google Drive</h3>
                        <p className="text-sm text-white/60 mb-6 max-w-xs">Acesse todos os seus livros e áudios instantaneamente em uma interface premium.</p>
                        <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-black shadow-lg hover:scale-105 active:scale-95 transition-all">
                            <Database size={18} />
                            Sincronizar Agora
                        </button>
                    </div>
                    <div className="absolute bottom-4 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CloudOff size={120} strokeWidth={1} />
                    </div>
                </div>
            )}

            {/* Loading Placeholder */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 className="animate-spin text-primary mb-4" size={40} />
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sincronizando Biblioteca...</span>
                </div>
            )}

            {/* Main Content Sections */}
            {!isLoading && isConnected && (
                <div className="space-y-4">
                    <SectionCarousel title="Audiobooks" items={collections.audiobooks} onPlay={playItem} icon={PlayCircle} />
                    <SectionCarousel title="E-books" items={collections.ebooks} onPlay={playItem} icon={BookOpen} />
                    <SectionCarousel title="Conteúdo em Vídeo" items={collections.videos} onPlay={playItem} icon={Video} />
                    <SectionCarousel title="Finanças & Docs" items={collections.finance} onPlay={playItem} icon={DollarSign} />

                    {driveItems.length === 0 && !isLoading && (
                        <div className="py-20 text-center">
                            <Database size={48} className="mx-auto text-muted mb-4 opacity-30" />
                            <p className="text-lg font-bold text-muted-foreground">Nenhum arquivo encontrado nas pastas.</p>
                            <button onClick={refresh} className="mt-4 text-primary font-black text-sm uppercase tracking-widest">Tentar Novamente</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

import { useMemo } from 'react'
import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { DEMO_AUDIOBOOKS, DEMO_EBOOKS, ALL_ITEMS } from '../utils/data'
import { getProgressPercent, formatDuration } from '../utils/helpers'
import { CloudOff, Database, RefreshCw, Loader2, PlayCircle, BookOpen } from 'lucide-react'

function BookCover({ item, className }) {
    if (item.thumbnail) {
        return (
            <img
                src={item.thumbnail}
                alt={item.title}
                className={`object-cover rounded-md shadow-sm aspect-square ${className}`}
            />
        )
    }
    return (
        <div
            className={`flex items-center justify-center rounded-md shadow-sm aspect-square text-white font-bold p-2 text-center text-xs ${className}`}
            style={{ background: item.coverGradient || 'linear-gradient(to right, #9333ea, #3b82f6)' }}
        >
            {item.title.substring(0, 20)}
        </div>
    )
}

function ItemCard({ item, onPlay }) {
    const subtitle = useMemo(() => {
        if (item.type === 'audiobook') return item.duration ? formatDuration(item.duration) : '🎧 Áudio'
        if (item.type === 'ebook') return item.pages ? `${item.pages} páginas` : '📖 Abrir'
        if (item.type === 'video-summary') return '📹 Vídeo'
        if (item.type === 'finance') return '📊 Doc'
        return ''
    }, [item])

    return (
        <button
            onClick={() => onPlay(item)}
            className="group flex-shrink-0 w-36 sm:w-40 flex flex-col items-start gap-2 text-left hover:opacity-90 transition-opacity focus:outline-none"
        >
            <BookCover item={item} className="w-full h-36 sm:h-40" />
            <div className="w-full">
                <h3 className="text-sm font-semibold truncate text-foreground w-full">{item.title}</h3>
                <p className="text-xs text-muted-foreground truncate w-full">{item.author}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-xs font-medium text-primary">
                    {item.type === 'audiobook' ? <PlayCircle size={12} /> : <BookOpen size={12} />}
                    {subtitle}
                </div>
            </div>
        </button>
    )
}

export default function Home() {
    const { playItem } = usePlayer()
    const { driveItems, isConnected, isLoading, error, login, refresh } = useDrive()

    const audiobooks = useMemo(() => {
        const drive = driveItems.filter(i => i.type === 'audiobook')
        return [...drive, ...DEMO_AUDIOBOOKS]
    }, [driveItems])

    const ebooks = useMemo(() => {
        const drive = driveItems.filter(i => i.type === 'ebook')
        return [...drive, ...DEMO_EBOOKS]
    }, [driveItems])

    const videos = useMemo(() => driveItems.filter(i => i.type === 'video-summary'), [driveItems])
    const finance = useMemo(() => driveItems.filter(i => i.type === 'finance'), [driveItems])

    const continueListening = useMemo(() => ALL_ITEMS.filter(item => item.currentTime > 0), [])

    const greeting = useMemo(() => {
        const h = new Date().getHours()
        if (h < 12) return 'Bom dia'
        if (h < 18) return 'Boa tarde'
        return 'Boa noite'
    }, [])

    return (
        <div className="w-full max-w-4xl mx-auto px-5 pt-8 pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{greeting} ✨</h1>
                    <p className="text-sm text-muted-foreground mt-1">O que vamos absorver hoje?</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">
                    HS
                </div>
            </header>

            {/* Error handling */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                    <CloudOff className="shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <p className="font-semibold text-sm">Problema com o Drive</p>
                        <p className="text-xs mt-1 opacity-90">{error}</p>
                    </div>
                    <button onClick={() => login()} className="text-xs font-bold bg-white px-3 py-1.5 rounded-full shadow-sm hover:bg-red-50 transition border border-red-100">
                        Reconectar
                    </button>
                </div>
            )}

            {/* Drive Sync Card */}
            <div className="mb-10 bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                {!isConnected ? (
                    <>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                <CloudOff size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">Drive Desconectado</h3>
                                <p className="text-xs text-muted-foreground">Conecte para sincronizar seus livros reais</p>
                            </div>
                        </div>
                        <button
                            onClick={() => login()}
                            disabled={isLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                            {isLoading ? 'Conectando...' : 'Conectar Agora'}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#2e7d32] shrink-0 font-bold">
                                {driveItems.length}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">Drive Sincronizado</h3>
                                <p className="text-xs text-muted-foreground">Sua livraria na nuvem está pronta</p>
                            </div>
                        </div>
                        <button
                            onClick={refresh}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 bg-muted text-foreground px-4 py-2 rounded-full text-xs font-bold hover:bg-border transition disabled:opacity-50"
                        >
                            <RefreshCw className={isLoading ? "animate-spin" : ""} size={14} />
                            {isLoading ? 'Checando...' : 'Atualizar'}
                        </button>
                    </>
                )}
            </div>

            {/* Continue Listening */}
            {continueListening.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Continuar Consumindo</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {continueListening.map(item => {
                            const progress = getProgressPercent(item.currentTime, item.type === 'audiobook' ? item.duration : item.pages)
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => playItem(item)}
                                    className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <BookCover item={item} className="w-16 h-16 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{item.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.author}</p>
                                        <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Premium Carousels */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">🎧 Áudiobooks Premium</h2>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{audiobooks.length}</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5 snap-x">
                    {audiobooks.map(item => <ItemCard key={item.id} item={item} onPlay={playItem} />)}
                </div>
            </section>

            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">📖 Leituras (PDF/ePub)</h2>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{ebooks.length}</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5 snap-x">
                    {ebooks.map(item => <ItemCard key={item.id} item={item} onPlay={playItem} />)}
                </div>
            </section>

            {videos.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">📹 Resumos em Vídeo</h2>
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{videos.length}</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5 snap-x">
                        {videos.map(item => <ItemCard key={item.id} item={item} onPlay={playItem} />)}
                    </div>
                </section>
            )}

            {finance.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">💰 Inteligência Financeira</h2>
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{finance.length}</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5 snap-x">
                        {finance.map(item => <ItemCard key={item.id} item={item} onPlay={playItem} />)}
                    </div>
                </section>
            )}
        </div>
    )
}

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { DEMO_AUDIOBOOKS, DEMO_EBOOKS, ALL_ITEMS } from '../utils/data'
import { getProgressPercent, formatDuration } from '../utils/helpers'
import BookCover from '../components/BookCover'
import { Loader2, CloudOff, Database, RefreshCw } from 'lucide-react'
import './Home.css'

function ItemCard({ item, onPlay }) {
    const subtitle = useMemo(() => {
        if (item.type === 'audiobook') return item.duration ? formatDuration(item.duration) : '🎧 Áudio do Drive'
        if (item.type === 'ebook') return item.pages ? `${item.pages} páginas` : '📖 Abrir no Drive ↗'
        if (item.type === 'video-summary') return '📹 Abrir no Drive ↗'
        if (item.type === 'finance') return '📊 Abrir no Drive ↗'
        return ''
    }, [item])

    return (
        <div className="home__card" onClick={() => onPlay(item)} id={`item-${item.id}`}>
            <BookCover item={item} size="md" />
            <p className="home__card-title">{item.title}</p>
            <p className="home__card-meta">{item.author}</p>
            <p className="home__card-duration">{subtitle}</p>
        </div>
    )
}

export default function Home() {
    const { playItem } = usePlayer()
    const { driveItems, isConnected, isLoading, error, login, refresh } = useDrive()
    const navigate = useNavigate()

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

    const driveCount = driveItems.length

    return (
        <div className="home" id="home-page">
            {/* Hero */}
            <header className="home__header">
                <div className="home__greeting">
                    <h1 className="home__title">{greeting} ✨</h1>
                    <p className="home__subtitle">O que vamos absorver hoje?</p>
                </div>
                <div className="home__avatar" id="home-avatar">
                    <span>HS</span>
                </div>
            </header>

            {/* Drive Connection Banner — shown when not connected */}
            {!isConnected && !isLoading && (
                <div className="home__drive-banner" id="drive-connect-banner">
                    <div className="home__drive-banner-icon">
                        <CloudOff size={22} />
                    </div>
                    <div className="home__drive-banner-text">
                        <p className="home__drive-banner-title">Google Drive desconectado</p>
                        <p className="home__drive-banner-sub">Conecte para ver seus audiobooks e e-books reais</p>
                    </div>
                    <button className="home__drive-banner-btn" onClick={() => login()} id="home-connect-drive">
                        <Database size={14} />
                        Conectar
                    </button>
                </div>
            )}

            {/* Drive connected — show count + refresh */}
            {isConnected && !isLoading && driveCount > 0 && (
                <div className="home__drive-connected">
                    <span>✅ Drive conectado — {driveCount} arquivos</span>
                    <button onClick={refresh} className="home__drive-refresh">
                        <RefreshCw size={12} /> Sincronizar
                    </button>
                </div>
            )}

            {/* Drive loading */}
            {isLoading && (
                <div className="home__drive-loading">
                    <Loader2 size={14} className="spin" />
                    <span>Buscando arquivos no Drive...</span>
                </div>
            )}

            {/* Drive error */}
            {error && (
                <div className="home__drive-error">
                    ⚠️ {error} — <button onClick={() => login()}>Reconectar</button>
                </div>
            )}

            {/* Continue Listening */}
            {continueListening.length > 0 && (
                <section className="home__section animate-slideUp">
                    <h2 className="home__section-title">Continuar ouvindo</h2>
                    <div className="home__continue-grid">
                        {continueListening.map(item => {
                            const progress = getProgressPercent(
                                item.currentTime,
                                item.type === 'audiobook' ? item.duration : item.pages
                            )
                            return (
                                <button
                                    key={item.id}
                                    className="home__continue-card"
                                    onClick={() => playItem(item)}
                                    id={`continue-${item.id}`}
                                >
                                    <BookCover item={item} size="sm" />
                                    <div className="home__continue-info">
                                        <p className="home__continue-title">{item.title}</p>
                                        <p className="home__continue-meta">{item.author}</p>
                                        <div className="home__continue-progress">
                                            <div className="home__continue-progress-fill" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Audiobooks */}
            <section className="home__section animate-slideUp" style={{ animationDelay: '100ms' }}>
                <h2 className="home__section-title">
                    🎧 Audiobooks
                    <span className="home__section-count">{audiobooks.length}</span>
                </h2>
                <div className="home__scroll-row">
                    {audiobooks.map(item => (
                        <ItemCard key={item.id} item={item} onPlay={playItem} />
                    ))}
                </div>
            </section>

            {/* E-books */}
            <section className="home__section animate-slideUp" style={{ animationDelay: '200ms' }}>
                <h2 className="home__section-title">
                    📖 E-books
                    <span className="home__section-count">{ebooks.length}</span>
                </h2>
                <div className="home__scroll-row">
                    {ebooks.map(item => (
                        <ItemCard key={item.id} item={item} onPlay={playItem} />
                    ))}
                </div>
            </section>

            {/* Videos */}
            {videos.length > 0 && (
                <section className="home__section animate-slideUp" style={{ animationDelay: '300ms' }}>
                    <h2 className="home__section-title">
                        📹 Vídeos
                        <span className="home__section-count">{videos.length}</span>
                    </h2>
                    <div className="home__scroll-row">
                        {videos.map(item => (
                            <ItemCard key={item.id} item={item} onPlay={playItem} />
                        ))}
                    </div>
                </section>
            )}

            {/* Finance */}
            {finance.length > 0 && (
                <section className="home__section animate-slideUp" style={{ animationDelay: '400ms' }}>
                    <h2 className="home__section-title">
                        💰 Financeiro
                        <span className="home__section-count">{finance.length}</span>
                    </h2>
                    <div className="home__scroll-row">
                        {finance.map(item => (
                            <ItemCard key={item.id} item={item} onPlay={playItem} />
                        ))}
                    </div>
                </section>
            )}

            {/* Categories */}
            <section className="home__section animate-slideUp" style={{ animationDelay: '500ms' }}>
                <h2 className="home__section-title">Categorias</h2>
                <div className="home__categories">
                    {['Desenvolvimento Pessoal', 'Finanças', 'Psicologia', 'História', 'Filosofia', 'Estratégia'].map((cat, i) => (
                        <button
                            key={cat}
                            className="home__category-chip"
                            style={{ animationDelay: `${300 + i * 50}ms` }}
                            id={`category-${cat.toLowerCase().replace(/\s/g, '-')}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            <div className="home__spacer" />
        </div>
    )
}

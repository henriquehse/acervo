import { useMemo } from 'react'
import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { DEMO_AUDIOBOOKS, DEMO_EBOOKS, ALL_ITEMS } from '../utils/data'
import { getProgressPercent, formatDuration } from '../utils/helpers'
import BookCover from '../components/BookCover'
import './Home.css'

export default function Home() {
    const { playItem, currentItem } = usePlayer()
    const { driveItems, isConnected } = useDrive()

    const audiobooks = useMemo(() => {
        const driveAudiobooks = isConnected ? driveItems.filter(i => i.type === 'audiobook') : []
        return [...driveAudiobooks, ...DEMO_AUDIOBOOKS]
    }, [driveItems, isConnected])

    const ebooks = useMemo(() => {
        const driveEbooks = isConnected ? driveItems.filter(i => i.type === 'ebook') : []
        return [...driveEbooks, ...DEMO_EBOOKS]
    }, [driveItems, isConnected])

    const totalItems = useMemo(() => [...audiobooks, ...ebooks], [audiobooks, ebooks])

    const continueListening = useMemo(() => {
        return ALL_ITEMS.filter(item => item.currentTime > 0)
    }, [])

    const greeting = useMemo(() => {
        const h = new Date().getHours()
        if (h < 12) return 'Bom dia'
        if (h < 18) return 'Boa tarde'
        return 'Boa noite'
    }, [])

    return (
        <div className="home" id="home-page">
            {/* Hero greeting */}
            <header className="home__header">
                <div className="home__greeting">
                    <h1 className="home__title">{greeting} ✨</h1>
                    <p className="home__subtitle">O que vamos absorver hoje?</p>
                </div>
                <div className="home__avatar" id="home-avatar">
                    <span>HS</span>
                </div>
            </header>

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
                        <div key={item.id} className="home__card" onClick={() => playItem(item)} id={`audiobook-${item.id}`}>
                            <BookCover item={item} size="md" />
                            <p className="home__card-title">{item.title}</p>
                            <p className="home__card-meta">{item.author}</p>
                            <p className="home__card-duration">
                                {item.duration ? formatDuration(item.duration) : 'Drive File'}
                            </p>
                        </div>
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
                        <div key={item.id} className="home__card" onClick={() => playItem(item)} id={`ebook-${item.id}`}>
                            <BookCover item={item} size="md" />
                            <p className="home__card-title">{item.title}</p>
                            <p className="home__card-meta">{item.author}</p>
                            <p className="home__card-duration">
                                {item.pages ? `${item.pages} páginas` : 'Drive File'}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section className="home__section animate-slideUp" style={{ animationDelay: '300ms' }}>
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

            {/* Spacer for bottom nav + mini player */}
            <div className="home__spacer" />
        </div>
    )
}

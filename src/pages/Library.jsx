import { useState, useMemo } from 'react'
import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { ALL_ITEMS } from '../utils/data'
import { formatDuration, getProgressPercent } from '../utils/helpers'
import BookCover from '../components/BookCover'
import { Grid3X3, List, ArrowDownAZ, Clock } from 'lucide-react'
import './Library.css'

export default function Library() {
    const { playItem } = usePlayer()
    const { driveItems, isConnected } = useDrive()
    const [viewMode, setViewMode] = useState('grid') // grid, list
    const [sortBy, setSortBy] = useState('title') // title, author, recent
    const [filterType, setFilterType] = useState('all')

    const items = useMemo(() => {
        const allItems = isConnected ? [...driveItems, ...ALL_ITEMS] : [...ALL_ITEMS]
        let result = [...allItems]
        if (filterType !== 'all') {
            result = result.filter(i => i.type === filterType)
        }
        if (sortBy === 'title') {
            result.sort((a, b) => a.title.localeCompare(b.title))
        } else if (sortBy === 'author') {
            result.sort((a, b) => a.author.localeCompare(b.author))
        }
        return result
    }, [sortBy, filterType, driveItems, isConnected])

    return (
        <div className="library" id="library-page">
            <header className="library__header">
                <h1 className="library__title">Biblioteca</h1>
                <div className="library__view-toggle">
                    <button
                        className={`library__view-btn ${viewMode === 'grid' ? 'library__view-btn--active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        aria-label="Visualização em grade"
                    >
                        <Grid3X3 size={18} />
                    </button>
                    <button
                        className={`library__view-btn ${viewMode === 'list' ? 'library__view-btn--active' : ''}`}
                        onClick={() => setViewMode('list')}
                        aria-label="Visualização em lista"
                    >
                        <List size={18} />
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="library__filters">
                <div className="library__filter-row">
                    {[
                        { key: 'all', label: 'Todos' },
                        { key: 'audiobook', label: 'Audiobooks' },
                        { key: 'ebook', label: 'E-books' },
                        { key: 'video-summary', label: 'Vídeos' },
                        { key: 'finance', label: 'Financeiro' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            className={`library__filter-chip ${filterType === key ? 'library__filter-chip--active' : ''}`}
                            onClick={() => setFilterType(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="library__sort">
                    <button
                        className={`library__sort-btn ${sortBy === 'title' ? 'library__sort-btn--active' : ''}`}
                        onClick={() => setSortBy('title')}
                    >
                        <ArrowDownAZ size={14} /> Título
                    </button>
                    <button
                        className={`library__sort-btn ${sortBy === 'author' ? 'library__sort-btn--active' : ''}`}
                        onClick={() => setSortBy('author')}
                    >
                        <ArrowDownAZ size={14} /> Autor
                    </button>
                    <button
                        className={`library__sort-btn ${sortBy === 'recent' ? 'library__sort-btn--active' : ''}`}
                        onClick={() => setSortBy('recent')}
                    >
                        <Clock size={14} /> Recente
                    </button>
                </div>
            </div>

            {/* Items count */}
            <p className="library__count">{items.length} itens</p>

            {/* Grid View */}
            {viewMode === 'grid' ? (
                <div className="library__grid">
                    {items.map(item => (
                        <div key={item.id} className="library__grid-item" onClick={() => playItem(item)}>
                            <BookCover item={item} size="full" />
                            <p className="library__item-title">{item.title}</p>
                            <p className="library__item-meta">{item.author}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="library__list">
                    {items.map(item => {
                        const progress = getProgressPercent(
                            item.currentTime || item.currentPage || 0,
                            item.type === 'audiobook' ? item.duration : item.pages
                        )
                        return (
                            <button
                                key={item.id}
                                className="library__list-item"
                                onClick={() => playItem(item)}
                            >
                                <BookCover item={item} size="sm" />
                                <div className="library__list-info">
                                    <p className="library__list-title">{item.title}</p>
                                    <p className="library__list-author">{item.author}</p>
                                    <div className="library__list-bar">
                                        <div className="library__list-bar-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                                <span className="library__list-type">
                                    {item.type === 'audiobook' ? '🎧' : '📖'}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="library__spacer" />
        </div>
    )
}

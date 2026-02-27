import { useState, useMemo } from 'react'
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react'
import { usePlayer } from '../contexts/PlayerContext'
import { ALL_ITEMS, CATEGORIES } from '../utils/data'
import { formatDuration } from '../utils/helpers'
import BookCover from '../components/BookCover'
import './Search.css'

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('Todos')
    const [activeType, setActiveType] = useState('all') // all, audiobook, ebook
    const { playItem } = usePlayer()

    const filtered = useMemo(() => {
        let items = ALL_ITEMS

        if (activeType !== 'all') {
            items = items.filter(i => i.type === activeType)
        }

        if (activeCategory !== 'Todos') {
            items = items.filter(i => i.category === activeCategory)
        }

        if (query.trim()) {
            const q = query.toLowerCase()
            items = items.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.author.toLowerCase().includes(q) ||
                i.category?.toLowerCase().includes(q)
            )
        }

        return items
    }, [query, activeCategory, activeType])

    return (
        <div className="search" id="search-page">
            <header className="search__header">
                <h1 className="search__title">Buscar</h1>
            </header>

            {/* Search input */}
            <div className="search__input-wrap">
                <SearchIcon size={18} className="search__input-icon" />
                <input
                    type="text"
                    className="search__input"
                    placeholder="Buscar livros, autores, categorias..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    id="search-input"
                />
                {query && (
                    <button className="search__input-clear" onClick={() => setQuery('')}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Type filter */}
            <div className="search__type-filter">
                {[
                    { key: 'all', label: 'Todos' },
                    { key: 'audiobook', label: '🎧 Audiobooks' },
                    { key: 'ebook', label: '📖 E-books' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        className={`search__type-btn ${activeType === key ? 'search__type-btn--active' : ''}`}
                        onClick={() => setActiveType(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Category pills */}
            <div className="search__categories">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`search__cat-pill ${activeCategory === cat ? 'search__cat-pill--active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Results */}
            <div className="search__results">
                {filtered.length === 0 ? (
                    <div className="search__empty">
                        <SearchIcon size={48} strokeWidth={1} />
                        <p>Nenhum resultado encontrado</p>
                        <p className="search__empty-hint">Tente buscar por outro termo</p>
                    </div>
                ) : (
                    filtered.map(item => (
                        <button
                            key={item.id}
                            className="search__result-item"
                            onClick={() => playItem(item)}
                            id={`result-${item.id}`}
                        >
                            <BookCover item={item} size="sm" />
                            <div className="search__result-info">
                                <p className="search__result-title">{item.title}</p>
                                <p className="search__result-author">{item.author}</p>
                                <div className="search__result-tags">
                                    <span className="search__result-type">
                                        {item.type === 'audiobook' ? '🎧 Audiobook' : '📖 E-book'}
                                    </span>
                                    {item.category && (
                                        <span className="search__result-cat">{item.category}</span>
                                    )}
                                </div>
                            </div>
                            <div className="search__result-meta">
                                {item.type === 'audiobook'
                                    ? formatDuration(item.duration)
                                    : `${item.pages}p`}
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="search__spacer" />
        </div>
    )
}

import { useState, useMemo } from 'react'
import { Search as SearchIcon, X, SlidersHorizontal, BookOpen, PlayCircle } from 'lucide-react'
import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { ALL_ITEMS, CATEGORIES } from '../utils/data'
import { formatDuration } from '../utils/helpers'

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

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('Todos')
    const [activeType, setActiveType] = useState('all')
    const { playItem } = usePlayer()
    const { driveItems } = useDrive()

    const filtered = useMemo(() => {
        let items = [...driveItems, ...ALL_ITEMS]

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
                (i.author || '').toLowerCase().includes(q) ||
                (i.category || '').toLowerCase().includes(q)
            )
        }

        return items
    }, [query, activeCategory, activeType, driveItems])

    const filtesList = [
        { key: 'all', label: 'Todos' },
        { key: 'audiobook', label: '🎧 Audiobooks' },
        { key: 'ebook', label: '📖 E-books' },
        { key: 'video-summary', label: '📹 Vídeos' },
    ]

    return (
        <div className="w-full max-w-4xl mx-auto px-5 pt-8 pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Buscar</h1>
            </header>

            {/* Search Input */}
            <div className="relative flex items-center mb-6">
                <SearchIcon size={18} className="absolute left-4 text-muted-foreground" />
                <input
                    type="text"
                    className="w-full h-12 bg-card border border-border rounded-full pl-11 pr-12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all placeholder:text-muted-foreground"
                    placeholder="Buscar livros, autores..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    id="search-input"
                />
                {query && (
                    <button
                        className="absolute right-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition"
                        onClick={() => setQuery('')}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Type Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar -mx-5 px-5">
                {filtesList.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveType(key)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all border ${activeType === key
                                ? 'bg-foreground text-background border-foreground shadow-md'
                                : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/50 hover:text-foreground'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${activeCategory === cat
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Results */}
            <div className="flex flex-col gap-3">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <SearchIcon size={48} className="opacity-20 mb-4" />
                        <p className="text-lg font-semibold">Nenhum resultado encontrado</p>
                        <p className="text-sm">Tente buscar por outro termo.</p>
                    </div>
                ) : (
                    filtered.map(item => (
                        <button
                            key={item.id}
                            onClick={() => playItem(item)}
                            className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors text-left focus:outline-none"
                        >
                            <BookCover item={item} className="w-16 h-16 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate text-foreground leading-tight">{item.title}</h3>
                                <p className="text-xs text-muted-foreground truncate my-1">{item.author}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                                        {item.type === 'audiobook' ? <PlayCircle size={10} /> : <BookOpen size={10} />}
                                        {item.type === 'video-summary' ? 'Vídeo' : item.type}
                                    </span>
                                    {item.category && (
                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{item.category}</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs font-medium text-muted-foreground whitespace-nowrap hidden sm:block">
                                {item.type === 'audiobook' && item.duration ? formatDuration(item.duration) : ''}
                                {item.type === 'ebook' && item.pages ? `${item.pages}p` : ''}
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}

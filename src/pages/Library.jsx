import { useState, useMemo } from 'react'
import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { ALL_ITEMS } from '../utils/data'
import { getProgressPercent } from '../utils/helpers'
import { Grid3X3, List, ArrowDownAZ, Clock, Search as SearchIcon } from 'lucide-react'

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

export default function Library() {
    const { playItem } = usePlayer()
    const { driveItems } = useDrive()
    const [viewMode, setViewMode] = useState('grid')
    const [sortBy, setSortBy] = useState('title')
    const [filterType, setFilterType] = useState('all')

    const items = useMemo(() => {
        // We know we must merge driveItems and ALL_ITEMS
        const allItems = [...driveItems, ...ALL_ITEMS]

        let result = [...allItems]
        if (filterType !== 'all') {
            result = result.filter(i => i.type === filterType)
        }

        if (sortBy === 'title') {
            result.sort((a, b) => a.title.localeCompare(b.title))
        } else if (sortBy === 'author') {
            result.sort((a, b) => (a.author || '').localeCompare(b.author || ''))
        }
        // sort by recent is implicit by keeping original order or modifiedTime

        return result
    }, [sortBy, filterType, driveItems])

    const filtesList = [
        { key: 'all', label: 'Todos' },
        { key: 'audiobook', label: 'Áudiobooks' },
        { key: 'ebook', label: 'E-books' },
        { key: 'video-summary', label: 'Vídeos' },
        { key: 'finance', label: 'Financeiro' },
    ]

    return (
        <div className="w-full max-w-4xl mx-auto px-5 pt-8 pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Biblioteca</h1>
                <div className="flex bg-card border border-border rounded-full p-1 shadow-sm">
                    <button
                        className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={() => setViewMode('grid')}
                        aria-label="Grade"
                    >
                        <Grid3X3 size={18} />
                    </button>
                    <button
                        className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={() => setViewMode('list')}
                        aria-label="Lista"
                    >
                        <List size={18} />
                    </button>
                </div>
            </header>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar -mx-5 px-5">
                {filtesList.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilterType(key)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all border ${filterType === key
                                ? 'bg-foreground text-background border-foreground shadow-md'
                                : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/50 hover:text-foreground'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Sort Row */}
            <div className="flex items-center justify-between mb-6 text-sm">
                <p className="text-muted-foreground font-medium">{items.length} itens encontrados</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setSortBy('title')}
                        className={`flex items-center gap-1 transition-colors ${sortBy === 'title' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <ArrowDownAZ size={14} /> Título
                    </button>
                    <button
                        onClick={() => setSortBy('author')}
                        className={`flex items-center gap-1 transition-colors ${sortBy === 'author' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <ArrowDownAZ size={14} /> Autor
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <SearchIcon size={48} className="opacity-20 mb-4" />
                    <p className="text-lg font-semibold">Nenhum item encontrado.</p>
                    <p className="text-sm">Tente mudar o filtro ou reconectar o Drive.</p>
                </div>
            )}

            {/* Content View */}
            {items.length > 0 && viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => playItem(item)}
                            className="group flex flex-col items-start text-left focus:outline-none"
                        >
                            <BookCover item={item} className="w-full mb-3 group-hover:opacity-90 transition-opacity" />
                            <h3 className="text-sm font-semibold truncate text-foreground w-full leading-tight">{item.title}</h3>
                            <p className="text-xs text-muted-foreground truncate w-full mt-1.5">{item.author}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {items.map(item => {
                        const progress = getProgressPercent(item.currentTime || 0, item.type === 'audiobook' ? item.duration : item.pages)
                        return (
                            <button
                                key={item.id}
                                onClick={() => playItem(item)}
                                className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors text-left focus:outline-none"
                            >
                                <BookCover item={item} className="w-16 h-16 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-sm truncate">{item.title}</p>
                                        <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-md text-muted-foreground shrink-0 border border-border/50">
                                            {item.type === 'audiobook' ? '🎧' : item.type === 'video-summary' ? '📹' : '📖'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-1">{item.author}</p>

                                    {progress > 0 && (
                                        <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

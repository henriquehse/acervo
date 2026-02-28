import { usePlayer } from '../contexts/PlayerContext'
import { Disc, Play, Pause, ChevronUp } from 'lucide-react'

export default function MiniPlayer() {
    const { currentItem, isPlaying, togglePlay, setIsFullPlayer } = usePlayer()

    if (!currentItem) return null

    return (
        <div
            onClick={() => setIsFullPlayer(true)}
            className="fixed bottom-[72px] left-0 w-full px-4 z-40 cursor-pointer animate-in slide-in-from-bottom"
        >
            <div className="bg-[#2d2a26] text-white rounded-2xl p-2.5 flex items-center justify-between shadow-xl border border-white/10 backdrop-blur-md bg-opacity-95">
                <div className="flex items-center gap-3 w-4/5">
                    {currentItem.thumbnail ? (
                        <img src={currentItem.thumbnail} className="w-10 h-10 rounded-lg object-cover bg-white/5" />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                            <Disc size={20} className={isPlaying ? "animate-spin" : ""} style={{ animationDuration: '3s' }} />
                        </div>
                    )}
                    <div className="min-w-0 pr-2">
                        <p className="font-bold text-sm truncate">{currentItem.title}</p>
                        <p className="text-xs text-white/60 truncate">{currentItem.author || 'Audiobook'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 pr-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); togglePlay() }}
                        className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-transform"
                    >
                        {isPlaying ? <Pause size={18} className="fill-black" /> : <Play size={18} className="fill-black ml-0.5" />}
                    </button>
                </div>
            </div>
        </div>
    )
}

import { useState } from 'react'
import { usePlayer } from '../contexts/PlayerContext'
import { formatTime } from '../utils/helpers'
import { SPEED_OPTIONS } from '../utils/data'
import {
    ChevronDown, Play, Pause, SkipBack, SkipForward,
    FastForward, Rewind, Volume2, VolumeX, Moon, BookMarked,
    ListMusic, Repeat, Repeat1
} from 'lucide-react'

export default function FullPlayer() {
    const {
        currentItem, currentTrackIndex, isPlaying, currentTime, duration,
        speed, volume, isMuted, isFullPlayer, sleepTimer, repeatMode,
        playNextTrack, playPrevTrack, togglePlay, seekTo, seekRelative,
        cycleSpeed, setVolume, toggleMute, setIsFullPlayer, setSleepTimer,
        addBookmark, toggleRepeat
    } = usePlayer()

    const [showChapters, setShowChapters] = useState(false)

    if (!isFullPlayer || !currentItem) return null

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
    const hasNextTrack = currentItem.isMultiTrack && currentTrackIndex < currentItem.tracks.length - 1
    const hasPrevTrack = currentItem.isMultiTrack && currentTrackIndex > 0

    return (
        <div className="fixed inset-0 z-50 bg-[#e6e2d8] flex flex-col pt-[max(20px,env(safe-area-inset-top))] h-dvh animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4">
                <button onClick={() => setIsFullPlayer(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 active:bg-black/10 transition-colors">
                    <ChevronDown size={28} className="text-black/70" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-black/50">Reproduzindo</span>
                    <span className="text-sm font-semibold text-black/90 w-48 text-center truncate">
                        {currentItem.title}
                    </span>
                </div>
                <button
                    onClick={() => setShowChapters(!showChapters)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showChapters ? 'bg-primary text-white' : 'bg-black/5 text-black/70'}`}
                >
                    <ListMusic size={20} />
                </button>
            </header>

            {/* Chapters Panel (Optional Overlay) */}
            {showChapters && currentItem.isMultiTrack && (
                <div className="absolute top-[80px] inset-x-4 bg-white rounded-3xl p-4 shadow-2xl z-10 max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Faixas do Livro</h3>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">{currentItem.tracks.length}</span>
                    </div>
                    {currentItem.tracks.map((t, idx) => (
                        <div
                            key={t.id}
                            className={`p-3 rounded-xl mb-2 cursor-pointer transition flex items-center gap-3 ${idx === currentTrackIndex ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-black/5'}`}
                        >
                            <span className="text-xs opacity-50 w-6 text-center">{idx + 1}</span>
                            <span className="truncate flex-1 text-sm">{t.name}</span>
                            {idx === currentTrackIndex && isPlaying && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
                {/* Book Cover */}
                <div className="w-full max-w-[280px] aspect-square rounded-2xl shadow-2xl overflow-hidden bg-white mb-8 transition-transform duration-500 hover:scale-[1.02]">
                    {currentItem.thumbnail ? (
                        <img src={currentItem.thumbnail} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-6 text-white text-center font-bold text-xl" style={{ background: currentItem.coverGradient || 'var(--primary)' }}>
                            {currentItem.title}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="w-full text-center px-4 mb-8">
                    <h2 className="text-2xl font-black text-black/90 mb-2 truncate">
                        {currentItem.title}
                    </h2>
                    <p className="text-lg font-medium text-black/60 truncate">
                        {currentItem.isMultiTrack ? currentItem.tracks[currentTrackIndex].name : currentItem.author || 'Drive'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-sm mb-8 px-4">
                    <div className="relative h-2.5 bg-black/10 rounded-full mb-3 cursor-pointer group" onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                        seekTo(percent * duration)
                    }}>
                        <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-150" style={{ width: `${progressPercent}%` }}></div>
                        {/* Custom Dot Handler */}
                        <div className="absolute top-1/2 -mt-2.5 w-5 h-5 bg-white rounded-full shadow-md border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progressPercent}% - 10px)` }} />
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold text-black/50 font-mono tracking-wider">
                        <span>{formatTime(currentTime)}</span>
                        <span>-{formatTime(duration - currentTime)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 mb-10 w-full max-w-sm">
                    {/* Previous Track / Rewind */}
                    <button
                        onClick={() => hasPrevTrack ? playPrevTrack() : seekRelative(-10)}
                        className="w-14 h-14 flex items-center justify-center rounded-full text-black/80 hover:bg-black/5 transition active:scale-95"
                    >
                        {hasPrevTrack ? <SkipBack size={28} /> : <Rewind size={28} />}
                    </button>

                    {/* Play/Pause */}
                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 flex items-center justify-center bg-primary text-white rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all outline-none ring-4 ring-primary/20"
                    >
                        {isPlaying ? <Pause size={36} className="fill-white" /> : <Play size={36} className="fill-white ml-2" />}
                    </button>

                    {/* Next Track / Fast Forward */}
                    <button
                        onClick={() => hasNextTrack ? playNextTrack() : seekRelative(10)}
                        className="w-14 h-14 flex items-center justify-center rounded-full text-black/80 hover:bg-black/5 transition active:scale-95"
                    >
                        {hasNextTrack ? <SkipForward size={28} /> : <FastForward size={28} />}
                    </button>
                </div>

                {/* Secondary Controls Row */}
                <div className="w-full max-w-sm flex items-center justify-between pb-8 pt-4 border-t border-black/10 px-4">
                    {/* Speed Control */}
                    <button
                        onClick={cycleSpeed}
                        className="flex flex-col items-center gap-1.5 text-black/60 hover:text-black/90 transition"
                    >
                        <div className="h-8 flex items-center justify-center px-3 rounded-full bg-black/5 font-bold text-xs tracking-wider">
                            {speed}x
                        </div>
                        <span className="text-[10px] font-semibold uppercase">Veloc.</span>
                    </button>

                    {/* Sleep Timer */}
                    <button
                        onClick={() => {
                            const opts = [null, 15, 30, 60]
                            const cIdx = opts.indexOf(sleepTimer)
                            setSleepTimer(opts[(cIdx + 1) % opts.length])
                        }}
                        className={`flex flex-col items-center gap-1.5 transition ${sleepTimer ? 'text-primary' : 'text-black/60 hover:text-black/90'}`}
                    >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${sleepTimer ? 'bg-primary/20 text-primary' : 'bg-black/5'}`}>
                            {sleepTimer ? <span className="text-xs font-bold">{sleepTimer}m</span> : <Moon size={18} />}
                        </div>
                        <span className="text-[10px] font-semibold uppercase">Timer</span>
                    </button>

                    {/* Add Bookmark */}
                    <button
                        onClick={() => { addBookmark(); /* Optional: Show toast */ }}
                        className="flex flex-col items-center gap-1.5 text-black/60 hover:text-black/90 transition"
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5">
                            <BookMarked size={18} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase">Marcar</span>
                    </button>

                    {/* Repeat */}
                    <button
                        onClick={toggleRepeat}
                        className={`flex flex-col items-center gap-1.5 transition ${repeatMode !== 'off' ? 'text-primary' : 'text-black/60 hover:text-black/90'}`}
                    >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${repeatMode !== 'off' ? 'bg-primary/20 text-primary' : 'bg-black/5'}`}>
                            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                        </div>
                        <span className="text-[10px] font-semibold uppercase">{repeatMode === 'off' ? 'Repetir' : repeatMode.toUpperCase()}</span>
                    </button>

                </div>
            </div>

        </div>
    )
}

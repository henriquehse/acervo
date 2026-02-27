import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '../contexts/PlayerContext'
import { formatTime, formatDuration, getProgressPercent } from '../utils/helpers'
import BookCover from './BookCover'
import {
    ChevronDown, Play, Pause, SkipBack, SkipForward,
    Repeat, Repeat1, Shuffle, Bookmark, BookmarkCheck,
    Moon, List, Volume2, VolumeX, Share2, MoreVertical, Clock
} from 'lucide-react'
import './FullPlayer.css'

export default function FullPlayer() {
    const {
        currentItem, isPlaying, currentTime, duration, speed,
        isFullPlayer, currentChapter, bookmarks, repeatMode,
        togglePlay, seekTo, seekRelative, cycleSpeed, setPlaybackSpeed,
        setIsFullPlayer, skipForward, skipBackward, addBookmark,
        toggleRepeat, setSleepTimer, volume, setVolume, isMuted, toggleMute
    } = usePlayer()

    const [showChapters, setShowChapters] = useState(false)
    const [showSpeed, setShowSpeed] = useState(false)
    const [showSleep, setShowSleep] = useState(false)
    const [bookmarkFeedback, setBookmarkFeedback] = useState(false)
    const progressRef = useRef(null)
    const isDragging = useRef(false)

    const progress = getProgressPercent(currentTime, duration)

    const handleProgressInteraction = useCallback((e) => {
        if (!progressRef.current) return
        const rect = progressRef.current.getBoundingClientRect()
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
        const pct = Math.max(0, Math.min(1, x / rect.width))
        seekTo(pct * duration)
    }, [duration, seekTo])

    const handleProgressStart = (e) => {
        isDragging.current = true
        handleProgressInteraction(e)
    }

    const handleProgressMove = (e) => {
        if (isDragging.current) handleProgressInteraction(e)
    }

    const handleProgressEnd = () => {
        isDragging.current = false
    }

    const handleBookmark = () => {
        addBookmark()
        setBookmarkFeedback(true)
        setTimeout(() => setBookmarkFeedback(false), 1500)
    }

    if (!currentItem || !isFullPlayer) return null

    const isBookmarked = bookmarks.some(b => b.itemId === currentItem.id && Math.abs(b.time - currentTime) < 5)

    const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0]
    const sleepOptions = [
        { label: '15 min', value: 15 },
        { label: '30 min', value: 30 },
        { label: '45 min', value: 45 },
        { label: '1 hora', value: 60 },
        { label: '2 horas', value: 120 },
        { label: 'Fim do capítulo', value: -1 },
    ]

    return (
        <AnimatePresence>
            <motion.div
                className="full-player"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                id="full-player"
            >
                {/* Background blur from cover gradient */}
                <div
                    className="full-player__bg"
                    style={{ background: currentItem.coverGradient }}
                />
                <div className="full-player__overlay" />

                {/* Header */}
                <div className="full-player__header">
                    <button
                        className="full-player__btn-icon"
                        onClick={() => setIsFullPlayer(false)}
                        aria-label="Minimizar player"
                        id="full-player-minimize"
                    >
                        <ChevronDown size={28} />
                    </button>
                    <div className="full-player__header-info">
                        <p className="full-player__header-label">REPRODUZINDO</p>
                        <p className="full-player__header-chapter">
                            {currentChapter?.title || currentItem.title}
                        </p>
                    </div>
                    <button
                        className="full-player__btn-icon"
                        aria-label="Mais opções"
                        id="full-player-more"
                    >
                        <MoreVertical size={22} />
                    </button>
                </div>

                {/* Cover Art */}
                <div className="full-player__cover-area">
                    <motion.div
                        className="full-player__cover-wrapper"
                        animate={{
                            scale: isPlaying ? 1 : 0.92,
                        }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    >
                        <div className="full-player__cover-shadow" style={{ background: currentItem.coverGradient }} />
                        <BookCover item={currentItem} size="full" />
                    </motion.div>
                </div>

                {/* Track Info */}
                <div className="full-player__track-info">
                    <div className="full-player__track-text">
                        <h2 className="full-player__title">{currentItem.title}</h2>
                        <p className="full-player__author">{currentItem.author}</p>
                    </div>
                    <button
                        className={`full-player__btn-icon ${bookmarkFeedback || isBookmarked ? 'full-player__btn-icon--active' : ''}`}
                        onClick={handleBookmark}
                        aria-label="Adicionar marcador"
                        id="full-player-bookmark"
                    >
                        {bookmarkFeedback || isBookmarked ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="full-player__progress-area">
                    <div
                        className="full-player__progress-track"
                        ref={progressRef}
                        onMouseDown={handleProgressStart}
                        onMouseMove={handleProgressMove}
                        onMouseUp={handleProgressEnd}
                        onMouseLeave={handleProgressEnd}
                        onTouchStart={handleProgressStart}
                        onTouchMove={handleProgressMove}
                        onTouchEnd={handleProgressEnd}
                        role="slider"
                        aria-label="Progresso"
                        aria-valuenow={Math.round(progress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div className="full-player__progress-fill" style={{ width: `${progress}%` }}>
                            <div className="full-player__progress-thumb" />
                        </div>
                    </div>
                    <div className="full-player__time">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration - currentTime)}</span>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="full-player__controls">
                    <button
                        className="full-player__btn-icon"
                        onClick={() => setShowSpeed(true)}
                        aria-label="Velocidade"
                        id="full-player-speed"
                    >
                        <span className="full-player__speed-label">{speed}x</span>
                    </button>

                    <button
                        className="full-player__btn-control"
                        onClick={skipBackward}
                        aria-label="Capítulo anterior"
                        id="full-player-prev"
                    >
                        <SkipBack size={28} fill="currentColor" />
                    </button>

                    <button
                        className="full-player__btn-control full-player__btn-seek"
                        onClick={() => seekRelative(-15)}
                        aria-label="Voltar 15 segundos"
                        id="full-player-rewind"
                    >
                        <span className="full-player__seek-num">15</span>
                        <svg className="full-player__seek-icon" viewBox="0 0 24 24" width="32" height="32">
                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor" />
                        </svg>
                    </button>

                    <button
                        className="full-player__btn-play"
                        onClick={togglePlay}
                        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                        id="full-player-play"
                    >
                        <motion.div
                            key={isPlaying ? 'pause' : 'play'}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        >
                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                        </motion.div>
                    </button>

                    <button
                        className="full-player__btn-control full-player__btn-seek"
                        onClick={() => seekRelative(30)}
                        aria-label="Avançar 30 segundos"
                        id="full-player-forward"
                    >
                        <span className="full-player__seek-num">30</span>
                        <svg className="full-player__seek-icon full-player__seek-icon--forward" viewBox="0 0 24 24" width="32" height="32">
                            <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="currentColor" />
                        </svg>
                    </button>

                    <button
                        className="full-player__btn-control"
                        onClick={skipForward}
                        aria-label="Próximo capítulo"
                        id="full-player-next"
                    >
                        <SkipForward size={28} fill="currentColor" />
                    </button>

                    <button
                        className={`full-player__btn-icon ${repeatMode !== 'off' ? 'full-player__btn-icon--active' : ''}`}
                        onClick={toggleRepeat}
                        aria-label="Repetir"
                        id="full-player-repeat"
                    >
                        {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                    </button>
                </div>

                {/* Bottom Actions */}
                <div className="full-player__actions">
                    <button
                        className="full-player__action-btn"
                        onClick={() => setShowChapters(true)}
                        id="full-player-chapters"
                    >
                        <List size={18} />
                        <span>Capítulos</span>
                    </button>
                    <button
                        className="full-player__action-btn"
                        onClick={() => setShowSleep(true)}
                        id="full-player-sleep"
                    >
                        <Moon size={18} />
                        <span>Timer</span>
                    </button>
                    <button
                        className="full-player__action-btn"
                        onClick={toggleMute}
                        id="full-player-mute"
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        <span>{isMuted ? 'Mudo' : 'Som'}</span>
                    </button>
                    <button className="full-player__action-btn" id="full-player-share">
                        <Share2 size={18} />
                        <span>Compartilhar</span>
                    </button>
                </div>

                {/* Chapters Sheet */}
                <AnimatePresence>
                    {showChapters && (
                        <motion.div
                            className="full-player__sheet-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowChapters(false)}
                        >
                            <motion.div
                                className="full-player__sheet"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="full-player__sheet-handle" />
                                <h3 className="full-player__sheet-title">Capítulos</h3>
                                <div className="full-player__chapter-list">
                                    {currentItem.chapters?.map((ch) => {
                                        const isActive = currentChapter?.id === ch.id
                                        return (
                                            <button
                                                key={ch.id}
                                                className={`full-player__chapter-item ${isActive ? 'full-player__chapter-item--active' : ''}`}
                                                onClick={() => {
                                                    seekTo(ch.start)
                                                    setShowChapters(false)
                                                }}
                                            >
                                                <div className="full-player__chapter-info">
                                                    <span className="full-player__chapter-num">{ch.id}</span>
                                                    <span className="full-player__chapter-name">{ch.title}</span>
                                                </div>
                                                <span className="full-player__chapter-dur">
                                                    {formatDuration(ch.end - ch.start)}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Speed Sheet */}
                <AnimatePresence>
                    {showSpeed && (
                        <motion.div
                            className="full-player__sheet-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSpeed(false)}
                        >
                            <motion.div
                                className="full-player__sheet full-player__sheet--compact"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="full-player__sheet-handle" />
                                <h3 className="full-player__sheet-title">Velocidade de Reprodução</h3>
                                <div className="full-player__speed-grid">
                                    {speedOptions.map((s) => (
                                        <button
                                            key={s}
                                            className={`full-player__speed-option ${speed === s ? 'full-player__speed-option--active' : ''}`}
                                            onClick={() => {
                                                setPlaybackSpeed(s)
                                                setShowSpeed(false)
                                            }}
                                        >
                                            {s}x
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sleep Timer Sheet */}
                <AnimatePresence>
                    {showSleep && (
                        <motion.div
                            className="full-player__sheet-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSleep(false)}
                        >
                            <motion.div
                                className="full-player__sheet full-player__sheet--compact"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="full-player__sheet-handle" />
                                <h3 className="full-player__sheet-title">
                                    <Clock size={20} />
                                    Timer de Sono
                                </h3>
                                <div className="full-player__sleep-list">
                                    {sleepOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className="full-player__sleep-option"
                                            onClick={() => {
                                                setSleepTimer(opt.value)
                                                setShowSleep(false)
                                            }}
                                        >
                                            <Moon size={16} />
                                            {opt.label}
                                        </button>
                                    ))}
                                    <button
                                        className="full-player__sleep-option full-player__sleep-option--cancel"
                                        onClick={() => {
                                            setSleepTimer(null)
                                            setShowSleep(false)
                                        }}
                                    >
                                        Desativar Timer
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bookmark Feedback Toast */}
                <AnimatePresence>
                    {bookmarkFeedback && (
                        <motion.div
                            className="full-player__toast"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <BookmarkCheck size={16} />
                            Marcador adicionado!
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    )
}

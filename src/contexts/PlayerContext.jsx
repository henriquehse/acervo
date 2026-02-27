import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { SPEED_OPTIONS } from '../utils/data'

const PlayerContext = createContext(null)

export const usePlayer = () => {
    const ctx = useContext(PlayerContext)
    if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
    return ctx
}

export const PlayerProvider = ({ children }) => {
    const [currentItem, setCurrentItem] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [speed, setSpeed] = useState(1.0)
    const [volume, setVolume] = useState(0.8)
    const [isMuted, setIsMuted] = useState(false)
    const [isFullPlayer, setIsFullPlayer] = useState(false)
    const [sleepTimer, setSleepTimer] = useState(null)
    const [currentChapter, setCurrentChapter] = useState(null)
    const [queue, setQueue] = useState([])
    const [isShuffled, setIsShuffled] = useState(false)
    const [repeatMode, setRepeatMode] = useState('off') // off, one, all
    const [bookmarks, setBookmarks] = useState([])

    const audioRef = useRef(null)
    const progressInterval = useRef(null)
    const sleepTimerRef = useRef(null)

    // Simulate audio playback with interval
    useEffect(() => {
        if (isPlaying && currentItem?.type === 'audiobook') {
            progressInterval.current = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + (speed * 0.1)
                    if (next >= duration) {
                        setIsPlaying(false)
                        return duration
                    }
                    return next
                })
            }, 100)
        }
        return () => clearInterval(progressInterval.current)
    }, [isPlaying, speed, duration, currentItem])

    // Update current chapter based on time
    useEffect(() => {
        if (currentItem?.chapters) {
            const chapter = currentItem.chapters.find(
                ch => currentTime >= ch.start && currentTime < ch.end
            )
            if (chapter && chapter.id !== currentChapter?.id) {
                setCurrentChapter(chapter)
            }
        }
    }, [currentTime, currentItem, currentChapter])

    // Sleep timer
    useEffect(() => {
        if (sleepTimer) {
            sleepTimerRef.current = setTimeout(() => {
                setIsPlaying(false)
                setSleepTimer(null)
            }, sleepTimer * 60 * 1000)
        }
        return () => clearTimeout(sleepTimerRef.current)
    }, [sleepTimer])

    const playItem = useCallback((item) => {
        setCurrentItem(item)
        setCurrentTime(item.currentTime || 0)
        setDuration(item.duration || 0)
        setIsPlaying(true)
        setCurrentChapter(item.chapters?.[0] || null)

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: item.title,
                artist: item.author,
                album: 'Acervo',
            })
            navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true))
            navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false))
            navigator.mediaSession.setActionHandler('seekbackward', () => seekRelative(-30))
            navigator.mediaSession.setActionHandler('seekforward', () => seekRelative(30))
        }
    }, [])

    const togglePlay = useCallback(() => {
        setIsPlaying(prev => !prev)
    }, [])

    const seekTo = useCallback((time) => {
        setCurrentTime(Math.max(0, Math.min(time, duration)))
    }, [duration])

    const seekRelative = useCallback((delta) => {
        setCurrentTime(prev => Math.max(0, Math.min(prev + delta, duration)))
    }, [duration])

    const cycleSpeed = useCallback(() => {
        setSpeed(prev => {
            const idx = SPEED_OPTIONS.indexOf(prev)
            return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]
        })
    }, [])

    const setPlaybackSpeed = useCallback((s) => {
        setSpeed(s)
    }, [])

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev)
    }, [])

    const skipToChapter = useCallback((chapter) => {
        setCurrentTime(chapter.start)
        setCurrentChapter(chapter)
    }, [])

    const skipForward = useCallback(() => {
        if (currentItem?.chapters && currentChapter) {
            const idx = currentItem.chapters.findIndex(ch => ch.id === currentChapter.id)
            if (idx < currentItem.chapters.length - 1) {
                skipToChapter(currentItem.chapters[idx + 1])
            }
        }
    }, [currentItem, currentChapter, skipToChapter])

    const skipBackward = useCallback(() => {
        if (currentItem?.chapters && currentChapter) {
            const idx = currentItem.chapters.findIndex(ch => ch.id === currentChapter.id)
            if (currentTime - currentChapter.start > 3) {
                seekTo(currentChapter.start)
            } else if (idx > 0) {
                skipToChapter(currentItem.chapters[idx - 1])
            }
        }
    }, [currentItem, currentChapter, currentTime, seekTo, skipToChapter])

    const addBookmark = useCallback(() => {
        if (!currentItem) return
        const bm = {
            id: Date.now(),
            itemId: currentItem.id,
            time: currentTime,
            chapter: currentChapter?.title || '',
            createdAt: new Date().toISOString()
        }
        setBookmarks(prev => [...prev, bm])
        return bm
    }, [currentItem, currentTime, currentChapter])

    const removeBookmark = useCallback((id) => {
        setBookmarks(prev => prev.filter(b => b.id !== id))
    }, [])

    const toggleRepeat = useCallback(() => {
        setRepeatMode(prev => {
            if (prev === 'off') return 'one'
            if (prev === 'one') return 'all'
            return 'off'
        })
    }, [])

    const value = {
        currentItem,
        isPlaying,
        currentTime,
        duration,
        speed,
        volume,
        isMuted,
        isFullPlayer,
        sleepTimer,
        currentChapter,
        queue,
        isShuffled,
        repeatMode,
        bookmarks,
        playItem,
        togglePlay,
        seekTo,
        seekRelative,
        cycleSpeed,
        setPlaybackSpeed,
        setVolume,
        toggleMute,
        setIsFullPlayer,
        setSleepTimer,
        skipToChapter,
        skipForward,
        skipBackward,
        addBookmark,
        removeBookmark,
        toggleRepeat,
        setIsShuffled,
        setQueue,
    }

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    )
}

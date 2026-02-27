import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { SPEED_OPTIONS } from '../utils/data'
import { useDrive } from './DriveContext'

const PlayerContext = createContext(null)

export const usePlayer = () => {
    const ctx = useContext(PlayerContext)
    if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
    return ctx
}

export const PlayerProvider = ({ children }) => {
    const { token } = useDrive()
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
    const [repeatMode, setRepeatMode] = useState('off')
    const [bookmarks, setBookmarks] = useState([])

    const audioRef = useRef(new Audio())
    const sleepTimerRef = useRef(null)

    // Sync state with audio element
    useEffect(() => {
        const audio = audioRef.current

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const handleEnded = () => {
            if (repeatMode === 'one') {
                audio.currentTime = 0
                audio.play()
            } else {
                setIsPlaying(false)
            }
        }

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [repeatMode])

    // Handle play/pause
    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Playback error:", e))
        } else {
            audioRef.current.pause()
        }
    }, [isPlaying])

    // Handle speed
    useEffect(() => {
        audioRef.current.playbackRate = speed
    }, [speed])

    // Handle volume
    useEffect(() => {
        audioRef.current.volume = volume
        audioRef.current.muted = isMuted
    }, [volume, isMuted])

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
        let src = item.audioUrl || item.src

        // If it's a Drive file, construct the authenticated URL
        if (item.driveId && token) {
            src = `https://www.googleapis.com/drive/v3/files/${item.driveId}?alt=media&access_token=${token}`
        }

        if (src) {
            audioRef.current.src = src
            audioRef.current.load()
            setCurrentItem(item)
            setIsPlaying(true)
            setIsFullPlayer(true)

            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: item.title,
                    artist: item.author || 'Acervo',
                    album: 'Biblioteca Digital',
                    artwork: item.thumbnail ? [{ src: item.thumbnail, sizes: '96x96', type: 'image/png' }] : []
                })
            }
        } else if (item.type === 'ebook' || item.type === 'video-summary' || item.type === 'finance') {
            // For non-audio items, we just set the current item and let the UI handle it (e.g. open PDF)
            setCurrentItem(item)
            setIsFullPlayer(true)
            if (item.type === 'video-summary' || item.type === 'finance') {
                // Open in new tab for now as a quick solution
                window.open(item.webViewLink || `https://drive.google.com/file/d/${item.driveId}/view`, '_blank')
            }
        }
    }, [token])

    const togglePlay = useCallback(() => setIsPlaying(prev => !prev), [])
    const seekTo = useCallback((time) => { audioRef.current.currentTime = time }, [])
    const seekRelative = useCallback((delta) => { audioRef.current.currentTime += delta }, [])

    const cycleSpeed = useCallback(() => {
        setSpeed(prev => {
            const idx = SPEED_OPTIONS.indexOf(prev)
            return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]
        })
    }, [])

    const setPlaybackSpeed = useCallback((s) => setSpeed(s), [])
    const toggleMute = useCallback(() => setIsMuted(prev => !prev), [])
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
        addBookmark,
        toggleRepeat,
        setBookmarks,
    }

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    )
}

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
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)

    // Audio States
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [speed, setSpeed] = useState(1.0)
    const [volume, setVolume] = useState(0.8)
    const [isMuted, setIsMuted] = useState(false)
    const [isFullPlayer, setIsFullPlayer] = useState(false)
    const [sleepTimer, setSleepTimer] = useState(null)
    const [repeatMode, setRepeatMode] = useState('off')
    const [bookmarks, setBookmarks] = useState([])

    // PDF Viewer State
    const [currentPdfItem, setCurrentPdfItem] = useState(null)

    const audioRef = useRef(new Audio())
    const sleepTimerRef = useRef(null)

    // Force preserve pitch (premium player feature)
    useEffect(() => {
        if ('preservesPitch' in audioRef.current) {
            audioRef.current.preservesPitch = true
        } else if ('mozPreservesPitch' in audioRef.current) {
            audioRef.current.mozPreservesPitch = true
        } else if ('webkitPreservesPitch' in audioRef.current) {
            audioRef.current.webkitPreservesPitch = true
        }
    }, [])

    const playNextTrack = useCallback(() => {
        if (!currentItem?.isMultiTrack) return false
        if (currentTrackIndex < currentItem.tracks.length - 1) {
            playItem(currentItem, currentTrackIndex + 1)
            return true
        }
        return false
    }, [currentItem, currentTrackIndex])

    const playPrevTrack = useCallback(() => {
        if (!currentItem?.isMultiTrack) return false
        if (currentTrackIndex > 0) {
            playItem(currentItem, currentTrackIndex - 1)
            return true
        }
        return false
    }, [currentItem, currentTrackIndex])

    // Sync state with audio element
    useEffect(() => {
        const audio = audioRef.current

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const handleEnded = () => {
            if (currentItem?.isMultiTrack && currentTrackIndex < currentItem.tracks.length - 1) {
                playNextTrack()
                return
            }
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
    }, [repeatMode, currentItem, currentTrackIndex, playNextTrack])

    // Handle play/pause
    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Playback error:", e))
        } else {
            audioRef.current.pause()
        }
    }, [isPlaying, currentItem, currentTrackIndex])

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

    // Main Play Function
    const playItem = useCallback((item, trackIdx = 0) => {
        // Videos and Finance: open in Drive directly
        if (item.type === 'video-summary' || item.type === 'finance') {
            const link = item.webViewLink || `https://drive.google.com/file/d/${item.driveId}/view`
            window.open(link, '_blank', 'noopener,noreferrer')
            return
        }

        // Ebooks: Use Google Drive Viewer (100% reliable, no CORS issues)
        if (item.type === 'ebook') {
            const driveViewerUrl = item.driveId
                ? `https://drive.google.com/file/d/${item.driveId}/view`
                : item.webViewLink
            if (driveViewerUrl) {
                window.open(driveViewerUrl, '_blank', 'noopener,noreferrer')
            }
            return
        }

        // Audiobooks: Stream via Drive API with current token
        const currentToken = token || localStorage.getItem('gdrive_token')
        let src = item.audioUrl || item.src

        if (item.isMultiTrack && item.tracks?.length > 0) {
            setCurrentTrackIndex(trackIdx)
            const track = item.tracks[trackIdx]
            src = `https://www.googleapis.com/drive/v3/files/${track.driveId}?alt=media&access_token=${currentToken}`
        } else if (item.driveId && currentToken) {
            src = `https://www.googleapis.com/drive/v3/files/${item.driveId}?alt=media&access_token=${currentToken}`
        }

        if (src) {
            audioRef.current.src = src
            audioRef.current.load()
            setCurrentItem(item)
            setIsPlaying(true)
            setIsFullPlayer(true)

            if ('mediaSession' in navigator) {
                const trackName = item.isMultiTrack ? ` - Faixa ${trackIdx + 1}` : ''
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: item.title + trackName,
                    artist: item.author || 'Acervo',
                    album: 'Biblioteca Digital',
                    artwork: item.thumbnail ? [{ src: item.thumbnail, sizes: '512x512', type: 'image/png' }] : []
                })

                // Set MediaSession Actions for MultiTrack
                navigator.mediaSession.setActionHandler('previoustrack', item.isMultiTrack ? playPrevTrack : null)
                navigator.mediaSession.setActionHandler('nexttrack', item.isMultiTrack ? playNextTrack : null)
                navigator.mediaSession.setActionHandler('seekbackward', () => { audioRef.current.currentTime -= 10 })
                navigator.mediaSession.setActionHandler('seekforward', () => { audioRef.current.currentTime += 10 })
            }
        }
    }, [token, playNextTrack, playPrevTrack])

    const closePdfViewer = useCallback(() => setCurrentPdfItem(null), [])

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
            chapter: currentItem.isMultiTrack ? currentItem.tracks[currentTrackIndex].name : '',
            createdAt: new Date().toISOString()
        }
        setBookmarks(prev => [...prev, bm])
        return bm
    }, [currentItem, currentTime, currentTrackIndex])

    const toggleRepeat = useCallback(() => {
        setRepeatMode(prev => {
            if (prev === 'off') return 'one'
            if (prev === 'one') return 'all'
            return 'off'
        })
    }, [])

    const value = {
        currentItem,
        currentTrackIndex,
        isPlaying,
        currentTime,
        duration,
        speed,
        volume,
        isMuted,
        isFullPlayer,
        sleepTimer,
        currentChapter: currentItem?.isMultiTrack ? currentItem.tracks[currentTrackIndex].name : null,
        repeatMode,
        bookmarks,
        currentPdfItem,

        playItem,
        playNextTrack,
        playPrevTrack,
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
        closePdfViewer
    }

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    )
}

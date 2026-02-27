import { usePlayer } from '../contexts/PlayerContext'
import { Play, Pause, SkipForward } from 'lucide-react'
import { getProgressPercent } from '../utils/helpers'
import BookCover from './BookCover'
import './MiniPlayer.css'

export default function MiniPlayer() {
    const { currentItem, isPlaying, togglePlay, currentTime, duration, setIsFullPlayer, skipForward } = usePlayer()

    if (!currentItem) return null

    const progress = getProgressPercent(currentTime, duration)

    return (
        <div className="mini-player" id="mini-player" onClick={() => setIsFullPlayer(true)}>
            <div className="mini-player__progress" style={{ width: `${progress}%` }} />
            <div className="mini-player__content">
                <BookCover item={currentItem} size="xs" />
                <div className="mini-player__info">
                    <p className="mini-player__title">{currentItem.title}</p>
                    <p className="mini-player__author">{currentItem.author}</p>
                </div>
                <div className="mini-player__controls">
                    <button
                        className="mini-player__btn"
                        onClick={(e) => { e.stopPropagation(); togglePlay() }}
                        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                        id="mini-player-play"
                    >
                        {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                    </button>
                    <button
                        className="mini-player__btn"
                        onClick={(e) => { e.stopPropagation(); skipForward() }}
                        aria-label="Próximo capítulo"
                        id="mini-player-next"
                    >
                        <SkipForward size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}

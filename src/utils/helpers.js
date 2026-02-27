export const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatDuration = (seconds) => {
    if (!seconds) return ''
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs > 0) {
        return `${hrs}h ${mins}min`
    }
    return `${mins}min`
}

export const getProgressPercent = (current, total) => {
    if (!total) return 0
    return Math.min(100, Math.max(0, (current / total) * 100))
}

export const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

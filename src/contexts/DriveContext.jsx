import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useGoogleLogin } from '@react-oauth/google'

const DriveContext = createContext(null)

export const useDrive = () => {
    const ctx = useContext(DriveContext)
    if (!ctx) throw new Error('useDrive must be used within DriveProvider')
    return ctx
}

// These are the core folders the user cares about
const FOLDERS = {
    AUDIOBOOKS: '1-6gsrxIJVE9k4eEBVSWEnloFKZQ56_ap',
    EBOOKS: '1KgyMW0W9e_7PqYn51o36FgW-hXH54AGU',
    VIDEOS: '15j1UHlL6rOyg93PjdBFsSfoXaop7hlDv',
    FINANCE: '1egQtgh8iZtjOG-N67QPb6yObqbUzc0hn'
}

async function fetchAllFiles(query, token) {
    let allFiles = []
    let nextPageToken = null
    do {
        const url = new URL('https://www.googleapis.com/drive/v3/files')
        url.searchParams.set('q', query)
        url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,modifiedTime,thumbnailLink,webViewLink,parents,size)')
        url.searchParams.set('pageSize', '1000')
        url.searchParams.set('supportsAllDrives', 'true')
        url.searchParams.set('includeItemsFromAllDrives', 'true')
        url.searchParams.set('corpora', 'allDrives')
        if (nextPageToken) url.searchParams.set('pageToken', nextPageToken)

        try {
            const res = await axios.get(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
            allFiles = allFiles.concat(res.data.files || [])
            nextPageToken = res.data.nextPageToken || null
        } catch (e) {
            console.error('[Acervo Sync] Fetch Error:', e)
            throw e
        }
    } while (nextPageToken)
    return allFiles
}

function getHighResThumb(thumbnailLink) {
    if (!thumbnailLink) return null
    return thumbnailLink.replace(/=s\d+/, '=s1000')
}

export const DriveProvider = ({ children }) => {
    const [driveItems, setDriveItems] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('gdrive_token'))

    const handleLogout = useCallback(() => {
        setToken(null)
        setDriveItems([])
        setError(null)
        localStorage.removeItem('gdrive_token')
    }, [])

    const fetchDriveFiles = useCallback(async (accessToken) => {
        if (!accessToken) return
        setIsLoading(true)
        setError(null)
        console.log('[Acervo] Starting Deep Sync...')

        try {
            // 1. Get ALL files from the 4 targeted roots (Recursive Search)
            // Query: find all items that have any of our root folders as parents
            const rootParents = Object.values(FOLDERS).map(id => `'${id}' in parents`).join(' or ')
            const rootsQuery = `trashed = false and (${rootParents})`
            const rootItems = await fetchAllFiles(rootsQuery, accessToken)

            // 2. Identify Subfolders to scan deeper
            const subFolders = rootItems.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
            let deepFiles = []

            if (subFolders.length > 0) {
                const chunkSize = 20
                for (let i = 0; i < subFolders.length; i += chunkSize) {
                    const chunk = subFolders.slice(i, i + chunkSize)
                    const subQ = `trashed = false and (${chunk.map(sf => `'${sf.id}' in parents`).join(' or ')})`
                    const results = await fetchAllFiles(subQ, accessToken)
                    deepFiles = deepFiles.concat(results)
                }
            }

            // 3. Flatten all candidates
            const allCandidates = [...rootItems.filter(f => f.mimeType !== 'application/vnd.google-apps.folder'), ...deepFiles]
            const finalItems = []
            const processedIds = new Set()

            // 4. Group Multi-track (Folders containing mostly audios)
            const folderContents = {}
            allCandidates.forEach(f => {
                if (!f.parents?.[0]) return
                if (!folderContents[f.parents[0]]) folderContents[f.parents[0]] = []
                folderContents[f.parents[0]].push(f)
            })

            const folderMeta = {}
            subFolders.forEach(f => folderMeta[f.id] = f)

            Object.keys(folderContents).forEach(pid => {
                const contents = folderContents[pid]
                const audios = contents.filter(f => f.mimeType.startsWith('audio/') || f.name.match(/\.(mp3|m4a|wav|aac)$/i))

                if (audios.length > 2) {
                    const sorted = audios.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                    const cover = contents.find(f => f.mimeType.startsWith('image/'))
                    const folderName = folderMeta[pid]?.name || sorted[0].name.split('-')[0] || 'Audiobook'

                    finalItems.push({
                        id: `folder-${pid}`,
                        title: folderName,
                        author: 'Meu Drive',
                        type: 'audiobook',
                        isMultiTrack: true,
                        tracks: sorted.map(a => ({ id: a.id, name: a.name, driveId: a.id })),
                        thumbnail: getHighResThumb(cover?.thumbnailLink || sorted[0].thumbnailLink),
                        coverGradient: 'linear-gradient(135deg, #d46a43 0%, #7c2d12 100%)'
                    })
                    audios.forEach(a => processedIds.add(a.id))
                }
            })

            // 5. Process Loose Files
            allCandidates.forEach(f => {
                if (processedIds.has(f.id)) return

                let type = 'other'
                let gradient = 'linear-gradient(135deg, #6b7280 0%, #343a40 100%)'
                const name = f.name.toLowerCase()
                const mime = f.mimeType.toLowerCase()

                if (mime.startsWith('audio/') || name.match(/\.(mp3|m4a|wav|aac|ogg)$/)) {
                    type = 'audiobook'
                    gradient = 'linear-gradient(135deg, #d46a43 0%, #7c2d12 100%)'
                } else if (mime === 'application/pdf' || name.endsWith('.pdf')) {
                    type = 'ebook'
                    gradient = 'linear-gradient(135deg, #1e40af 0%, #172554 100%)'
                } else if (mime.includes('video') || name.match(/\.(mp4|mov|avi|mkv)$/)) {
                    type = 'video-summary'
                    gradient = 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)'
                }

                finalItems.push({
                    id: f.id,
                    title: f.name.replace(/\.[^/.]+$/, ''),
                    author: 'Meu Drive',
                    type,
                    driveId: f.id,
                    webViewLink: f.webViewLink,
                    thumbnail: getHighResThumb(f.thumbnailLink),
                    coverGradient: gradient
                })
            })

            setDriveItems(finalItems)
            console.log(`[Acervo Sync] Complete! Total items: ${finalItems.length}`)

        } catch (err) {
            console.error('[Acervo Sync] Critical Error:', err)
            setError('Fez login mas não puxou? Tente desconectar e conectar novamente.')
            if (err.response?.status === 401) handleLogout()
        } finally {
            setIsLoading(false)
        }
    }, [handleLogout])

    const login = useGoogleLogin({
        onSuccess: (res) => {
            const t = res.access_token
            setToken(t)
            localStorage.setItem('gdrive_token', t)
            fetchDriveFiles(t)
        },
        scope: 'https://www.googleapis.com/auth/drive.readonly'
    })

    useEffect(() => {
        if (token) fetchDriveFiles(token)
    }, []) // eslint-disable-line

    return (
        <DriveContext.Provider value={{
            driveItems, isLoading, error, isConnected: !!token, token, login, logout: handleLogout, refresh: () => token && fetchDriveFiles(token)
        }}>
            {children}
        </DriveContext.Provider>
    )
}

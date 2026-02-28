import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useGoogleLogin } from '@react-oauth/google'

const DriveContext = createContext(null)

export const useDrive = () => {
    const ctx = useContext(DriveContext)
    if (!ctx) throw new Error('useDrive must be used within DriveProvider')
    return ctx
}

const FOLDERS = {
    AUDIOBOOKS: '1-6gsrxIJVE9k4eEBVSWEnloFKZQ56_ap',
    EBOOKS: '1KgyMW0W9e_7PqYn51o36FgW-hXH54AGU',
    VIDEOS: '15j1UHlL6rOyg93PjdBFsSfoXaop7hlDv',
    FINANCE: '1egQtgh8iZtjOG-N67QPb6yObqbUzc0hn'
}

// Helper to fetch all pages for a given query
async function fetchAllFiles(query, token) {
    let allFiles = []
    let nextPageToken = null
    do {
        const url = new URL('https://www.googleapis.com/drive/v3/files')
        url.searchParams.set('q', query)
        url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,modifiedTime,thumbnailLink,webViewLink,parents,size)')
        url.searchParams.set('pageSize', '1000') // Max per page
        if (nextPageToken) url.searchParams.set('pageToken', nextPageToken)

        try {
            const res = await axios.get(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
            allFiles = allFiles.concat(res.data.files || [])
            nextPageToken = res.data.nextPageToken || null
        } catch (e) {
            console.error('[Acervo] Error fetching chunk:', e)
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
    const tokenRef = useRef(token)

    const handleLogout = useCallback(() => {
        setToken(null)
        setDriveItems([])
        setError(null)
        localStorage.removeItem('gdrive_token')
        tokenRef.current = null
    }, [])

    const fetchDriveFiles = useCallback(async (accessToken) => {
        if (!accessToken) return
        setIsLoading(true)
        setError(null)

        try {
            // STEP 1: Fetch EVERYTHING from all folders (recursive-like flat search)
            // Using "shortcut" to find all files that have any of our root folders as parents
            const query = `(
                '${FOLDERS.AUDIOBOOKS}' in parents or 
                '${FOLDERS.EBOOKS}' in parents or 
                '${FOLDERS.VIDEOS}' in parents or 
                '${FOLDERS.FINANCE}' in parents
            ) and trashed = false`

            const rawFiles = await fetchAllFiles(query, accessToken)
            console.log(`[Acervo Sync] Found ${rawFiles.length} raw files/folders in roots.`)

            // STEP 2: Handle Subfolders (Dive deep once)
            const subFolders = rawFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
            let deepFiles = []

            if (subFolders.length > 0) {
                // Batch query for efficiency
                const chunkSize = 25
                for (let i = 0; i < subFolders.length; i += chunkSize) {
                    const chunk = subFolders.slice(i, i + chunkSize)
                    const parentsQ = chunk.map(sf => `'${sf.id}' in parents`).join(' or ')
                    const subQ = `(${parentsQ}) and trashed = false`
                    const chunkFiles = await fetchAllFiles(subQ, accessToken)
                    deepFiles = deepFiles.concat(chunkFiles)
                }
            }

            // STEP 3: Classification engine (Loose Files + Folders)
            const allFiles = [...rawFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder'), ...deepFiles]
            const items = []

            // Group files by parent to handle "Multi-track" folders
            const folderContentMap = {}
            allFiles.forEach(f => {
                const pid = f.parents?.[0]
                if (!pid) return
                if (!folderContentMap[pid]) folderContentMap[pid] = []
                folderContentMap[pid].push(f)
            })

            // Meta-map for folder names
            const folderMetadata = {}
            subFolders.forEach(f => folderMetadata[f.id] = f)

            // 1. Process Folders as potentially grouped items
            Object.keys(folderContentMap).forEach(fid => {
                const contents = folderContentMap[fid]
                const audios = contents.filter(f => f.mimeType.startsWith('audio/') || f.name.match(/\.(mp3|m4a|wav|aac)$/i))
                const info = folderMetadata[fid] || { name: 'Pasta' }

                if (audios.length > 1) {
                    // It's a Multi-track Audiobook
                    const cover = contents.find(f => f.mimeType.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png)$/i))
                    const sortedAudios = audios.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

                    items.push({
                        id: `folder-${fid}`,
                        title: info.name,
                        author: 'Meu Drive',
                        type: 'audiobook',
                        isMultiTrack: true,
                        tracks: sortedAudios.map(a => ({ id: a.id, name: a.name, driveId: a.id })),
                        thumbnail: getHighResThumb(cover?.thumbnailLink || audios[0].thumbnailLink),
                        coverGradient: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)'
                    })
                    // Remove these audios from loose processing
                    audios.forEach(a => a._processed = true)
                }
            })

            // 2. Process all loose files (including those in small subfolders)
            allFiles.forEach(f => {
                if (f._processed) return

                let type = 'other'
                let gradient = 'linear-gradient(135deg, #6b7280 0%, #374151 100%)'

                const name = f.name.toLowerCase()
                const mime = f.mimeType.toLowerCase()

                if (mime.startsWith('audio/') || name.match(/\.(mp3|m4a|wav|aac|ogg)$/)) {
                    type = 'audiobook'
                    gradient = 'linear-gradient(135deg, #d46a43 0%, #a84a2d 100%)'
                } else if (mime === 'application/pdf' || mime.includes('epub') || name.endsWith('.pdf') || name.endsWith('.epub')) {
                    if (f.parents?.includes(FOLDERS.FINANCE)) {
                        type = 'finance'
                        gradient = 'linear-gradient(135deg, #059669 0%, #064e3b 100%)'
                    } else {
                        type = 'ebook'
                        gradient = 'linear-gradient(135deg, #5b21b6 0%, #1e3a8a 100%)'
                    }
                } else if (mime.startsWith('video/') || name.match(/\.(mp4|mov|avi|mkv|webm)$/)) {
                    type = 'video-summary'
                    gradient = 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)'
                } else if (f.parents?.includes(FOLDERS.FINANCE)) {
                    type = 'finance'
                    gradient = 'linear-gradient(135deg, #059669 0%, #064e3b 100%)'
                }

                items.push({
                    id: f.id,
                    title: f.name.replace(/\.[^/.]+$/, ''),
                    author: 'Meu Drive',
                    type,
                    driveId: f.id,
                    webViewLink: f.webViewLink,
                    thumbnail: getHighResThumb(f.thumbnailLink),
                    coverGradient: gradient,
                    modifyTime: f.modifiedTime
                })
            })

            setDriveItems(items)
            console.log(`[Acervo Sync] Available: ${items.length} items.`)
        } catch (err) {
            console.error('[Acervo Sync Error]', err)
            setError('Falha ao puxar arquivos. Tente reconectar.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    const login = useGoogleLogin({
        onSuccess: (res) => {
            const token = res.access_token
            setToken(token)
            localStorage.setItem('gdrive_token', token)
            fetchDriveFiles(token)
        },
        scope: 'https://www.googleapis.com/auth/drive.readonly'
    })

    const refresh = useCallback(() => {
        if (token) fetchDriveFiles(token)
    }, [token, fetchDriveFiles])

    useEffect(() => {
        if (token) fetchDriveFiles(token)
    }, [token, fetchDriveFiles])

    return (
        <DriveContext.Provider value={{
            driveItems, isLoading, error, isConnected: !!token, token, login, logout: handleLogout, refresh
        }}>
            {children}
        </DriveContext.Provider>
    )
}

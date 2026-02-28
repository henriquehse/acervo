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
        url.searchParams.set('pageSize', '1000')
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

// Extract max res image from thumbnail
function getHighResThumb(thumbnailLink) {
    if (!thumbnailLink) return null
    return thumbnailLink.replace(/=s\d+/, '=s1000') // force 1000px instead of 220px
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
            // 1. Fetch direct children of the 4 root folders
            const rootQuery = `(
                '${FOLDERS.AUDIOBOOKS}' in parents or 
                '${FOLDERS.EBOOKS}' in parents or 
                '${FOLDERS.VIDEOS}' in parents or 
                '${FOLDERS.FINANCE}' in parents
            ) and trashed = false`

            const rootFiles = await fetchAllFiles(rootQuery, accessToken)

            // 2. Separate folders from standalone files
            const subFolders = rootFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
            let subFiles = []

            // 3. Fetch contents of those subfolders
            if (subFolders.length > 0) {
                const CHUNK_SIZE = 30
                for (let i = 0; i < subFolders.length; i += CHUNK_SIZE) {
                    const chunk = subFolders.slice(i, i + CHUNK_SIZE)
                    const parentsQ = chunk.map(sf => `'${sf.id}' in parents`).join(' or ')
                    const subQ = `(${parentsQ}) and trashed = false`
                    const chunkFiles = await fetchAllFiles(subQ, accessToken)
                    subFiles = subFiles.concat(chunkFiles)
                }
            }

            // 4. Combine and group into an intelligent library!
            const items = []

            // Map subfolders by ID so we can get their names easily
            const folderMap = new Map()
            subFolders.forEach(sf => folderMap.set(sf.id, sf))

            // Group subfiles by parent folder
            const groupsByFolder = {}
            subFiles.forEach(f => {
                const pid = f.parents?.[0]
                if (!pid) return
                if (!groupsByFolder[pid]) groupsByFolder[pid] = { audios: [], docs: [], images: [], videos: [] }

                if (f.mimeType.startsWith('audio/')) groupsByFolder[pid].audios.push(f)
                else if (f.mimeType.startsWith('video/')) groupsByFolder[pid].videos.push(f)
                else if (f.mimeType.startsWith('image/')) groupsByFolder[pid].images.push(f)
                else groupsByFolder[pid].docs.push(f)
            })

            // Process folders (Multi-track Audiobooks & Complex Folders)
            Object.keys(groupsByFolder).forEach(folderId => {
                const grp = groupsByFolder[folderId]
                const folderInfo = folderMap.get(folderId) || { name: 'Pasta Desconhecida' }

                // Try to find a cover image (prioritize files named cover/capa)
                let coverImg = grp.images.find(img => img.name.match(/cover|capa|front/i))
                if (!coverImg && grp.images.length > 0) coverImg = grp.images[0]
                const highResCover = coverImg ? getHighResThumb(coverImg.thumbnailLink) : null

                if (grp.audios.length > 0) {
                    // Sort audio files alphabetically to construct playable tracks
                    const sortedTracks = grp.audios.sort((a, b) => a.name.localeCompare(b.name)).map(t => ({
                        id: t.id,
                        name: t.name,
                        driveId: t.id,
                        mimeType: t.mimeType
                    }))

                    items.push({
                        id: `folder-${folderId}`, // unique ID for the whole audiobook
                        isMultiTrack: true,
                        driveId: sortedTracks[0].driveId, // First track fallback
                        tracks: sortedTracks,
                        title: folderInfo.name,
                        author: 'Meu Drive',
                        type: 'audiobook',
                        thumbnail: highResCover,
                        coverGradient: highResCover ? null : 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)'
                    })
                }
            })

            // Process loose files (Single-track items, standalone PDFs)
            const looseFiles = rootFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder')
            looseFiles.forEach(f => {
                const highResThumb = getHighResThumb(f.thumbnailLink)

                let type = 'other'
                let color = 'linear-gradient(135deg, #6b7280 0%, #374151 100%)'

                if (f.mimeType.startsWith('audio/')) { type = 'audiobook'; color = 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }
                else if (f.mimeType.startsWith('video/')) { type = 'video-summary'; color = 'linear-gradient(135deg, #dc2626 0%, #d97706 100%)' }
                else if (f.mimeType === 'application/pdf' || f.mimeType === 'application/epub+zip') {
                    if (f.parents?.includes(FOLDERS.FINANCE)) { type = 'finance'; color = 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' }
                    else { type = 'ebook'; color = 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)' }
                }

                items.push({
                    id: `file-${f.id}`,
                    isMultiTrack: false,
                    driveId: f.id,
                    title: f.name.replace(/\.[^/.]+$/, ''),
                    author: 'Meu Drive',
                    type,
                    mimeType: f.mimeType,
                    webViewLink: f.webViewLink,
                    thumbnail: highResThumb,
                    coverGradient: highResThumb ? null : color
                })
            })

            console.log(`[Acervo Smart Drive] Loaded ${items.length} intelligent items (folders combined).`)
            setDriveItems(items)
        } catch (err) {
            console.error('[Acervo] Drive fetch error:', err?.response?.data || err.message)
            if (err?.response?.status === 401) {
                setError('Sessão expirada. Por favor, reconecte o Google Drive.')
                handleLogout()
            } else {
                setError('Erro ao buscar arquivos. Verifique a conexão.')
            }
        } finally {
            setIsLoading(false)
        }
    }, [handleLogout])

    const login = useGoogleLogin({
        onSuccess: (response) => {
            const accessToken = response.access_token
            setToken(accessToken)
            tokenRef.current = accessToken
            localStorage.setItem('gdrive_token', accessToken)
            fetchDriveFiles(accessToken)
        },
        onError: (err) => {
            console.error('[Acervo] Google login error:', err)
            setError('Erro no login com Google.')
        },
        scope: 'https://www.googleapis.com/auth/drive.readonly',
    })

    useEffect(() => {
        if (token) fetchDriveFiles(token)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const refresh = useCallback(() => {
        if (token) fetchDriveFiles(token)
    }, [token, fetchDriveFiles])

    return (
        <DriveContext.Provider value={{
            login, logout: handleLogout, refresh, driveItems, isLoading, error,
            isConnected: !!token, token, folders: FOLDERS,
        }}>
            {children}
        </DriveContext.Provider>
    )
}

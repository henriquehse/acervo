import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useGoogleLogin } from '@react-oauth/google'

const DriveContext = createContext(null)

export const useDrive = () => {
    const ctx = useContext(DriveContext)
    if (!ctx) throw new Error('useDrive must be used within DriveProvider')
    return ctx
}

// These are the 4 shared folder IDs from the user's Google Drive
const FOLDERS = {
    AUDIOBOOKS: '1-6gsrxIJVE9k4eEBVSWEnloFKZQ56_ap',
    EBOOKS: '1KgyMW0W9e_7PqYn51o36FgW-hXH54AGU',
    VIDEOS: '15j1UHlL6rOyg93PjdBFsSfoXaop7hlDv',
    FINANCE: '1egQtgh8iZtjOG-N67QPb6yObqbUzc0hn'
}

function classifyFile(file) {
    const mime = file.mimeType || ''
    const parents = file.parents || []

    // Type detection by mimeType first (most accurate)
    if (mime.startsWith('audio/')) {
        return { type: 'audiobook', color: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }
    }
    if (mime.startsWith('video/')) {
        return { type: 'video-summary', color: 'linear-gradient(135deg, #dc2626 0%, #d97706 100%)' }
    }
    if (mime === 'application/pdf' || mime === 'application/epub+zip') {
        // Determine if it's a finance doc or ebook by parent folder
        if (parents.some(p => p === FOLDERS.FINANCE)) {
            return { type: 'finance', color: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' }
        }
        return { type: 'ebook', color: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)' }
    }
    // Google Workspace types
    if (mime.includes('spreadsheet') || mime.includes('presentation')) {
        return { type: 'finance', color: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' }
    }

    // Fallback: classify by folder
    if (parents.some(p => p === FOLDERS.AUDIOBOOKS)) {
        return { type: 'audiobook', color: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }
    }
    if (parents.some(p => p === FOLDERS.EBOOKS)) {
        return { type: 'ebook', color: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)' }
    }
    if (parents.some(p => p === FOLDERS.VIDEOS)) {
        return { type: 'video-summary', color: 'linear-gradient(135deg, #dc2626 0%, #d97706 100%)' }
    }
    if (parents.some(p => p === FOLDERS.FINANCE)) {
        return { type: 'finance', color: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' }
    }

    return { type: 'other', color: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)' }
}

// Fetch ALL pages of files from Drive API
async function fetchAllFiles(query, token) {
    let allFiles = []
    let nextPageToken = null

    do {
        const url = new URL('https://www.googleapis.com/drive/v3/files')
        url.searchParams.set('q', query)
        url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,modifiedTime,thumbnailLink,webViewLink,iconLink,parents,size)')
        url.searchParams.set('pageSize', '1000')
        url.searchParams.set('orderBy', 'name')
        if (nextPageToken) url.searchParams.set('pageToken', nextPageToken)

        const res = await axios.get(url.toString(), {
            headers: { Authorization: `Bearer ${token}` }
        })

        allFiles = allFiles.concat(res.data.files || [])
        nextPageToken = res.data.nextPageToken || null
    } while (nextPageToken)

    return allFiles
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
            // Query all 4 folders at once
            const query = `(
                '${FOLDERS.AUDIOBOOKS}' in parents or 
                '${FOLDERS.EBOOKS}' in parents or 
                '${FOLDERS.VIDEOS}' in parents or 
                '${FOLDERS.FINANCE}' in parents
            ) and trashed = false`

            const files = await fetchAllFiles(query, accessToken)
            console.log(`[Acervo] Fetched ${files.length} files from Drive`)

            const items = files.map(file => {
                const { type, color } = classifyFile(file)
                return {
                    id: `drive-${file.id}`,
                    driveId: file.id,
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    filename: file.name,
                    author: 'Minha Biblioteca',
                    type,
                    mimeType: file.mimeType,
                    coverGradient: color,
                    thumbnail: file.thumbnailLink || null,
                    webViewLink: file.webViewLink || null,
                    modifiedTime: file.modifiedTime,
                    size: file.size || null,
                }
            })

            setDriveItems(items)
            console.log('[Acervo] Classified items:', {
                audiobooks: items.filter(i => i.type === 'audiobook').length,
                ebooks: items.filter(i => i.type === 'ebook').length,
                videos: items.filter(i => i.type === 'video-summary').length,
                finance: items.filter(i => i.type === 'finance').length,
            })
        } catch (err) {
            console.error('[Acervo] Drive fetch error:', err?.response?.data || err.message)
            if (err?.response?.status === 401) {
                // Token expired - clear it so user can re-login
                console.warn('[Acervo] Token expired, logging out')
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

    // On mount: try to use stored token
    useEffect(() => {
        if (token) {
            fetchDriveFiles(token)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const refresh = useCallback(() => {
        if (token) fetchDriveFiles(token)
    }, [token, fetchDriveFiles])

    return (
        <DriveContext.Provider value={{
            login,
            logout: handleLogout,
            refresh,
            driveItems,
            isLoading,
            error,
            isConnected: !!token,
            token,
            folders: FOLDERS,
        }}>
            {children}
        </DriveContext.Provider>
    )
}

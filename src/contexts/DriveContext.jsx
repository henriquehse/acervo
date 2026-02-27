import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useGoogleLogin } from '@react-oauth/google'

const DriveContext = createContext(null)

export const useDrive = () => {
    const ctx = useContext(DriveContext)
    if (!ctx) throw new Error('useDrive must be used within DriveProvider')
    return ctx
}

export const DriveProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [driveItems, setDriveItems] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [token, setToken] = useState(localStorage.getItem('gdrive_token'))

    const login = useGoogleLogin({
        onSuccess: (response) => {
            setToken(response.access_token)
            localStorage.setItem('gdrive_token', response.access_token)
            fetchDriveFiles(response.access_token)
        },
        scope: 'https://www.googleapis.com/auth/drive.readonly',
    })

    const logout = () => {
        setToken(null)
        setDriveItems([])
        setUser(null)
        localStorage.removeItem('gdrive_token')
    }

    const fetchDriveFiles = useCallback(async (token) => {
        if (!token) return
        setIsLoading(true)
        try {
            const FOLDERS = {
                AUDIOBOOKS: '1-6gsrxIJVE9k4eEBVSWEnloFKZQ56_ap',
                EBOOKS: '1KgyMW0W9e_7PqYn51o36FgW-hXH54AGU',
                VIDEOS: '15j1UHlL6rOyg93PjdBFsSfoXaop7hlDv',
                FINANCE: '1egQtgh8iZtjOG-N67QPb6yObqbUzc0hn'
            }

            // We fetch all files that are inside these specific folders
            const query = `('${FOLDERS.AUDIOBOOKS}' in parents or '${FOLDERS.EBOOKS}' in parents or '${FOLDERS.VIDEOS}' in parents or '${FOLDERS.FINANCE}' in parents) and trashed = false`
            const response = await axios.get(
                `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, modifiedTime, thumbnailLink, webViewLink, iconLink, parents)&pageSize=1000`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            const mappedItems = response.data.files.map(file => {
                let type = 'other'
                let color = 'linear-gradient(135deg, #6b7280 0%, #374151 100%)'

                const isAudio = file.mimeType?.startsWith('audio/')
                const isVideo = file.mimeType?.startsWith('video/')
                const isPdfOrEpub = file.mimeType === 'application/pdf' || file.mimeType === 'application/epub+zip'

                // Smart classification based on mimeType first, then folder
                if (isAudio) {
                    type = 'audiobook'
                    color = 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)'
                } else if (isVideo) {
                    type = 'video-summary'
                    color = 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)'
                } else if (isPdfOrEpub) {
                    type = 'ebook'
                    color = 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                } else {
                    // Fallback to folder-based classification for unknown types 
                    // (mostly for the Finance folder which might have docs/sheets)
                    if (file.parents?.includes(FOLDERS.FINANCE)) {
                        type = 'finance'
                        color = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    } else if (file.parents?.includes(FOLDERS.AUDIOBOOKS)) {
                        type = 'other' // If it's in audio folder but not audio, mark as other to avoid player crash
                    } else if (file.parents?.includes(FOLDERS.EBOOKS)) {
                        type = 'ebook'
                        color = 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                    } else if (file.parents?.includes(FOLDERS.VIDEOS)) {
                        type = 'video-summary'
                        color = 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)'
                    }
                }

                return {
                    id: file.id,
                    title: file.name.replace(/\.[^/.]+$/, ""), // remove extension
                    filename: file.name,
                    author: 'Drive User',
                    type,
                    driveId: file.id,
                    thumbnail: file.thumbnailLink,
                    webViewLink: file.webViewLink,
                    modifiedTime: file.modifiedTime,
                    coverGradient: color,
                    mimeType: file.mimeType
                }
            })

            setDriveItems(mappedItems)
        } catch (error) {
            console.error('Error fetching drive files:', error)
            if (error.response?.status === 401) logout()
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (token) fetchDriveFiles(token)
    }, [token, fetchDriveFiles])

    return (
        <DriveContext.Provider value={{ login, logout, driveItems, isLoading, isConnected: !!token, token }}>
            {children}
        </DriveContext.Provider>
    )
}

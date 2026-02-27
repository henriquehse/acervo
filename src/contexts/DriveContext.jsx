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
            // Query for shared files shared around yesterday
            // MIME types: audio (mp3, m4a, etc), pdf, epub
            const query = "sharedWithMe = true and (mimeType contains 'audio/' or mimeType = 'application/pdf' or mimeType = 'application/epub+zip')"
            const response = await axios.get(
                `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, modifiedTime, thumbnailLink, webViewLink, iconLink)`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            const mappedItems = response.data.files.map(file => {
                const isAudio = file.mimeType.includes('audio')
                return {
                    id: file.id,
                    title: file.name,
                    author: 'Drive User',
                    type: isAudio ? 'audiobook' : 'ebook',
                    driveId: file.id,
                    thumbnail: file.thumbnailLink,
                    modifiedTime: file.modifiedTime,
                    coverGradient: isAudio ? 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)' : 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
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
        <DriveContext.Provider value={{ login, logout, driveItems, isLoading, isConnected: !!token }}>
            {children}
        </DriveContext.Provider>
    )
}

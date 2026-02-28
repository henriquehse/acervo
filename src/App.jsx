import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { PlayerProvider } from './contexts/PlayerContext'
import { DriveProvider } from './contexts/DriveContext'
import BottomNav from './components/BottomNav'
import MiniPlayer from './components/MiniPlayer'
import FullPlayer from './components/FullPlayer'
import Home from './pages/Home'
import SearchPage from './pages/Search'
import Library from './pages/Library'
import Profile from './pages/Profile'
import PdfViewer from './components/PdfViewer'
import './index.css'

// VITE_GOOGLE_CLIENT_ID will be provided via .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE"

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <DriveProvider>
          <PlayerProvider>
            <div className="app" id="app">
              <main className="app__main">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
              <MiniPlayer />
              <BottomNav />
              <FullPlayer />
              <PdfViewer />
            </div>
          </PlayerProvider>
        </DriveProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

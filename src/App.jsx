import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PlayerProvider } from './contexts/PlayerContext'
import BottomNav from './components/BottomNav'
import MiniPlayer from './components/MiniPlayer'
import FullPlayer from './components/FullPlayer'
import Home from './pages/Home'
import SearchPage from './pages/Search'
import Library from './pages/Library'
import Profile from './pages/Profile'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
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
        </div>
      </PlayerProvider>
    </BrowserRouter>
  )
}

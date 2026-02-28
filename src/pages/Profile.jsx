import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { ALL_ITEMS } from '../utils/data'
import { formatTime } from '../utils/helpers'
import { LogOut, Settings, Bell, HelpCircle, Bookmark, Clock, ChevronRight, Headphones, BookOpen, Zap, Database, RefreshCw, AlertCircle } from 'lucide-react'
import './Profile.css'

export default function Profile() {
    const { bookmarks } = usePlayer()
    const { login, logout, isConnected, driveItems, isLoading, error, refresh } = useDrive()

    const stats = {
        total: ALL_ITEMS.length + (isConnected ? driveItems.length : 0),
        audiobooks: ALL_ITEMS.filter(i => i.type === 'audiobook').length + (isConnected ? driveItems.filter(i => i.type === 'audiobook').length : 0),
        ebooks: ALL_ITEMS.filter(i => i.type === 'ebook').length + (isConnected ? driveItems.filter(i => i.type === 'ebook').length : 0),
        listening: ALL_ITEMS.filter(i => i.currentTime > 0).length,
    }

    return (
        <div className="profile" id="profile-page">
            <header className="profile__header">
                <h1 className="profile__title">Perfil</h1>
            </header>

            {/* User Card */}
            <div className="profile__user-card">
                <div className="profile__avatar">
                    <span>HS</span>
                </div>
                <div className="profile__user-info">
                    <h2 className="profile__user-name">Henrique Santos</h2>
                    <p className="profile__user-email">henriquehse2015@gmail.com</p>
                </div>
                {!isConnected ? (
                    <button className="profile__connect-btn" onClick={() => login()}>
                        <Database size={16} />
                        <span>Conectar Drive</span>
                    </button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <button className="profile__connect-btn profile__connect-btn--active" onClick={() => logout()}>
                            <Database size={16} />
                            <span>Drive Conectado</span>
                        </button>
                        <button onClick={refresh} style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', cursor: 'pointer' }}>
                            <RefreshCw size={12} /> Sincronizar
                        </button>
                    </div>
                )}
            </div>

            {/* Drive error banner */}
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button onClick={() => login()} style={{ marginLeft: 'auto', fontWeight: 600, cursor: 'pointer', color: '#dc2626', background: 'none' }}>Reconectar</button>
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Sincronizando com o Drive...
                </div>
            )}

            {/* Stats */}
            <div className="profile__stats">
                <div className="profile__stat">
                    <div className="profile__stat-icon profile__stat-icon--purple">
                        <Headphones size={18} />
                    </div>
                    <div className="profile__stat-info">
                        <span className="profile__stat-value">{stats.audiobooks}</span>
                        <span className="profile__stat-label">Audiobooks</span>
                    </div>
                </div>
                <div className="profile__stat">
                    <div className="profile__stat-icon profile__stat-icon--cyan">
                        <BookOpen size={18} />
                    </div>
                    <div className="profile__stat-info">
                        <span className="profile__stat-value">{stats.ebooks}</span>
                        <span className="profile__stat-label">E-books</span>
                    </div>
                </div>
                <div className="profile__stat">
                    <div className="profile__stat-icon profile__stat-icon--amber">
                        <Zap size={18} />
                    </div>
                    <div className="profile__stat-info">
                        <span className="profile__stat-value">{stats.listening}</span>
                        <span className="profile__stat-label">Em progresso</span>
                    </div>
                </div>
            </div>

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
                <section className="profile__section">
                    <h3 className="profile__section-title">
                        <Bookmark size={18} />
                        Marcadores ({bookmarks.length})
                    </h3>
                    <div className="profile__bookmarks">
                        {bookmarks.map(bm => {
                            const item = ALL_ITEMS.find(i => i.id === bm.itemId)
                            return (
                                <div key={bm.id} className="profile__bookmark-item">
                                    <Clock size={14} />
                                    <div className="profile__bookmark-info">
                                        <span className="profile__bookmark-title">{item?.title}</span>
                                        <span className="profile__bookmark-time">
                                            {formatTime(bm.time)} • {bm.chapter}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Menu */}
            <div className="profile__menu">
                <button className="profile__menu-item" id="profile-settings">
                    <Settings size={20} />
                    <span>Configurações</span>
                    <ChevronRight size={16} className="profile__menu-arrow" />
                </button>
                <button className="profile__menu-item" id="profile-notifications">
                    <Bell size={20} />
                    <span>Notificações</span>
                    <ChevronRight size={16} className="profile__menu-arrow" />
                </button>
                <button className="profile__menu-item" id="profile-help">
                    <HelpCircle size={20} />
                    <span>Ajuda</span>
                    <ChevronRight size={16} className="profile__menu-arrow" />
                </button>
                <button className="profile__menu-item profile__menu-item--danger" id="profile-logout">
                    <LogOut size={20} />
                    <span>Sair</span>
                    <ChevronRight size={16} className="profile__menu-arrow" />
                </button>
            </div>

            {/* Version */}
            <p className="profile__version">Acervo v2.0.0 • PWA</p>

            <div className="profile__spacer" />
        </div>
    )
}

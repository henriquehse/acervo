import { usePlayer } from '../contexts/PlayerContext'
import { useDrive } from '../contexts/DriveContext'
import { ALL_ITEMS } from '../utils/data'
import { formatTime } from '../utils/helpers'
import { LogOut, Settings, Bell, HelpCircle, Bookmark, Clock, ChevronRight, Headphones, BookOpen, Zap, Database, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

export default function Profile() {
    const { bookmarks } = usePlayer()
    const { login, logout, isConnected, driveItems, isLoading, error, refresh } = useDrive()

    const stats = {
        total: ALL_ITEMS.length + driveItems.length,
        audiobooks: ALL_ITEMS.filter(i => i.type === 'audiobook').length + driveItems.filter(i => i.type === 'audiobook').length,
        ebooks: ALL_ITEMS.filter(i => i.type === 'ebook').length + driveItems.filter(i => i.type === 'ebook').length,
        listening: ALL_ITEMS.filter(i => i.currentTime > 0).length,
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-5 pt-8 pb-32 animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Perfil</h1>
            </header>

            {/* User Card */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-sm">
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-md shrink-0">
                        HS
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Henrique Santos</h2>
                        <p className="text-sm text-muted-foreground">henriquehse2015@gmail.com</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    {!isConnected ? (
                        <button
                            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:opacity-90 transition"
                            onClick={() => login()}
                        >
                            <Database size={16} />
                            Conectar Drive
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={refresh}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition bg-muted/50 px-3 py-1.5 rounded-full disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                                {isLoading ? 'Sincronizando...' : 'Sincronizar'}
                            </button>
                            <button
                                className="flex items-center gap-2 bg-[#e8f5e9] text-[#2e7d32] px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:opacity-90 transition border border-[#c8e6c9]"
                                onClick={() => logout()}
                            >
                                <Database size={16} />
                                Desconectar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Drive Error Banner */}
            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <p className="font-semibold text-sm">Problema de Conexão</p>
                        <p className="text-xs mt-1 opacity-90">{error}</p>
                    </div>
                    <button onClick={() => login()} className="text-xs font-bold bg-white px-3 py-1.5 rounded-full shadow-sm hover:bg-red-50 transition border border-red-100">
                        Reconectar
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                        <Headphones size={20} />
                    </div>
                    <span className="text-xl font-black text-foreground">{stats.audiobooks}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Áudio</span>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                        <BookOpen size={20} />
                    </div>
                    <span className="text-xl font-black text-foreground">{stats.ebooks}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">E-books</span>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                        <Zap size={20} />
                    </div>
                    <span className="text-xl font-black text-foreground">{stats.listening}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Em Andamento</span>
                </div>
            </div>

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
                <section className="mb-10">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Bookmark size={20} className="text-primary" fill="currentColor" />
                        Marcadores ({bookmarks.length})
                    </h3>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        {bookmarks.map((bm, index) => {
                            const item = ALL_ITEMS.find(i => i.id === bm.itemId)
                            return (
                                <div key={bm.id} className={`flex items-center gap-3 p-4 ${index !== bookmarks.length - 1 ? 'border-b border-border' : ''}`}>
                                    <Clock size={16} className="text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate text-foreground">{item?.title || 'Faixa Desconhecida'}</p>
                                        <p className="text-xs text-primary font-medium mt-0.5">
                                            {formatTime(bm.time)} {bm.chapter ? `• ${bm.chapter}` : ''}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Menu */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-10">
                <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition border-b border-border focus:outline-none text-left">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Settings size={18} />
                    </div>
                    <span className="flex-1 font-medium text-sm text-foreground">Configurações</span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                </button>
                <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition border-b border-border focus:outline-none text-left">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Bell size={18} />
                    </div>
                    <span className="flex-1 font-medium text-sm text-foreground">Notificações</span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                </button>
                <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition focus:outline-none text-left">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <HelpCircle size={18} />
                    </div>
                    <span className="flex-1 font-medium text-sm text-foreground">Ajuda</span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                </button>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 p-4 rounded-xl border border-red-100 font-bold transition focus:outline-none shadow-sm mb-6">
                <LogOut size={18} />
                Encerrar Sessão
            </button>

            {/* Version */}
            <p className="text-center text-xs font-mono text-muted-foreground opacity-60">
                Acervo v3.0.0 Premium
            </p>
        </div>
    )
}

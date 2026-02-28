import { NavLink } from 'react-router-dom'
import { Home, Search, Library as LibraryIcon, User } from 'lucide-react'

export default function BottomNav() {
    const navItems = [
        { path: '/', icon: Home, label: 'Início' },
        { path: '/search', icon: Search, label: 'Buscar' },
        { path: '/library', icon: LibraryIcon, label: 'Biblioteca' },
        { path: '/profile', icon: User, label: 'Perfil' }
    ]

    return (
        <nav className="fixed bottom-0 w-full bg-background/80 backdrop-blur-xl border-t border-border z-40 pb-[env(safe-area-inset-bottom)] px-4">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex flex-col items-center gap-1 min-w-[64px] transition-colors
                            ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(212,106,67,0.4)]' : 'text-muted-foreground hover:text-foreground'}
                        `}
                    >
                        <item.icon size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}

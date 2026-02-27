import { NavLink, useLocation } from 'react-router-dom'
import { Home, Library, Search, User } from 'lucide-react'
import { usePlayer } from '../contexts/PlayerContext'
import './BottomNav.css'

const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/search', icon: Search, label: 'Buscar' },
    { path: '/library', icon: Library, label: 'Biblioteca' },
    { path: '/profile', icon: User, label: 'Perfil' },
]

export default function BottomNav() {
    const { currentItem } = usePlayer()
    const location = useLocation()

    return (
        <nav
            className="bottom-nav"
            style={{ bottom: 0 }}
            id="bottom-nav"
        >
            {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path
                return (
                    <NavLink
                        key={path}
                        to={path}
                        className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
                        id={`nav-${label.toLowerCase()}`}
                    >
                        <div className="bottom-nav__icon-wrap">
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                            {isActive && <div className="bottom-nav__dot" />}
                        </div>
                        <span className="bottom-nav__label">{label}</span>
                    </NavLink>
                )
            })}
        </nav>
    )
}

'use client';

import React, { useState, useEffect } from 'react';
import {
    Home,
    Settings,
    User,
    Layout,
    Brain,
    Zap,
    Activity,
    Languages,
    Gamepad2,
    GraduationCap,
    Video,
    Image,
    Vault,
    FileText,
    LogOut,
    ExternalLink,
    Sparkles,
    Trophy,
    Hammer,
    Target,
    Tv,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Bot,
    ChevronDown,
    Calendar,
    CheckSquare,
    Newspaper,
    Radar
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

    // Update global CSS variable for layout shift
    useEffect(() => {
        const width = isExpanded ? '16rem' : '5rem'; // w-64 vs w-20
        document.documentElement.style.setProperty('--sidebar-width', width);
    }, [isExpanded]);

    const menuItems = [
        { icon: Home, label: 'Home', href: '/', color: '#25D366' },
        { icon: Calendar, label: 'Rotina', href: '/rotina', color: '#10B981' },
        { icon: Layout, label: 'Finance', href: '/finance', color: '#10B981' },
        { icon: Activity, label: 'Bio-Data', href: '/biodata', color: '#F43F5E' },
        { icon: GraduationCap, label: 'Cursos', href: '/estudos', color: '#8B5CF6' },
        { icon: Languages, label: 'Idiomas', href: '/idiomas', color: '#F59E0B' },
        { icon: Video, label: 'Director AI', href: '/director', color: '#4285F4' },
        { icon: Image, label: 'Bunker Image Lab', href: '/bunker', color: '#8B5CF6' },
        { icon: Vault, label: 'Vault', href: '/vault', color: '#25D366' },
        { icon: FileText, label: 'Templates', href: '/templates', color: '#00BCD4' },
        { icon: Zap, label: 'Automações', href: '/automations', color: '#FBBF24' },
        { icon: Settings, label: 'Config APIs', href: '/settings', color: '#6B7280' },
        { icon: Bot, label: 'Fred Monitor', href: '/fred-monitor', color: '#10B981' },
        { icon: Target, label: 'Intel Bunker', href: '/lazer/blaze', color: '#F59E0B' },
        // { icon: Radar, label: 'MoltBot Intel', href: '/moltbot', color: '#10B981' },
        { icon: Newspaper, label: 'Bunker Feed', href: '/feed', color: '#6366f1' },
    ];

    const externalProjects = [
        { icon: Sparkles, label: 'Arsenal God', href: 'https://arsenal-god-mode.vercel.app', color: '#4285F4' },
        { icon: Target, label: 'Conquista', href: 'https://conquista-projetos.vercel.app', color: '#25D366' },
        { icon: Trophy, label: 'LotoMind', href: 'https://lotomind.vercel.app', color: '#25D366' },
        { icon: Hammer, label: 'Móveis Agora', href: 'https://moveisplanejadosagora.vercel.app', color: '#00BCD4' },
    ];

    // Carregar perfil do usuário para avatar
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const token = localStorage.getItem('bunker_token');
                if (!token) return;

                const res = await fetch('/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUserProfile(data);
                }
            } catch (e) {
                console.error('Erro ao carregar perfil:', e);
            }
        };

        loadProfile();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('bunker_token');
        router.push('/login');
    };

    const SidebarContent = ({ mobile = false }) => (
        <>
            {/* Logo */}
            <div className={`flex justify-center ${mobile ? 'mb-8 mt-4' : 'mb-6'}`}>
                <Link href="/" className="flex items-center justify-center" onClick={() => mobile && setIsMobileMenuOpen(false)}>
                    <img
                        src="/bunker-logo.png"
                        alt="BUNKER"
                        className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    />
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 min-h-0 flex flex-col gap-1.5 px-2 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#374151_transparent] hover:[scrollbar-color:#4B5563_transparent] pr-1">
                {menuItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={index}
                            href={item.href}
                            onClick={() => mobile && setIsMobileMenuOpen(false)}
                            className={`group relative flex items-center ${mobile || isExpanded ? 'justify-start px-4' : 'justify-center'} gap-3 px-2 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon
                                size={28}
                                className="flex-shrink-0 transition-colors"
                                style={{ color: isActive ? item.color : undefined }}
                                strokeWidth={1.5}
                            />

                            {(mobile || isExpanded) && (
                                <span className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1">
                                    {item.label}
                                </span>
                            )}

                            {isActive && (
                                <div
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full`}
                                    style={{ backgroundColor: item.color }}
                                />
                            )}

                            {!mobile && !isExpanded && (
                                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#15151A] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                    <span className="text-xs font-bold text-white">{item.label}</span>
                                </div>
                            )}
                        </Link>
                    );
                })}

                {/* Separator */}
                <div className="my-3 border-t border-white/5" />

                {/* Projects Dropdown Header */}
                <button
                    onClick={() => {
                        // Lógica: Se sidebar fechada, abre sidebar + abre dropdown
                        // Se sidebar aberta, só toggle do dropdown
                        if (!isExpanded && !mobile) {
                            setIsExpanded(true);
                            setIsProjectsOpen(true);
                        } else {
                            setIsProjectsOpen(!isProjectsOpen);
                        }
                    }}
                    className={`group relative flex items-center ${mobile || isExpanded ? 'justify-between px-4' : 'justify-center'} gap-2 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200 w-full`}
                >
                    <div className="flex items-center gap-3">
                        <CheckSquare size={24} className="flex-shrink-0" strokeWidth={1.5} />
                        {(mobile || isExpanded) && (
                            <span className="text-xs font-bold uppercase tracking-widest">Meus Projetos</span>
                        )}
                    </div>
                    {(mobile || isExpanded) && (
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isProjectsOpen ? 'rotate-180' : ''}`}
                        />
                    )}

                    {!mobile && !isExpanded && (
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#15151A] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            <span className="text-xs font-bold text-white">Meus Projetos</span>
                        </div>
                    )}
                </button>

                {/* Projects List (Collapsible with VISIBLE scroll) */}
                <div
                    className={`transition-all duration-300 ease-in-out ${isProjectsOpen ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
                >
                    <div className={`${isProjectsOpen ? 'max-h-[180px] overflow-y-auto' : ''} [scrollbar-width:thin] [scrollbar-color:#10B981_#1a1a2e] space-y-1 pt-1 pb-2`}>
                        {externalProjects.map((project, index) => (
                            <a
                                key={index}
                                href={project.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group relative flex items-center ${mobile || isExpanded ? 'justify-start px-4' : 'justify-center'} gap-3 px-2 py-2.5 rounded-xl text-gray-500 hover:bg-white/5 hover:text-white transition-all duration-200`}
                            >
                                <project.icon
                                    size={22}
                                    className="flex-shrink-0"
                                    style={{ color: project.color }}
                                    strokeWidth={1.5}
                                />

                                {(mobile || isExpanded) && (
                                    <>
                                        <span className="text-xs font-medium whitespace-nowrap overflow-hidden flex-1">
                                            {project.label}
                                        </span>
                                        <ExternalLink size={12} className="text-gray-600 group-hover:text-gray-400" />
                                    </>
                                )}

                                {!mobile && !isExpanded && (
                                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#15151A] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{project.label}</span>
                                        <ExternalLink size={10} className="text-gray-500" />
                                    </div>
                                )}
                            </a>
                        ))}
                    </div>
                </div>

                {/* User Profile & Logout */}
                <div className="mt-auto px-2 pt-4 border-t border-white/5 space-y-2 pb-4">
                    {/* User Avatar */}
                    <Link
                        href="/profile"
                        onClick={() => mobile && setIsMobileMenuOpen(false)}
                        className={`group relative flex items-center ${mobile || isExpanded ? 'justify-start px-4' : 'justify-center'} gap-3 px-2 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200`}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                            {userProfile?.avatar_url ? (
                                <img
                                    src={`${userProfile.avatar_url}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-lg">{userProfile?.full_name?.[0]?.toUpperCase() || 'B'}</span>
                            )}
                        </div>

                        {(mobile || isExpanded) && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{userProfile?.full_name || 'Meu Perfil'}</p>
                                <p className="text-[10px] text-gray-500 truncate">Ver perfil</p>
                            </div>
                        )}

                        {!mobile && !isExpanded && (
                            <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#15151A] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                <span className="text-xs font-bold text-white">Meu Perfil</span>
                            </div>
                        )}
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${mobile || isExpanded ? 'justify-start px-4' : 'justify-center'} gap-3 px-2 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200`}
                    >
                        <LogOut size={24} strokeWidth={1.5} className="flex-shrink-0" />
                        {(mobile || isExpanded) && (
                            <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">Sair</span>
                        )}
                    </button>
                </div>
            </nav>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            {/* Desktop Sidebar */}
            <div
                className={`hidden md:flex fixed left-0 top-0 h-full bg-[#08080c]/95 backdrop-blur-xl border-r border-white/5 flex-col py-4 z-50 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute top-4 -right-3 w-6 h-6 bg-[#1a1a2e] border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-purple-600 transition-colors z-[60] shadow-lg"
                    title={isExpanded ? "Recolher menu" : "Expandir menu"}
                >
                    {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                <SidebarContent />
            </div>

            {/* === MOBILE HEADER FIXED === */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-[100] h-24 bg-[#08080c]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 transition-all duration-300">
                {/* Logo Mobile - Ícone B (Favicon) */}
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                    <img
                        src="/favicon.png"
                        alt="BUNKER"
                        className="h-12 w-12 object-contain"
                    />
                </Link>

                {/* Custom NEON HAMBURGER Button - Refinado */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="group relative w-14 h-14 flex flex-col items-end justify-center gap-[7px] p-2 focus:outline-none"
                    aria-label="Menu"
                >
                    {/* Line 1 */}
                    <span className={`h-[3px] w-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all duration-300 origin-right ${isMobileMenuOpen ? '-rotate-45 -translate-y-[1px] -translate-x-[1px] w-full' : ''}`} />

                    {/* Line 2 */}
                    <span className={`h-[3px] w-2/3 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'}`} />

                    {/* Line 3 */}
                    <span className={`h-[3px] w-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all duration-300 origin-right ${isMobileMenuOpen ? 'rotate-45 translate-y-[1px] -translate-x-[1px] w-full' : ''}`} />
                </button>
            </div>

            {/* === MOBILE FULL SCREEN OVERLAY === */}
            <div
                className={`fixed inset-0 z-[90] bg-[#050505]/95 backdrop-blur-xl md:hidden flex flex-col pt-20 px-6 transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${isMobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-10 pointer-events-none'
                    }`}
            >
                {/* Background Grid Ambience */}
                <div
                    className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(245, 158, 11, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Mobile Content */}
                <div className="relative z-10 flex flex-col h-full overflow-y-auto pb-10">
                    <SidebarContent mobile={true} />
                </div>
            </div>
        </>
    );
}

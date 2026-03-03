'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Wallet, Flame, Tv, FileText, Bell, ChevronDown,
    AlertTriangle, CheckCircle, Info, Zap, RefreshCw, BarChart3,
    CircleDollarSign, MonitorPlay
} from 'lucide-react';

interface KPI {
    id: string;
    icon: string;
    label: string;
    value: string | number;
    sublabel: string;
}

interface Alert {
    type: string;
    category: string;
    icon: string;
    message: string;
    priority: number;
}

interface Quote {
    text: string;
    index: number;
    total: number;
    next_rotation?: string;
}

interface CommandCenterData {
    timestamp: string;
    user: string;
    kpis: KPI[];
    alerts: Alert[];
    quote: Quote;
    status: string;
}

const ICON_MAP: Record<string, any> = {
    'activity': Activity,
    'finance': CircleDollarSign,
    'zap': Zap,
    'monitor': MonitorPlay,
    'file-text': FileText,
};

export default function CommandCenter() {
    const [data, setData] = useState<CommandCenterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Atualiza relógio
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Busca dados do Hub
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/hub/command-center');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error('[CommandCenter] Erro:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh a cada 2 minutos
        const interval = setInterval(fetchData, 120000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={16} className="text-amber-400" />;
            case 'achievement': return <CheckCircle size={16} className="text-emerald-400" />;
            case 'reminder': return <Info size={16} className="text-blue-400" />;
            default: return <Bell size={16} className="text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="w-full bg-[#050505] border-b border-white/5 py-3 px-8">
                <div className="flex items-center justify-center gap-3 text-gray-500 text-sm font-medium tracking-wide">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>SYSTEM SYNC...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#050505] border-b border-white/10 relative z-50 hidden md:block">
            {/* Main Bar */}
            <div className="max-w-[1920px] mx-auto flex items-center justify-between px-8 py-3">
                {/* Left: Title + Status */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/20">
                        <Zap size={16} className="text-emerald-400 fill-emerald-400/20" />
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">
                            Command Center
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider">SYSTEM OPERATIONAL</span>
                    </div>
                </div>

                {/* Center: KPIs */}
                <div className="flex items-center gap-8">
                    {(data?.kpis || []).slice(0, 5).map((kpi, idx) => {
                        const IconComponent = ICON_MAP[kpi.icon] || BarChart3;
                        return (
                            <motion.div
                                key={kpi.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group flex flex-col items-center gap-0.5 cursor-default"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="text-gray-400 group-hover:text-emerald-400 transition-colors">
                                        <IconComponent size={18} />
                                    </div>
                                    <span className="text-base font-bold text-white tracking-wide">
                                        {kpi.value}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider group-hover:text-emerald-500/70 transition-colors">
                                    {kpi.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Right: Time + Alerts */}
                <div className="flex items-center gap-6">
                    {/* Alerts Badge */}
                    {data?.alerts && data.alerts.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all group"
                            >
                                <Bell size={16} className="text-amber-400 group-hover:animate-swing" />
                                <span className="text-xs font-bold text-amber-400">
                                    {data.alerts.length} ALERTS
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="h-8 w-px bg-white/10" />

                    {/* Time Display */}
                    <div className="flex flex-col items-end leading-tight">
                        <span className="text-xl font-black text-white tabular-nums tracking-tight">
                            {formatTime(currentTime)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {formatDate(currentTime)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quote Bar (Expandable) */}
            <AnimatePresence>
                {data?.quote && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-white/10 bg-gradient-to-r from-[#050505] via-[#0a0a0f] to-[#050505] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none" />
                        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col items-center justify-center relative z-10">
                            <p className="text-lg md:text-xl font-medium text-gray-200 italic text-center tracking-wide font-display leading-relaxed drop-shadow-lg">
                                <span className="text-emerald-500/80 text-2xl not-italic mr-3">❝</span>
                                {data.quote.text}
                                <span className="text-emerald-500/80 text-2xl not-italic ml-3">❞</span>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alerts Dropdown */}
            <AnimatePresence>
                {expanded && data?.alerts && data.alerts.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="absolute top-full right-0 mt-2 w-96 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] mr-8"
                    >
                        <div className="p-4 space-y-2">
                            {data.alerts.map((alert, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-0.5">{alert.category}</span>
                                        <span className="text-sm text-gray-400">{alert.message}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

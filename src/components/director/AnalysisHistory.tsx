'use client';

import React, { useState, useEffect } from 'react';
import { History, Play, Trash2, Clock, TrendingUp, Youtube, Video } from 'lucide-react';

interface HistoryItem {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
    analyzedAt: string;
    viralScore: number;
    platform: 'youtube' | 'vimeo' | 'local';
}

interface AnalysisHistoryProps {
    onSelect: (url: string) => void;
    currentUrl?: string;
}

const STORAGE_KEY = 'bunker_director_history';

export function AnalysisHistory({ onSelect, currentUrl }: AnalysisHistoryProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error('Error loading history:', e);
            }
        }
    }, []);

    const removeItem = (id: string) => {
        const updated = history.filter(item => item.id !== id);
        setHistory(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const clearAll = () => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'youtube': return <Youtube size={14} className="text-red-500" />;
            case 'vimeo': return <Play size={14} className="text-blue-400" />;
            default: return <Video size={14} className="text-gray-400" />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Agora';
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    if (history.length === 0) return null;

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3"
            >
                <History size={16} />
                <span className="font-bold uppercase tracking-wider">Análises Recentes</span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{history.length}</span>
            </button>

            {isExpanded && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentUrl === item.url
                                    ? 'bg-purple-500/20 border border-purple-500/30'
                                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                }`}
                            onClick={() => onSelect(item.url)}
                        >
                            {/* Thumbnail */}
                            <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                                {item.thumbnail ? (
                                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                        <Video size={16} className="text-gray-600" />
                                    </div>
                                )}
                                <div className="absolute bottom-0.5 right-0.5">
                                    {getPlatformIcon(item.platform)}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{item.title || 'Vídeo Analisado'}</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock size={10} />
                                    <span>{formatDate(item.analyzedAt)}</span>
                                </div>
                            </div>

                            {/* Score */}
                            <div className="flex items-center gap-1">
                                <TrendingUp size={12} className="text-purple-400" />
                                <span className="text-sm font-bold text-purple-400">{item.viralScore}%</span>
                            </div>

                            {/* Delete */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(item.id);
                                }}
                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    {history.length > 2 && (
                        <button
                            onClick={clearAll}
                            className="w-full py-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                            Limpar Histórico
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Helper function to add item to history (call this after analysis)
export function addToHistory(item: Omit<HistoryItem, 'id' | 'analyzedAt'>) {
    const stored = localStorage.getItem(STORAGE_KEY);
    let history: HistoryItem[] = [];

    try {
        if (stored) history = JSON.parse(stored);
    } catch (e) { }

    // Remove duplicates
    history = history.filter(h => h.url !== item.url);

    // Add new item at the beginning
    history.unshift({
        ...item,
        id: Date.now().toString(),
        analyzedAt: new Date().toISOString()
    });

    // Keep only last 10
    history = history.slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// Helper to detect platform from URL
export function detectPlatform(url: string): 'youtube' | 'vimeo' | 'local' {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'local';
}

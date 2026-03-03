import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Activity, Zap, Cpu } from 'lucide-react';

interface FeedItem {
    agent: string;
    message: string;
    type: string;
    timestamp: string;
}

const MissionControlTerminal = () => {
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [status, setStatus] = useState<any>({ Jarvis: 'offline', Fury: 'offline', Lock: 'offline' });
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchFeed = async () => {
        try {
            const res = await fetch('http://localhost:8001/api/moltbot/feed'); // Adjust port if needed
            if (res.ok) {
                const data = await res.json();
                setFeed(data);
                // Also update status if endpoint available
                // const statusRes = await fetch('http://localhost:8001/api/moltbot/status');
                // if (statusRes.ok) setStatus(await statusRes.json());
            }
        } catch (e) {
            console.error("Feed Fetch Error", e);
        }
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [feed]);

    const getAgentColor = (agent: string) => {
        switch (agent) {
            case 'Jarvis': return 'text-emerald-400';
            case 'Fury': return 'text-amber-400';
            case 'Lock': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden shadow-2xl font-mono text-sm mb-8">
            {/* Header */}
            <div className="bg-[#151520] px-4 py-3 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <Terminal size={16} className="text-emerald-500" />
                    <span className="font-bold text-gray-200">MOLTBOT MISSION CONTROL</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded animate-pulse">
                        LIVE
                    </span>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <Cpu size={12} /> Jarvis
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400">
                        <Activity size={12} /> Fury
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-400">
                        <Zap size={12} /> Lock
                    </div>
                </div>
            </div>

            {/* Terminal Window */}
            <div ref={scrollRef} className="h-64 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {feed.length === 0 ? (
                    <div className="text-gray-600 italic text-center mt-20">Waiting for agent activity...</div>
                ) : (
                    feed.map((item, idx) => (
                        <div key={idx} className="flex gap-3 animate-in fade-in duration-300">
                            <span className="text-gray-600 min-w-[140px] text-xs pt-0.5">
                                {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            <div className="flex-1 break-words">
                                <span className={`font-bold ${getAgentColor(item.agent)}`}>
                                    @{item.agent}:
                                </span>{' '}
                                <span className="text-gray-300">{item.message}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Mockup */}
            <div className="bg-[#0f0f15] px-4 py-2 border-t border-gray-800 flex items-center gap-2 text-gray-500">
                <span>$</span>
                <span className="cursor animate-pulse">_</span>
            </div>
        </div>
    );
};

export default MissionControlTerminal;

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Cpu, Zap, Radio, Globe, Shield, Eye, Download, FileText } from 'lucide-react';
import MissionControlTerminal from './MissionControlTerminal';

interface MoltBotPanelProps {
    token: string | null;
}

const MoltBotPanel: React.FC<MoltBotPanelProps> = ({ token }) => {
    const [status, setStatus] = useState<'IDLE' | 'ACTIVE' | 'DONE'>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [reports, setReports] = useState<any[]>([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('http://localhost:8002/api/moltbot/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (e) {
            console.error("Failed to fetch reports", e);
        }
    };

    const addLog = (message: string) => {
        setLogs(prev => [...prev.slice(-4), `> ${message}`]);
    };

    const handleInitiate = async () => {
        setStatus('ACTIVE');
        setLogs([]);
        setProgress(0);
        addLog("INITIATING PROTOCOL: MOLTBOT OVERLORD...");

        try {
            // Direct HFT port connection to bypass potential proxy issues
            const response = await fetch('http://localhost:8002/api/moltbot/trigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Connection failed: ${response.status}`);
            }

            const data = await response.json();
            addLog(`> SERVER: ${data.message}`);

            // Simulate the "Interception, Modulation, Cross-Content" visual sequence
            setTimeout(() => {
                addLog("📡 INTERCEPTING GLOBAL INTEL STREAMS...");
                setProgress(20);
            }, 1000);

            setTimeout(() => {
                addLog("🧠 CORTEX: ANALYZING PATTERNS (Groq-8x7b)...");
                setProgress(45);
            }, 3500);

            setTimeout(() => {
                addLog("🎨 MODULATING CONTENT & GENERATING ASSETS...");
                setProgress(70);
            }, 6000);

            setTimeout(() => {
                addLog("🚀 DISPATCHING SECURE BRIEFING TO HQ...");
                setProgress(90);
                fetchReports(); // Refresh silently
            }, 8500);

            setTimeout(() => {
                addLog("✅ MISSION ACCOMPLISHED. CHECK SECURE COMMS.");
                setStatus('DONE');
                setProgress(100);
                setTimeout(() => setStatus('IDLE'), 5000);
                fetchReports(); // Final refresh
            }, 10000);

        } catch (error) {
            addLog("❌ PROTOCOL FAILED. SYSTEMS OFFLINE.");
            setStatus('IDLE');
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="w-full bg-[#0a0a0a] border border-[#333] rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
                {/* Background Grid Animation */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Left: Identity */}
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border transition-all duration-500 ${status === 'ACTIVE' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                            <Cpu size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-2">
                                MoltBot <span className="text-[10px] bg-emerald-500 text-black px-1.5 py-0.5 rounded font-bold">V11.2</span>
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">Autonomous Intelligence Architect</p>
                        </div>
                    </div>

                    {/* Middle: Terminal Output */}
                    <div className="flex-1 w-full md:max-w-2xl">
                        <MissionControlTerminal />
                    </div>

                    {/* Right: Action Button */}
                    <button
                        onClick={handleInitiate}
                        disabled={status === 'ACTIVE'}
                        className={`
                            relative px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all duration-300 overflow-hidden
                            ${status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 cursor-wait'
                                : status === 'DONE'
                                    ? 'bg-emerald-500 text-black border border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                                    : 'bg-white hover:bg-emerald-400 text-black hover:scale-105 border-0 shadow-xl'}
                        `}
                    >
                        {status === 'ACTIVE' ? (
                            <span className="flex items-center gap-2">
                                <Zap size={16} className="animate-spin" /> Processing
                            </span>
                        ) : status === 'DONE' ? (
                            <span className="flex items-center gap-2">
                                <Shield size={16} /> SENT
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Radio size={16} /> ACTIVATE
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* INTEL ARCHIVE LIST (BunkerFeed Style) */}
            {reports.length > 0 && (
                <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto w-full pt-8">
                    {reports.map((report) => (
                        <div
                            key={report.filename}
                            className="group relative border-l-2 border-transparent hover:border-emerald-500 pl-6 transition-all duration-300"
                        >
                            {/* Metadata Row */}
                            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase mb-2 text-gray-500">
                                <span>{new Date(report.created * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                <span className="w-1 h-1 rounded-full bg-emerald-500/50"></span>
                                <span className="text-emerald-500 font-bold">INTELIGÊNCIA TÁTICA</span>
                            </div>


                            {/* Title */}
                            <h3 className="text-2xl font-black text-white leading-tight mb-3 group-hover:text-emerald-400 transition-colors cursor-pointer">
                                <Link
                                    href={`/moltbot/report/${encodeURIComponent(report.filename)}`}
                                >
                                    {report.filename
                                        .replace('report_', '')
                                        .replace('.html', '')
                                        .replace(/_/g, ' ')
                                        // Capitalize first letter of each word
                                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </Link>
                            </h3>

                            {/* Excerpt (Simulated) */}
                            <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-2xl line-clamp-2">
                                Relatório confidencial gerado autonomamente pelo MoltBot. Contém análise de padrões, interceptação de dados da surface web e projeções estratégicas para o cenário atual.
                            </p>

                            {/* Action & Tags */}
                            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                                <Link
                                    href={`/moltbot/report/${encodeURIComponent(report.filename)}`}
                                    className="text-xs font-bold text-white hover:text-emerald-400 flex items-center gap-2 transition-colors uppercase tracking-wider"
                                >
                                    Acessar Documento <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                                </Link>

                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 rounded border border-white/10 text-[9px] font-mono text-gray-500 uppercase hover:border-emerald-500/30 transition-colors">
                                        #MOLTBOT_V11
                                    </span>
                                    <span className="px-2 py-0.5 rounded border border-white/10 text-[9px] font-mono text-gray-500 uppercase hover:border-emerald-500/30 transition-colors">
                                        #{(report.size / 1024).toFixed(1)}KB
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MoltBotPanel;

'use client';

import React from 'react';
import { FileText, Copy, Check, Download, Clock, TrendingUp, Users, Hash, Zap, Target, MessageSquare } from 'lucide-react';

interface OnePagerProps {
    result: {
        video_id: string;
        thumbnail_url: string;
        stats: { duration: number; words: number; segments: number };
        viral_analysis: {
            video_summary: string;
            viral_potential: number;
            best_moments: any[];
            target_audience: string;
            overall_hook: string;
        };
    };
    onCopy: (text: string, id: string) => void;
    copiedId: string | null;
}

export function OnePager({ result, onCopy, copiedId }: OnePagerProps) {
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const generateOnePagerText = () => {
        const moments = result.viral_analysis.best_moments || [];
        const topMoments = moments.slice(0, 3);

        return `
📹 ANÁLISE DE VÍDEO - ONE PAGER
═══════════════════════════════════

📊 MÉTRICAS GERAIS
• Duração: ${formatDuration(result.stats.duration)}
• Palavras: ${result.stats.words.toLocaleString()}
• Segmentos: ${result.stats.segments}
• Potencial Viral: ${result.viral_analysis.viral_potential}%

📝 RESUMO EXECUTIVO
${result.viral_analysis.video_summary}

🎯 PÚBLICO-ALVO
${result.viral_analysis.target_audience || 'Não identificado'}

🪝 HOOK PRINCIPAL
${result.viral_analysis.overall_hook || 'Não identificado'}

🔥 TOP ${topMoments.length} MOMENTOS VIRAIS
${topMoments.map((m, i) => `
${i + 1}. [${m.start_timestamp} - ${m.end_timestamp}] Score: ${m.viral_score}
   "${m.quote}"
   → ${m.reason}
`).join('')}

═══════════════════════════════════
Gerado por BUNKER Director AI
        `.trim();
    };

    const moments = result.viral_analysis.best_moments || [];
    const avgScore = moments.length > 0
        ? Math.round(moments.reduce((a, b) => a + b.viral_score, 0) / moments.length)
        : 0;

    return (
        <div className="bg-gradient-to-br from-[#0f0f15] to-[#12121a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="relative h-32 overflow-hidden">
                <img
                    src={result.thumbnail_url}
                    alt="Video Thumbnail"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                            <FileText size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-wider">One Pager</h3>
                            <p className="text-xs text-gray-400">Sumário Executivo Completo</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onCopy(generateOnePagerText(), 'onepager')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold text-white transition-all"
                    >
                        {copiedId === 'onepager' ? <Check size={16} /> : <Copy size={16} />}
                        {copiedId === 'onepager' ? 'Copiado!' : 'Copiar Tudo'}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/5">
                <StatCard
                    icon={Clock}
                    label="Duração"
                    value={formatDuration(result.stats.duration)}
                    color="text-blue-400"
                />
                <StatCard
                    icon={MessageSquare}
                    label="Palavras"
                    value={result.stats.words.toLocaleString()}
                    color="text-emerald-400"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Potencial Viral"
                    value={`${result.viral_analysis.viral_potential}%`}
                    color="text-purple-400"
                />
                <StatCard
                    icon={Zap}
                    label="Média Score"
                    value={`${avgScore}`}
                    color="text-orange-400"
                />
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Summary */}
                <Section title="Resumo Executivo" icon={FileText}>
                    <p className="text-gray-300 leading-relaxed">{result.viral_analysis.video_summary}</p>
                </Section>

                {/* Target Audience & Hook */}
                <div className="grid grid-cols-2 gap-6">
                    <Section title="Público-Alvo" icon={Users}>
                        <p className="text-gray-300">{result.viral_analysis.target_audience || 'Não identificado'}</p>
                    </Section>
                    <Section title="Hook Principal" icon={Target}>
                        <p className="text-gray-300">{result.viral_analysis.overall_hook || 'Não identificado'}</p>
                    </Section>
                </div>

                {/* Top Moments */}
                <Section title={`Top ${Math.min(3, moments.length)} Momentos`} icon={TrendingUp}>
                    <div className="space-y-3">
                        {moments.slice(0, 3).map((moment, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                                    style={{
                                        backgroundColor: moment.viral_score >= 90 ? '#10B981' :
                                            moment.viral_score >= 70 ? '#F59E0B' : '#6B7280'
                                    }}
                                >
                                    {moment.viral_score}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-500">{moment.start_timestamp} - {moment.end_timestamp}</span>
                                        <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-400 capitalize">{moment.emotion}</span>
                                    </div>
                                    <p className="text-white font-medium mb-1">"{moment.quote}"</p>
                                    <p className="text-sm text-gray-500">{moment.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-600">Gerado por BUNKER Director AI</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onCopy(generateOnePagerText(), 'onepager')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
                    >
                        <Copy size={12} />
                        Copiar
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
            <Icon size={20} className={`mx-auto mb-2 ${color}`} />
            <div className="text-xl font-black text-white">{value}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
        </div>
    );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Icon size={16} className="text-purple-400" />
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">{title}</h4>
            </div>
            {children}
        </div>
    );
}

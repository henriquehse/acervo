'use client';

import React from 'react';
import { Play, Scissors, Smartphone, Clock, TrendingUp } from 'lucide-react';

interface ViralMoment {
    start_timestamp: string;
    end_timestamp: string;
    viral_score: number;
    emotion: string;
    quote: string;
    reason: string;
    clip_titles?: string[];
    hashtags?: string[];
}

interface TimelineProps {
    moments: ViralMoment[];
    duration: number; // in seconds
    onMomentClick: (moment: ViralMoment) => void;
    onCutClick: (moment: ViralMoment, is916: boolean) => void;
    activeMoment?: ViralMoment | null;
}

const parseTimestamp = (ts: string): number => {
    const parts = ts.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
};

const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    if (score >= 50) return '#F97316';
    return '#6B7280';
};

export function ViralTimeline({ moments, duration, onMomentClick, onCutClick, activeMoment }: TimelineProps) {
    const totalDuration = duration || 600; // default 10 min

    return (
        <div className="relative w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-purple-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Timeline de Momentos Virais</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
                </div>
            </div>

            {/* Timeline Bar */}
            <div className="relative h-16 bg-[#12121a] rounded-2xl border border-white/5 overflow-hidden group">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-pink-900/10" />

                {/* Time markers */}
                <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between px-2 text-[10px] text-gray-600">
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                        <div key={ratio} className="flex flex-col items-center">
                            <div className="w-px h-2 bg-white/10" />
                            <span>{Math.floor(totalDuration * ratio / 60)}:{String(Math.floor((totalDuration * ratio) % 60)).padStart(2, '0')}</span>
                        </div>
                    ))}
                </div>

                {/* Moment markers */}
                {moments.map((moment, i) => {
                    const startSec = parseTimestamp(moment.start_timestamp);
                    const endSec = parseTimestamp(moment.end_timestamp);
                    const leftPercent = (startSec / totalDuration) * 100;
                    const widthPercent = ((endSec - startSec) / totalDuration) * 100;
                    const isActive = activeMoment && activeMoment.start_timestamp === moment.start_timestamp;

                    return (
                        <div
                            key={i}
                            onClick={() => onMomentClick(moment)}
                            className={`absolute top-2 h-8 rounded-lg cursor-pointer transition-all duration-300 group/moment ${isActive ? 'ring-2 ring-white shadow-lg scale-105 z-10' : 'hover:scale-105 hover:z-10'
                                }`}
                            style={{
                                left: `${leftPercent}%`,
                                width: `${Math.max(widthPercent, 3)}%`,
                                backgroundColor: getScoreColor(moment.viral_score),
                                boxShadow: isActive ? `0 0 20px ${getScoreColor(moment.viral_score)}` : 'none'
                            }}
                        >
                            {/* Score badge */}
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white/20">
                                {moment.viral_score}
                            </div>

                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg opacity-0 group-hover/moment:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                                <div className="text-xs font-bold text-white mb-1">{moment.emotion}</div>
                                <div className="text-[10px] text-gray-400">{moment.start_timestamp} - {moment.end_timestamp}</div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#1a1a24] border-r border-b border-white/10 rotate-45" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                    <span>90+ Viral</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                    <span>70+ Alto</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F97316]" />
                    <span>50+ Médio</span>
                </div>
            </div>

            {/* Active Moment Details */}
            {activeMoment && (
                <div className="mt-6 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 rounded-2xl">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white"
                                    style={{ backgroundColor: getScoreColor(activeMoment.viral_score) }}
                                >
                                    {activeMoment.viral_score}
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white capitalize">{activeMoment.emotion}</div>
                                    <div className="text-sm text-gray-400">{activeMoment.start_timestamp} - {activeMoment.end_timestamp}</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onCutClick(activeMoment, false)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-bold transition-all"
                            >
                                <Scissors size={16} />
                                Cortar Clip
                            </button>
                            <button
                                onClick={() => onCutClick(activeMoment, true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-bold transition-all"
                            >
                                <Smartphone size={16} />
                                Shorts 9:16
                            </button>
                        </div>
                    </div>
                    <blockquote className="text-xl text-white font-serif italic border-l-4 border-purple-500 pl-6 py-2 mb-4">
                        "{activeMoment.quote}"
                    </blockquote>
                    <p className="text-sm text-gray-400">{activeMoment.reason}</p>
                </div>
            )}
        </div>
    );
}

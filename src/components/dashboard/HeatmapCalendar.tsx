'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface HeatmapCalendarProps {
    data?: Record<string, number>; // "YYYY-MM-DD": percentage (0-100)
}

export function HeatmapCalendar({ data = {} }: HeatmapCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [days, setDays] = useState<Date[]>([]);

    useEffect(() => {
        generateCalendarDays();
    }, [currentDate]);

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysArray = [];
        const paddingDays = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

        // Previous month padding
        for (let i = paddingDays; i > 0; i--) {
            daysArray.push(new Date(year, month, 1 - i));
        }

        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            daysArray.push(new Date(year, month, i));
        }

        setDays(daysArray);
    };

    const getColorForPercentage = (percentage: number) => {
        if (percentage === undefined || percentage === null) return 'bg-[#1a1a24]'; // Empty/Future

        // Gradient Logic: Red-Orange -> Teal-Green
        // 0%   -> #FF4500 (Orange Red)
        // 100% -> #00E5FF (Cyan/Teal Vivid)

        if (percentage === 0) return 'bg-[#1a1a24] border border-white/5';
        if (percentage < 30) return 'bg-gradient-to-br from-[#FF4500] to-[#FF6B00] shadow-[0_0_10px_rgba(255,69,0,0.3)]';
        if (percentage < 70) return 'bg-gradient-to-br from-[#FF6B00] to-[#FFD700]';
        return 'bg-gradient-to-br from-[#25D366] to-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]';
    };

    const formatDateKey = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#FF6B00]/10 rounded-lg text-[#FF6B00]">
                        <CalendarIcon size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white capitalize">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => changeMonth(1)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 mb-4">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-bold text-gray-500 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();
                    const dateKey = formatDateKey(day);

                    // Mock Data for now (se não houver dados reais)
                    // Na integração real, usaremos data[dateKey]
                    const mockPercent = isCurrentMonth && day < new Date()
                        ? (Math.random() > 0.2 ? Math.floor(Math.random() * 100) : 0)
                        : null;

                    const percent = data[dateKey] ?? mockPercent;

                    return (
                        <div key={idx} className="aspect-square relative group">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.01 }}
                                className={`
                                    w-full h-full rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300
                                    ${!isCurrentMonth ? 'opacity-20' : ''}
                                    ${getColorForPercentage(percent)}
                                    ${isToday ? 'ring-2 ring-white scale-105 z-10' : ''}
                                    hover:scale-110 hover:z-20 cursor-pointer
                                `}
                            >
                                <span className={`${percent && percent > 50 ? 'text-black font-bold' : 'text-white'}`}>
                                    {day.getDate()}
                                </span>
                            </motion.div>

                            {/* Tooltip */}
                            {percent !== null && percent !== undefined && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                    {percent}% Concluído
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-between text-xs text-gray-500 px-2">
                <span>0%</span>
                <div className="flex gap-1 h-1.5 w-32 rounded-full overflow-hidden">
                    <div className="flex-1 bg-gradient-to-r from-[#FF4500] to-[#FFD700]" />
                    <div className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#00E5FF]" />
                </div>
                <span>100%</span>
            </div>
        </div>
    );
}

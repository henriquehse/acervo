'use client';

import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isToday,
    isAfter,
    startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';


interface InteractiveCalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    onClose: () => void;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
    selectedDate,
    onDateSelect,
    onClose
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-white/5">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Selecionar Data</span>
                    <span className="text-xl font-bold text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        className="ml-2 p-2 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dateNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 py-3">
                    {dateNames[i]}
                </div>
            );
        }

        return <div className="grid grid-cols-7 border-b border-white/5">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isCurrentDay = isToday(day);
                const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));

                days.push(
                    <div
                        key={day.toString()}
                        className={`
              relative h-14 sm:h-20 border-r border-b border-white/5 flex flex-col items-center justify-center cursor-pointer transition-all group
              ${!isCurrentMonth ? 'bg-black/20 text-gray-700' : 'text-gray-300 hover:bg-white/5'}
              ${isSelected ? 'bg-purple-600/20 text-white' : ''}
              ${isFuture ? 'opacity-40 cursor-not-allowed' : ''}
            `}
                        onClick={() => !isFuture && onDateSelect(cloneDay)}
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="activeDay"
                                className="absolute inset-0 bg-purple-600/10 border-2 border-purple-500/50 z-0"
                                initial={false}
                            />
                        )}

                        <span className={`
              relative z-10 text-sm font-bold
              ${isCurrentDay ? 'text-purple-500' : ''}
              ${isSelected ? 'text-white scale-125' : ''}
            `}>
                            {formattedDate}
                        </span>

                        {isCurrentDay && !isSelected && (
                            <div className="absolute bottom-2 w-1 h-1 rounded-full bg-purple-500" />
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="bg-[#0a0a0f]">{rows}</div>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0f0f1a] rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] w-full max-w-md mx-auto"
        >
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <div className="p-4 bg-white/5 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    Hoje
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-600/40 border border-purple-500/50" />
                    Selecionado
                </div>
            </div>
        </motion.div>
    );
};

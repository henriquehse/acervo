'use client';

import React, { useState, useEffect } from 'react';

export function DigitalClock({ className = "" }: { className?: string }) {
    // Inicializa como null para evitar hydration mismatch
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        // Define o tempo inicial apenas no cliente
        setTime(new Date());

        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Mostra placeholder enquanto não está hidratado
    if (!time) {
        return (
            <div className={`flex items-baseline gap-1 font-black tracking-tighter text-white ${className}`}>
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                    --
                </span>
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-amber-500 animate-pulse">:</span>
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                    --
                </span>
            </div>
        );
    }

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');

    return (
        <div className={`flex items-baseline gap-1 font-black tracking-tighter text-white ${className}`}>
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                {hours}
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-amber-500 animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">:</span>
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                {minutes}
            </span>
        </div>
    );
}

export function DateDisplay() {
    // Versão DESKTOP Original (Clean)
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        setDate(new Date());
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!date) return <div className="h-6 w-32 animate-pulse bg-white/10 rounded" />;

    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
    const fullDate = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="flex items-center gap-3 select-none">
            <span className="text-sm sm:text-base md:text-lg font-bold text-amber-500 uppercase tracking-wider">
                {weekday}
            </span>
            <span className="text-amber-500/60 text-lg sm:text-xl font-light drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">—</span>
            <span className="text-xs sm:text-sm md:text-base text-gray-400 font-medium">
                {fullDate}
            </span>
        </div>
    );
}

export function MobileHUDDate() {
    // Versão MOBILE HUD (Tech Design)
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        setDate(new Date());
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!date) return <div className="h-10 w-32 animate-pulse bg-amber-500/10 rounded" />;

    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex items-center gap-3 select-none">
            {/* Indicador Status Lateral */}
            <div className="w-1.5 h-10 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>

            {/* Container de Dados */}
            <div className="flex flex-col justify-center">
                {/* Linha Superior: DIA // DATA */}
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.15em] text-amber-500/90 leading-none mb-1">
                    <span className="">{weekday}</span>
                    <span className="text-amber-500/40">{'//'}</span>
                    <span className="text-gray-400 font-mono">{day} {month} {year}</span>
                </div>

                {/* Linha Inferior: HORA em destaque */}
                <div className="text-3xl sm:text-4xl font-black tracking-widest text-[#ededed] leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] font-mono">
                    {time}
                </div>
            </div>
        </div>
    );
}

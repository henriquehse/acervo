'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Coins,
    Languages,
    GraduationCap,
    MonitorPlay,
    Zap,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const PREMIUM_SERVICES = [
    {
        label: 'Financeiro',
        icon: <Coins size={28} />,
        path: '/finance',
        description: 'Gestão de patrimônio e investimentos.',
        color: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
        shadow: 'rgba(16, 185, 129, 0.2)'
    },
    {
        label: 'IPTV Premium',
        icon: <MonitorPlay size={28} />,
        path: '/tv',
        description: 'Canais ao vivo, filmes e séries.',
        color: 'linear-gradient(135deg, #EF4444 0%, #E11D48 100%)',
        shadow: 'rgba(239, 68, 68, 0.2)'
    }
];

export const PremiumHub: React.FC = () => {
    return (
        <section className="mb-10 px-1">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[rgba(201,169,110,0.1)] border border-[rgba(201,169,110,0.2)] rounded-xl flex items-center justify-center">
                    <Zap size={22} className="text-[var(--gold)] fill-[var(--gold)]" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-[var(--text)] tracking-tight">Premium Hub</h2>
                    <p className="text-xs text-[var(--text-muted)] font-medium">Serviços exclusivos para membros Gold</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {PREMIUM_SERVICES.map((service, index) => (
                    <Link href={service.path} key={service.path}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            className="relative cursor-pointer group h-full"
                        >
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity z-0"
                                style={{ background: service.color }}
                            />

                            <div className="relative z-10 h-full bg-[var(--surface)] border border-[var(--border)] group-hover:border-[var(--gold)] rounded-2xl p-5 flex flex-col items-center text-center transition-all shadow-lg group-hover:shadow-2xl">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white mb-4 shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ background: service.color }}>
                                    {service.icon}
                                </div>

                                <h3 className="text-base font-extrabold text-[var(--text)] mb-2">{service.label}</h3>
                                <p className="hidden md:block text-[11px] text-[var(--text-muted)] leading-relaxed mb-4 flex-1">{service.description}</p>

                                <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--gold)] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                    <span>Acessar</span>
                                    <ArrowRight size={12} />
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

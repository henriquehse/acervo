"use client";

import { motion } from "framer-motion";
import { ArrowRight, Wallet, CreditCard, PiggyBank } from "lucide-react";

// Um Sankey simplificado em puro CSS/React para manter leve e responsivo
// Mostra: Renda -> (Despesas, Investimentos, Impostos)
export function FinancialSankey() {
    return (
        <div className="bg-[#0A0A0E] border border-white/10 rounded-xl p-6 relative overflow-hidden h-full flex flex-col">
            <h3 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
                <Wallet size={18} className="text-zinc-500" /> Fluxo de Capital
            </h3>

            <div className="flex-1 flex items-center justify-between gap-4 relative">

                {/* SOURCE: INCOME */}
                <div className="flex flex-col gap-4 w-1/4 z-10">
                    <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-xl text-center relative group cursor-pointer hover:bg-emerald-900/50 transition-all">
                        <div className="text-xs text-emerald-400 uppercase tracking-widest mb-1">Renda Total</div>
                        <div className="text-xl font-bold text-white">R$ 25k</div>
                        {/* Dot Connector */}
                        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0A0A0E]" />
                    </div>
                </div>

                {/* FLOW LINES (SVG) */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <svg className="w-full h-full">
                        {/* Line to Invest */}
                        <path d="M 25% 50% C 50% 50%, 50% 20%, 75% 20%" fill="none" stroke="#10B981" strokeWidth="2" strokeOpacity="0.3" />
                        {/* Line to Fixos */}
                        <path d="M 25% 50% C 50% 50%, 50% 50%, 75% 50%" fill="none" stroke="#F59E0B" strokeWidth="4" strokeOpacity="0.2" />
                        {/* Line to Lifestyle */}
                        <path d="M 25% 50% C 50% 50%, 50% 80%, 75% 80%" fill="none" stroke="#EC4899" strokeWidth="2" strokeOpacity="0.2" />
                    </svg>
                </div>

                {/* TARGETS: DESTINATIONS */}
                <div className="flex flex-col gap-6 w-1/4 z-10">

                    {/* Investimentos */}
                    <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-lg flex items-center justify-between relative">
                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full border border-[#0A0A0E]" />
                        <span className="text-xs text-zinc-400">Investimentos</span>
                        <span className="text-sm font-bold text-emerald-400">30%</span>
                    </div>

                    {/* Custos Fixos (Essential) */}
                    <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-lg flex items-center justify-between relative">
                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full border border-[#0A0A0E]" />
                        <span className="text-xs text-zinc-400">Essencial</span>
                        <span className="text-sm font-bold text-amber-500">45%</span>
                    </div>

                    {/* Lifestyle (Discretionary) */}
                    <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-lg flex items-center justify-between relative">
                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-2 h-2 bg-pink-500 rounded-full border border-[#0A0A0E]" />
                        <span className="text-xs text-zinc-400">Lazer / Lifestyle</span>
                        <span className="text-sm font-bold text-pink-500">25%</span>
                    </div>

                </div>
            </div>

            <p className="text-[10px] text-zinc-600 text-center mt-4">
                Seu "Burn Rate" está em 70%. Ideal é abaixo de 60%.
            </p>
        </div>
    );
}

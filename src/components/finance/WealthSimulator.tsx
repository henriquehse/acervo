"use client";

import { motion } from "framer-motion";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { useState } from "react";
import { Lock, Unlock, Play, RefreshCw } from "lucide-react";

// Simulador de Riqueza Futura (Monte Carlo Light)
export function WealthSimulator() {
    const [monthlyContribution, setMonthlyContribution] = useState(5000);
    const [years, setYears] = useState(10);
    const [yieldRate, setYieldRate] = useState(10); // 10% a.a.

    // Gera dados de projeção
    const generateProjection = () => {
        const data = [];
        let currentAmount = 50000; // Valor inicial fictício (será props)

        for (let i = 0; i <= years; i++) {
            data.push({
                year: 2024 + i,
                amount: Math.round(currentAmount),
                conservative: Math.round(currentAmount * 0.8), // Cenário Pessimista
                optimistic: Math.round(currentAmount * 1.2)   // Cenário Otimista
            });
            // Juros compostos + Aporte mensal * 12
            currentAmount = (currentAmount * (1 + yieldRate / 100)) + (monthlyContribution * 12);
        }
        return data;
    };

    const data = generateProjection();
    const finalAmount = data[data.length - 1].amount;

    return (
        <div className="bg-[#0A0A0E] border border-white/10 rounded-xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                        <Play size={18} className="text-emerald-500 fill-emerald-500" /> Simulador de Futuro
                    </h3>
                    <p className="text-xs text-zinc-500">Projeção de Liberdade Financeira (Juros Compostos)</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Patrimônio em {2024 + years}</p>
                    <p className="text-2xl font-mono font-bold text-emerald-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(finalAmount)}
                    </p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[250px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(value)}
                        />
                        <Area type="monotone" dataKey="optimistic" stackId="1" stroke="#3B82F6" strokeDasharray="5 5" fill="url(#colorOptimistic)" strokeWidth={1} name="Otimista" />
                        <Area type="monotone" dataKey="amount" stackId="2" stroke="#10B981" fill="url(#colorAmount)" strokeWidth={2} name="Realista" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Aporte Mensal</span>
                        <span className="text-white font-mono">R$ {monthlyContribution}</span>
                    </div>
                    <input
                        type="range" min="0" max="50000" step="500"
                        value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Taxa Anual (Yield)</span>
                        <span className="text-white font-mono">{yieldRate}%</span>
                    </div>
                    <input
                        type="range" min="1" max="30" step="0.5"
                        value={yieldRate} onChange={(e) => setYieldRate(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Tempo (Anos)</span>
                        <span className="text-white font-mono">{years} anos</span>
                    </div>
                    <input
                        type="range" min="1" max="50" step="1"
                        value={years} onChange={(e) => setYears(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
}

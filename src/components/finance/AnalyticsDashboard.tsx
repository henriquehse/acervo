"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Flame, Shield, PiggyBank, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface Analytics {
    period: string;
    total_income: number;
    total_expenses: number;
    total_investments: number;
    net_cashflow: number;
    burn_rate: number;
    runway_months: number;
    by_category: Record<string, number>;
    savings_rate: number;
}

const CATEGORY_COLORS: Record<string, string> = {
    "Alimentação": "#F59E0B",
    "Moradia": "#3B82F6",
    "Transporte": "#8B5CF6",
    "Saúde": "#EC4899",
    "Educação": "#10B981",
    "Lazer": "#F472B6",
    "Assinaturas": "#EF4444",
    "Tecnologia": "#06B6D4",
    "Outros": "#6B7280"
};

export function AnalyticsDashboard() {
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    // Date Filtering State
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [periodMode, setPeriodMode] = useState<'month' | 'q1' | 'q2'>('month');

    useEffect(() => {
        setLoading(true);
        let url = `http://localhost:8001/api/finance/analytics?month=${selectedMonth}&year=${selectedYear}`;

        if (periodMode === 'q1') {
            const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
            const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`;
            url = `http://localhost:8001/api/finance/analytics?start_date_str=${start}&end_date_str=${end}`;
        } else if (periodMode === 'q2') {
            const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-16`;
            // Last day logic
            const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
            const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;
            url = `http://localhost:8001/api/finance/analytics?start_date_str=${start}&end_date_str=${end}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(setData)
            .catch(() => {
                console.warn("Backend not found, using mock data");
                setData({
                    total_income: 18500,
                    total_expenses: 6200,
                    total_investments: 4500,
                    net_cashflow: 7800,
                    burn_rate: 6200,
                    runway_months: 25,
                    by_category: { "Moradia": 2500, "Alimentação": 1200, "Transporte": 800 },
                    savings_rate: 42,
                    period: 'month'
                });
            })
            .finally(() => setLoading(false));
    }, [selectedMonth, selectedYear, periodMode]);

    const handleMonthChange = (increment: number) => {
        let newMonth = selectedMonth + increment;
        let newYear = selectedYear;

        if (newMonth > 12) { newMonth = 1; newYear++; }
        if (newMonth < 1) { newMonth = 12; newYear--; }

        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    if (loading && !data) return <div className="animate-pulse bg-zinc-900/50 border border-white/5 h-64 rounded-xl flex items-center justify-center text-zinc-600 font-mono text-xs">CALCULANDO MÉTRICAS...</div>;

    const categoryData = Object.entries(data?.by_category || {}).map(([name, value]) => ({
        name: name.length > 12 ? name.slice(0, 12) + "..." : name,
        value,
        color: CATEGORY_COLORS[name] || "#6B7280"
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-[#0A0A0E] border border-white/10 rounded-xl p-6 relative overflow-hidden shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-500" /> Fluxo de Capital
                </h3>

                {/* Date Controls */}
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-center">
                    {/* Month Selector */}
                    <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1 border border-white/5">
                        <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs font-mono font-bold w-24 text-center capitalize text-zinc-200 pt-0.5">
                            {monthName}
                        </span>
                        <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Period Selector */}
                    <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setPeriodMode('month')}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${periodMode === 'month' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            MÊS
                        </button>
                        <button
                            onClick={() => setPeriodMode('q1')}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${periodMode === 'q1' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Q1
                        </button>
                        <button
                            onClick={() => setPeriodMode('q2')}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${periodMode === 'q2' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Q2
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Burn Rate */}
                <div className={`p-4 rounded-lg border ${(data?.burn_rate || 0) > 80 ? 'bg-rose-950/20 border-rose-500/20' : 'bg-zinc-900/40 border-white/5'}`}>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                        <Flame size={12} className={(data?.burn_rate || 0) > 80 ? "text-rose-500" : "text-zinc-500"} />
                        <span>Burn Rate</span>
                    </div>
                    <p className={`text-2xl font-mono font-bold ${(data?.burn_rate || 0) > 80 ? 'text-rose-400' : (data?.burn_rate || 0) > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {data?.burn_rate || 0}%
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">da renda comprometida</p>
                </div>

                {/* Runway */}
                <div className="p-4 bg-zinc-900/40 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                        <Shield size={12} />
                        <span>Runway</span>
                    </div>
                    <p className="text-2xl font-mono font-bold text-white">
                        {data?.runway_months || 0}<span className="text-sm text-zinc-500">m</span>
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">meses de sobrevivência</p>
                </div>

                {/* Savings Rate */}
                <div className="p-4 bg-zinc-900/40 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                        <PiggyBank size={12} />
                        <span>Poupança</span>
                    </div>
                    <p className={`text-2xl font-mono font-bold ${(data?.savings_rate || 0) > 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {data?.savings_rate || 0}%
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">taxa de acumulação</p>
                </div>

                {/* Net Cashflow */}
                <div className="p-4 bg-zinc-900/40 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                        {(data?.net_cashflow || 0) >= 0 ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-rose-500" />}
                        <span>Resultado</span>
                    </div>
                    <p className={`text-2xl font-mono font-bold ${(data?.net_cashflow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(data?.net_cashflow || 0)}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">balanço do período</p>
                </div>
            </div>

            {/* Category Breakdown */}
            {categoryData.length > 0 ? (
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-bold">Top Gastos por Categoria</p>
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} width={90} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                    formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : (
                <div className="h-[180px] flex items-center justify-center text-[10px] text-zinc-600 uppercase tracking-widest border border-dashed border-zinc-800 rounded-lg">
                    Sem dados neste período
                </div>
            )}

            {/* Summary Row */}
            <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase mb-1 tracking-widest">Entradas</p>
                    <p className="text-sm md:text-base font-mono text-emerald-400 font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.total_income || 0)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase mb-1 tracking-widest">Saídas</p>
                    <p className="text-sm md:text-base font-mono text-rose-400 font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.total_expenses || 0)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase mb-1 tracking-widest">Investido</p>
                    <p className="text-sm md:text-base font-mono text-blue-400 font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.total_investments || 0)}
                    </p>
                </div>
            </div>
        </div>
    );
}

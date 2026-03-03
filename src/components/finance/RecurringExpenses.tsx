"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, AlertCircle, Trash2, RefreshCw, DollarSign } from "lucide-react";

interface RecurringItem {
    description: string;
    occurrences: number;
    average_amount: number;
    total_spent: number;
    category: string;
    is_subscription: boolean;
}

export function RecurringExpenses() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchRecurring = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8001/api/finance/recurring");
            if (!res.ok) throw new Error("Backend offline");
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.warn("Backend not found, using mock data for RecurringExpenses");
            setData({
                total_monthly_recurring: 1250,
                total_count: 3,
                recurring_expenses: [
                    { description: "Assinatura ChatGPT", occurrences: 12, average_amount: 100, total_spent: 1200, category: "Geral", is_subscription: true },
                    { description: "Energia Elétrica", occurrences: 12, average_amount: 250, total_spent: 3000, category: "Moradia", is_subscription: false },
                    { description: "Aluguel", occurrences: 12, average_amount: 900, total_spent: 10800, category: "Moradia", is_subscription: true }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRecurring(); }, []);

    return (
        <div className="bg-[#0A0A0E] border border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                        <CreditCard size={18} className="text-rose-500" /> Assinaturas & Recorrentes
                    </h3>
                    <p className="text-xs text-zinc-500">Gastos que se repetem todo mês</p>
                </div>
                <button onClick={fetchRecurring} className="p-2 hover:bg-white/5 rounded transition-colors text-zinc-500">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Métrica Principal */}
            <div className="bg-gradient-to-r from-rose-950/30 to-transparent p-4 rounded-lg border border-rose-500/20 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-rose-400 uppercase tracking-widest font-bold mb-1">Custo Mensal Estimado</p>
                        <p className="text-3xl font-mono font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.total_monthly_recurring || 0)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase">Anual</p>
                        <p className="text-lg font-mono text-zinc-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format((data?.total_monthly_recurring || 0) * 12)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Lista de Recorrentes */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {loading ? (
                    <div className="text-center py-10 text-zinc-600 animate-pulse">Analisando padrões...</div>
                ) : !data?.recurring_expenses?.length ? (
                    <div className="text-center py-10 text-zinc-600">
                        <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                        <p>Nenhum gasto recorrente detectado.</p>
                        <p className="text-xs text-zinc-700 mt-1">Adicione mais transações para análise.</p>
                    </div>
                ) : (
                    data.recurring_expenses.map((item: RecurringItem, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all group cursor-pointer
                                ${item.is_subscription
                                    ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/50'
                                    : 'bg-zinc-900/30 border-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                                    ${item.is_subscription ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {item.is_subscription ? '⚡' : <DollarSign size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white capitalize">{item.description}</p>
                                    <div className="flex gap-2 text-[10px] text-zinc-500">
                                        <span>{item.occurrences}x detectado</span>
                                        <span>•</span>
                                        <span className="text-zinc-600">{item.category}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className={`text-sm font-mono font-bold ${item.is_subscription ? 'text-rose-400' : 'text-zinc-300'}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.average_amount)}
                                    </p>
                                    <p className="text-[10px] text-zinc-600">/mês</p>
                                </div>
                                <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-500 rounded transition-all text-zinc-600">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer Insight */}
            {data?.total_count > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <p className="text-[10px] text-zinc-500">
                        💡 Dica: Cancele <span className="text-rose-400">1 assinatura</span> e economize <span className="text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((data?.total_monthly_recurring || 0) / (data?.total_count || 1))}/mês</span>
                    </p>
                </div>
            )}
        </div>
    );
}

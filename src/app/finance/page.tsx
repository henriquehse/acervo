"use client";
import { PageNav } from '@/components/layout/PageNav';

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap');

.font-orbitron { font-family: 'Orbitron', sans-serif; }
.font-mono-jet { font-family: 'JetBrains Mono', monospace; }

.glow-text { text-shadow: 0 0 20px currentColor; }

.glass-card {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(245, 158, 11, 0.2);
}

.fin-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: white;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
}
.fin-input:focus { border-color: rgba(245,158,11,0.5); }

.emoji-picker { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.emoji-btn { font-size: 1.4rem; padding: 4px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; background: rgba(255,255,255,0.04); transition: all 0.2s; }
.emoji-btn.selected { border-color: rgba(245,158,11,0.6); background: rgba(245,158,11,0.12); }
`;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target, Plus, X, Layers, Trash2, Edit2
} from "lucide-react";
import { RecurringExpenses } from "@/components/finance/RecurringExpenses";
import { TransactionLedger } from "@/components/finance/TransactionLedger";
import { AnalyticsDashboard } from "@/components/finance/AnalyticsDashboard";

// ── Types ──
interface Goal {
    id: string;
    title: string;
    description: string;
    icon: string;
    current_amount: number;
    target_amount: number;
    created_at: string;
}

interface FixedExpense {
    id: string;
    name: string;
    amount: number;
    icon: string;
    category: string;
}

const EXPENSE_ICONS = ['🏠', '💡', '🌊', '📱', '🌐', '🚗', '⛽', '🍽️', '💊', '🎓', '🏦', '💳', '🎬', '🎵', '🏋️', '🐾', '📦', '🔧', '👕', '✈️'];
const GOAL_ICONS = ['🎯', '🏦', '🏠', '🚗', '✈️', '💍', '🎓', '💻', '🏋️', '🌎', '🎸', '📈', '🏖️', '🛥️', '🤝', '💰', '🏆', '🛡️'];

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ── Persistence helpers ──
const loadGoals = (): Goal[] => { try { return JSON.parse(localStorage.getItem('acervo_finance_goals') || '[]'); } catch { return []; } };
const saveGoals = (g: Goal[]) => localStorage.setItem('acervo_finance_goals', JSON.stringify(g));

const loadExpenses = (): FixedExpense[] => { try { return JSON.parse(localStorage.getItem('acervo_finance_expenses') || '[]'); } catch { return []; } };
const saveExpenses = (e: FixedExpense[]) => localStorage.setItem('acervo_finance_expenses', JSON.stringify(e));

const loadNetWorth = (): number => { try { return Number(localStorage.getItem('acervo_finance_networth') || '0'); } catch { return 0; } };
const saveNetWorth = (v: number) => localStorage.setItem('acervo_finance_networth', String(v));

const loadIncome = (): number => { try { return Number(localStorage.getItem('acervo_finance_income') || '0'); } catch { return 0; } };
const saveIncome = (v: number) => localStorage.setItem('acervo_finance_income', String(v));

// ── Main Component ──
export default function FinanceDashboard() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [expenses, setExpenses] = useState<FixedExpense[]>([]);
    const [netWorth, setNetWorth] = useState(0);
    const [monthlyIncome, setMonthlyIncome] = useState(0);

    // UI State
    const [activeSection, setActiveSection] = useState<'overview' | 'goals' | 'expenses' | 'analytics'>('overview');
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [balanceModalOpen, setBalanceModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);

    // Goal form
    const [gTitle, setGTitle] = useState('');
    const [gDesc, setGDesc] = useState('');
    const [gIcon, setGIcon] = useState('🎯');
    const [gCurrent, setGCurrent] = useState('');
    const [gTarget, setGTarget] = useState('');

    // Expense form
    const [eLabel, setELabel] = useState('');
    const [eAmount, setEAmount] = useState('');
    const [eIcon, setEIcon] = useState('🏠');

    // Balance form
    const [bNetWorth, setBNetWorth] = useState('');
    const [bIncome, setBIncome] = useState('');

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const monthlyBalance = monthlyIncome - totalExpenses;

    // ── Goal CRUD ──
    const openNewGoal = () => {
        setEditingGoal(null);
        setGTitle(''); setGDesc(''); setGIcon('🎯'); setGCurrent(''); setGTarget('');
        setGoalModalOpen(true);
    };

    const openEditGoal = (g: Goal) => {
        setEditingGoal(g);
        setGTitle(g.title); setGDesc(g.description); setGIcon(g.icon);
        setGCurrent(String(g.current_amount)); setGTarget(String(g.target_amount));
        setGoalModalOpen(true);
    };

    const saveGoal = () => {
        if (!gTitle.trim() || !gTarget) return;
        let updated: Goal[];
        if (editingGoal) {
            updated = goals.map(g => g.id === editingGoal.id
                ? { ...g, title: gTitle.trim(), description: gDesc.trim(), icon: gIcon, current_amount: Number(gCurrent) || 0, target_amount: Number(gTarget) }
                : g);
        } else {
            const newGoal: Goal = {
                id: Date.now().toString(), title: gTitle.trim(), description: gDesc.trim(),
                icon: gIcon, current_amount: Number(gCurrent) || 0, target_amount: Number(gTarget),
                created_at: new Date().toISOString()
            };
            updated = [...goals, newGoal];
        }
        setGoals(updated); saveGoals(updated);
        setGoalModalOpen(false);
    };

    const deleteGoal = (id: string) => {
        const updated = goals.filter(g => g.id !== id);
        setGoals(updated); saveGoals(updated);
    };

    // ── Expense CRUD ──
    const openNewExpense = () => {
        setEditingExpense(null);
        setELabel(''); setEAmount(''); setEIcon('🏠');
        setExpenseModalOpen(true);
    };

    const openEditExpense = (e: FixedExpense) => {
        setEditingExpense(e);
        setELabel(e.name); setEAmount(String(e.amount)); setEIcon(e.icon);
        setExpenseModalOpen(true);
    };

    const saveExpense = () => {
        if (!eLabel.trim() || !eAmount) return;
        let updated: FixedExpense[];
        if (editingExpense) {
            updated = expenses.map(e => e.id === editingExpense.id
                ? { ...e, name: eLabel.trim(), amount: Number(eAmount), icon: eIcon }
                : e);
        } else {
            const newExp: FixedExpense = {
                id: Date.now().toString(), name: eLabel.trim(),
                amount: Number(eAmount), icon: eIcon, category: 'fixo'
            };
            updated = [...expenses, newExp];
        }
        setExpenses(updated); saveExpenses(updated);
        setExpenseModalOpen(false);
    };

    const deleteExpense = (id: string) => {
        const updated = expenses.filter(e => e.id !== id);
        setExpenses(updated); saveExpenses(updated);
    };

    // ── Balance ──
    const saveBalance = () => {
        const nw = Number(bNetWorth) || 0;
        const inc = Number(bIncome) || 0;
        setNetWorth(nw); saveNetWorth(nw);
        setMonthlyIncome(inc); saveIncome(inc);
        setBalanceModalOpen(false);
    };

    const openBalance = () => {
        setBNetWorth(String(netWorth)); setBIncome(String(monthlyIncome));
        setBalanceModalOpen(true);
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'goals', label: 'Metas', icon: '🎯' },
        { id: 'expenses', label: 'Fixos', icon: '📋' },
        { id: 'analytics', label: 'Extrato', icon: '💳' },
    ] as const;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-16 font-sans overflow-x-hidden pb-32">
            <style dangerouslySetInnerHTML={{ __html: FONT_STYLE }} />
            <PageNav title="Financeiro" />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="font-orbitron text-3xl md:text-5xl font-black tracking-tighter text-white uppercase">
                            BUNKER <span className="text-zinc-600">FINANCE</span>
                        </h1>
                        <p className="text-zinc-500 font-mono-jet text-[8px] md:text-sm tracking-[0.3em] uppercase font-black">COMMAND CENTER v3.2</p>
                    </div>
                    <div className="text-center md:text-right cursor-pointer" onClick={openBalance}>
                        <div className="font-orbitron text-3xl md:text-5xl font-black text-white hover:text-emerald-400 transition-colors">
                            {fmtBRL(netWorth)}
                        </div>
                        <div className="text-[8px] text-zinc-600 uppercase tracking-[0.3em] font-black mt-1">
                            PATRIMÔNIO • clique para editar
                        </div>
                    </div>
                </header>

                {/* Monthly Income vs Expenses Summary */}
                {(monthlyIncome > 0 || totalExpenses > 0) && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card p-4 text-center">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Renda Mensal</p>
                            <p className="font-orbitron text-lg font-black text-emerald-400">{fmtBRL(monthlyIncome)}</p>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Fixos/Mês</p>
                            <p className="font-orbitron text-lg font-black text-red-400">{fmtBRL(totalExpenses)}</p>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Sobra Líquida</p>
                            <p className={`font-orbitron text-lg font-black ${monthlyBalance >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                {fmtBRL(monthlyBalance)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Nav Tabs */}
                <nav className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSection === item.id
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'}`}
                        >
                            <span>{item.icon}</span> {item.label}
                        </button>
                    ))}
                </nav>

                {/* ── OVERVIEW ── */}
                {activeSection === 'overview' && (
                    <div className="space-y-6">
                        {/* Quick stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Metas Ativas', value: goals.length, icon: '🎯', color: 'text-amber-400' },
                                { label: 'Despesas Fixas', value: expenses.length, icon: '📋', color: 'text-red-400' },
                                { label: 'Total Fixos', value: fmtBRL(totalExpenses), icon: '💸', color: 'text-orange-400' },
                                { label: 'Saldo Livre', value: fmtBRL(monthlyBalance), icon: '✅', color: monthlyBalance >= 0 ? 'text-emerald-400' : 'text-red-500' },
                            ].map((s, i) => (
                                <div key={i} className="glass-card p-4">
                                    <p className="text-2xl mb-1">{s.icon}</p>
                                    <p className={`font-orbitron text-xl font-black ${s.color}`}>{s.value}</p>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Goals preview */}
                        {goals.length > 0 && (
                            <div className="glass-card p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Target size={16} className="text-amber-500" /> Objetivos Táticos
                                    </h3>
                                    <button onClick={() => setActiveSection('goals')} className="text-xs text-amber-400 hover:text-amber-300 font-bold">VER TODOS →</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {goals.slice(0, 3).map(g => {
                                        const pct = Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0);
                                        return (
                                            <div key={g.id} className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-2xl">{g.icon}</span>
                                                    <div>
                                                        <p className="font-bold text-sm">{g.title}</p>
                                                        <p className="text-xs text-zinc-500">{g.description}</p>
                                                    </div>
                                                    <span className="ml-auto font-orbitron text-sm font-black text-emerald-400">{pct.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 1.2, ease: 'circOut' }}
                                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                                    <span>{fmtBRL(g.current_amount)}</span>
                                                    <span>{fmtBRL(g.target_amount)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Expenses preview */}
                        {expenses.length > 0 && (
                            <div className="glass-card p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Layers size={16} className="text-red-400" /> Despesas Fixas Mensais
                                    </h3>
                                    <button onClick={() => setActiveSection('expenses')} className="text-xs text-amber-400 hover:text-amber-300 font-bold">GERENCIAR →</button>
                                </div>
                                <div className="space-y-2">
                                    {expenses.slice(0, 5).map(e => (
                                        <div key={e.id} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-2">
                                            <span className="flex items-center gap-2 text-sm"><span>{e.icon}</span>{e.name}</span>
                                            <span className="font-orbitron text-sm font-bold text-red-400">{fmtBRL(e.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {goals.length === 0 && expenses.length === 0 && (
                            <div className="glass-card p-12 text-center">
                                <p className="text-5xl mb-4">🚀</p>
                                <h3 className="font-orbitron text-xl font-black mb-2">Comece Agora</h3>
                                <p className="text-zinc-500 text-sm mb-6">Defina suas metas financeiras e cadastre suas despesas fixas mensais para ter controle total.</p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={openBalance} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-bold transition-colors">Definir Renda</button>
                                    <button onClick={() => setActiveSection('goals')} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-bold transition-colors">Criar Meta</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── GOALS ── */}
                {activeSection === 'goals' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="font-orbitron text-xl font-black uppercase flex items-center gap-2">
                                <Target size={20} className="text-amber-500" /> Objetivos Táticos
                            </h2>
                            <button onClick={openNewGoal} className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                                <Plus size={16} /> NOVA META
                            </button>
                        </div>

                        {goals.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <p className="text-5xl mb-3">🎯</p>
                                <p className="text-zinc-500 text-sm">Nenhuma meta cadastrada. Crie sua primeira!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {goals.map(g => {
                                    const pct = Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0);
                                    return (
                                        <motion.div key={g.id} layout className="glass-card p-5 relative group">
                                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditGoal(g)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                    <Edit2 size={14} className="text-zinc-400" />
                                                </button>
                                                <button onClick={() => deleteGoal(g.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                                                    <Trash2 size={14} className="text-red-400" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-3xl">
                                                    {g.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-orbitron text-sm font-black text-white uppercase truncate">{g.title}</h4>
                                                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{g.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-zinc-500">Progresso</span>
                                                <span className="font-orbitron text-sm font-black text-emerald-400 glow-text">{pct.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 mb-2">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 1.5, ease: 'circOut' }}
                                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                                <span className="text-emerald-400/80">{fmtBRL(g.current_amount)}</span>
                                                <span>de {fmtBRL(g.target_amount)}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── FIXED EXPENSES ── */}
                {activeSection === 'expenses' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="font-orbitron text-xl font-black uppercase flex items-center gap-2">
                                <Layers size={20} className="text-red-400" /> Despesas Fixas
                            </h2>
                            <button onClick={openNewExpense} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                                <Plus size={16} /> ADICIONAR
                            </button>
                        </div>

                        {/* Summary cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="glass-card p-4 text-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Renda</p>
                                <p className="font-orbitron text-lg font-black text-emerald-400">{fmtBRL(monthlyIncome)}</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Fixos</p>
                                <p className="font-orbitron text-lg font-black text-red-400">{fmtBRL(totalExpenses)}</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Saldo Livre</p>
                                <p className={`font-orbitron text-lg font-black ${monthlyBalance >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                    {fmtBRL(monthlyBalance)}
                                </p>
                            </div>
                        </div>

                        {expenses.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <p className="text-5xl mb-3">📋</p>
                                <p className="text-zinc-500 text-sm">Nenhuma despesa fixa cadastrada. Adicione suas contas mensais para calcular sua sobra real.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {expenses.map(e => (
                                    <motion.div key={e.id} layout className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 group hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{e.icon}</span>
                                            <p className="font-semibold text-sm">{e.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-orbitron text-sm font-black text-red-400">{fmtBRL(e.amount)}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditExpense(e)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                    <Edit2 size={13} className="text-zinc-400" />
                                                </button>
                                                <button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                                                    <Trash2 size={13} className="text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-4 mt-4">
                                    <p className="font-orbitron text-sm font-black text-amber-400 uppercase">Total Mensal</p>
                                    <p className="font-orbitron text-lg font-black text-red-400">{fmtBRL(totalExpenses)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ANALYTICS ── */}
                {activeSection === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8"><AnalyticsDashboard /></div>
                        <div className="md:col-span-4"><RecurringExpenses /></div>
                        <div className="md:col-span-12"><TransactionLedger /></div>
                    </div>
                )}
            </div>

            {/* ── MODALS ── */}

            {/* Balance Modal */}
            <AnimatePresence>
                {balanceModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setBalanceModalOpen(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0A0A0E] border border-emerald-500/30 p-8 rounded-2xl max-w-md w-full relative"
                            onClick={e => e.stopPropagation()}>
                            <button onClick={() => setBalanceModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <h2 className="font-orbitron text-lg font-black text-white mb-6">💼 Meu Patrimônio</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Patrimônio Total (R$)</label>
                                    <input type="number" value={bNetWorth} onChange={e => setBNetWorth(e.target.value)} className="fin-input" placeholder="0,00" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Renda Mensal Líquida (R$)</label>
                                    <input type="number" value={bIncome} onChange={e => setBIncome(e.target.value)} className="fin-input" placeholder="0,00" />
                                </div>
                                <button onClick={saveBalance} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-black text-sm transition-colors uppercase tracking-wider">Salvar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Goal Modal */}
            <AnimatePresence>
                {goalModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setGoalModalOpen(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0A0A0E] border border-amber-500/30 p-8 rounded-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}>
                            <button onClick={() => setGoalModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <h2 className="font-orbitron text-lg font-black text-white mb-6">{editingGoal ? '✏️ Editar Meta' : '🎯 Nova Meta'}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1">Ícone</label>
                                    <div className="emoji-picker">
                                        {GOAL_ICONS.map(icon => (
                                            <button key={icon} onClick={() => setGIcon(icon)} className={`emoji-btn ${gIcon === icon ? 'selected' : ''}`}>{icon}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Título *</label>
                                    <input value={gTitle} onChange={e => setGTitle(e.target.value)} className="fin-input" placeholder="Ex: Reserva de Emergência" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Descrição</label>
                                    <input value={gDesc} onChange={e => setGDesc(e.target.value)} className="fin-input" placeholder="Descrição curta" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Valor Atual (R$)</label>
                                        <input type="number" value={gCurrent} onChange={e => setGCurrent(e.target.value)} className="fin-input" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Meta (R$) *</label>
                                        <input type="number" value={gTarget} onChange={e => setGTarget(e.target.value)} className="fin-input" placeholder="10000" />
                                    </div>
                                </div>
                                <button onClick={saveGoal} disabled={!gTitle.trim() || !gTarget}
                                    className="w-full bg-amber-500 disabled:opacity-40 hover:bg-amber-400 py-3 rounded-xl font-bold text-black text-sm transition-colors uppercase tracking-wider">
                                    {editingGoal ? 'Salvar Alterações' : 'Criar Meta'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Expense Modal */}
            <AnimatePresence>
                {expenseModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setExpenseModalOpen(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0A0A0E] border border-red-500/30 p-8 rounded-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}>
                            <button onClick={() => setExpenseModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <h2 className="font-orbitron text-lg font-black text-white mb-6">{editingExpense ? '✏️ Editar Despesa' : '📋 Nova Despesa Fixa'}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1">Ícone</label>
                                    <div className="emoji-picker">
                                        {EXPENSE_ICONS.map(icon => (
                                            <button key={icon} onClick={() => setEIcon(icon)} className={`emoji-btn ${eIcon === icon ? 'selected' : ''}`}>{icon}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Nome *</label>
                                    <input value={eLabel} onChange={e => setELabel(e.target.value)} className="fin-input" placeholder="Ex: Aluguel, Netflix, Energia..." />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2">Valor Mensal (R$) *</label>
                                    <input type="number" value={eAmount} onChange={e => setEAmount(e.target.value)} className="fin-input" placeholder="0" />
                                </div>
                                <button onClick={saveExpense} disabled={!eLabel.trim() || !eAmount}
                                    className="w-full bg-red-600 disabled:opacity-40 hover:bg-red-500 py-3 rounded-xl font-bold text-white text-sm transition-colors uppercase tracking-wider">
                                    {editingExpense ? 'Salvar Alterações' : 'Adicionar Despesa'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

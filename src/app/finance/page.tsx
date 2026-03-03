"use client";

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap');

.font-orbitron { font-family: 'Orbitron', sans-serif; }
.font-mono-jet { font-family: 'JetBrains Mono', monospace; }

.glow-text {
    text-shadow: 0 0 20px currentColor;
}

.glass-card {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
`;

import { useEffect, useState } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
    Target, PieChart, TrendingUp, ArrowUpRight, Shield, Brain, Zap, Plus, X, GripVertical, Layers, ArrowLeft
} from "lucide-react";
import Link from 'next/link';
import { ResponsiveContainer, Cell, Pie, PieChart as RePie, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';

// --- MODULES ---
import { WealthSimulator } from "@/components/finance/WealthSimulator";
import { TaxShield } from "@/components/finance/TaxShield";
import { FinancialSankey } from "@/components/finance/FinancialSankey";
import { TransactionLedger } from "@/components/finance/TransactionLedger";
import { RecurringExpenses } from "@/components/finance/RecurringExpenses";
import { AnalyticsDashboard } from "@/components/finance/AnalyticsDashboard";

const allocationData = [
    { name: 'Cripto (BTC)', value: 450000, color: '#F59E0B' },
    { name: 'Reserva (CDB)', value: 15500, color: '#10B981' },
    { name: 'Ações BR', value: 5000, color: '#3B82F6' },
];

export default function FinanceDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [balanceModalOpen, setBalanceModalOpen] = useState(false);

    // --- DRAGGABLE SECTIONS ORDER ---
    const [sectionOrder, setSectionOrder] = useState([
        'analytics',
        'ledger',
        'goals',
        'investments'
    ]);

    // === DATA FETCHING ===
    useEffect(() => {
        fetch("http://localhost:8001/api/finance/dashboard")
            .then(async (res) => {
                if (!res.ok) throw new Error("Backend offline");
                return res.json();
            })
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.warn("Backend not found, using Mock data for Finance Dashboard");
                setLoading(false);
                setData({
                    net_worth: 485000,
                    goals: [
                        { id: 1, title: 'Reserva Ouro', description: 'Caixa Rápido', current_amount: 15500, target_amount: 50000, icon: '🏦' },
                        { id: 2, title: 'Viagem Europa', description: 'Eurotrip 2026', current_amount: 5000, target_amount: 25000, icon: '✈️' },
                        { id: 3, title: 'Novo Carro', description: 'Civic', current_amount: 10000, target_amount: 120000, icon: '🏎️' }
                    ]
                });
            });
    }, []);

    const handleUpdateBalance = async (amount: number, income: number) => {
        try {
            const res = await fetch("http://localhost:8001/api/finance/wealth/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ total_amount: amount, income_monthly: income })
            });
            if (!res.ok) throw new Error("Backend offline");
        } catch (e) {
            console.warn("Backend unavailable, simulating local update");
        } finally {
            setData((prev: any) => ({ ...prev, net_worth: amount }));
            setBalanceModalOpen(false);
        }
    };

    const callAdvisor = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch("http://localhost:8001/api/finance/advisor/report");
            if (!res.ok) throw new Error("Backend offline");
            const json = await res.json();
            setAiReport(json.report);
        } catch {
            setAiReport(`## Análise Concluída (Mock)\n\n\n* Backend está offline.\n* Como uma contingência, sua saúde financeira parece controlada considerando suas reservas mockadas.\n* Recomendamos aportar mais no VOO ETF em breve.`);
        } finally {
            setAnalyzing(false);
        }
    };

    // --- RENDERERS ---

    const renderAnalytics = () => (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 select-none">
            <div className="md:col-span-8">
                <AnalyticsDashboard />
            </div>
            <div className="md:col-span-4">
                <RecurringExpenses />
            </div>
        </div>
    );

    const renderLedger = () => (
        <div className="grid grid-cols-1">
            <TransactionLedger />
        </div>
    );

    const renderGoals = () => (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 select-none">
            <div className="md:col-span-12 bg-[#0A0A0E] border border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-200">
                        <Target size={18} className="text-emerald-500" /> Objetivos Táticos
                    </h3>
                    <button onClick={() => setModalOpen(true)} className="text-xs flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-zinc-300">
                        <Plus size={12} /> NOVO
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {(!data?.goals || data?.goals?.length === 0) ? (
                        <div className="text-center py-12 text-zinc-600 col-span-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-2xl">
                            <Target size={32} className="mb-3 opacity-20" />
                            <p className="font-orbitron text-xs uppercase tracking-widest font-bold">No tactical goals active</p>
                        </div>
                    ) : (
                        data?.goals?.map((goal: any) => (
                            <div key={goal.id} className="relative glass-card p-5 group hover:border-emerald-500/30">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                            {goal.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-orbitron text-sm font-black text-white uppercase tracking-tight">{goal.title}</h4>
                                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{goal.description}</p>
                                        </div>
                                    </div>
                                    <span className="font-orbitron text-xl font-black text-emerald-400 glow-text">{((goal.current_amount / goal.target_amount) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden relative border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderInvestments = () => (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300 select-none">
            <div className="md:col-span-12 flex items-center gap-2 mb-2 pt-8 border-t border-dashed border-white/5">
                <Layers size={14} className="text-zinc-600" />
                <span className="text-xs uppercase tracking-widest text-zinc-600 font-bold">Área Estratégica (Longo Prazo)</span>
            </div>
            <div className="md:col-span-8"><FinancialSankey /></div>
            <div className="md:col-span-4"><WealthSimulator /></div>
            <div className="md:col-span-8 bg-[#0A0A0E] border border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col">
                <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-200 mb-2"><PieChart size={18} className="text-amber-500" /> Distribuição de Ativos</h3>
                <div className="flex-1 min-h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePie width={400} height={400}>
                            <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                        </RePie>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="md:col-span-4"><TaxShield /></div>
        </div>
    );

    const sectionRenderers: Record<string, () => React.JSX.Element> = {
        'analytics': renderAnalytics,
        'ledger': renderLedger,
        'goals': renderGoals,
        'investments': renderInvestments
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-amber-500/30 overflow-x-hidden pb-32">
            <style dangerouslySetInnerHTML={{ __html: FONT_STYLE }} />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
            </div>

            <div className="relative z-10 max-w-[1920px] mx-auto space-y-6">
                <div className="mb-2">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-400 p-2 pr-4 bg-white/5 rounded-xl transition-colors shadow-lg border border-white/5 hover:border-emerald-500/30">
                        <ArrowLeft size={18} />
                        <span className="text-xs font-orbitron font-bold uppercase tracking-widest">Base</span>
                    </Link>
                </div>
                <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 border-b border-white/5 pb-8 md:pb-6 relative">
                    <div className="text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <div className="hidden md:block h-8 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                            <h1 className="font-orbitron text-4xl sm:text-5xl md:text-5xl font-black tracking-tighter text-white uppercase">BUNKER <span className="text-zinc-600">FINANCE</span></h1>
                        </div>
                        <p className="text-zinc-500 font-mono-jet text-[8px] md:text-sm tracking-[0.3em] uppercase md:ml-4 font-black">COMMAND CENTER v3.2</p>
                    </div>
                    <div className="text-center md:text-right w-full md:w-auto">
                        <div onClick={() => setBalanceModalOpen(true)} className="font-orbitron text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white cursor-pointer hover:text-emerald-400 transition-colors flex items-center justify-center md:justify-end gap-3 md:gap-4 group">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.net_worth || 0)}
                            <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 p-2 rounded-full"><TrendingUp size={24} className="text-zinc-400" /></div>
                        </div>
                        <div className="text-[8px] md:text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black mt-2 md:mt-1 md:mr-1">PATRIMÔNIO LÍQUIDO CONSOLIDADO</div>
                    </div>
                </header>

                <Reorder.Group axis="y" values={sectionOrder} onReorder={setSectionOrder} className="space-y-8">
                    {sectionOrder.map((section) => (
                        <DraggableSection key={section} section={section}>
                            {sectionRenderers[section]()}
                        </DraggableSection>
                    ))}
                </Reorder.Group>

            </div>

            <div className="fixed bottom-8 right-8 z-50">
                <button onClick={callAdvisor} disabled={analyzing} className="group relative flex items-center justify-center">
                    <div className={`absolute inset-0 bg-indigo-600 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity ${analyzing ? "animate-pulse" : ""}`} />
                    <div className="relative bg-[#111] border border-indigo-500/50 text-indigo-400 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer overflow-hidden">
                        <Brain size={28} className={`relative z-10 ${analyzing ? "animate-spin-slow" : ""}`} />
                    </div>
                </button>
            </div>

            <AnimatePresence>
                {aiReport && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8">
                        <div className="bg-[#0A0A0E] border border-indigo-500/30 w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col relative overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-900/20 to-transparent">
                                <div><h2 className="text-2xl font-bold text-white">Fred Intelligence</h2></div>
                                <button onClick={() => setAiReport(null)}><X size={24} className="text-zinc-500 hover:text-white" /></button>
                            </div>
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar prose prose-invert max-w-none"><ReactMarkdown>{aiReport}</ReactMarkdown></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {modalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0A0A0E] border border-white/10 p-8 rounded-xl max-w-md w-full relative">
                        <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                        <p className="text-zinc-500 mb-4">Adicionar Meta (Mock)</p>
                        <button onClick={async () => {
                            await fetch("http://localhost:8001/api/finance/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Nova Meta", target_amount: 10000, current_amount: 0, icon: "🎯" }) });
                            window.location.reload();
                        }} className="w-full bg-emerald-600 py-2 rounded">Criar Meta Genérica</button>
                    </div>
                </div>
            )}

            {balanceModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0A0A0E] border border-emerald-500/30 p-8 rounded-xl max-w-md w-full relative">
                        <button onClick={() => setBalanceModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleUpdateBalance(Number(fd.get('amount')), Number(fd.get('income'))); }} className="space-y-4">
                            <input name="amount" type="number" defaultValue={data?.net_worth} className="w-full bg-zinc-900 p-3 rounded text-white" />
                            <input name="income" type="number" defaultValue={data?.monthly_income} className="w-full bg-zinc-900 p-3 rounded text-white" />
                            <button className="w-full bg-emerald-600 py-3 rounded font-bold">ATUALIZAR</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function DraggableSection({ section, children }: { section: string, children: React.ReactNode }) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={section}
            dragListener={false}
            dragControls={controls}
            className="relative group/drag"
        >
            <div
                className="absolute -left-2 md:-left-6 top-6 cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-100 transition-opacity z-50 text-zinc-600 hover:text-zinc-300 bg-black/50 md:bg-transparent rounded p-1"
                onPointerDown={(e) => controls.start(e)}
            >
                <GripVertical className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]" />
            </div>
            {children}
        </Reorder.Item>
    );
}

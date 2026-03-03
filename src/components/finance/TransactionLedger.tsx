"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Tag, ArrowUpCircle, ArrowDownCircle, Sparkles, Trash2, Send, Bot, FileText, ChevronLeft, ChevronRight, X, Lightbulb, CheckCircle2, Circle, Pencil, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

interface Transaction {
    id: number;
    description: string;
    amount: number;
    type: string;
    category: string;
    date: string;
    is_paid?: boolean;
}

export function TransactionLedger() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddMode, setIsAddMode] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editDesc, setEditDesc] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editCategory, setEditCategory] = useState("");

    // Smart Bot State
    const [smartInput, setSmartInput] = useState("");
    const [processingSmart, setProcessingSmart] = useState(false);
    const [smartFeedback, setSmartFeedback] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any | null>(null);

    // Navigation State
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [periodMode, setPeriodMode] = useState<'month' | 'q1' | 'q2'>('month');

    // Form States
    const [newDesc, setNewDesc] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newType, setNewType] = useState("expense");
    const [newCategory, setNewCategory] = useState("Geral");
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch Transações
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8001/api/finance/transactions?limit=500&t=${new Date().getTime()}`, {
                cache: 'no-store'
            });
            if (!res.ok) throw new Error("Backend unavailable");
            const data = await res.json();

            // Filter by selected period
            const filtered = data.filter((tx: any) => {
                const txDate = new Date(tx.date);
                const txMonth = txDate.getMonth() + 1;
                const txYear = txDate.getFullYear();
                const txDay = txDate.getDate();

                if (txMonth !== selectedMonth || txYear !== selectedYear) return false;

                if (periodMode === 'q1') return txDay <= 15;
                if (periodMode === 'q2') return txDay > 15;

                return true;
            });

            setTransactions(filtered.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (e) {
            console.warn("Backend not found or error, using mock data for Ledger");
            const mockData = [
                { id: 1, description: "Salário Liquid", amount: 15000, type: "income", category: "Renda", date: new Date(selectedYear, selectedMonth - 1, 5).toISOString(), is_paid: true },
                { id: 2, description: "Aluguel", amount: 2500, type: "expense", category: "Moradia", date: new Date(selectedYear, selectedMonth - 1, 10).toISOString(), is_paid: true },
                { id: 3, description: "Mercado Jão", amount: 650, type: "expense", category: "Alimentação", date: new Date(selectedYear, selectedMonth - 1, 12).toISOString(), is_paid: false },
                { id: 4, description: "Aporte VOO", amount: 3000, type: "investment", category: "Bolsa", date: new Date(selectedYear, selectedMonth - 1, 15).toISOString(), is_paid: true },
                { id: 5, description: "Energia", amount: 250, type: "expense", category: "Moradia", date: new Date(selectedYear, selectedMonth - 1, 20).toISOString(), is_paid: false },
            ];

            // Filter Mock Data
            const filteredMock = mockData.filter((tx: any) => {
                const txDate = new Date(tx.date);
                const txDay = txDate.getDate();
                if (periodMode === 'q1') return txDay <= 15;
                if (periodMode === 'q2') return txDay > 15;
                return true;
            });

            setTransactions(filteredMock.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, [selectedMonth, selectedYear, periodMode]);

    // Actions
    const handleSmartSubmit = async () => {
        if (!smartInput.trim()) return;
        setProcessingSmart(true);
        setSmartFeedback(null);
        setAnalysisResult(null);

        try {
            const res = await fetch("http://localhost:8001/api/finance/smart-process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: smartInput })
            });
            const result = await res.json();

            if (result.action === "transaction") {
                setNewDesc(result.data.description);
                setNewAmount(result.data.amount.toString());
                setNewType(result.data.type);
                setNewCategory(result.data.category);
                if (result.data.date) setNewDate(result.data.date.split('T')[0]);

                setIsAddMode(true);
                setSmartFeedback(result.message);
                setSmartInput("");
            } else if (result.action === "analysis") {
                setAnalysisResult(result.data);
                setSmartFeedback(result.message);
            } else if (result.action === "update_profile") {
                alert("Perfil atualizado: " + result.message);
            } else {
                setSmartFeedback("Não entendi completamente.");
            }
        } catch (e) {
            console.error(e);
            setSmartFeedback("Erro ao processar.");
        } finally {
            setProcessingSmart(false);
        }
    };

    const handleAdd = async () => {
        if (!newDesc || !newAmount) return;
        const payload = {
            description: newDesc,
            amount: parseFloat(newAmount),
            type: newType,
            category: newCategory,
            date: new Date(newDate).toISOString(),
            is_paid: false
        };
        try {
            await fetch("http://localhost:8001/api/finance/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn("Backend unavailable, falling back to mock save");
            // Just simulate success to keep frontend working
        } finally {
            setIsAddMode(false);
            setNewDesc(""); setNewAmount(""); setNewCategory("Geral");
            fetchTransactions();
        }
    };

    const togglePaid = async (tx: Transaction) => {
        try {
            // Optimistic update
            const updatedTx = { ...tx, is_paid: !tx.is_paid };
            setTransactions(prev => prev.map(t => t.id === tx.id ? updatedTx : t));

            const res = await fetch(`http://localhost:8001/api/finance/transactions/${tx.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_paid: !tx.is_paid })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: res.statusText }));
                throw new Error(err.detail || "Erro ao atualizar status");
            }
        } catch (e: any) {
            console.warn("Backend unavailable, simulating state locally");
            // Keep the optimistic update when offline
        }
    };

    const startEdit = (tx: Transaction) => {
        setEditingId(tx.id);
        setEditDesc(tx.description);
        setEditAmount(tx.amount.toString());
        setEditCategory(tx.category);
    };

    const saveEdit = async (id: number) => {
        try {
            // Fix amount format (comma to dot) for locales using comma
            const cleanAmount = editAmount.toString().replace(/,/g, '.');
            const numericAmount = parseFloat(cleanAmount);

            if (isNaN(numericAmount)) {
                alert("Valor numérico inválido (use ponto ou vírgula)");
                return;
            }

            console.log("Saving edit...", { id, description: editDesc, amount: numericAmount, category: editCategory });

            const res = await fetch(`http://localhost:8001/api/finance/transactions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: editDesc,
                    amount: numericAmount,
                    category: editCategory
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: `Erro HTTP ${res.status}` }));
                throw new Error(errorData.detail || "Falha desconhecida no servidor");
            }

            setEditingId(null);
            fetchTransactions();
        } catch (e: any) {
            console.error("Save Error:", e);
            alert(`Erro ao salvar transação: ${e.message}`);
        }
    };

    const periodLabel = periodMode === 'month' ? 'Mês Completo' : periodMode === 'q1' ? '1ª Quinzena' : '2ª Quinzena';
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Totals
    const totalSemInvest = transactions.filter(t => t.type !== 'investment');
    const totalExpensesPlanned = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalExpensesPaid = transactions.filter(t => t.type === 'expense' && t.is_paid).reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="bg-[#0A0A0E] border border-white/10 rounded-xl overflow-hidden flex flex-col h-full min-h-[600px] shadow-2xl shadow-black/50 relative">

            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-zinc-900/50 to-transparent">
                <div className="w-full md:w-auto text-center md:text-left">
                    <h3 className="text-xl font-bold text-zinc-200 font-mono tracking-tight flex items-center justify-center md:justify-start gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" /> Livro Razão
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">Registro Tático de Operações</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                    {/* Period Controls */}
                    <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg p-1 w-full sm:w-auto justify-between sm:justify-center">
                        <button onClick={() => {
                            let m = selectedMonth - 1; let y = selectedYear;
                            if (m < 1) { m = 12; y--; }
                            setSelectedMonth(m); setSelectedYear(y);
                        }} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                        <span className="text-xs md:text-sm font-bold text-white w-28 md:w-32 text-center capitalize font-mono pt-0.5">{monthName}</span>
                        <button onClick={() => {
                            let m = selectedMonth + 1; let y = selectedYear;
                            if (m > 12) { m = 1; y++; }
                            setSelectedMonth(m); setSelectedYear(y);
                        }} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
                    </div>

                    <div className="flex bg-black border border-white/10 rounded-lg p-1 w-full sm:w-auto">
                        <button onClick={() => setPeriodMode('month')} className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs font-bold rounded ${periodMode === 'month' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>MÊS</button>
                        <button onClick={() => setPeriodMode('q1')} className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs font-bold rounded ${periodMode === 'q1' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Q1</button>
                        <button onClick={() => setPeriodMode('q2')} className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs font-bold rounded ${periodMode === 'q2' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Q2</button>
                    </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-white/10" />
                <button onClick={() => setIsAddMode(!isAddMode)} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"><Plus size={14} /> NOVA OPERAÇÃO</button>
            </div>

            {/* Smart Input */}
            <div className="bg-zinc-900/30 border-b border-white/5 p-4">
                <div className="relative">
                    <div className="absolute left-3 top-3 text-indigo-500">
                        {processingSmart ? <Bot size={18} className="animate-bounce" /> : <Sparkles size={18} />}
                    </div>
                    <input
                        type="text" value={smartInput} onChange={(e) => setSmartInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSmartSubmit()}
                        placeholder="Comandos de Voz/Texto: 'Pago 50 uber', 'Salário 5000', 'Uber vs Onibus'..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-zinc-300 focus:text-white outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                    />
                    <button onClick={handleSmartSubmit} disabled={processingSmart} className="absolute right-2 top-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white"><Send size={16} /></button>
                </div>
                {smartFeedback && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs text-indigo-400 font-mono ml-2 flex items-center gap-2"><Bot size={12} /> {smartFeedback}</motion.div>}
            </div>

            {/* Add Form */}
            <AnimatePresence>
                {isAddMode && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-zinc-900/50 border-b border-indigo-500/20 px-4 md:px-6 py-4 overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 items-end">
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Meta Data</label>
                                <input value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" className="w-full bg-black border border-zinc-700 rounded p-2 text-[10px] md:text-xs text-white outline-none focus:border-indigo-500" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Esquema</label>
                                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full bg-black border border-zinc-700 rounded p-2 text-[10px] md:text-xs text-white outline-none focus:border-indigo-500">
                                    <option value="expense">🔴 Despesa</option>
                                    <option value="income">🟢 Receita</option>
                                    <option value="investment">🔵 Investimento</option>
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-4">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Identificador / Descrição</label>
                                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} type="text" placeholder="Ex: Assinatura ChatGPT" className="w-full bg-black border border-zinc-700 rounded p-2 text-[10px] md:text-xs text-white outline-none focus:border-indigo-500" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Valor Bruto</label>
                                <input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} type="number" placeholder="0.00" className="w-full bg-black border border-zinc-700 rounded p-2 text-[10px] md:text-xs text-white outline-none focus:border-indigo-500" />
                            </div>
                            <div className="col-span-1 md:col-span-2 relative">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Categoria</label>
                                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} type="text" placeholder="Geral" className="w-full bg-black border border-zinc-700 rounded p-2 text-[10px] md:text-xs text-white outline-none focus:border-indigo-500" />
                            </div>
                            <div className="col-span-2 md:col-span-12 flex gap-2 mt-2">
                                <button onClick={handleAdd} className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-[40px] md:h-[34px] rounded text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20">EXECUTAR</button>
                                <button onClick={() => setIsAddMode(false)} className="px-4 bg-zinc-800 hover:bg-zinc-700 h-[40px] md:h-[34px] rounded text-white text-xs font-bold transition-colors">ABORTAR</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analysis Modal */}
            <AnimatePresence>
                {analysisResult && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8">
                        <div className="bg-[#0A0A0E] border border-indigo-500/50 w-full max-w-2xl rounded-xl p-6 shadow-2xl overflow-y-auto max-h-full">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2"><Lightbulb size={24} /> {analysisResult.title}</h3>
                                <button onClick={() => setAnalysisResult(null)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {analysisResult.comparison?.map((opt: any, idx: number) => (
                                    <div key={idx} className="bg-zinc-900 border border-white/10 p-4 rounded-lg">
                                        <h4 className="font-bold text-white mb-2">{opt.option}</h4>
                                        <p className="text-lg font-mono text-emerald-400 font-bold">R$ {opt.cost}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{opt.time_gain || opt.detail}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg text-sm text-zinc-200 leading-relaxed font-mono prose-invert"><ReactMarkdown>{analysisResult.recommendation}</ReactMarkdown></div>
                            <button onClick={() => setAnalysisResult(null)} className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 py-3 rounded text-white font-bold transition-colors">FECHAR ANÁLISE</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-zinc-950/20">
                <table className="w-full text-left border-collapse min-w-[500px] md:min-w-0">
                    <thead className="bg-[#050505] sticky top-0 z-10 text-[10px] uppercase text-zinc-500 font-mono tracking-wider border-b border-white/5">
                        <tr>
                            <th className="p-4 w-10 text-center"></th>
                            <th className="p-4 font-normal hidden sm:table-cell">Data</th>
                            <th className="p-4 font-normal">Operação</th>
                            <th className="p-4 font-normal hidden md:table-cell">Categoria</th>
                            <th className="p-4 font-normal text-right">Montante</th>
                            <th className="p-4 font-bold w-12 text-center text-[10px]">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-zinc-600 animate-pulse">Carregando livro caixa...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-zinc-600">Nenhum registro neste período.</td></tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className={`group hover:bg-white/[0.02] transition-colors ${tx.is_paid ? 'opacity-50' : ''}`}>

                                    {/* Edit Mode Handlers */}
                                    {editingId === tx.id ? (
                                        <>
                                            <td className="p-4"></td>
                                            <td className="p-2"><input type="date" defaultValue={tx.date.split('T')[0]} disabled className="bg-transparent text-zinc-500 text-xs w-24" /></td>
                                            <td className="p-2"><input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded p-1 w-full text-xs text-white" autoFocus /></td>
                                            <td className="p-2"><input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded p-1 w-full text-xs text-white" /></td>
                                            <td className="p-2"><input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded p-1 w-full text-xs text-white text-right" /></td>
                                            <td className="p-4 text-center flex gap-2 justify-center items-center h-full pt-3">
                                                <button onClick={() => saveEdit(tx.id)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-900/20 p-1.5 rounded"><Save size={14} /></button>
                                                <button onClick={() => setEditingId(null)} className="text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded"><X size={14} /></button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-4 text-center">
                                                <button onClick={() => togglePaid(tx)} className="text-zinc-500 hover:text-emerald-400 transition-colors" title={tx.is_paid ? "Marcar como não pago" : "Marcar como pago"}>
                                                    {tx.is_paid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="p-4 text-zinc-500 font-mono text-[10px] whitespace-nowrap hidden sm:table-cell">
                                                {new Date(tx.date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="p-4 font-medium text-zinc-300">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`p-1 rounded-full ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : tx.type === 'investment' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {tx.type === 'income' ? <ArrowUpCircle size={10} /> : tx.type === 'investment' ? <ArrowUpCircle size={10} className="rotate-45" /> : <ArrowDownCircle size={10} />}
                                                        </span>
                                                        <span className="text-xs md:text-sm">{tx.description}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:hidden">
                                                        <span className="text-[9px] text-zinc-600 font-mono">{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                                                        <span className="text-[9px] text-indigo-500/60 font-bold uppercase tracking-tighter">[{tx.category}]</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 uppercase tracking-wide">
                                                    <Tag size={10} /> {tx.category}
                                                </span>
                                            </td>
                                            <td className={`p-4 text-right font-mono font-bold text-xs md:text-sm ${tx.type === 'income' ? 'text-emerald-400' : tx.type === 'investment' ? 'text-blue-400' : 'text-zinc-400'}`}>
                                                {tx.type === 'expense' && '- '}
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => startEdit(tx)} className="text-zinc-600 hover:text-blue-400 p-1.5 hover:bg-blue-900/10 rounded" title="Editar"><Pencil size={14} /></button>
                                                    <button onClick={async () => {
                                                        if (!confirm("Apagar transação?")) return;
                                                        try {
                                                            await fetch(`http://localhost:8001/api/finance/transactions/${tx.id}`, { method: 'DELETE' });
                                                        } catch (e) {
                                                            console.warn("Backend offline, mock delete");
                                                        }
                                                        fetchTransactions();
                                                    }} className="text-zinc-600 hover:text-red-500 p-1.5 hover:bg-red-900/10 rounded" title="Apagar"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary */}
            <div className="p-4 border-t border-white/5 bg-[#08080c] grid grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                <div className="text-xs text-zinc-500">
                    <span className="block font-bold mb-0.5">ITENS EXIBIDOS</span>
                    {transactions.length} registros
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-2 border border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Despesas Planejadas</p>
                    <p className="text-sm font-mono font-bold text-zinc-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpensesPlanned)}</p>
                </div>

                <div className="bg-emerald-950/20 rounded-lg p-2 border border-emerald-500/10">
                    <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-0.5">Despesas Realizadas (Ticadas)</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpensesPaid)}</p>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-2 border border-white/5 text-right flex flex-col items-end justify-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Pendência</p>
                    <p className="text-xs font-mono font-bold text-amber-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpensesPlanned - totalExpensesPaid)}</p>
                </div>
            </div>
        </div>
    );
}

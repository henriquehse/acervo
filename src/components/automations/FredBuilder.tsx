import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface WorkflowResult {
    success: boolean;
    workflow_id: string;
    name: string;
    description: string;
    status: string;
    url: string;
    error?: string;
}

interface FredBuilderProps {
    initialPrompt?: string;
}

export const FredBuilder = ({ initialPrompt = '' }: FredBuilderProps) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [isThinking, setIsThinking] = useState(false);
    const [step, setStep] = useState<'idle' | 'analyzing' | 'building' | 'done' | 'error'>('idle');
    const [result, setResult] = useState<WorkflowResult | null>(null);

    React.useEffect(() => {
        if (initialPrompt) setPrompt(initialPrompt);
    }, [initialPrompt]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsThinking(true);
        setStep('analyzing');
        setResult(null);

        try {
            // Simula análise rápida para UX
            setTimeout(() => setStep('building'), 1500);

            const response = await fetch('/api/automations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
                setStep('done');
                setPrompt('');
            } else {
                setResult({ ...data, success: false });
                setStep('error');
            }
        } catch (error) {
            console.error('Erro:', error);
            setStep('error');
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mb-12">
            <div className="relative bg-[#0F1115] border border-white/5 rounded-2xl p-1 overflow-hidden shadow-2xl">
                {/* Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/5 blur-[100px] pointer-events-none" />

                <div className="relative p-6 md:p-10 flex flex-col items-center text-center space-y-6">

                    {/* Header */}
                    <div className="space-y-2">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-emerald-500/20"
                        >
                            <Sparkles size={12} />
                            <span>Fred Automation Engine</span>
                        </motion.div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                            O que vamos automatizar hoje?
                        </h2>
                        <p className="text-gray-400 max-w-lg mx-auto">
                            Descreva o fluxo que você precisa e o Fred criará e configurará tudo no N8N instantaneamente.
                        </p>
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="w-full max-w-2xl relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-xl opacity-50 group-hover:opacity-100 transition duration-500 blur-sm"></div>
                        <div className="relative flex items-center bg-[#0A0C10] rounded-xl border border-white/10 p-2 shadow-xl focus-within:border-emerald-500/50 transition-colors">
                            <Bot className={`ml-3 mr-3 transition-colors ${isThinking ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: Todo dia às 8h enviar email com cotação do dólar..."
                                className="flex-1 bg-transparent border-none text-white placeholder-gray-600 focus:ring-0 text-lg"
                                disabled={isThinking}
                            />
                            <button
                                type="submit"
                                disabled={isThinking || !prompt.trim()}
                                className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isThinking ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </div>
                    </form>

                    {/* Status Feedback */}
                    <AnimatePresence mode="wait">
                        {step === 'analyzing' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center space-x-2 text-emerald-400/80"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-sm font-mono">Fred está analisando sua intenção...</span>
                            </motion.div>
                        )}

                        {step === 'building' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center space-x-2 text-blue-400/80"
                            >
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-sm font-mono">Construindo workflow no N8N...</span>
                            </motion.div>
                        )}

                        {step === 'done' && result && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-2xl mt-4"
                            >
                                <div className="bg-[#151920] border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between shadow-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-white font-medium">{result.name || "Automação Criada"}</h3>
                                            <p className="text-gray-500 text-sm font-mono truncate max-w-xs md:max-w-md">
                                                ID: {result.workflow_id} • Status: <span className="text-emerald-400 uppercase text-xs">{result.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition text-sm font-medium bg-emerald-500/5 px-4 py-2 rounded-lg border border-emerald-500/10 hover:bg-emerald-500/10"
                                    >
                                        <span>Abrir no N8N</span>
                                        <ArrowRight size={16} />
                                    </a>
                                </div>
                            </motion.div>
                        )}

                        {step === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-2 text-red-400 bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10"
                            >
                                <AlertCircle size={16} />
                                <span className="text-sm">Não foi possível criar. O Fred disse: "{result?.error || 'Erro desconhecido'}"</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

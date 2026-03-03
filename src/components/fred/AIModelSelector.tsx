"use client";

import { useState, useEffect } from 'react';
import { Brain, Check, ChevronDown, Zap, DollarSign, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIModel {
    id: string;
    name: string;
    provider: string;
    tier: 'standard' | 'premium';
    input_cost: number;
    output_cost: number;
    description: string;
    context_window: number;
}

export function AIModelSelector() {
    const [models, setModels] = useState<AIModel[]>([]);
    const [activeModel, setActiveModel] = useState<AIModel | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [modelsRes, activeRes] = await Promise.all([
                fetch('/api/ai/models'),
                fetch('/api/ai/active')
            ]);

            if (modelsRes.ok && activeRes.ok) {
                const modelsData = await modelsRes.json();
                const activeData = await activeRes.json();
                setModels(modelsData);
                setActiveModel(activeData);
            } else {
                throw new Error("API not available");
            }
        } catch (e) {
            console.warn("Using default AI config (Gemini 3.0 Flash)");
            // Fallback Genérico para Visualização
            setActiveModel({
                id: 'gemini-3-flash',
                name: 'Gemini 3.0 Flash',
                provider: 'google',
                tier: 'standard',
                input_cost: 0.10,
                output_cost: 0.40,
                description: 'Model Default System',
                context_window: 1000000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (model: AIModel) => {
        try {
            const res = await fetch('/api/ai/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_id: model.id })
            });
            if (res.ok) {
                setActiveModel(model);
                setIsOpen(false);
            }
        } catch (e) {
            console.error("Failed to set active model", e);
        }
    };

    if (loading) return <div className="animate-pulse w-32 h-10 bg-white/5 rounded-lg"></div>;

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-[#1A1A1E] hover:bg-[#25252A] border border-white/10 px-4 py-2 rounded-xl transition-all duration-200 group"
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeModel?.tier === 'premium'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20'
                    }`}>
                    <Brain size={16} className="text-white" />
                </div>

                <div className="flex flex-col items-start mr-2">
                    <span className="text-xs text-gray-400 font-medium">Cérebro Ativo</span>
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                        {activeModel?.name}
                    </span>
                </div>

                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-96 bg-[#0E0E12] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-sm font-semibold text-white">Selecionar Modelo de IA</h3>
                                <p className="text-xs text-gray-400 mt-1">Escolha quem controlará todas as gerações.</p>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {models.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => handleSelect(model)}
                                        className={`w-full text-left p-3 rounded-xl transition-all border ${activeModel?.id === model.id
                                            ? 'bg-white/10 border-indigo-500/50'
                                            : 'hover:bg-white/5 border-transparent hover:border-white/5'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <Server size={14} className={
                                                    model.provider === 'groq' ? 'text-orange-400' :
                                                        model.provider === 'google' ? 'text-blue-400' :
                                                            model.provider === 'openai' ? 'text-green-400' : 'text-gray-400'
                                                } />
                                                <span className="font-semibold text-white text-sm">{model.name}</span>
                                            </div>
                                            {activeModel?.id === model.id && <Check size={16} className="text-indigo-400" />}
                                        </div>

                                        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{model.description}</p>

                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${model.tier === 'premium'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                {model.tier.toUpperCase()}
                                            </span>

                                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                <DollarSign size={10} />
                                                ${typeof model.input_cost === 'number' ? model.input_cost.toFixed(2) : '0.00'} / 1M In
                                            </div>

                                            {model.provider === 'groq' && (
                                                <div className="flex items-center gap-1 text-[10px] text-orange-400/80">
                                                    <Zap size={10} />
                                                    Ultra-Fast
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-3 border-t border-white/5 bg-white/[0.02] text-center">
                                <p className="text-[10px] text-gray-600">Preços estimados por 1 Milhão de tokens</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

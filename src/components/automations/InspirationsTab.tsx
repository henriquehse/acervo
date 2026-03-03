import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface Suggestion {
    title: string;
    description: string;
    complexity: string;
    tools: string[];
    prompt: string;
}

interface InspirationsTabProps {
    onSelectPrompt: (prompt: string) => void;
}

export const InspirationsTab: React.FC<InspirationsTabProps> = ({ onSelectPrompt }) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/automations/suggestions');
            if (!res.ok) throw new Error('Falha ao buscar sugestões');
            const data = await res.json();
            setSuggestions(data.suggestions || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="animate-spin text-purple-500 mb-4" size={32} />
                <p className="text-gray-400">Fred está pesquisando novas tendências...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="text-purple-400" />
                        Descobertas do Fred
                    </h2>
                    <p className="text-gray-400">Automações de alto impacto sugeridas para o seu stack.</p>
                </div>
                <button
                    onClick={fetchSuggestions}
                    className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggestions.map((sug, idx) => (
                    <div
                        key={idx}
                        className="group bg-[#121216] border border-white/5 hover:border-purple-500/30 p-6 rounded-2xl transition-all hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 text-purple-500/20 group-hover:text-purple-500/10 transition-colors">
                            <Zap size={64} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {sug.tools.map(tool => (
                                    <span key={tool} className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-500 px-2 py-1 rounded">
                                        {tool}
                                    </span>
                                ))}
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${sug.complexity === 'Alta' ? 'bg-red-500/10 text-red-400' :
                                    sug.complexity === 'Média' ? 'bg-yellow-500/10 text-yellow-400' :
                                        'bg-green-500/10 text-green-400'
                                    }`}>
                                    {sug.complexity}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                {sug.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                {sug.description}
                            </p>

                            <button
                                onClick={() => onSelectPrompt(sug.prompt)}
                                className="w-full py-3 bg-white/5 hover:bg-purple-600 hover:text-white text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-all group-hover:shadow-lg group-hover:shadow-purple-500/20"
                            >
                                Criar Agora <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

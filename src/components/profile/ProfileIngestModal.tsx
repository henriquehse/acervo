import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, AlertCircle, FileText, User } from 'lucide-react';

interface ProfileIngestModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserName?: string;
}

export const ProfileIngestModal: React.FC<ProfileIngestModalProps> = ({ isOpen, onClose, currentUserName }) => {
    const [reportText, setReportText] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [resultSummary, setResultSummary] = useState<string>('');

    const handleIngest = async () => {
        if (!reportText.trim()) return;

        setStatus('processing');
        try {
            const token = localStorage.getItem('bunker_token');
            const res = await fetch('/api/profile/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ report_text: reportText })
            });

            if (res.status === 401) {
                setStatus('error');
                setResultSummary('Sessão expirada. Por favor, faça login novamente.');
                // Opcional: Redirecionar automaticamente após um tempo
                setTimeout(() => window.location.href = '/login', 2000);
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setResultSummary((data.profile_summary && `Identidade reconhecida: ${data.profile_summary}`) || 'Perfil atualizado com sucesso!');
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                    setReportText('');
                    window.location.reload();
                }, 3000);
            } else {
                setStatus('error');
                setResultSummary(data.detail || 'Erro ao processar perfil.');
            }
        } catch (error) {
            setStatus('error');
            setResultSummary('Erro de conexão com o servidor.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] bg-[#0f0f13] border border-white/10 rounded-3xl shadow-2xl z-[1000] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-start bg-gradient-to-r from-[#0f0f13] to-[#1a1a24]">
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <User className="text-[#FF6B00]" size={28} />
                                    Identidade Nexus
                                </h2>
                                <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-md">
                                    Cole abaixo o relatório detalhado da sua LLM. O sistema irá extrair automaticamente seus dados, preferências visuais e missão de vida.
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 flex-1 overflow-y-auto">
                            {status === 'success' ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                                        <CheckCircle2 size={40} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase mb-2">Identidade Atualizada</h3>
                                    <p className="text-gray-400">{resultSummary}</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <textarea
                                        value={reportText}
                                        onChange={(e) => setReportText(e.target.value)}
                                        placeholder="Cole seu relatório aqui... (Ex: 'O usuário é um Arquiteto de Software de 36 anos, vive em São Paulo...')"
                                        className="w-full h-64 bg-black/30 border border-white/10 rounded-xl p-6 text-gray-300 focus:outline-none focus:border-[#FF6B00]/50 input-modern resize-none font-mono text-sm leading-relaxed"
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs text-gray-600 font-bold uppercase tracking-widest pointer-events-none">
                                        AI PROFILE INGESTOR V1.0
                                    </div>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                                    <AlertCircle size={20} />
                                    <span className="text-sm font-bold">{resultSummary}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {status !== 'success' && (
                            <div className="p-6 border-t border-white/5 bg-[#0a0a0f] flex justify-end">
                                <button
                                    onClick={handleIngest}
                                    disabled={status === 'processing' || !reportText.trim()}
                                    className={`
                                        px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all
                                        ${status === 'processing'
                                            ? 'bg-white/5 text-white/30 cursor-wait'
                                            : !reportText.trim()
                                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                : 'bg-white text-black hover:bg-[#FF6B00] hover:text-white shadow-xl hover:shadow-[#FF6B00]/20'
                                        }
                                    `}
                                >
                                    {status === 'processing' ? (
                                        <>
                                            <Sparkles className="animate-spin" size={18} /> Processando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} /> Analisar & Aplicar
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

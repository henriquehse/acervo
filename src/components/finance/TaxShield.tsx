"use client";

import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

export function TaxShield() {
    // Mock Data (Fred vai preencher isso via API depois)
    const data = {
        estimated_tax: 12500, // Imposto estimado anual
        deductions_used: 4500,
        deductions_potential: 15000,
        health_score: 65, // 0-100
        alerts: [
            { id: 1, type: "warning", msg: "PGBL não maximizado (Faltam R$ 8.000)" },
            { id: 2, type: "info", msg: "Recibos médicos de Fev/24 não scaneados" }
        ]
    };

    return (
        <div className="bg-[#0A0A0E] border border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                    <Shield size={18} className="text-indigo-500 fill-indigo-500/20" /> Bunker Tax Shield
                </h3>
                <div className={`px-2 py-1 rounded text-xs font-bold ${data.health_score > 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    SCORE: {data.health_score}/100
                </div>
            </div>

            {/* Radar Dedução */}
            <div className="flex-1 space-y-6">
                <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-2">
                        <span>Potencial de Dedução (IRPF)</span>
                        <span>{Math.round((data.deductions_used / data.deductions_potential) * 100)}% Utilizado</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden relative border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(data.deductions_used / data.deductions_potential) * 100}%` }}
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-500"
                        />
                        {/* Marcador de Oportunidade */}
                        <div className="absolute top-0 bottom-0 right-0 w-[30%] bg-white/5 border-l border-white/10 flex items-center justify-center">
                            <span className="text-[8px] text-zinc-500 hidden sm:block">OPORTUNIDADE</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 text-right">
                        Você pode abater mais <strong>R$ {new Intl.NumberFormat('pt-BR').format(data.deductions_potential - data.deductions_used)}</strong> legalmente.
                    </p>
                </div>

                {/* Fred Alerts */}
                <div className="space-y-2">
                    {data.alerts.map(alert => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-lg border border-white/5 text-xs">
                            {alert.type === 'warning' ? <AlertTriangle size={14} className="text-amber-500 mt-0.5" /> : <HelpCircle size={14} className="text-blue-500 mt-0.5" />}
                            <span className="text-zinc-300">{alert.msg}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button className="mt-6 w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/30 text-indigo-400 text-xs font-bold rounded transition-all">
                AUDITORIA FISCAL COMPLETA
            </button>
        </div>
    );
}

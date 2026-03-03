'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, Eye, Copy, Check, Maximize2, Minimize2, Download } from 'lucide-react';

interface ArtifactsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    language: string;
    title: string;
}

export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ isOpen, onClose, code, language, title }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
    const [isCopied, setIsCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isExpanded ? '100%' : '45%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`h-full border-l border-white/10 bg-[#0a0a0e] flex flex-col transition-all duration-300 relative z-30 ${isExpanded ? 'absolute inset-0' : 'relative'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#12121a]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Code size={16} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{language}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <div className="flex bg-[#0a0a0e] rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Eye size={12} /> Preview
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Code size={12} /> Code
                        </button>
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title={isExpanded ? "Restaurar" : "Expandir"}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative group">
                {activeTab === 'preview' ? (
                    <div className="w-full h-full bg-white relative">
                        {/* Sandbox Preview - Simple Iframe Implementation */}
                        <iframe
                            className="w-full h-full border-none"
                            srcDoc={`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <script src="https://cdn.tailwindcss.com"></script>
                                    <style>
                                        body { margin: 0; padding: 0; overflow-x: hidden; }
                                        ::-webkit-scrollbar { width: 8px; }
                                        ::-webkit-scrollbar-track { background: #f1f1f1; }
                                        ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
                                    </style>
                                </head>
                                <body>
                                    ${code}
                                </body>
                                </html>
                            `}
                            title="Preview"
                            sandbox="allow-scripts"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full overflow-auto bg-[#0d1117] p-4 font-mono text-sm relative">
                        <button
                            onClick={handleCopy}
                            className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10 flex items-center gap-2"
                        >
                            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            <span className="text-xs">{isCopied ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <pre className="text-gray-300 leading-relaxed">
                            {code}
                        </pre>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5 bg-[#12121a] flex justify-between items-center text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                <span>Bruce's Hub Artifact v1.0</span>
                <span className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'preview' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                    {activeTab === 'preview' ? 'Live Render' : 'Read Only'}
                </span>
            </div>
        </motion.div>
    );
};

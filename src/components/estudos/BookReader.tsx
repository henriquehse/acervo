
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactReader to avoid SSR issues
const ReactReader = dynamic(() => import('react-reader').then((mod) => mod.ReactReader), { ssr: false });

interface BookReaderProps {
    url: string;
    title: string;
    // initialLocation: string | number;
    onClose: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({ url, title, onClose }) => {
    const [location, setLocation] = useState<string | number>(0);
    const [error, setError] = useState<string | null>(null);

    // Reset error when url changes
    useEffect(() => {
        setError(null);
    }, [url]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] text-white">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0a]">
                <h2 className="text-sm font-medium text-gray-300 uppercase tracking-widest truncate max-w-lg">{title} - Leitura Ativa</h2>
                <div className="flex items-center gap-4">
                    {error && <span className="text-red-500 text-xs bg-red-500/10 px-2 py-1 rounded">Erro ao carregar livro</span>}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Reader Area */}
            <div className="flex-1 relative" style={{ height: 'calc(100vh - 64px)' }}>
                <ReactReader
                    url={url}
                    location={location}
                    locationChanged={(epubcifi: string | number) => setLocation(epubcifi)}
                    epubInitOptions={{
                        openAs: 'epub',
                    }}
                    epubOptions={{
                        flow: 'scrolled',
                        manager: 'continuous',
                    }}
                />
            </div>
        </div>
    );
};

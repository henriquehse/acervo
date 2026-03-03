import React, { useState } from 'react';
import { X, ExternalLink, Download, BookOpen, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { ReactReader } from 'react-reader';

interface BookReaderProps {
    book: {
        title: string;
        file_path: string; // The ID or Path
        file_type: string;
        source?: 'telegram' | 'drive' | 'local';
    };
    onClose: () => void;
}

const API_URL = "http://localhost:8001";

export const BookReader: React.FC<BookReaderProps> = ({ book, onClose }) => {
    const [location, setLocation] = useState<string | number>(0);
    const [isReaderReady, setIsReaderReady] = useState(false);

    // Construct Stream URL
    const getStreamUrl = () => {
        if (typeof book.file_path === 'string' && book.file_path.startsWith('tg_')) {
            const parts = book.file_path.split('_');
            if (parts.length >= 3) {
                const channelId = parts[1];
                const msgId = parts[2];
                return `${API_URL}/api/telegram/stream/${channelId}/${msgId}`;
            }
        }

        if (book.file_path.startsWith('/')) {
            return `${API_URL}/api/gdrive/stream?path=${encodeURIComponent(book.file_path)}`;
        }

        return book.file_path;
    };

    const streamUrl = getStreamUrl();
    const isPdf = book.file_type === 'pdf';
    const isEpub = book.file_type === 'epub';

    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col animate-in fade-in duration-300">
            {/* High-End Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f0f12] backdrop-blur-xl bg-opacity-80">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <BookOpen size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg truncate max-w-xl leading-none mb-1">{book.title}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-black uppercase tracking-widest">{book.file_type}</span>
                            <span className="text-[10px] text-white/20 font-medium lowercase">streaming via bunker vault</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.open(streamUrl, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-white/50 hover:text-white transition-all text-sm font-medium border border-transparent hover:border-white/10"
                    >
                        <ExternalLink size={16} /> <span className="hidden sm:inline">Modo Externo</span>
                    </button>

                    <a
                        href={streamUrl}
                        download
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all text-sm font-bold border border-white/5"
                    >
                        <Download size={16} /> <span className="hidden sm:inline">Baixar</span>
                    </a>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-500/10 rounded-xl text-white/40 hover:text-red-400 transition-all group"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            </div>

            {/* Content Viewer */}
            <div className="flex-1 w-full bg-[#050505] relative overflow-hidden flex flex-col">
                {isPdf ? (
                    <div className="w-full h-full flex flex-col">
                        <iframe
                            src={`${streamUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="w-full h-full border-none invert-[0.05] grayscale-[0.1]"
                            title="Bunker PDF Reader"
                        />
                    </div>
                ) : isEpub ? (
                    <div className="w-full h-full relative" style={{ height: 'calc(100vh - 64px)' }}>
                        <ReactReader
                            url={streamUrl}
                            title={book.title}
                            location={location}
                            locationChanged={(loc: string) => setLocation(loc)}
                            getRendition={(rendition: any) => {
                                // Premium Customization
                                rendition.on('renderer:render', (contents: any) => {
                                    contents.addStylesheetRules({
                                        body: {
                                            background: '#0a0a0a !important',
                                            color: '#d1d1d1 !important',
                                            'font-family': 'Inter, sans-serif !important',
                                            'line-height': '1.6 !important',
                                            padding: '40px !important'
                                        },
                                        '::selection': {
                                            background: '#7c3aed !important',
                                            color: '#fff !important'
                                        }
                                    });
                                });
                            }}
                            readerStyles={{
                                ...baseReaderStyles,
                                container: {
                                    ...baseReaderStyles.container,
                                    background: '#050505'
                                },
                                reader: {
                                    ...baseReaderStyles.reader,
                                    background: '#0a0a0a',
                                    borderRadius: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center p-12 max-w-lg bg-[#0f0f12] rounded-3xl border border-white/5 shadow-2xl">
                            <div className="mb-6 inline-flex p-6 bg-purple-500/10 rounded-full">
                                <Download size={48} className="text-purple-400 animate-bounce" />
                            </div>
                            <h2 className="text-2xl text-white font-black mb-3 italic">Formato não suportado para leitura direta</h2>
                            <p className="text-white/40 mb-8 leading-relaxed">
                                O Bunker ainda não possui um renderizador nativo para <span className="text-purple-400 font-bold uppercase">{book.file_type}</span>.
                                <br />Faça o download para ler em seu dispositivo.
                            </p>
                            <a
                                href={streamUrl}
                                download
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Download size={20} /> BAIXAR AGORA
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const baseReaderStyles: any = {
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column'
    },
    reader: {
        flex: 1,
        position: 'relative',
        zIndex: 1
    },
    swipeWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        zIndex: 2
    },
    prev: {
        left: 1
    },
    next: {
        right: 1
    },
    arrow: {
        outline: 'none',
        border: 'none',
        background: 'none',
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: '2rem',
        padding: '0 1rem',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'color 0.2s',
        '&:hover': {
            color: 'rgba(255, 255, 255, 0.8)'
        }
    },
    arrowHover: {
        color: 'rgba(255, 255, 255, 0.8)'
    },
    tocArea: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 3,
        width: '300px',
        background: '#111',
        transition: 'transform 0.3s'
    },
    tocAreaButton: {
        userSelect: 'none',
        appearance: 'none',
        background: 'none',
        border: 'none',
        display: 'block',
        fontFamily: 'inherit',
        width: '100%'
    },
    loadingView: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#fff'
    }
};

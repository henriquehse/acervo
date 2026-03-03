'use client';

import { MessageSquare, Mic, BookOpen, Command, ArrowUp } from 'lucide-react';

interface DockProps {
    onOpenFred?: () => void;
    onOpenDocs?: () => void;
    onOpenCmds?: () => void;
}

export function Dock({ onOpenFred, onOpenDocs, onOpenCmds }: DockProps) {

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] md:w-auto max-w-md md:max-w-none">
            <div className="flex items-center justify-between md:justify-center gap-2 md:gap-4 bg-[#08080c]/60 backdrop-blur-2xl px-4 py-3 md:px-6 md:py-4 rounded-[2rem] border border-white/5 shadow-2xl shadow-black/50 hover:bg-[#08080c]/80 transition-all duration-300 group ring-1 ring-white/5 hover:ring-white/10 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                {/* Fred Trigger */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={onOpenFred}
                        className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#FF6B00] to-[#E05A45] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 hover:scale-110 hover:shadow-orange-500/40 transition-all duration-300 group-hover:-translate-y-2"
                    >
                        <MessageSquare size={24} className="text-white fill-white/20" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#08080c] rounded-full animate-pulse" />
                    </button>
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest whitespace-nowrap hidden md:block">
                        Fred
                    </span>
                </div>

                <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2 flex-shrink-0" />

                <DockItem icon={BookOpen} label="Manual" onClick={onOpenDocs || (() => { })} />
                <DockItem icon={Command} label="Cmds" onClick={onOpenCmds || (() => { })} />
                <DockItem icon={Mic} label="Voice" onClick={() => { }} />

                <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2 flex-shrink-0" />

                {/* To Top Button */}
                <div className="relative group/item flex-shrink-0">
                    <button
                        onClick={scrollToTop}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-2"
                    >
                        <ArrowUp size={20} className="text-gray-400 group-hover/item:text-white" strokeWidth={2.5} />
                    </button>
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 opacity-0 group-hover/item:opacity-100 transition-opacity uppercase tracking-widest whitespace-nowrap hidden md:block">
                        Topo
                    </span>
                </div>

            </div>
        </div >
    );
}

function DockItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <div className="relative group/item flex-shrink-0">
            <button
                onClick={onClick}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-2"
            >
                <Icon size={20} className="text-gray-400 group-hover/item:text-white" />
            </button>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 opacity-0 group-hover/item:opacity-100 transition-opacity uppercase tracking-widest whitespace-nowrap hidden md:block">
                {label}
            </span>
        </div>
    );
}

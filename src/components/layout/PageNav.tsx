'use client';

import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageNavProps {
    title?: string;
    className?: string;
}

export function PageNav({ title, className = '' }: PageNavProps) {
    const router = useRouter();

    return (
        <div className={`fixed top-0 left-0 right-0 z-[80] md:left-[var(--sidebar-width,5rem)] ${className}`}>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#08080c]/90 backdrop-blur-md border-b border-white/5">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all text-sm font-medium"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={18} strokeWidth={2} />
                    <span className="hidden sm:inline text-xs">Voltar</span>
                </button>

                <Link
                    href="/"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all text-sm font-medium"
                    aria-label="Home"
                >
                    <Home size={18} strokeWidth={2} />
                    <span className="hidden sm:inline text-xs">Home</span>
                </Link>

                {title && (
                    <span className="ml-2 text-xs font-bold text-white/60 uppercase tracking-widest truncate">
                        {title}
                    </span>
                )}
            </div>
        </div>
    );
}

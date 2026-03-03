'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import CommandCenter from "@/components/CommandCenter";

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    const isFullScreen = isLoginPage;
    const isMobile = useIsMobile();

    return (
        <>
            {!isFullScreen && <Sidebar />}

            <div
                className="flex-1 flex flex-col min-h-screen transition-all duration-300 relative"
                style={{
                    paddingLeft: isFullScreen || isMobile ? '0' : 'var(--sidebar-width)',
                    paddingTop: !isFullScreen && isMobile ? '6rem' : '0',
                }}
            >
                {pathname === '/' && <CommandCenter />}
                {children}
            </div>
        </>
    );
}

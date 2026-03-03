import { cn } from "@/lib/utils/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    action?: ReactNode;
}

export function GlassCard({ children, className, title, action }: GlassCardProps) {
    return (
        <div className={cn("glass-card rounded-2xl p-6 flex flex-col h-full", className)}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4">
                    {title && <h3 className="text-lg font-medium text-white/90">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

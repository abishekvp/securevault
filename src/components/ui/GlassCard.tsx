'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    layoutId?: string;
    onClick?: () => void;
}

export default function GlassCard({
    children,
    className,
    hoverEffect = false,
    layoutId,
    onClick
}: GlassCardProps) {
    return (
        <motion.div
            layoutId={layoutId}
            whileHover={hoverEffect ? { scale: 1.02, backgroundColor: "rgba(2, 6, 23, 0.7)" } : undefined}
            whileTap={hoverEffect ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-xl p-6 shadow-2xl transition-colors",
                hoverEffect && "cursor-pointer hover:border-white/20",
                className
            )}
        >
            {/* Subtle Gradient Overlay */}
            <div className="pointer-events-none absolute -inset-px bg-gradient-to-br from-white/5 to-transparent opacity-50" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}

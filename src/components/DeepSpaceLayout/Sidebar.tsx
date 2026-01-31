'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, FileText, Trash2, Settings, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

interface SidebarProps {
    activeTab: 'all' | 'logins' | 'notes' | 'trash';
    onTabChange: (tab: any) => void;
    onLock: () => void;
    itemsCount: number;
}

export default function Sidebar({ activeTab, onTabChange, onLock, itemsCount }: SidebarProps) {
    const navItems = [
        { id: 'all', label: 'All Items', icon: Shield },
        { id: 'logins', label: 'Logins', icon: Key },
        { id: 'notes', label: 'Secure Notes', icon: FileText },
        { id: 'trash', label: 'Trash', icon: Trash2 },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-20 lg:w-72 flex flex-col items-center lg:items-stretch py-8 lg:px-6 z-40">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 mb-10 px-2 lg:px-4">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="hidden lg:block font-bold text-xl tracking-tight text-white">
                    Vault<span className="text-cyan-400">.io</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 w-full">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "group relative flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300",
                                isActive ? "text-white" : "text-slate-400 hover:text-white"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-bg"
                                    className="absolute inset-0 bg-white/5 border border-white/5 rounded-xl backdrop-blur-md"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <div className="relative z-10 flex items-center gap-3 w-full">
                                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-cyan-400" : "group-hover:text-cyan-400")} />
                                <span className="hidden lg:block font-medium">{item.label}</span>
                                {item.id === 'all' && (
                                    <span className="hidden lg:block ml-auto text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                                        {itemsCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Security Pulse Widget (Mini) */}
            <div className="hidden lg:flex flex-col gap-4 mt-auto mb-6 p-4 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vault Health</span>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs text-emerald-400 font-medium">98%</span>
                    </div>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[98%] bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-1 w-full pt-4 border-t border-white/5">
                <button
                    onClick={onLock}
                    className="group flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Lock className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
                    <span className="hidden lg:block font-medium">Lock Vault</span>
                </button>
                <button
                    onClick={() => signOut()}
                    className="group flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Settings className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
                    <span className="hidden lg:block font-medium">Settings</span>
                </button>
            </div>
        </aside>
    );
}

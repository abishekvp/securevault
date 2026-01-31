'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Copy, Eye, EyeOff, MoreHorizontal, ExternalLink } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils'; // Assumed exist from step 504

interface Account {
    id: string;
    name: string;
    username: string;
    password?: string;
    notes?: string;
    fields: any[];
    createdAt: number;
}

interface VaultGridProps {
    accounts: Account[];
    onSelect: (id: string | null) => void;
    selectedId: string | null;
    onAddNew: () => void;
}

// Staggered Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function VaultGrid({ accounts, onSelect, selectedId, onAddNew }: VaultGridProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCopyId, setActiveCopyId] = useState<string | null>(null);

    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setActiveCopyId(id);
        setTimeout(() => setActiveCopyId(null), 2000);
    };

    return (
        <div className="flex-1 p-6 lg:p-10 ml-0 lg:ml-72 overflow-y-auto min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header & Command Palette */}
                <header className="flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div className="relative w-full max-w-xl group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search vault..."
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-lg backdrop-blur-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10 blur-xl" />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAddNew}
                        className="flex items-center gap-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Item</span>
                    </motion.button>
                </header>

                {/* Bento Grid */}
                {filteredAccounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 opacity-50" />
                        </div>
                        <p>No items found matching "{searchQuery}"</p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]"
                    >
                        {filteredAccounts.map((account) => (
                            <motion.div key={account.id} variants={itemVariants} layoutId={`card-${account.id}`}>
                                <GlassCard
                                    hoverEffect
                                    className="h-full flex flex-col justify-between group"
                                    onClick={() => onSelect(account.id)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            {/* Icon Placeholder (Future: Logo Fetcher) */}
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                                                {account.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{account.name}</h3>
                                                <p className="text-sm text-slate-400 font-medium truncate">{account.username}</p>
                                            </div>
                                        </div>
                                        <button className="text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-2">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Password Mask */}
                                        <div className="flex items-center justify-between bg-slate-950/30 p-3 rounded-lg border border-white/5 group/field hover:border-white/10 transition-colors">
                                            <div className="flex gap-1.5">
                                                {[...Array(8)].map((_, i) => (
                                                    <div key={i} className="w-2 h-2 rounded-full bg-slate-600 group-hover/field:bg-cyan-500/50 transition-colors" />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleCopy(e, account.password || '', account.id)}
                                                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-md transition-all relative"
                                                    title="Copy Password"
                                                >
                                                    {activeCopyId === account.id ? (
                                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-400 font-bold text-xs absolute -top-8 -left-2 bg-slate-900 border border-emerald-500/30 px-2 py-1 rounded-md shadow-lg">Copied!</motion.span>
                                                    ) : null}
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-2 border-t border-white/5">
                                            <span>Last modified recently</span>
                                            {/* Tag implementation later */}
                                            <span className="px-2 py-1 rounded-md bg-white/5 text-slate-400">Login</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

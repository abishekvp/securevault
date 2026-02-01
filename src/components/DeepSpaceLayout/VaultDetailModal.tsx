'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Eye, EyeOff, Trash2, Edit, Save, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/ui/GlassCard';

interface Account {
    id: string;
    name: string;
    username: string;
    password?: string;
    notes?: string;
    fields: any[];
    createdAt: string;
}

interface VaultDetailModalProps {
    account: Account;
    onClose: () => void;
    onDelete: (id: string) => void;
    onSave: (acc: Account) => void;
}

export default function VaultDetailModal({ account, onClose, onDelete, onSave }: VaultDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editedAccount, setEditedAccount] = useState<Account>(account);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast logic to be lifted or handled by a context ideally
    };

    const handleSave = () => {
        onSave(editedAccount);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 pointer-events-none">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-auto"
            />

            {/* Modal Card */}
            <motion.div
                layoutId={`card-${account.id}`}
                className="w-full max-w-2xl pointer-events-auto z-10"
            >
                <GlassCard className="h-full max-h-[90vh] overflow-y-auto flex flex-col bg-slate-900/90 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                                {account.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedAccount.name}
                                        onChange={(e) => setEditedAccount({ ...editedAccount, name: e.target.value })}
                                        className="bg-transparent border-b border-cyan-500/50 text-2xl font-bold text-white focus:outline-none mb-1 w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <h2 className="text-3xl font-bold text-white">{account.name}</h2>
                                )}
                                <p className="text-slate-400 font-medium">Login Item</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(account.id)}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Save
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all ml-2"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 flex-1">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Username</label>
                            <div className="relative group">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedAccount.username}
                                        onChange={(e) => setEditedAccount({ ...editedAccount, username: e.target.value })}
                                        className="w-full p-4 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:border-cyan-500/50 focus:outline-none"
                                    />
                                ) : (
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-white/10 group-hover:border-white/20 transition-all">
                                        <span className="text-lg text-white font-mono">{account.username}</span>
                                        <button onClick={() => handleCopy(account.username)} className="text-slate-500 hover:text-cyan-400 transition-colors">
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Password</label>
                            <div className="relative group">
                                {isEditing ? (
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={editedAccount.password}
                                            onChange={(e) => setEditedAccount({ ...editedAccount, password: e.target.value })}
                                            className="w-full p-4 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:border-cyan-500/50 focus:outline-none font-mono"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-white/10 group-hover:border-white/20 transition-all">
                                        <span className="text-lg text-white font-mono tracking-wider">
                                            {showPassword ? account.password : '••••••••••••••••'}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-white transition-colors">
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                            <button onClick={() => handleCopy(account.password || '')} className="text-slate-500 hover:text-cyan-400 transition-colors">
                                                <Copy className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex gap-4 text-sm text-slate-500">
                        <span>Created {new Date(account.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>0 shares</span>
                    </div>

                </GlassCard>
            </motion.div>
        </div>
    );
}

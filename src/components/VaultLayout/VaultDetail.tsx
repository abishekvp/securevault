'use client';

import React, { useState, useEffect } from 'react';
import VaultItemIcon from './VaultItemIcon';
import PasswordGenerator from '../PasswordGenerator';
import { Copy, Eye, EyeOff, Trash2, Plus, Dice5, Save, X, Edit, ExternalLink, Clock, Share2, ArrowLeft } from 'lucide-react';
import * as OTPAuth from 'otpauth';

import { AccountUI, CustomField, FolderUI } from '@/types/vault';
import ShareModal from './ShareModal';

interface VaultDetailProps {
    account: AccountUI | null;
    onSave: (updated: AccountUI) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onRestore?: (id: string) => Promise<void>;
    folders?: FolderUI[];
    autoEdit?: boolean;
    onBack?: () => void;
}

export default function VaultDetail({ account, onSave, onDelete, onRestore, folders = [], autoEdit = false, onBack }: VaultDetailProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editForm, setEditForm] = useState<AccountUI | null>(null);
    const [showGenerator, setShowGenerator] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showTOTPSetup, setShowTOTPSetup] = useState(false);
    const [tempTOTPSecret, setTempTOTPSecret] = useState('');

    // TOTP State
    const [totpCode, setTotpCode] = useState<string>('000000');
    const [totpProgress, setTotpProgress] = useState(0);

    // Reset state when selection changes
    useEffect(() => {
        setIsEditing(autoEdit);
        setShowPassword(false);
        setEditForm(account ? JSON.parse(JSON.stringify(account)) : null);
        setShowTOTPSetup(false);
        setTempTOTPSecret('');
    }, [account, autoEdit]);

    // TOTP Timer Effect
    useEffect(() => {
        if (!account?.totpSecret || isEditing) return;

        let interval: NodeJS.Timeout;
        try {
            const totp = new OTPAuth.TOTP({
                secret: OTPAuth.Secret.fromBase32(account.totpSecret),
                algorithm: 'SHA1',
                digits: 6,
                period: 30
            });

            const updateTotp = () => {
                const token = totp.generate();
                const seconds = Math.floor(Date.now() / 1000);
                const progress = ((seconds % 30) / 30) * 100;

                setTotpCode(token);
                setTotpProgress(progress);
            };

            updateTotp();
            interval = setInterval(updateTotp, 1000);
        } catch (e) {
            console.error("Invalid TOTP Secret", e);
        }

        return () => clearInterval(interval);
    }, [account, isEditing]);

    if (!account) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-gray-400 p-8 relative z-10">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
                    <div className="w-12 h-12 text-gray-500 opacity-50">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                </div>
                <h3 className="text-xl font-medium text-gray-300">No Account Selected</h3>
                <p className="mt-2 text-sm text-gray-500">Select an account from the list to view details.</p>
            </div>
        );
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm) return;
        setIsSaving(true);
        try {
            await onSave(editForm);
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveTOTP = async () => {
        if (!account) return;
        const secret = tempTOTPSecret.replace(/\s/g, '').toUpperCase();
        if (!secret) return;

        setIsSaving(true);
        try {
            const updated = { ...account, totpSecret: secret };
            await onSave(updated);
            setShowTOTPSetup(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            await onDelete(account.id);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could trigger toast here
    };

    // Form Helpers
    const updateField = (id: string, key: keyof CustomField, val: string) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            fields: editForm.fields.map(f => f.id === id ? { ...f, [key]: val } : f)
        });
    };

    const addField = () => {
        if (!editForm) return;
        const newField: CustomField = { id: crypto.randomUUID(), label: '', value: '', type: 'text' };
        setEditForm({ ...editForm, fields: [...editForm.fields, newField] });
    };

    const removeField = (id: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, fields: editForm.fields.filter(f => f.id !== id) });
    };

    // --- VIEW MODE ---
    if (!isEditing) {
        return (
            <div className="flex-1 flex flex-col h-full bg-black/20 backdrop-blur-md overflow-y-auto relative z-10">
                {/* Header */}
                <div className="p-8 pb-6 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            {/* Mobile Back Button */}
                            <button onClick={onBack} className="md:hidden p-1 text-gray-400 hover:text-white">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <VaultItemIcon name={account.name} size="xl" />
                        </div>
                        <div className="flex gap-2">
                            {account.trashDate ? (
                                <button
                                    onClick={() => onRestore?.(account.id)}
                                    className="h-9 px-4 rounded-lg bg-[hsl(var(--primary))] text-black border border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-sm font-bold transition-all flex items-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Restore
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowShare(true)}
                                        className="h-9 px-4 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-sm font-medium transition-all flex items-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-all flex items-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-1 text-white tracking-tight">{account.name}</h1>
                    <p className="text-gray-400">{account.username}</p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 max-w-3xl">
                    <div className="relative group p-1">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[hsl(var(--primary))] to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                        <div className="relative bg-black/40 border border-white/10 rounded-2xl p-6 space-y-6">
                            <div className="group/item relative">
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Username / Email</label>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-lg font-mono text-gray-200 select-all">{account.username || '—'}</span>
                                    <button onClick={() => copyToClipboard(account.username)} className="p-2 text-gray-500 hover:text-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary))]/10 opacity-0 group-hover/item:opacity-100 transition-all" title="Copy Username">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="group/item relative">
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Password</label>
                                <div className="flex items-center justify-between">
                                    <span className={`font-medium text-lg font-mono break-all ${showPassword ? 'text-[hsl(var(--primary))]' : 'text-gray-400'}`}>
                                        {showPassword ? account.password : '••••••••••••••••'}
                                    </span>
                                    <div className="flex gap-1 items-center opacity-0 group-hover/item:opacity-100 transition-all">
                                        <button onClick={() => setShowPassword(!showPassword)} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => copyToClipboard(account.password || '')} className="p-2 text-gray-500 hover:text-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary))]/10" title="Copy Password">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* TOTP Section */}
                            {account.totpSecret ? (
                                <>
                                    <div className="h-px bg-white/5" />
                                    <div className="group/item relative">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> One-Time Password
                                            </label>
                                            <button
                                                onClick={() => { setTempTOTPSecret(account.totpSecret || ''); setShowTOTPSetup(true); }}
                                                className="text-[10px] text-gray-600 hover:text-gray-400 uppercase font-bold tracking-widest"
                                            >
                                                Update
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className="font-medium text-2xl font-mono text-[hsl(var(--primary))] tracking-widest">{totpCode.replace(/(.{3})(.{3})/, "$1 $2")}</span>
                                                <div className="w-full max-w-[120px] h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[hsl(var(--primary))] transition-all duration-1000 ease-linear"
                                                        style={{ width: `${totpProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={() => copyToClipboard(totpCode)} className="p-2 text-gray-500 hover:text-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary))]/10 opacity-0 group-hover/item:opacity-100 transition-all" title="Copy OTP">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="h-px bg-white/5" />
                                    {!showTOTPSetup ? (
                                        <div className="flex items-center justify-between group/item">
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold">Two-Factor Authentication</label>
                                            <button
                                                onClick={() => setShowTOTPSetup(true)}
                                                className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-gray-300 transition-all flex items-center gap-2"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Setup TOTP
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            )}

                            {showTOTPSetup && (
                                <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Secret Key</label>
                                        <button onClick={() => setShowTOTPSetup(false)} className="text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg h-9 px-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                                            placeholder="JBSWY3DPEHPK3PXP"
                                            value={tempTOTPSecret}
                                            onChange={e => setTempTOTPSecret(e.target.value.toUpperCase())}
                                        />
                                        <button
                                            onClick={handleSaveTOTP}
                                            disabled={isSaving || !tempTOTPSecret.trim()}
                                            className="h-9 px-4 rounded-lg bg-[hsl(var(--primary))] text-black font-bold text-sm hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50"
                                        >
                                            {isSaving ? '...' : 'Save'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Enter the Base32 secret provided by the website.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Fields */}
                    {account.fields.length > 0 && (
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4">Additional Info</h3>
                            {account.fields.map(field => (
                                <div key={field.id} className="group flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                    <div className="w-1/3">
                                        <span className="text-sm font-medium text-gray-400">{field.label}</span>
                                    </div>
                                    <div className="flex-1 text-right flex items-center justify-end gap-3">
                                        <span className="text-sm font-mono text-gray-200 select-all">{field.value}</span>
                                        <button onClick={() => copyToClipboard(field.value)} className="text-gray-600 hover:text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Notes */}
                    {account.notes && (
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Notes</h3>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{account.notes}</p>
                        </div>
                    )}

                    <div className="pt-8 flex justify-between text-sm text-gray-600">
                        <span>Created {new Date(account.createdAt).toLocaleDateString()}</span>
                        <button onClick={handleDelete} className="text-red-500/70 hover:text-red-500 hover:underline flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            {account.trashDate ? 'Delete Forever' : 'Delete Account'}
                        </button>
                    </div>
                </div>

                {/* Share Modal */}
                {showShare && (
                    <ShareModal
                        item={account}
                        onClose={() => setShowShare(false)}
                    />
                )}
            </div>
        );
    }

    // --- EDIT MODE ---
    if (!editForm) return null;

    return (
        <div className="flex-1 flex flex-col h-full bg-black/20 backdrop-blur-md overflow-y-auto relative z-10">
            <form onSubmit={handleSave} className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-black/40 backdrop-blur-xl flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} type="button" className="md:hidden text-gray-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white">Edit Account</h2>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="h-9 px-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="h-9 px-4 rounded-lg bg-[hsl(var(--primary))] text-black text-sm font-bold hover:bg-[hsl(var(--primary))]/90 transition-colors flex items-center gap-2" disabled={isSaving}>
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="p-8 max-w-3xl space-y-6 mx-auto w-full">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Website URL</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all placeholder:text-gray-600"
                                placeholder="https://example.com"
                                value={editForm.url || ''}
                                onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Folder</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                value={editForm.folderId || ''}
                                onChange={e => setEditForm({ ...editForm, folderId: e.target.value || undefined })}
                            >
                                <option value="" className="bg-black text-gray-300">No Folder</option>
                                {folders.map(f => (
                                    <option key={f._id} value={f._id} className="bg-black">{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Username</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                value={editForm.username}
                                onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                />
                                <button type="button" className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-[hsl(var(--primary))]" onClick={() => setShowGenerator(!showGenerator)}>
                                    <Dice5 className="w-5 h-5" />
                                </button>
                            </div>
                            {showGenerator && (
                                <div className="mt-2 p-4 bg-black/40 rounded-xl border border-white/10">
                                    <PasswordGenerator
                                        onGenerate={(pass) => setEditForm({ ...editForm, password: pass })}
                                        onClose={() => setShowGenerator(false)}
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">TOTP Secret Key</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all placeholder:text-gray-600"
                                placeholder="e.g. JBSWY3DPEHPK3PXP"
                                value={editForm.totpSecret || ''}
                                onChange={e => setEditForm({ ...editForm, totpSecret: e.target.value.replace(/\s/g, '').toUpperCase() })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-bold text-gray-300">Custom Fields</label>
                            <button type="button" onClick={addField} className="text-xs text-[hsl(var(--primary))] font-bold hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Field
                            </button>
                        </div>
                        <div className="space-y-3">
                            {editForm.fields.map(field => (
                                <div key={field.id} className="flex gap-2 items-start">
                                    <input
                                        className="w-1/3 bg-white/5 border border-white/10 rounded-lg h-9 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                                        placeholder="Label"
                                        value={field.label}
                                        onChange={e => updateField(field.id, 'label', e.target.value)}
                                    />
                                    <input
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg h-9 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                                        placeholder="Value"
                                        value={field.value}
                                        onChange={e => updateField(field.id, 'value', e.target.value)}
                                    />
                                    <button type="button" onClick={() => removeField(field.id)} className="p-2 text-gray-500 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Notes</label>
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all min-h-[120px]"
                            value={editForm.notes}
                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}

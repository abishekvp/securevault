'use client';

import React, { useState } from 'react';
import { Save, Dice5, Plus, X, Loader2 } from 'lucide-react';
import PasswordGenerator from '../PasswordGenerator';
import { FolderUI, CustomField } from '@/types/vault';

interface CreateItemModalProps {
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    folders: FolderUI[];
}

export default function CreateItemModal({ onClose, onSave, folders }: CreateItemModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        url: '',
        folderId: '',
        totpSecret: '',
        notes: '',
        fields: [] as CustomField[]
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Clean up data before saving
            const dataToSave = {
                ...formData,
                folderId: formData.folderId || undefined,
                // Ensure TOTP secret is clean if provided
                totpSecret: formData.totpSecret ? formData.totpSecret.replace(/\s/g, '').toUpperCase() : undefined
            };
            await onSave(dataToSave);
            onClose();
        } catch (error) {
            console.error("Failed to create item", error);
            // Ideally show error info here
        } finally {
            setIsSaving(false);
        }
    };

    const addField = () => {
        const newField: CustomField = { id: crypto.randomUUID(), label: '', value: '', type: 'text' };
        setFormData({ ...formData, fields: [...formData.fields, newField] });
    };

    const updateField = (id: string, key: keyof CustomField, val: string) => {
        setFormData({
            ...formData,
            fields: formData.fields.map(f => f.id === id ? { ...f, [key]: val } : f)
        });
    };

    const removeField = (id: string) => {
        setFormData({ ...formData, fields: formData.fields.filter(f => f.id !== id) });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <form onSubmit={handleSave} className="flex flex-col h-full min-h-0">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                        <h2 className="text-xl font-bold text-white">Create New Account</h2>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-8 overflow-y-auto space-y-6 flex-1 min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                    placeholder="e.g. Netflix, Gmail"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-300">Username / Email</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-[hsl(var(--primary))]"
                                        onClick={() => setShowGenerator(!showGenerator)}
                                        title="Generate Password"
                                    >
                                        <Dice5 className="w-5 h-5" />
                                    </button>
                                </div>
                                {showGenerator && (
                                    <div className="absolute top-full left-0 right-0 mt-2 z-10 bg-[#111] rounded-xl border border-white/10 p-4 shadow-xl">
                                        <PasswordGenerator
                                            onGenerate={(pass) => setFormData({ ...formData, password: pass })}
                                            onClose={() => setShowGenerator(false)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium mb-1 text-gray-300">Website URL</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all placeholder:text-gray-600"
                                    placeholder="https://example.com"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-300">Folder</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                    value={formData.folderId}
                                    onChange={e => setFormData({ ...formData, folderId: e.target.value })}
                                >
                                    <option value="" className="bg-black text-gray-300">No Folder</option>
                                    {folders.map(f => (
                                        <option key={f._id} value={f._id} className="bg-black">{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-300">TOTP Secret Key</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all placeholder:text-gray-600"
                                    placeholder="e.g. JBSWY3DPEHPK3PXP"
                                    value={formData.totpSecret}
                                    onChange={e => setFormData({ ...formData, totpSecret: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Custom Fields */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-gray-300">Custom Fields</label>
                                <button type="button" onClick={addField} className="text-xs text-[hsl(var(--primary))] font-bold hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Field
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.fields.map(field => (
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

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Notes</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all min-h-[100px]"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Secure notes..."
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-colors flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

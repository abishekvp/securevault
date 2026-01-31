'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Mail, Loader2, Send } from 'lucide-react';

interface AdminSettingsModalProps {
    onClose: () => void;
}

export default function AdminSettingsModal({ onClose }: AdminSettingsModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [config, setConfig] = useState({
        host: '',
        port: 587,
        secure: false,
        user: '',
        pass: '',
        from: ''
    });
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        fetch('/api/admin/mail')
            .then(res => res.json())
            .then(data => {
                setConfig(prev => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (!res.ok) throw new Error('Failed to save');
            alert('Settings saved!');
        } catch (e) {
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail) return alert('Enter an email to test');
        setTesting(true);
        try {
            const res = await fetch('/api/admin/mail/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: testEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            alert('Test email sent successfully!');
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setTesting(false);
        }
    };

    if (loading) return null; // Or loader

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-[hsl(var(--primary))]" />
                        Mail Configuration
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    <form id="mail-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-gray-300">SMTP Host</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                value={config.host}
                                onChange={e => setConfig({ ...config, host: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Port</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                value={config.port}
                                onChange={e => setConfig({ ...config, port: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="flex items-end pb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                    checked={config.secure}
                                    onChange={e => setConfig({ ...config, secure: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-300">Use Secure (TLS)</span>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">User</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                value={config.user}
                                onChange={e => setConfig({ ...config, user: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
                            <input
                                type="password"
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                value={config.pass}
                                onChange={e => setConfig({ ...config, pass: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-gray-300">From Email</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                value={config.from}
                                onChange={e => setConfig({ ...config, from: e.target.value })}
                                required
                            />
                        </div>
                    </form>

                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Test Configuration</h3>
                        <div className="flex gap-4">
                            <input
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                placeholder="Recipient Email"
                                value={testEmail}
                                onChange={e => setTestEmail(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={testing}
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send Test
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button
                        type="submit"
                        form="mail-form"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-colors flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Mail } from 'lucide-react';

export default function AdminSettingsPage() {
    const [config, setConfig] = useState({
        smtpHost: '',
        smtpPort: '',
        smtpUser: '',
        smtpPass: '', // we might not want to return this back to UI always, but for editing we might need to overwrite
        smtpFrom: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch existing config
        fetch('/api/admin/settings?key=email_config')
            .then(res => res.json())
            .then(data => {
                if (data && data.value) {
                    setConfig(prev => ({ ...prev, ...data.value }));
                }
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'email_config',
                    value: config
                })
            });

            if (!res.ok) throw new Error('Failed to save settings');
            setMessage('Settings saved successfully.');
        } catch (error) {
            setMessage('Error saving settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-4xl">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-gray-400">Configure system parameters.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Email Configuration (SMTP)</h3>
                        <p className="text-sm text-gray-500">Required for OTP and notifications.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">SMTP Host</label>
                            <input
                                className="w-full bg-black/20 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                value={config.smtpHost}
                                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">SMTP Port</label>
                            <input
                                className="w-full bg-black/20 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                value={config.smtpPort}
                                onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                                placeholder="587"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">SMTP User</label>
                            <input
                                className="w-full bg-black/20 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                value={config.smtpUser}
                                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">SMTP Password</label>
                            <input
                                type="password"
                                className="w-full bg-black/20 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                value={config.smtpPass}
                                onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                                placeholder="********"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-gray-300">From Email</label>
                            <input
                                className="w-full bg-black/20 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                value={config.smtpFrom}
                                onChange={(e) => setConfig({ ...config, smtpFrom: e.target.value })}
                                placeholder="noreply@securevault.com"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                        {message && <span className="text-green-500 text-sm">{message}</span>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-10 px-6 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center gap-2 ml-auto"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

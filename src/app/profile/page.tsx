'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { User, Mail, Shield, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        currentPassword: '',
        newPassword: '',
    });

    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || '',
                // session.user doesn't strictly have username unless we customized types, 
                // but we might need to fetch it or just use name for now.
                // Re-fetching full profile is better.
            }));
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Implement profile update logic
            // For now just simulation or partial update
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    username: formData.username,
                    // Password change would be a separate flow usually
                })
            });

            if (!res.ok) throw new Error('Failed to update profile');

            await update({ name: formData.name });
            setSuccess('Profile updated successfully');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/vault" className="text-gray-500 hover:text-white transition-colors">
                        &larr; Back to Vault
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
                    {/* User Info */}
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-purple-600 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-black">
                            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{session?.user?.name}</h2>
                            <p className="text-gray-400">{session?.user?.email}</p>
                            {session?.user?.isAdmin && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-500/20 text-red-500 text-xs font-bold mt-2">
                                    Administrator
                                </span>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        className="w-full bg-black/20 border border-white/10 rounded-xl h-11 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Username</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        className="w-full bg-black/20 border border-white/10 rounded-xl h-11 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
                                        placeholder="Set a username"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    // Disable since we need specific API for unique check
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">Security</h3>
                            <div className="space-y-4">
                                <button type="button" className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center text-[hsl(var(--primary))]">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-white">Email Address</div>
                                            <div className="text-sm text-gray-500">{session?.user?.email}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider group-hover:underline">Change</span>
                                </button>

                                <button type="button" className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center text-[hsl(var(--primary))]">
                                            <KeyRound className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-white">Master Password</div>
                                            <div className="text-sm text-gray-500">Last changed recently</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-wider group-hover:underline">Change</span>
                                </button>
                            </div>
                        </div>

                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        {success && <div className="text-green-500 text-sm">{success}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-11 px-8 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-all flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

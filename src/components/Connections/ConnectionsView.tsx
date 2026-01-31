'use client';

import React, { useState, useEffect } from 'react';
import { User, UserPlus, Check, X, Search, Loader2, Menu } from 'lucide-react';

interface ConnectionsViewProps {
    onMenuClick?: () => void;
}

export default function ConnectionsView({ onMenuClick }: ConnectionsViewProps) {
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchVal, setSearchVal] = useState('');
    const [sending, setSending] = useState(false);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/connections');
            const data = await res.json();
            setConnections(data.connections);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    const handleSendRequest = async () => {
        if (!searchVal.trim()) return;
        setSending(true);
        try {
            const res = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetEmailOrUsername: searchVal })
            });
            if (!res.ok) {
                const msg = await res.text();
                alert(msg);
            } else {
                alert('Request sent!');
                setSearchVal('');
                fetchConnections();
            }
        } catch (e) { alert('Failed to send request'); }
        finally { setSending(false); }
    };

    const handleRespond = async (userId: string, action: 'accept' | 'reject') => {
        try {
            const res = await fetch('/api/connections/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, action })
            });
            if (res.ok) fetchConnections();
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

    const pending = connections.filter(c => c.status === 'pending');
    const sent = connections.filter(c => c.status === 'sent');
    const accepted = connections.filter(c => c.status === 'accepted');

    return (
        <div className="flex-1 flex flex-col h-full bg-black/20 backdrop-blur-md text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold">Connections</h2>
                        <p className="text-gray-400 hidden sm:block">Connect with people to safely share passwords.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Add Connection */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-[hsl(var(--primary))]" />
                        Add Connection
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                className="w-full bg-black border border-white/10 rounded-xl h-11 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                placeholder="Enter email or username..."
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                            />
                        </div>
                        <button
                            onClick={handleSendRequest}
                            disabled={sending}
                            className="bg-[hsl(var(--primary))] text-black font-bold h-11 px-8 rounded-xl hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 w-full sm:w-max ml-auto"
                        >
                            {sending ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </div>

                {/* Pending Requests */}
                {pending.length > 0 && (
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-gray-400 uppercase text-xs tracking-wider">Pending Requests</h3>
                        <div className="grid gap-4">
                            {pending.map(c => (
                                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                                            {c.username?.[0]?.toUpperCase() || c.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold">{c.name || c.username}</p>
                                            <p className="text-sm text-gray-400">{c.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRespond(c.id, 'accept')} className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30">
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleRespond(c.id, 'reject')} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sent Requests */}
                {sent.length > 0 && (
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-gray-400 uppercase text-xs tracking-wider">Sent Requests</h3>
                        <div className="grid gap-4">
                            {sent.map(c => (
                                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between opacity-70">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold">
                                            {c.username?.[0]?.toUpperCase() || c.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold">{c.name || c.username}</p>
                                            <p className="text-sm text-gray-400">{c.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded">Pending Acceptance</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Accepted Connections */}
                <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-400 uppercase text-xs tracking-wider">Your Connections</h3>
                    {accepted.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No connections yet. Add someone above!
                        </div>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                            {accepted.map(c => (
                                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-[hsl(var(--primary))]/50 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                                        {c.username?.[0]?.toUpperCase() || c.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{c.name || c.username}</p>
                                        <p className="text-sm text-gray-400">{c.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

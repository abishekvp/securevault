'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Check, X, Clock, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Connection {
    userId: {
        _id: string;
        name: string;
        email: string;
        username?: string;
        image?: string;
    };
    status: 'pending' | 'sent' | 'accepted' | 'blocked';
    _id: string;
}

export default function ConnectionsPage() {
    const { data: session } = useSession();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchEmail, setSearchEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Fetch Connections
    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/user/connections');
            const data = await res.json();
            if (res.ok) {
                setConnections(data.connections);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchConnections();
    }, [session]);

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        setMsg({ type: '', text: '' });

        try {
            const res = await fetch('/api/user/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetEmail: searchEmail })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to send request');

            setMsg({ type: 'success', text: 'Request sent successfully!' });
            setSearchEmail('');
            fetchConnections();

        } catch (err: any) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setIsAdding(false);
        }
    };

    const handleAction = async (targetId: string, action: 'accept' | 'reject') => {
        try {
            const res = await fetch('/api/user/connections', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: targetId, action })
            });
            if (res.ok) fetchConnections();
        } catch (e) {
            console.error(e);
        }
    };

    const pendingRequests = connections.filter(c => c.status === 'pending'); // Incoming
    const sentRequests = connections.filter(c => c.status === 'sent');
    const friends = connections.filter(c => c.status === 'accepted');

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/vault" className="text-gray-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-[hsl(var(--primary))]" />
                        Deep Connections
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content: List */}
                    <div className="md:col-span-2 space-y-8">

                        {/* Incoming Requests */}
                        {pendingRequests.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-[hsl(var(--primary))] uppercase tracking-wider flex items-center gap-2">
                                    Incoming Requests <span className="bg-[hsl(var(--primary))] text-black px-1.5 rounded-full text-xs">{pendingRequests.length}</span>
                                </h3>
                                <div className="space-y-3">
                                    {pendingRequests.map(c => (
                                        <div key={c._id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white">
                                                    {c.userId.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{c.userId.name}</div>
                                                    <div className="text-xs text-gray-500">{c.userId.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction(c.userId._id, 'accept')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors">
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleAction(c.userId._id, 'reject')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Friends List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Connections</h3>
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="p-8 border border-white/5 border-dashed rounded-xl text-center text-gray-500">
                                    You haven't connected with anyone yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {friends.map(c => (
                                        <div key={c._id} className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:border-[hsl(var(--primary))]/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                                                    {c.userId.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-[hsl(var(--primary))] transition-colors">{c.userId.name}</div>
                                                    <div className="text-xs text-gray-500">{c.userId.email}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-600 font-mono">
                                                Connected
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sent Requests */}
                        {sentRequests.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    Sent Requests
                                </h3>
                                <div className="space-y-2 opacity-60">
                                    {sentRequests.map(c => (
                                        <div key={c._id} className="flex items-center justify-between py-2 px-4 bg-white/5 rounded-lg">
                                            <span className="text-sm text-gray-300">{c.userId.email}</span>
                                            <span className="text-xs text-yellow-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Pending
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Add Friend */}
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl sticky top-8">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-[hsl(var(--primary))]" />
                                Add Connection
                            </h3>
                            <form onSubmit={handleSendRequest} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                                    <div className="relative mt-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="email"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl h-10 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                            placeholder="friend@example.com"
                                            value={searchEmail}
                                            onChange={e => setSearchEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isAdding}
                                    className="w-full h-10 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-all flex items-center justify-center gap-2"
                                >
                                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
                                </button>

                                {msg.text && (
                                    <div className={`p-3 rounded-lg text-xs font-medium ${msg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {msg.text}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

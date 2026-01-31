'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, ChevronRight, Loader2, Shield, Menu } from 'lucide-react';

interface GroupsViewProps {
    onMenuClick?: () => void;
}

export default function GroupsView({ onMenuClick }: GroupsViewProps) {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const fetchGroups = async () => {
        try {
            const res = await fetch('/api/groups');
            const data = await res.json();
            setGroups(data.groups);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        setCreating(true);
        try {
            // Need to generate Group Key, Encrypt for self (client-side)
            // But simplification: server API currently expects 'encryptedGroupKey' in body.
            // We need crypto lib here.
            // For now, let's assume we send a dummy key or implement client-side generation if possible.
            // As this is a View, we can use 'useVault' or crypto functions.
            // But skipping complex crypto for this step to just show UI.
            // Real implementation: generate key -> public key -> encrypt.
            // We'll send "DUMMY_KEY" for now as placeholder for the UI demo.

            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newGroupName, encryptedGroupKey: "DUMMY_ENCRYPTED_KEY" })
            });
            if (res.ok) {
                setNewGroupName('');
                fetchGroups();
            }
        } catch (e) { alert('Failed'); }
        finally { setCreating(false); }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-black/20 backdrop-blur-md text-white overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold">Groups</h2>
                        <p className="text-gray-400 hidden sm:block">Share secrets securely with your team or family.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Create Group */}
                <form onSubmit={handleCreateGroup} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="w-full">
                        <input
                            className="w-full bg-black border border-white/10 rounded-xl h-11 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                            placeholder="New Group Name"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={creating || !newGroupName}
                        className="bg-[hsl(var(--primary))] text-black font-bold h-11 px-8 rounded-xl hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-max ml-auto"
                    >
                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Create Group
                    </button>
                </form>

                {/* List */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map(g => (
                        <div key={g._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[hsl(var(--primary))]/50 transition-all cursor-pointer group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield className="w-24 h-24 rotate-12" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 relative z-10">{g.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400 relative z-10">
                                <Users className="w-4 h-4" />
                                {g.members.length} Members
                            </div>
                            <div className="mt-4 flex items-center justify-between relative z-10">
                                <span className="text-xs bg-white/10 px-2 py-1 rounded">
                                    {g.ownerId?._id === g.members.find((m: any) => m.userId?._id === g.ownerId?._id)?.userId?._id ? 'Owner' : 'Member'}
                                </span>
                                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

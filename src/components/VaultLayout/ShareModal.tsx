import React, { useState, useEffect } from 'react';
import { X, Share2, Search, User, Check, Loader2, AlertCircle } from 'lucide-react';
import { AccountUI } from '@/types/vault';
import { useVault } from '@/context/VaultContext';
import { wrapKeyWithPublic, importPublicKey, encryptData } from '@/lib/crypto';
import { VaultService } from '@/services/vault';

interface ShareModalProps {
    item: AccountUI;
    onClose: () => void;
}

interface ConnectionUI {
    _id: string; // Connection object ID? No, we want User ID usually, but API returns connections array
    userId: {
        _id: string;
        name: string;
        email: string;
        publicKey?: string;
    };
    status: string;
}

export default function ShareModal({ item, onClose }: ShareModalProps) {
    const { masterKey } = useVault();
    const [connections, setConnections] = useState<ConnectionUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharingWith, setSharingWith] = useState<string | null>(null); // userId
    const [status, setStatus] = useState<'idle' | 'sharing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const res = await fetch('/api/user/connections');
                if (res.ok) {
                    const data = await res.json();
                    // Filter only accepted connections with public keys
                    const validFriends = data.connections.filter((c: any) =>
                        c.status === 'accepted' && c.userId.publicKey
                    );
                    setConnections(validFriends);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchConnections();
    }, []);

    const handleShare = async (friend: ConnectionUI['userId']) => {
        if (!masterKey || !friend.publicKey) return;

        setStatus('sharing');
        setSharingWith(friend._id);
        setErrorMsg('');

        try {
            // 1. Get the Item's Key (We don't have the raw ItemKey here, we only have the item data)
            // Wait, to share, we need to decrypt the ItemKey using MasterKey, 
            // then re-encrypt it using Friend's Public Key.

            // Problem: `item` prop is AccountUI (decrypted data). It does NOT have the `encryptedItemKey`.
            // We need to fetch the raw item first? Or pass it down?
            // Passing it down is cleaner but `VaultDetail` doesn't have it either (it receives decrypted `account`).
            // `VaultView` has it in `fetchVaultItems` but discards it after decrypt.

            // Solution: Fetch the single item raw data again from API using ID.
            const rawItem = await VaultService.getItem(item.id);
            if (!rawItem) throw new Error('Item not found');

            // 2. Decrypt ItemKey (AES) using MasterKey
            // We need `decryptData` and `importKey` imports.
            // Let's assume we can move these imports or logic. 
            // Better: `VaultService` or `crypto` helper? 
            // I'll assume I can import crypto utils here.

            // Actually, better architecture:
            // Delegate the heavy lifting to `VaultView` via a `onShare(itemId, targetUserId)` callback?
            // `ShareModal` should just select the user.
            // But `ShareModal` is a nice self-contained unit.
            // Let's use crypto utils here.

            // Import necessary functions if not available (I added them to imports above).
            const { decryptData, importKey } = await import('@/lib/crypto');

            const itemKeyRawB64 = await decryptData(masterKey, rawItem.encryptedItemKey);
            const itemKey = await importKey(itemKeyRawB64);

            // 3. Encrypt ItemKey with Friend's Public Key
            const friendPublicKey = await importPublicKey(friend.publicKey);
            const wrappedKey = await wrapKeyWithPublic(itemKey, friendPublicKey);

            // 4. Send to Share API
            const res = await fetch('/api/vault/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: item.id,
                    targetUserId: friend._id,
                    encryptedItemKey: wrappedKey
                })
            });

            if (!res.ok) throw new Error('Failed to share');

            setStatus('success');
            setTimeout(onClose, 1500);

        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setErrorMsg(e.message || 'Share failed');
            setSharingWith(null);
        }
    };

    const filtered = connections.filter(c =>
        c.userId.name.toLowerCase().includes(search.toLowerCase()) ||
        c.userId.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-[hsl(var(--primary))]" />
                        Share Account
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center text-[hsl(var(--primary))] font-bold text-lg">
                            {item.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-bold text-white truncate">{item.name}</div>
                            <div className="text-xs text-gray-500 truncate">{item.username || 'No username'}</div>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            className="w-full bg-black/20 border border-white/10 rounded-xl h-10 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                            placeholder="Search connections..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[300px]">
                        {loading ? (
                            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-600" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 text-sm">
                                {connections.length === 0 ? "No friends with sharing keys found." : "No matches found."}
                            </div>
                        ) : (
                            filtered.map(c => (
                                <button
                                    key={c._id}
                                    onClick={() => handleShare(c.userId)}
                                    disabled={status === 'sharing' || status === 'success'}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                            {c.userId.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-200 group-hover:text-white">{c.userId.name}</div>
                                            <div className="text-xs text-gray-600">{c.userId.email}</div>
                                        </div>
                                    </div>
                                    {sharingWith === c.userId._id ? (
                                        status === 'success' ? <Check className="w-5 h-5 text-green-500" /> : <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--primary))]" />
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            Share
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {errorMsg && (
                    <div className="p-4 border-t border-white/10 bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errorMsg}
                    </div>
                )}
            </div>
        </div>
    );
}

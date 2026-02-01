'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useVault } from '@/context/VaultContext';
import { generateSalt, deriveMasterKey, generateVaultKey, encryptData, exportKey, decryptData, importKey, generateKeyPair, exportPublicKey, exportPrivateKey, unwrapKeyWithPrivate, importPrivateKey } from '@/lib/crypto';
import { signOut } from 'next-auth/react';
import { ShieldCheck, Lock, Unlock, Settings, LogOut, Loader2, ArrowRight, Plus } from 'lucide-react';
import { VaultService, VaultItem } from '@/services/vault';
import VaultSidebar from './VaultLayout/VaultSidebar';
import VaultList from './VaultLayout/VaultList';
import VaultDetail from './VaultLayout/VaultDetail';
import CreateItemModal from './VaultLayout/CreateItemModal';
import AdminSettingsModal from './Admin/AdminSettingsModal';
import ConnectionsView from './Connections/ConnectionsView';
import GroupsView from './Groups/GroupsView';
import SettingsView from './Settings/SettingsView';
import NotificationBell from './VaultLayout/NotificationBell';
import { AccountUI, CustomField, FolderUI } from '@/types/vault';
import { useSession } from 'next-auth/react';

interface VaultViewProps {
    userData: {
        encryptionSalt: string | null;
        encryptedVaultKey?: string | null;
        publicKey?: string | null;
        encryptedPrivateKey?: string | null;
        isAdmin?: boolean;
    };
    userEmail: string;
}

export default function VaultView({ userData, userEmail }: VaultViewProps) {
    // --- Security & Setup State ---
    const [status, setStatus] = useState<'LOCKED' | 'UNLOCKED' | 'MAINTENANCE'>('LOCKED');
    const { masterKey, setMasterKey } = useVault();

    // --- Data State ---
    const [accounts, setAccounts] = useState<AccountUI[]>([]);
    const [folders, setFolders] = useState<FolderUI[]>([]);

    // --- UI State ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [decryptionError, setDecryptionError] = useState(false);

    const [currentFilter, setCurrentFilter] = useState<string>('all');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [showAdminSettings, setShowAdminSettings] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // --- Encryption Helpers ---

    const decryptVaultItem = useCallback(async (item: VaultItem, mKey: CryptoKey): Promise<AccountUI | null> => {
        try {
            const itemKeyRaw = await decryptData(mKey, item.encryptedItemKey);
            const itemKey = await importKey(itemKeyRaw);
            const decryptedJson = await decryptData(itemKey, item.encryptedData);
            const data = JSON.parse(decryptedJson);

            return {
                ...data,
                id: item._id,
                type: item.type,
                createdAt: new Date(item.createdAt).getTime(),
                folderId: item.folderId,
                favorite: item.favorite
            };
        } catch (e) {
            console.error(`Failed to decrypt item ${item._id}`, e);
            throw e;
        }
    }, []);

    const encryptVaultItem = async (data: any, mKey: CryptoKey) => {
        const itemKey = await generateVaultKey();
        const itemKeyRaw = await exportKey(itemKey);
        const dataJson = JSON.stringify(data);
        const encryptedData = await encryptData(itemKey, dataJson);
        const encryptedItemKey = await encryptData(mKey, itemKeyRaw);
        return { encryptedData, encryptedItemKey };
    };

    // --- Initialization & Auto-Unlock ---

    // 1. Auto-Unlock Logic
    // 1. Auto-Unlock Logic
    useEffect(() => {
        const initVault = async () => {
            setIsProcessing(true);
            try {
                // 1. Priority: Check Maintenance Mode
                const statusRes = await fetch('/api/system/status');
                if (statusRes.ok) {
                    const { maintenanceMode } = await statusRes.json();
                    if (maintenanceMode && !userData.isAdmin) {
                        setStatus('MAINTENANCE');
                        return; // Block access
                    }
                }

                // 2. Check if we already have the key (e.g. from context/hot-reload)
                if (masterKey) {
                    setStatus('UNLOCKED');
                    return;
                }

                // 3. Try to fetch existing key from server (Auto-Unlock)
                const res = await fetch('/api/user/key');

                // If key exists, use it
                if (res.ok) {
                    const { vaultKey } = await res.json();
                    const mKey = await importKey(vaultKey);
                    setMasterKey(mKey);
                    setStatus('UNLOCKED');

                    // Generate RSA keys if missing
                    if (!userData.publicKey) {
                        generateRSAKeys(mKey);
                    }
                    return;
                }

                // 4. If 404, we need new vault setup
                if (res.status === 404) {
                    console.log("Initializing new vault...");
                    const mKey = await generateVaultKey();
                    const vaultKeyB64 = await exportKey(mKey);

                    const setupRes = await fetch('/api/vault/setup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vaultKey: vaultKeyB64,
                            encryptedVaultData: null
                        })
                    });

                    if (!setupRes.ok) throw new Error('Failed to initialize vault.');

                    setMasterKey(mKey);
                    setStatus('UNLOCKED');

                    // Generate RSA keys
                    generateRSAKeys(mKey);
                } else {
                    throw new Error('Failed to retrieve vault key');
                }
            } catch (e: any) {
                console.error("Auto-unlock error:", e);
                setError(e.message || "Failed to access vault");
            } finally {
                // If we are still processing and haven't blocked/unlocked, stop spinning?
                // Actually, if we hit maintenance or unlocked, we are good.
                // If error, we stop.
                // We only want to stop spinning if we are NOT in maintenance (status handles UI)
                // But let's just create consistency.
                setIsProcessing(false);
            }
        };

        initVault();
    }, [userData, userEmail, masterKey, setMasterKey]);

    const generateRSAKeys = async (mKey: CryptoKey) => {
        try {
            const keyPair = await generateKeyPair();
            const publicKeyB64 = await exportPublicKey(keyPair.publicKey);
            const privateKeyB64 = await exportPrivateKey(keyPair.privateKey);
            const encryptedPrivateKey = await encryptData(mKey, privateKeyB64);

            await fetch('/api/user/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publicKey: publicKeyB64,
                    encryptedPrivateKey
                })
            });
        } catch (e) {
            console.error("Failed to generate RSA keys", e);
        }
    };


    // 2. Fetch Items
    const fetchVaultItems = useCallback(async (isTrashMode: boolean) => {
        if (!masterKey) return;

        try {
            setIsProcessing(true);
            const [itemsFromApi, foldersFromApi, sharesRes] = await Promise.all([
                VaultService.getItems(undefined, isTrashMode),
                isTrashMode ? Promise.resolve([]) : VaultService.getFolders(),
                !isTrashMode ? fetch('/api/vault/share') : Promise.resolve(null)
            ]);

            setFolders(foldersFromApi);

            const decryptedList: AccountUI[] = [];
            let failedCount = 0;

            for (const item of itemsFromApi) {
                try {
                    const dec = await decryptVaultItem(item, masterKey);
                    if (dec) decryptedList.push(dec);
                } catch (e) {
                    failedCount++;
                }
            }

            if (itemsFromApi.length > 0 && failedCount === itemsFromApi.length) {
                setDecryptionError(true);
            }

            // Shared Items
            if (sharesRes && sharesRes.ok) {
                const { shares } = await sharesRes.json();
                if (userData.encryptedPrivateKey && shares.length > 0) {
                    try {
                        const privateKeyRawB64 = await decryptData(masterKey, userData.encryptedPrivateKey);
                        const privateKey = await importPrivateKey(privateKeyRawB64);
                        for (const share of shares) {
                            if (!share.itemId) continue;
                            try {
                                const itemKey = await unwrapKeyWithPrivate(share.encryptedItemKey, privateKey);
                                const item = share.itemId;
                                const decryptedJson = await decryptData(itemKey, item.encryptedData);
                                const data = JSON.parse(decryptedJson);
                                decryptedList.push({
                                    id: item._id, ...data, type: item.type,
                                    createdAt: new Date(item.createdAt).getTime(),
                                    favorite: false, sharedBy: share.senderId.name
                                });
                            } catch (e) { console.error("Share decrypt fail", e); }
                        }
                    } catch (e) { console.error("Private Key decrypt fail", e); }
                }
            }

            setAccounts(decryptedList);
        } catch (e) {
            console.error("Failed to fetch items", e);
        } finally {
            setIsProcessing(false);
        }
    }, [masterKey, decryptVaultItem, userData.encryptedPrivateKey]);


    useEffect(() => {
        if (status !== 'UNLOCKED' || !masterKey) return;
        const isTrashMode = currentFilter === 'trash';
        fetchVaultItems(isTrashMode);
    }, [status, masterKey, currentFilter, fetchVaultItems]);


    // Clear newlyCreatedId when selection changes (prevents stuck edit mode)
    useEffect(() => {
        if (newlyCreatedId && selectedItemId !== newlyCreatedId) {
            setNewlyCreatedId(null);
        }
    }, [selectedItemId, newlyCreatedId]);

    // --- Actions (CRUD) ---

    // ... (Keep existing CRUD handlers, they are fine)
    const handleAddItem = () => {
        setShowCreateModal(true);
    };

    const handleCreateItem = async (data: any) => {
        if (!masterKey) return;
        try {
            const newItemData = {
                id: crypto.randomUUID(),
                name: data.name,
                username: data.username,
                password: data.password,
                url: data.url,
                folderId: data.folderId,
                totpSecret: data.totpSecret,
                notes: data.notes,
                fields: data.fields || [],
                createdAt: Date.now()
            };

            const { encryptedData, encryptedItemKey } = await encryptVaultItem(newItemData, masterKey);
            const savedItem = await VaultService.createItem({
                type: 'login',
                encryptedData,
                encryptedItemKey,
                favorite: false,
                folderId: data.folderId,
                title: data.name,
                username: data.username,
                url: data.url
            });
            const decryptedSaved = { ...newItemData, id: savedItem._id };
            setAccounts(prev => [decryptedSaved, ...prev]);
            setSelectedItemId(savedItem._id);
            // setNewlyCreatedId(savedItem._id); // Removed to prevent auto-edit mode
        } catch (e) { console.error(e); alert('Failed to create item'); }
    };

    const handleUpdateItem = async (updatedUI: AccountUI) => {
        if (!masterKey) return;
        try {
            const { encryptedData, encryptedItemKey } = await encryptVaultItem(updatedUI, masterKey);
            await VaultService.updateItem(updatedUI.id, {
                encryptedData,
                encryptedItemKey,
                favorite: updatedUI.favorite,
                title: updatedUI.name,
                username: updatedUI.username,
                url: updatedUI.url
            });
            setAccounts(prev => prev.map(a => a.id === updatedUI.id ? updatedUI : a));

            // Clear newly created status on save to exit edit mode loop
            if (newlyCreatedId === updatedUI.id) {
                setNewlyCreatedId(null);
            }
        } catch (e) { console.error(e); alert('Failed to save changes'); }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            const permanent = currentFilter === 'trash';
            await VaultService.deleteItem(id, permanent);
            setAccounts(prev => prev.filter(a => a.id !== id));
            if (selectedItemId === id) setSelectedItemId(null);
        } catch (e) { console.error(e); alert('Failed to delete item'); }
    };

    const handleRestoreItem = async (id: string) => {
        try {
            await VaultService.restoreItem(id);
            setAccounts(prev => prev.filter(a => a.id !== id));
            if (selectedItemId === id) setSelectedItemId(null);
        } catch (e) { console.error(e); alert('Failed to restore item'); }
    };

    const handleCreateFolder = async (name: string) => {
        try {
            const newFolder = await VaultService.createFolder(name);
            setFolders(prev => [...prev, newFolder]);
        } catch (e) { console.error(e); alert('Failed to create folder'); }
    };

    const handleDeleteFolder = async (id: string) => {
        try {
            await VaultService.deleteFolder(id);
            setFolders(prev => prev.filter(f => f._id !== id));
            if (currentFilter === id) setCurrentFilter('all');
            setAccounts(prev => prev.map(a => a.folderId === id ? { ...a, folderId: undefined } : a));
        } catch (e) { console.error(e); alert('Failed to delete folder'); }
    };

    const handleResetVault = async () => {
        if (!confirm("Are you sure? This will delete all existing vault data to create a new key.")) return;
        try {
            setIsProcessing(true);
            const mKey = await generateVaultKey();
            const vaultKeyB64 = await exportKey(mKey);

            // Wipe old data first
            await fetch('/api/vault/reset', { method: 'POST' });

            await fetch('/api/vault/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vaultKey: vaultKeyB64, encryptedVaultData: null })
            });

            setMasterKey(mKey);
            setAccounts([]);
            setDecryptionError(false);
            setError("");
        } catch (e) { alert("Reset failed"); } finally { setIsProcessing(false); }
    };


    // --- Filtering ---
    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch =
            acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.username.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (currentFilter === 'trash') return true;
        if (currentFilter === 'favorites') return acc.favorite === true;
        if (currentFilter === 'notes') return acc.type === 'note';
        if (currentFilter === 'logins') return acc.type === 'login' || !acc.type;
        if (currentFilter === 'all') return true;
        return acc.folderId === currentFilter;
    }) || [];

    const selectedAccount = accounts.find(a => a.id === selectedItemId) || null;

    // --- Render ---

    // --- Mobile Responsiveness ---
    const [mobileView, setMobileView] = useState<'sidebar' | 'list' | 'detail'>('list');

    // Navigation Wrappers
    const handleMobileMenu = () => setMobileView('sidebar');
    const handleMobileBack = () => setMobileView('list');

    const handleFilterChange = (filter: string) => {
        setCurrentFilter(filter);
        setMobileView('list'); // Auto-close sidebar on selection
    };

    const handleAccountSelect = (id: string) => {
        setSelectedItemId(id);
        setMobileView('detail'); // Auto-open detail on selection
    };

    const isSinglePaneView = ['connections', 'groups', 'settings', 'admin'].includes(currentFilter);

    // --- Render ---

    if (status === 'MAINTENANCE') {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md bg-[#0A0A0A] p-8 rounded-2xl border border-[hsl(var(--primary))]/20 shadow-[0_0_50px_-10px_hsl(var(--primary))]/10">
                    <div className="mx-auto w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Secure Vault under maintainance</h2>
                    <p className="text-gray-400">please be patient we will be live soon</p>
                </div>
            </div>
        );
    }

    // Loading State (while auto-unlocking)
    if (status === 'LOCKED') {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))] mx-auto" />
                    <p className="text-gray-400">Securing Vault...</p>
                    {error && (
                        <div className="max-w-md mx-auto p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-500">
                            <p className="font-bold mb-2">Access Error</p>
                            <p className="text-sm mb-4">{error}</p>
                            <button onClick={handleResetVault} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Reset Vault
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-transparent">

            {/* Top Bar Area */}
            <div className="h-14 flex items-center justify-between px-6 shrink-0 z-40 border-b border-white/5 bg-[#0A0A0A]">
                <div className="flex items-center gap-3 select-none">
                    <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-lg flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_hsl(var(--primary)_/_0.3)]">
                        S
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight text-white leading-none mb-0.5">Secure Vault</span>
                        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider leading-none">Zero-Knowledge</span>
                    </div>
                </div>
                <NotificationBell />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar Pane */}
                <div className={`${mobileView === 'sidebar' ? 'flex' : 'hidden'} md:flex h-full w-full md:w-auto`}>
                    <VaultSidebar
                        currentFilter={currentFilter}
                        setFilter={handleFilterChange}
                        onAdd={handleAddItem}
                        userEmail={userEmail}
                        folders={folders}
                        onCreateFolder={handleCreateFolder}
                        onDeleteFolder={handleDeleteFolder}
                        isAdmin={userData.isAdmin}
                        onClose={() => setMobileView('list')}
                    />
                </div>

                {/* List / Settings / Connections Pane */}
                <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex ${isSinglePaneView ? 'flex-1' : 'md:flex-none md:w-80'} h-full w-full`}>

                    {currentFilter === 'connections' ? (
                        <ConnectionsView onMenuClick={handleMobileMenu} />
                    ) : currentFilter === 'groups' ? (
                        <GroupsView onMenuClick={handleMobileMenu} />
                    ) : (currentFilter === 'settings' || currentFilter === 'admin') ? (
                        <SettingsView
                            userEmail={userEmail}
                            isAdmin={userData.isAdmin}
                            mode={currentFilter === 'admin' ? 'admin' : 'user'}
                        />
                    ) : (
                        <VaultList
                            accounts={filteredAccounts}
                            selectedId={selectedItemId}
                            onSelect={handleAccountSelect}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onMenuClick={handleMobileMenu}
                            onAdd={handleAddItem}
                            folders={folders}
                            activeFilter={currentFilter}
                            onFilterChange={handleFilterChange}
                        />
                    )}
                </div>

                {/* Detail Pane */}
                {!isSinglePaneView && (
                    <div className={`${mobileView === 'detail' ? 'flex' : 'hidden'} md:flex flex-1 h-full w-full`}>
                        <VaultDetail
                            account={selectedAccount}
                            onSave={handleUpdateItem}
                            onDelete={handleDeleteItem}
                            onRestore={handleRestoreItem}
                            folders={folders}
                            autoEdit={selectedItemId === newlyCreatedId && newlyCreatedId !== null}
                            onBack={handleMobileBack}
                        />
                    </div>
                )}

                {decryptionError && (
                    <div className="absolute bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5" />
                        <div>
                            <p className="font-bold text-sm">Decryption Error</p>
                            <p className="text-xs opacity-90">Some items could not be decrypted.</p>
                        </div>
                        <button onClick={handleResetVault} className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-bold transition-colors">
                            Reset All
                        </button>
                    </div>
                )}



                {showSettings && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="w-full max-w-sm relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
                            <div className="text-sm text-gray-400 mb-6">
                                Vault is automatically secured with your account.
                            </div>
                            <button onClick={() => setShowSettings(false)} className="w-full text-center mt-4 text-gray-500 hover:text-white">Close</button>
                        </div>
                    </div>
                )}

                {showCreateModal && (
                    <CreateItemModal
                        onClose={() => setShowCreateModal(false)}
                        onSave={handleCreateItem}
                        folders={folders}
                    />
                )}

                {showAdminSettings && (
                    <AdminSettingsModal
                        onClose={() => setShowAdminSettings(false)}
                    />
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden h-16 bg-[#0A0A0A] border-t border-white/10 flex items-center justify-around shrink-0 z-50 pb-safe">
                <button
                    onClick={() => {
                        setCurrentFilter('all');
                        setMobileView('list');
                    }}
                    className={`flex flex-col items-center gap-1 p-2 ${currentFilter !== 'settings' && currentFilter !== 'admin' ? 'text-[hsl(var(--primary))]' : 'text-gray-500 hover:text-white'}`}
                >
                    <div className={`p-1 rounded-full ${currentFilter !== 'settings' && currentFilter !== 'admin' ? 'bg-[hsl(var(--primary))]/10' : ''}`}>
                        <div className="w-5 h-5 flex items-center justify-center font-bold border-2 border-current rounded-md text-[10px]">V</div>
                    </div>
                    <span className="text-[10px] font-bold">Vault</span>
                </button>

                <button
                    onClick={handleAddItem}
                    className="flex flex-col items-center justify-center -mt-8"
                >
                    <div className="w-12 h-12 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center shadow-lg shadow-[hsl(var(--primary))]/30 text-black">
                        <Plus className="w-6 h-6" />
                    </div>
                </button>

                <button
                    onClick={() => {
                        setCurrentFilter('settings');
                        setMobileView('list');
                    }}
                    className={`flex flex-col items-center gap-1 p-2 ${currentFilter === 'settings' ? 'text-[hsl(var(--primary))]' : 'text-gray-500 hover:text-white'}`}
                >
                    <div className={`p-1 rounded-full ${currentFilter === 'settings' ? 'bg-[hsl(var(--primary))]/10' : ''}`}>
                        <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold">Settings</span>
                </button>
            </div>
        </div>
    );
}

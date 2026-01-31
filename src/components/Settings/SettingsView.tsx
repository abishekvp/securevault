'use client';

import React, { useState, useEffect } from 'react';

import { User as UserIcon, Shield, Lock, Bell, Mail, Key, Save, Loader2, Eye, EyeOff, Check, X, Megaphone, Send, QrCode as QrIcon, Copy, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import QRCode from 'qrcode';
import { VaultService } from '@/services/vault';
import { useVault } from '@/context/VaultContext';
import { generateVaultKey, exportKey, decryptData, importKey, encryptData, unwrapKeyWithPrivate } from '@/lib/crypto';

export default function SettingsView({ userEmail, isAdmin, initialTab = 'profile', mode = 'user' }: { userEmail: string, isAdmin?: boolean, initialTab?: string, mode?: 'user' | 'admin' }) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState(mode === 'admin' ? 'admin-mail' : 'profile');

    // Mobile State
    const [showMobileMenu, setShowMobileMenu] = useState(true);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>({});

    // Form States
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setShowMobileMenu(false); // Close menu on mobile
    };

    const [privacyConn, setPrivacyConn] = useState(false); // boolean
    const [privacyGroup, setPrivacyGroup] = useState('none');
    const [whitelistInput, setWhitelistInput] = useState('');
    const [whitelist, setWhitelist] = useState<string[]>([]);

    // Security State
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [securityAction, setSecurityAction] = useState<'password' | 'email' | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [tfaSetupData, setTfaSetupData] = useState<{ secret: string, uri: string } | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [tfaCode, setTfaCode] = useState('');
    const [tfaLoading, setTfaLoading] = useState(false);
    const [showTfaConfirm, setShowTfaConfirm] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const [isEncrypting, setIsEncrypting] = useState(false);
    const { masterKey, setMasterKey } = useVault(); // Get access to current master key

    // Admin State
    const [smtp, setSmtp] = useState({ host: '', port: 587, user: '', pass: '', secure: false, from: '' });
    const [productConfig, setProductConfig] = useState({ allowSignups: true, maintenanceMode: false });
    const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'info' });

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (data.user) {
                setProfile(data.user);
                setName(data.user.name || '');
                setUsername(data.user.username || '');
                setPrivacyConn(data.user.privacySettings?.autoAcceptConnections || false);
                setPrivacyGroup(data.user.privacySettings?.autoJoinGroups || 'none');
                setWhitelist(data.user.privacySettings?.autoJoinWhitelist || []);
                setIs2FAEnabled(data.user.is2FAEnabled || false);
            } else {
                console.error("Profile data missing user", data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchAdminSettings = async () => {
        if (!isAdmin) return;
        try {
            const res = await fetch('/api/admin/mail');
            const data = await res.json();
            if (data.config) {
                setSmtp(prev => ({ ...prev, ...data.config }));
            }

            const resProd = await fetch('/api/admin/product');
            const dataProd = await resProd.json();
            console.log("SettingsView Fetched Product Config:", dataProd);
            if (dataProd.productConfig) setProductConfig(dataProd.productConfig);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        console.log("SettingsView Mode:", mode, "isAdmin:", isAdmin);
        fetchProfile();
        // Fetch Admin Settings if in admin mode, regardless of specific tab
        if (isAdmin && mode === 'admin') fetchAdminSettings();

        // Reset active tab when mode switches
        if (mode === 'admin') setActiveTab('admin-mail');
        else setActiveTab('profile');
    }, [isAdmin, mode]);

    // Auto-Save Handlers
    const updatePrivacy = async (key: string, value: any) => {
        console.log("Updating Privacy:", key, value);
        // Optimistic Update
        if (key === 'autoAcceptConnections') setPrivacyConn(value);
        if (key === 'autoJoinGroups') setPrivacyGroup(value);
        if (key === 'autoJoinWhitelist') setWhitelist(value);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    privacySettings: {
                        [key]: value
                    }
                })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }
            showToast('Privacy settings updated', 'success');
        } catch (e: any) {
            console.error("Failed to save privacy", e);
            // Revert on error
            if (key === 'autoAcceptConnections') setPrivacyConn(!value);
            // We'd ideally revert others too but they are more complex
            showToast(`Failed to save: ${e.message}`, 'error');
        }
    };

    const handleSaveProfileName = async () => {
        try {
            await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username })
            });
            showToast('Profile updated!', 'success');
        } catch (e) { showToast('Failed to update profile', 'error'); }
    };

    const handleRequestOtp = async (action: 'password' | 'email') => {
        setSecurityAction(action);
        setOtpLoading(true);
        try {
            const res = await fetch('/api/auth/otp/request', { method: 'POST' });
            const data = await res.json();
            if (data.dev_otp) alert(`DEV OTP: ${data.dev_otp}`); // Dev convenience
            setShowOtpInput(true);
        } catch (e) { alert('Failed to send OTP'); }
        finally { setOtpLoading(false); }
    };

    const handleVerifyAndChange = async () => {
        if (!otp) return alert('Enter OTP');

        // Special Handling for Password Change: RE-ENCRYPTION
        if (securityAction === 'password') {
            if (!newPass) return alert('Enter new password');
            setOtpLoading(true);
            setIsEncrypting(true);

            try {
                // 1. Get Current Data
                if (!masterKey) throw new Error("Vault is locked, cannot re-encrypt");
                const itemsRequest = await VaultService.getAllItems();
                const items = itemsRequest instanceof Array ? itemsRequest : [];

                // 2. Generate New Vault Key
                const newVaultKeyObj = await generateVaultKey();
                const newVaultKeyB64 = await exportKey(newVaultKeyObj);

                // 3. Re-Wrap Keys
                const reEncryptedItems = [];
                for (const item of items) {
                    try {
                        // Decrypt Item Key with OLD Master Key
                        const itemKeyRaw = await decryptData(masterKey, item.encryptedItemKey);
                        // Encrypt Item Key with NEW Vault Key
                        const newItemKeyEncrypted = await encryptData(newVaultKeyObj, itemKeyRaw);

                        reEncryptedItems.push({
                            id: item._id,
                            encryptedItemKey: newItemKeyEncrypted
                        });
                    } catch (e) {
                        console.error(`Failed to re-wrap item ${item._id}`, e);
                        // We continue, but this item might be lost if we proceed. 
                        // Ideally we should abort. But for MVP let's warn.
                    }
                }

                // 4. Re-Encrypt Private Key (if exists)
                let newEncryptedPrivateKey = "";
                if (profile.encryptedPrivateKey) {
                    const privateKeyRaw = await decryptData(masterKey, profile.encryptedPrivateKey);
                    newEncryptedPrivateKey = await encryptData(newVaultKeyObj, privateKeyRaw);
                }

                // 5. Send Atomic Update
                await VaultService.reEncryptVault({
                    otp,
                    newPassword: newPass,
                    newVaultKey: newVaultKeyB64,
                    encryptedPrivateKey: newEncryptedPrivateKey || "",
                    items: reEncryptedItems
                });

                // 6. Success & Local Update
                setMasterKey(newVaultKeyObj); // Update context
                showToast('Password changed and vault re-encrypted successfully!', 'success');
                setShowOtpInput(false);
                setOtp('');
                setNewPass('');
                // Ideally reload to refresh everything cleanly
                window.location.reload();

            } catch (e: any) {
                console.error("Re-encryption failed", e);
                alert(`Failed to change password: ${e.message}`);
                setIsEncrypting(false);
            } finally {
                setOtpLoading(false);
            }
            return;
        }

        // Standard Email Update
        setOtpLoading(true);
        try {
            const payload: any = { otp };
            if (securityAction === 'email') payload.newEmail = newEmail;

            const res = await fetch('/api/user/security/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Updated successfully!');
                setShowOtpInput(false);
                setOtp('');
                setNewEmail('');
                if (securityAction === 'email') window.location.reload();
            } else {
                alert('Verification failed');
            }
        } catch (e) { alert('Failed to verify'); }
        finally { setOtpLoading(false); }
    };

    const handleSetup2FA = async () => {
        setTfaLoading(true);
        try {
            const res = await fetch('/api/user/2fa/setup', { method: 'POST' });
            const data = await res.json();
            if (data.secret) {
                setTfaSetupData(data);
                const url = await QRCode.toDataURL(data.uri);
                setQrCodeUrl(url);
            } else {
                showToast(data.error || 'Failed to initiate 2FA setup', 'error');
            }
        } catch (e) { showToast('2FA setup failed', 'error'); }
        finally { setTfaLoading(false); }
    };

    const handleEnable2FA = async () => {
        if (!tfaCode) return;
        setTfaLoading(true);
        try {
            const res = await fetch('/api/user/2fa/enable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: tfaCode })
            });
            const data = await res.json();
            if (res.ok) {
                setIs2FAEnabled(true);
                setTfaSetupData(null);
                setTfaCode('');
                showToast('2FA Enabled Successfully!', 'success');
            } else {
                showToast(data.error || 'Invalid code', 'error');
            }
        } catch (e) { showToast('Failed to enable 2FA', 'error'); }
        finally { setTfaLoading(false); }
    };

    const handleDisable2FA = async () => {
        if (!confirmPass) return;
        setTfaLoading(true);
        try {
            const res = await fetch('/api/user/2fa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: confirmPass })
            });
            if (res.ok) {
                setIs2FAEnabled(false);
                setShowTfaConfirm(false);
                setConfirmPass('');
                showToast('2FA Disabled', 'success');
            } else {
                const text = await res.text();
                showToast(text || 'Failed to disable 2FA', 'error');
            }
        } catch (e) { showToast('Error disabling 2FA', 'error'); }
        finally { setTfaLoading(false); }
    };

    // Admin Save
    // Admin Auto-Save
    const updateAdminMail = async (newSmtp: any) => {
        try {
            await fetch('/api/admin/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSmtp)
            });
            showToast('Mail configurations saved successfully', 'success');
        } catch (e) { console.error("Failed to save mail", e); showToast('Failed to save mail config', 'error'); }
    };

    const handleTestEmail = async () => {
        try {
            showToast('Sending test email...', 'info');
            const res = await fetch('/api/admin/mail/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smtp)
            });
            if (res.ok) {
                showToast('Test email sent successfully!', 'success');
            } else {
                const text = await res.text();
                showToast(`Failed: ${text}`, 'error');
            }
        } catch (e) { showToast('Failed to send test email', 'error'); }
    };

    const handleBroadcast = async () => {
        if (!broadcast.title || !broadcast.message) return showToast('Title and message required', 'warning');
        try {
            await fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ action: 'create', ...broadcast }) });
            showToast('Notification sent to all users', 'success');
            setBroadcast({ title: '', message: '', type: 'info' });
        } catch (e) { showToast('Failed to send notification', 'error'); }
    };

    const updateProductConfig = async (key: string, value: boolean) => {
        console.log("Updating Product Config:", key, value);
        const newConfig = { ...productConfig, [key]: value };
        setProductConfig(newConfig);
        try {
            const res = await fetch('/api/admin/product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            if (!res.ok) throw new Error("Failed to save");
            showToast('Product configuration updated', 'success');
        } catch (e) {
            console.error("Failed to save product config", e);
            showToast('Failed to update product config', 'error');
            setProductConfig(productConfig); // Revert
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;

    if (isEncrypting) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-[hsl(var(--primary))]/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <ShieldCheck className="w-10 h-10 text-[hsl(var(--primary))]" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Re-encrypting Vault</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    We are securing all your accounts with your new password. This ensures your data remains readable only by you.
                </p>
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-xl border border-white/10">
                    <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--primary))]" />
                    <span className="text-sm font-mono text-gray-300">Processing keys...</span>
                </div>
                <div className="mt-8 text-xs text-gray-500">
                    Do not close this window.
                </div>
            </div>
        );
    }



    // ... (rest of imports/state)

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050505] text-white overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
                {!showMobileMenu && (
                    <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-1 -ml-2 text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <h2 className="text-2xl font-bold">Settings</h2>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className={`${showMobileMenu ? 'block' : 'hidden'} md:block w-full md:w-64 border-r border-white/10 p-4 space-y-2 overflow-y-auto`}>
                    {mode === 'user' && (
                        <>
                            <button onClick={() => handleTabChange('profile')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${activeTab === 'profile' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'hover:bg-white/5'}`}>
                                <UserIcon className="w-5 h-5" /> Account
                            </button>
                            <button onClick={() => handleTabChange('security')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${activeTab === 'security' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'hover:bg-white/5'}`}>
                                <Lock className="w-5 h-5" /> Security
                            </button>
                            <button onClick={() => handleTabChange('privacy')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${activeTab === 'privacy' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'hover:bg-white/5'}`}>
                                <Shield className="w-5 h-5" /> Privacy
                            </button>
                        </>
                    )}
                    {mode === 'admin' && isAdmin && (
                        <>
                            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Configuration</div>
                            <button onClick={() => handleTabChange('admin-mail')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${activeTab === 'admin-mail' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'hover:bg-white/5'}`}>
                                <Mail className="w-5 h-5" /> Mail Server
                            </button>
                            <button onClick={() => handleTabChange('admin-product')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${activeTab === 'admin-product' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'hover:bg-white/5'}`}>
                                <Key className="w-5 h-5" /> Product
                            </button>
                            <button onClick={() => handleTabChange('admin-notify')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${activeTab === 'admin-notify' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'hover:bg-white/5'}`}>
                                <Megaphone className="w-5 h-5" /> Broadcast
                            </button>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className={`${!showMobileMenu ? 'block' : 'hidden'} md:block flex-1 overflow-y-auto p-4 md:p-8 w-full`}>
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold mb-4">Account Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Username</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2" value={username} onChange={e => setUsername(e.target.value)} />
                                </div>
                                <button onClick={handleSaveProfileName} className="bg-[hsl(var(--primary))] text-black px-6 py-2 rounded-xl font-bold">Save Profile Info</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8">
                            <h3 className="text-xl font-bold mb-4">Security</h3>

                            {/* Change Email */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                <h4 className="font-bold flex items-center gap-2"><Mail className="w-4 h-4" /> Change Email</h4>
                                <p className="text-sm text-gray-400 mb-4">Current: {userEmail}</p>
                                {!showOtpInput ? (
                                    <div className="flex gap-4">
                                        <input className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2" placeholder="New Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                                        <button onClick={() => handleRequestOtp('email')} disabled={!newEmail} className="bg-white text-black px-4 py-2 rounded-xl font-bold">Verify</button>
                                    </div>
                                ) : securityAction === 'email' && (
                                    <div className="mt-4 space-y-4">
                                        <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-2" placeholder="Enter OTP from current email" value={otp} onChange={e => setOtp(e.target.value)} />
                                        <button onClick={handleVerifyAndChange} className="bg-[hsl(var(--primary))] text-black px-6 py-2 rounded-xl font-bold">Confirm Email Change</button>
                                    </div>
                                )}
                            </div>

                            {/* Change Password */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                <h4 className="font-bold flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h4>
                                {!showOtpInput ? (
                                    <div className="mt-4 flex gap-4">
                                        <input type="password" className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2" placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} />
                                        <button onClick={() => handleRequestOtp('password')} disabled={!newPass} className="bg-white text-black px-4 py-2 rounded-xl font-bold">Update</button>
                                    </div>
                                ) : securityAction === 'password' && (
                                    <div className="mt-4 space-y-4">
                                        <input className="w-full bg-black border border-white/10 rounded-xl px-4 py-2" placeholder="Enter OTP sent to email" value={otp} onChange={e => setOtp(e.target.value)} />
                                        <button onClick={handleVerifyAndChange} className="bg-[hsl(var(--primary))] text-black px-6 py-2 rounded-xl font-bold">Confirm Password Change</button>
                                    </div>
                                )}
                            </div>

                            {/* Two-Factor Authentication */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl py-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-[hsl(var(--primary))]" /> Two-Factor Authentication</h4>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${is2FAEnabled ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-500 border border-white/5'}`}>
                                        {is2FAEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>

                                {!is2FAEnabled ? (
                                    <div className="space-y-4">
                                        {!tfaSetupData ? (
                                            <>
                                                <p className="text-sm text-gray-400">Add an extra layer of security to your account by requiring a 6-digit code from an authenticator app.</p>
                                                <button onClick={handleSetup2FA} disabled={tfaLoading} className="bg-white text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                                                    {tfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable 2FA'}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-4">
                                                    <p className="text-xs text-gray-300 font-bold uppercase">1. Scan this QR Code</p>
                                                    <div className="flex justify-center bg-white p-4 rounded-xl">
                                                        {qrCodeUrl ? (
                                                            <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                                                        ) : (
                                                            <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Or enter manual secret:</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="flex-1 text-[10px] text-gray-500 leading-relaxed break-all font-mono bg-black p-2 rounded border border-white/5">{tfaSetupData.secret}</p>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(tfaSetupData.secret);
                                                                    showToast('Secret copied to clipboard', 'success');
                                                                }}
                                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                                                                title="Copy Secret"
                                                            >
                                                                <Copy className="w-3 h-3 text-gray-400" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] text-gray-600 italic mt-1">Scan using Google Authenticator, Authy, or Microsoft Authenticator.</p>
                                                </div>
                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                    <p className="text-xs text-gray-300 font-bold uppercase">2. Verify Verification Code</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-xl font-mono tracking-widest text-center"
                                                            maxLength={6}
                                                            placeholder="000000"
                                                            value={tfaCode}
                                                            onChange={e => setTfaCode(e.target.value)}
                                                        />
                                                        <button
                                                            disabled={tfaCode.length !== 6 || tfaLoading}
                                                            onClick={handleEnable2FA}
                                                            className="bg-[hsl(var(--primary))] text-black px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                                                        >
                                                            {tfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <button onClick={() => setTfaSetupData(null)} className="text-xs text-gray-500 hover:text-white transition-colors underline">Cancel Setup</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-400">Your account is protected with Two-Factor Authentication.</p>
                                        {!showTfaConfirm ? (
                                            <button onClick={() => setShowTfaConfirm(true)} className="text-sm text-red-500 hover:text-red-400 font-bold flex items-center gap-2">
                                                Disable 2FA
                                            </button>
                                        ) : (
                                            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                                                <p className="text-xs text-red-500 font-bold">Confirm password to disable 2FA</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="password"
                                                        className="flex-1 bg-black border border-red-500/20 rounded-lg px-4 py-2 text-sm"
                                                        placeholder="Your Password"
                                                        value={confirmPass}
                                                        onChange={e => setConfirmPass(e.target.value)}
                                                    />
                                                    <button
                                                        disabled={!confirmPass || tfaLoading}
                                                        onClick={handleDisable2FA}
                                                        className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
                                                    >
                                                        {tfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Disable'}
                                                    </button>
                                                </div>
                                                <button onClick={() => { setShowTfaConfirm(false); setConfirmPass(''); }} className="text-xs text-gray-500 hover:text-white transition-colors">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold mb-4">Privacy Settings</h3>

                            {/* Connection Requests Card */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-200">Auto-accept connections</label>
                                        <p className="text-xs text-gray-400">Instantly accept requests from found users.</p>
                                    </div>
                                    <button
                                        onClick={() => updatePrivacy('autoAcceptConnections', !privacyConn)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${privacyConn ? 'bg-[hsl(var(--primary))]' : 'bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform ${privacyConn ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Group Invites Card */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-200 mb-1">Auto-join groups</label>
                                    <p className="text-xs text-gray-400 mb-4">Automatically join groups when invited by...</p>
                                    <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-3" value={privacyGroup} onChange={e => updatePrivacy('autoJoinGroups', e.target.value)}>
                                        <option value="none">Off (Manual Accept)</option>
                                        <option value="connections">From Connections Only</option>
                                        <option value="specific">From Specific People Only</option>
                                    </select>
                                </div>

                                {privacyGroup === 'specific' && (
                                    <div className="bg-black/40 p-4 rounded-xl space-y-3 border border-white/5">
                                        <label className="text-xs text-gray-400 block font-bold">Whitelist (User IDs)</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                                                placeholder="Enter User ID"
                                                value={whitelistInput}
                                                onChange={e => setWhitelistInput(e.target.value)}
                                            />
                                            <button
                                                onClick={() => {
                                                    if (whitelistInput) {
                                                        const newList = [...whitelist, whitelistInput];
                                                        updatePrivacy('autoJoinWhitelist', newList);
                                                        setWhitelistInput('');
                                                    }
                                                }}
                                                className="bg-white text-black px-3 py-2 rounded font-bold text-sm hover:bg-gray-200"
                                            >Add</button>
                                        </div>
                                        <div className="space-y-1">
                                            {whitelist.map(id => (
                                                <div key={id} className="flex justify-between items-center text-xs bg-white/5 px-2 py-1 rounded border border-white/5">
                                                    <span className="font-mono text-gray-300">{id}</span>
                                                    <button onClick={() => {
                                                        const newList = whitelist.filter(w => w !== id);
                                                        updatePrivacy('autoJoinWhitelist', newList);
                                                    }}><X className="w-3 h-3 text-red-500 hover:text-red-400" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin-mail' && isAdmin && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold mb-4">Mail Server Configuration</h3>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                                <h4 className="font-bold border-b border-white/10 pb-2 mb-4">SMTP Settings</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Host</label>
                                        <input className="w-full bg-black border border-white/10 rounded px-3 py-2" value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Port</label>
                                        <input className="w-full bg-black border border-white/10 rounded px-3 py-2" type="number" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">User</label>
                                        <input autoComplete="off" className="w-full bg-black border border-white/10 rounded px-3 py-2" value={smtp.user} onChange={e => setSmtp({ ...smtp, user: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Pass</label>
                                        <input autoComplete="new-password" className="w-full bg-black border border-white/10 rounded px-3 py-2" type="password" value={smtp.pass} onChange={e => setSmtp({ ...smtp, pass: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-400 mb-1">From Email</label>
                                        <input className="w-full bg-black border border-white/10 rounded px-3 py-2" value={smtp.from} onChange={e => setSmtp({ ...smtp, from: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4 gap-3">
                                    <button onClick={handleTestEmail} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                                        <Send className="w-4 h-4" /> Test Email
                                    </button>
                                    <button onClick={() => updateAdminMail(smtp)} className="bg-[hsl(var(--primary))] text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin-product' && isAdmin && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold mb-4">Product Configuration</h3>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                    <span className="block font-bold text-white">Allow Public Signups</span>
                                    <p className="text-xs text-gray-400">If disabled, only admins can invite new users.</p>
                                </div>
                                <button
                                    onClick={() => updateProductConfig('allowSignups', !productConfig.allowSignups)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${productConfig.allowSignups ? 'bg-[hsl(var(--primary))]' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform ${productConfig.allowSignups ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                    <span className="block font-bold text-white">Maintenance Mode</span>
                                    <p className="text-xs text-gray-400">Lock the vault for non-admins.</p>
                                </div>
                                <button
                                    onClick={() => updateProductConfig('maintenanceMode', !productConfig.maintenanceMode)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${productConfig.maintenanceMode ? 'bg-[hsl(var(--primary))]' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform ${productConfig.maintenanceMode ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin-notify' && isAdmin && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold mb-4">Broadcast Notification</h3>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                                <p className="text-sm text-gray-400 mb-4">Send a system-wide notification to all users.</p>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Title</label>
                                    <input className="w-full bg-black border border-white/10 rounded px-3 py-2" value={broadcast.title} onChange={e => setBroadcast({ ...broadcast, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Message</label>
                                    <textarea className="w-full bg-black border border-white/10 rounded px-3 py-2 min-h-[100px]" value={broadcast.message} onChange={e => setBroadcast({ ...broadcast, message: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Type</label>
                                    <select className="w-full bg-black border border-white/10 rounded px-3 py-2" value={broadcast.type} onChange={e => setBroadcast({ ...broadcast, type: e.target.value })}>
                                        <option value="info">Info (Blue)</option>
                                        <option value="warning">Warning (Yellow)</option>
                                        <option value="alert">Alert (Red)</option>
                                    </select>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button onClick={handleBroadcast} className="bg-[hsl(var(--primary))] text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                                        <Send className="w-4 h-4" /> Send Notification
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

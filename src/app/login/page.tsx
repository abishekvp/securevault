'use client';

import { signIn } from 'next-auth/react';
import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { TrendingUp, ShieldCheck, Mail, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const router = useRouter();

    const [mode, setMode] = useState<'password' | 'otp'>('password');
    const [step, setStep] = useState<'email' | 'otp_code'>('email'); // for otp mode

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [tfaStep, setTfaStep] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const result = await signIn('credentials', {
            email,
            password,
            twoFactorCode: tfaStep ? twoFactorCode : undefined,
            redirect: false,
        });

        if (result?.error) {
            if (result.error === '2FA_REQUIRED') {
                setTfaStep(true);
                setMessage('');
            } else {
                setMessage('Authentication Failed. Check credentials.');
            }
            setLoading(false);
        } else {
            router.push('/vault');
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'login' }),
            });

            if (!res.ok) throw new Error('Failed to send OTP');

            setStep('otp_code');
            setMessage('OTP Sent. Please check your email.');
        } catch (err) {
            setMessage('Failed to send OTP. Check email.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const result = await signIn('credentials', {
            email,
            otp,
            redirect: false,
        });

        if (result?.error) {
            setMessage('Invalid OTP.');
            setLoading(false);
        } else {
            router.push('/vault');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden pt-16">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[hsl(var(--primary))]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="container relative z-10 px-4 flex justify-center">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                            <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 group-hover:bg-[hsl(var(--primary))]/20 transition-colors">
                                <TrendingUp className="w-6 h-6 text-[hsl(var(--primary))]" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-white">
                                SECURE<span className="text-[hsl(var(--primary))]">VAULT</span>
                            </span>
                        </Link>
                        <h1 className="text-3xl font-bold text-white mb-2 uppercase">Welcome Back</h1>
                        <p className="text-[hsl(var(--muted-foreground))]">Access your secure vault</p>
                    </div>

                    {/* Login Card */}
                    <div className="relative group">
                        {/* Glowing Border Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[hsl(var(--primary))] to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                        <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                            {(error || message) && (
                                <div className={`mb-6 p-4 border rounded-xl text-sm flex items-center gap-3 ${error || message.includes('Failed') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${error || message.includes('Failed') ? 'bg-red-500' : 'bg-green-500'}`} />
                                    {error ? 'Authentication Failed' : message}
                                </div>
                            )}

                            {mode === 'password' && (
                                <form onSubmit={handleCredentialsLogin} className="space-y-6">
                                    {!tfaStep ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">Email or Username</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 h-11 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        autoFocus
                                                        placeholder="Enter your email or username"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-300">Password</label>
                                                    <button type="button" onClick={() => { setMode('otp'); setStep('email'); setMessage(''); }} className="text-[10px] text-[hsl(var(--primary))] hover:underline">
                                                        Login with OTP instead
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="password"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 h-11 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-300 font-bold uppercase tracking-wider">Two-Factor Authentication</label>
                                                    <button type="button" onClick={() => setTfaStep(false)} className="text-[10px] text-gray-500 hover:text-white transition-colors">
                                                        Cancel
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">Enter the 6-digit code from your authenticator app.</p>
                                                <div className="relative">
                                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--primary))]" />
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        className="w-full bg-white/5 border border-[hsl(var(--primary))]/30 rounded-lg pl-10 h-12 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-600 font-mono text-xl tracking-[1em] text-center"
                                                        value={twoFactorCode}
                                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                                        required
                                                        autoFocus
                                                        placeholder="000000"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                {tfaStep ? 'Verify & Login' : 'Sign In'}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {mode === 'otp' && (
                                <form onSubmit={step === 'email' ? handleSendOtp : handleOtpLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-gray-300">Email Address</label>
                                            <button type="button" onClick={() => { setMode('password'); setMessage(''); }} className="text-[10px] text-[hsl(var(--primary))] hover:underline">
                                                Back to Password Login
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="email"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 h-11 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                readOnly={step === 'otp_code'}
                                                required
                                                autoFocus
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </div>

                                    {step === 'otp_code' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-sm font-medium text-gray-300">Enter OTP</label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 h-11 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500 font-mono tracking-widest"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    required
                                                    autoFocus
                                                    placeholder="000000"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                {step === 'email' ? 'Send OTP' : 'Login'}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Dividers and Social Login buttons remain same, just hiding for brevity if not needed in snippet */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                                <div className="relative flex justify-center text-sm"><span className="px-3 bg-black/40 text-gray-500">Or continue with</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => signIn('google', { callbackUrl: '/vault' })} className="flex items-center justify-center h-10 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" style={{ fill: '#4285F4' }} /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" style={{ fill: '#34A853' }} /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" style={{ fill: '#FBBC05' }} /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" style={{ fill: '#EA4335' }} /></svg>
                                </button>
                                <button onClick={() => signIn('azure-ad', { callbackUrl: '/vault' })} className="flex items-center justify-center h-10 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                                    <svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z" /><path fill="#81bc06" d="M12 1h10v10H12z" /><path fill="#05a6f0" d="M1 12h10v10H1z" /><path fill="#ffba08" d="M12 12h10v10H12z" /></svg>
                                </button>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 text-center">
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    New to Secure Vault? {" "}
                                    <Link href="/signup" className="text-[hsl(var(--primary))] font-semibold hover:underline">
                                        Sign up for free
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Footer Info */}
                    <div className="mt-10 flex items-center justify-center gap-6 grayscale opacity-50">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-white" />
                            <span className="text-xs font-medium uppercase tracking-widest text-white">Secure SSL</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <span className="text-xs font-medium uppercase tracking-widest text-gray-500">256-bit Encryption</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

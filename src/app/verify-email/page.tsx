'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, Mail } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

export default function VerifyEmailPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [step, setStep] = useState<'send' | 'verify'>('send');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session?.user?.email, type: 'verify' }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send OTP');
            }

            setStep('verify');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session?.user?.email, otp, type: 'verify' }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Invalid OTP');
            }

            // Reload session logic might be needed, or just redirect
            // Since session is JWT, we might need to re-login or refresh token.
            // For now, let's force a reload or signout/signin loop?
            // Actually, best user experience is just redirect to vault, 
            // but middleware might block because cookie is stale (isEmailVerified=false).
            // We should ask user to re-login or trigger session update.
            // Let's ask to re-login for security hygiene.

            await signOut({ callbackUrl: '/login' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[hsl(var(--primary))]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[hsl(var(--primary))] to-blue-600 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl space-y-8">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 rounded-2xl flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-8 h-8 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                            <p className="text-gray-400 text-sm">
                                {step === 'send'
                                    ? 'We need to verify your identity before accessing the vault.'
                                    : `Enter the code sent to ${session?.user?.email}`
                                }
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {step === 'send' ? (
                        <button
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5" /> Send Verification Code</>}
                        </button>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Enter OTP</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 h-12 text-center text-2xl tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-mono"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Verify & Login</>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('send')}
                                className="w-full text-sm text-gray-500 hover:text-white"
                            >
                                Resend Code
                            </button>
                        </form>
                    )}

                    <div className="pt-6 border-t border-white/10 text-center">
                        <button onClick={() => signOut()} className="text-xs text-gray-500 hover:text-white transition-colors">
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

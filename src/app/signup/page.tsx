'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, ShieldCheck, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, password })
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Signup failed');
            }

            router.push('/login?signedup=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
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
                            <span className="text-2xl font-black tracking-tighter text-white uppercase">
                                SECURE<span className="text-[hsl(var(--primary))]">VAULT</span>
                            </span>
                        </Link>
                        <h1 className="text-3xl font-bold text-white mb-2 uppercase">Create Account</h1>
                        <p className="text-[hsl(var(--muted-foreground))]">Start your secure journey</p>
                    </div>

                    {/* Signup Card */}
                    <div className="relative group">
                        {/* Glowing Border Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[hsl(var(--primary))] to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                        <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSignup} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 h-11 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. John Doe"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 h-11 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                                placeholder="Choose a username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="email"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 h-11 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="password"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 h-11 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all text-white placeholder:text-gray-500"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                        <>
                                            Sign Up
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 pt-8 border-t border-white/10 text-center">
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    Already have an account?{" "}
                                    <Link href="/login" className="text-[hsl(var(--primary))] font-semibold hover:underline">
                                        Log in
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

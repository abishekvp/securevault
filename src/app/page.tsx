import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TrendingUp, ShieldCheck, Lock, ExternalLink, ArrowRight } from 'lucide-react';

export default async function Home() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect('/vault');
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[hsl(var(--primary))]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Navbar (Logo top left) */}
            <div className="absolute top-6 left-6 z-20">
                <div className="inline-flex items-center gap-2 group">
                    <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 group-hover:bg-[hsl(var(--primary))]/20 transition-colors">
                        <TrendingUp className="w-5 h-5 text-[hsl(var(--primary))]" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">
                        SECURE<span className="text-[hsl(var(--primary))]">VAULT</span>
                    </span>
                </div>
            </div>

            <div className="container relative z-10 px-4 w-full max-w-4xl text-center space-y-12">
                {/* Hero Icon */}
                <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-[hsl(var(--primary))] to-blue-600 p-0.5 shadow-2xl shadow-[hsl(var(--primary))]/20 animate-in fade-in zoom-in duration-500">
                    <div className="w-full h-full rounded-[22px] bg-black/50 backdrop-blur-md flex items-center justify-center">
                        <ShieldCheck className="w-12 h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">
                        Security made <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-blue-500">luminous</span>.
                    </h1>
                    <p className="text-xl md:text-2xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed">
                        The open-source, zero-knowledge password manager that puts you in control. <span className="text-white">Encrypted heavily</span>, verified instantly.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                    <Link
                        href="/login"
                        className="h-14 px-8 rounded-xl bg-[hsl(var(--primary))] text-black font-bold text-lg hover:bg-[hsl(var(--primary))]/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                    >
                        Access Vault
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        href="/signup"
                        className="h-14 px-8 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
                    >
                        Create Account
                    </Link>
                </div>

                <div className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-[hsl(var(--primary))]/30 transition-colors group">
                        <Lock className="w-6 h-6 text-[hsl(var(--primary))] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold mb-1">Zero Knowledge</h3>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">We can't read your data</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-[hsl(var(--primary))]/30 transition-colors group">
                        <ShieldCheck className="w-6 h-6 text-[hsl(var(--primary))] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold mb-1">AES-256 Encryption</h3>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Military grade security</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-[hsl(var(--primary))]/30 transition-colors group">
                        <ExternalLink className="w-6 h-6 text-[hsl(var(--primary))] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold mb-1">Open Source</h3>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Verify our code anytime</p>
                    </div>
                </div>
            </div>
        </main>
    );
}

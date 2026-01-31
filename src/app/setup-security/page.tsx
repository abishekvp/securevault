'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

export default function SetupSecurityPage() {
    const router = useRouter();
    const { update } = useSession();
    const [questions, setQuestions] = useState([
        { question: '', answer: '' },
        { question: '', answer: '' },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleQuestionChange = (index: number, val: string) => {
        const newQ = [...questions];
        newQ[index].question = val;
        setQuestions(newQ);
    };

    const handleAnswerChange = (index: number, val: string) => {
        const newQ = [...questions];
        newQ[index].answer = val;
        setQuestions(newQ);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate
        if (questions.some(q => q.question.length < 3 || q.answer.length < 3)) {
            setError('Questions and answers must be at least 3 characters long.');
            return;
        }
        if (new Set(questions.map(q => q.answer.toLowerCase())).size !== questions.length) {
            setError('Answers cannot be the same.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/security/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions }),
            });

            if (!res.ok) throw new Error('Failed to save security questions');

            // Refresh session to update hasSecurityQuestions flag
            await update({ hasSecurityQuestions: true });

            router.push('/vault');

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
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[hsl(var(--primary))] to-purple-600 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Setup Security Questions</h2>
                        <p className="text-gray-400 text-sm">Required for account recovery and enhanced security.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {questions.map((q, idx) => (
                            <div key={idx} className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">Question {idx + 1}</span>
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                    placeholder="e.g. What is your pet's name?"
                                    value={q.question}
                                    onChange={e => handleQuestionChange(idx, e.target.value)}
                                    minLength={3}
                                    required
                                />
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded-lg h-10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                    placeholder="Answer"
                                    value={q.answer}
                                    onChange={e => handleAnswerChange(idx, e.target.value)}
                                    minLength={3}
                                    required
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-black font-bold hover:bg-[hsl(var(--primary))]/90 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Continue'}
                        </button>
                    </form>

                    <div className="pt-4 border-t border-white/10 text-center">
                        <button onClick={() => signOut()} className="text-xs text-gray-500 hover:text-white transition-colors">
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

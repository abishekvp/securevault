'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface PasswordGeneratorProps {
    onGenerate: (password: string) => void;
    onClose: () => void;
}

export default function PasswordGenerator({ onGenerate, onClose }: PasswordGeneratorProps) {
    const [length, setLength] = useState(16);
    const [useUpper, setUseUpper] = useState(true);
    const [useLower, setUseLower] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);
    const [generated, setGenerated] = useState('');

    const generate = useCallback(() => {
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

        let chars = "";
        if (useUpper) chars += upper;
        if (useLower) chars += lower;
        if (useNumbers) chars += numbers;
        if (useSymbols) chars += symbols;

        if (chars === "") return;

        let pass = "";
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            pass += chars[array[i] % chars.length];
        }

        setGenerated(pass);
    }, [length, useUpper, useLower, useNumbers, useSymbols]);

    useEffect(() => {
        generate();
    }, [generate]);

    return (
        <div className="card bg-[var(--bg-secondary)] p-4 space-y-4 border border-[var(--border-subtle)]">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--text-secondary)]">Password Generator</h3>

            <div className="flex gap-2">
                <input
                    type="text"
                    className="input font-mono text-center text-lg"
                    value={generated}
                    readOnly
                />
                <button
                    className="btn btn-secondary aspect-square"
                    onClick={generate}
                    title="Regenerate"
                >
                    ↻
                </button>
            </div>

            {/* Controls */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm">Length: {length}</label>
                    <input
                        type="range"
                        min="8" max="64"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        className="accent-[var(--accent-primary)]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} />
                        Uppercase
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)} />
                        Lowercase
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)} />
                        Numbers
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)} />
                        Symbols
                    </label>
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <button className="btn btn-secondary flex-1" type="button" onClick={onClose}>Cancel</button>
                <button
                    className="btn btn-primary flex-1"
                    type="button"
                    onClick={() => {
                        onGenerate(generated);
                        onClose();
                    }}
                >
                    Use Password
                </button>
            </div>
        </div>
    );
}

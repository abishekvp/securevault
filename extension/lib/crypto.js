
// Crypto Utilities for Extension (Vanilla JS)

const enc = new TextEncoder();
const dec = new TextDecoder();

function buf2base64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base642buf(base64) {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

export const CryptoUtils = {
    async generateVaultKey() {
        return window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
    },

    async importKey(base64Key) {
        const keyData = base642buf(base64Key);
        return window.crypto.subtle.importKey(
            'raw',
            keyData,
            'AES-GCM',
            true,
            ['encrypt', 'decrypt']
        );
    },

    async exportKey(key) {
        const exported = await window.crypto.subtle.exportKey('raw', key);
        return buf2base64(exported);
    },

    async encryptData(key, data) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
        const encodedData = enc.encode(data);

        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            encodedData
        );

        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return buf2base64(combined.buffer);
    },

    async decryptData(key, base64Data) {
        const combined = base642buf(base64Data);

        if (combined.byteLength < 12) {
            throw new Error("Invalid data length");
        }
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            ciphertext
        );

        return dec.decode(decryptedBuffer);
    }
};

window.CryptoUtils = CryptoUtils;

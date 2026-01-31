

// --- Types ---
export interface EncryptedData {
    ciphertext: string; // Base64
    iv: string; // Base64
}

// --- Encoding Utilities ---
const enc = new TextEncoder();
const dec = new TextDecoder();

function buf2hex(buffer: ArrayBuffer): string {
    return Array.prototype.map.call(new Uint8Array(buffer), (x: number) => ('00' + x.toString(16)).slice(-2)).join('');
}

function hex2buf(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

function buf2base64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base642buf(base64: string): Uint8Array {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

// --- Key Management ---

/**
 * Generates a random salt.
 */
export function generateSalt(length = 16): string {
    const salt = window.crypto.getRandomValues(new Uint8Array(length));
    return buf2hex(salt.buffer); // Storing as Hex is easier for DB
}

/**
 * Generates a random symmetric key (for the Vault Key).
 * Returns the raw CryptoKey.
 */
export async function generateVaultKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Derives the Master Key from the Master Password using Argon2 (if available) or PBKDF2.
 * For this implementation, we will use PBKDF2 for reliability in this demo environment, 
 * as Argon2 WASM loading can be tricky without specific Next.js config.
 * 
 * TODO: Swap to Argon2-browser for higher security in production.
 */
export async function deriveMasterKey(password: string, saltHex: string): Promise<CryptoKey> {
    const salt = hex2buf(saltHex);
    const passwordBuffer = enc.encode(password);

    // Import password as a key material
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Derive the Master Key (AES-GCM 256)
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as any, // Cast to any to avoid strict BufferSource mismatch in some TS envs
            iterations: 100000, // OWASP recommended minimum for PBKDF2
            hash: 'SHA-256',
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256,
        },
        true, // extractable (so we can use it to encrypt the Vault Key? Actually Master Key stays in memory as CryptoKey objects usually)
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
}

// --- Encryption / Decryption ---

/**
 * Encrypts data (string) using a CryptoKey (AES-GCM).
 */
export async function encryptData(key: CryptoKey, data: string): Promise<string> {
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

    // Pack IV and Ciphertext together: IV (12 bytes) + Ciphertext
    // We return as Base64 string
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return buf2base64(combined.buffer);
}

/**
 * Decrypts data (Base64 string) using a CryptoKey (AES-GCM).
 */
export async function decryptData(key: CryptoKey, base64Data: string): Promise<string> {
    const combined = base642buf(base64Data);

    // Extract IV (first 12 bytes)
    if (combined.byteLength < 12) {
        throw new Error("Invalid data length: too short for IV");
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

/**
 * Exports a CryptoKey to a raw string (Base64) for storage (encrypted by another key).
 */
export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return buf2base64(exported);
}

/**
 * Imports a raw key string (Base64) back into a CryptoKey.
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
    const keyData = base642buf(base64Key);
    return window.crypto.subtle.importKey(
        'raw',
        keyData as any,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
    );
}

// --- RSA Key Management (for Sharing) ---

/**
 * Generates an RSA-OAEP Key Pair for sharing.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Exports Public Key to Base64 (SPKI)
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return buf2base64(exported);
}

/**
 * Exports Private Key to Base64 (PKCS8) - To be encrypted before storage!
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    return buf2base64(exported);
}

/**
 * Imports Public Key from Base64 (SPKI)
 */
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
    const keyBuffer = base642buf(base64Key);
    return window.crypto.subtle.importKey(
        "spki",
        keyBuffer as any,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["encrypt"]
    );
}

/**
 * Imports Private Key from Base64 (PKCS8)
 */
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
    const keyBuffer = base642buf(base64Key);
    return window.crypto.subtle.importKey(
        "pkcs8",
        keyBuffer as any,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["decrypt"]
    );
}

/**
 * Wraps (Encrypts) a Symmetric Key (AES) using a Public Key (RSA).
 * Used for Sharing: Encrypt ItemKey with Recipient's Public Key.
 */
export async function wrapKeyWithPublic(itemKey: CryptoKey, publicKey: CryptoKey): Promise<string> {
    // We can't use 'wrapKey' easily across diff algorithms in some browser implementations perfectly matching specs, 
    // especially resizing raw key. 
    // Easier approach: Export ItemKey to Raw bytes -> Encrypt bytes with RSA Public Key.

    const rawKey = await window.crypto.subtle.exportKey("raw", itemKey);

    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        publicKey,
        rawKey
    );

    return buf2base64(encryptedKeyBuffer);
}

/**
 * Unwraps (Decrypts) a Symmetric Key (AES) using a Private Key (RSA).
 */
export async function unwrapKeyWithPrivate(encryptedKeyBase64: string, privateKey: CryptoKey): Promise<CryptoKey> {
    const encryptedBuffer = base642buf(encryptedKeyBase64);

    const decryptedRawKey = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP"
        },
        privateKey,
        encryptedBuffer as any
    );

    return window.crypto.subtle.importKey(
        "raw",
        decryptedRawKey,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    );
}




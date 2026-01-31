import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// In production, this should be a long, random string from process.env
// For this demo, we can fallback to a hardcoded string if env is missing, but WARN.
const SERVER_SECRET = process.env.SERVER_ENCRYPTION_SECRET || 'fallback-secret-replacement-needed-in-prod';

if (!process.env.SERVER_ENCRYPTION_SECRET) {
    console.warn("WARNING: SERVER_ENCRYPTION_SECRET not set. Using insecure fallback.");
}

// Ensure secret is 32 bytes for aes-256
const getSecretKey = () => {
    return crypto.createHash('sha256').update(SERVER_SECRET).digest();
};

export function encryptServerData(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Format: IV:AuthTag:EncryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptServerData(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted text format');

    const [ivHex, authTagHex, encryptedHex] = parts;

    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

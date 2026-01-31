import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    email: string;
    username?: string; // Add this line
    name?: string;
    image?: string;
    provider: 'google' | 'microsoft' | 'credentials';
    passwordHash?: string; // Add this line

    // Security / Encryption Metadata
    // These are critical for the Zero-Knowledge architecture

    // 1. The salt used to derive the Master Key from the User's Master Password on the client.
    // DEPRECATED in Custodial Mode (No Master Password). Kept for legacy support or optional generic usage.
    encryptionSalt?: string;

    // 2. The Vault Key (randomly generated).
    // PREVIOUSLY: Encrypted with the Derived Master Key (Client-side).
    // NOW (Custodial): Encrypted with the Server Secret (Server-side).
    encryptedVaultKey?: string;

    // 3. The actual Vault Data (Accounts, etc.) encrypted with the Vault Key.
    encryptedVaultData?: string;

    // --- Feature Additions ---
    isAdmin?: boolean;
    isEmailVerified?: boolean;
    otpCode?: string;
    otpExpires?: Date;
    securityQuestions?: { question: string; answerHash: string }[];
    connections?: { userId: any; status: 'pending' | 'sent' | 'accepted' | 'blocked'; publicKey?: string }[];
    publicKey?: string;
    encryptedPrivateKey?: string;
    favorites?: string[]; // IDs
    folders?: { id: string; name: string; encryptedName?: string }[];
    privacySettings?: {
        autoAcceptConnections: boolean;
        autoJoinGroups: 'none' | 'connections' | 'specific';
        autoJoinWhitelist?: string[]; // User IDs
    };
    twoFactorSecret?: string;
    is2FAEnabled?: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        username: {
            type: String,
            unique: true,
            sparse: true, // Allow null/undefined for OAuth users initially
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            index: true,
        },
        name: {
            type: String,
        },
        image: {
            type: String,
        },
        provider: {
            type: String,
            enum: ['google', 'microsoft', 'credentials'],
            required: true,
            default: 'credentials',
        },
        passwordHash: {
            type: String,
            select: false, // Do not return by default for security
        },
        encryptionSalt: {
            type: String,
            default: null, // Will be null until user sets up their Master Password
        },
        encryptedVaultKey: {
            type: String,
            default: null,
        },
        encryptedVaultData: {
            type: String,
            default: null,
        },
        // --- Feature Additions ---
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        otpCode: {
            type: String,
            select: false, // Don't expose by default
        },
        otpExpires: {
            type: Date,
            select: false,
        },
        securityQuestions: [{
            question: String,
            answerHash: String, // Store hashed answer for security
        }],
        connections: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['pending', 'sent', 'accepted', 'blocked'], default: 'pending' },
            publicKey: String, // Public key of the connected user for sharing
        }],
        publicKey: {
            type: String, // RSA/ECC Public Key for this user (for sharing)
            default: null,
        },
        encryptedPrivateKey: {
            type: String, // Private key encrypted with Master Key
            default: null,
        },
        favorites: [{
            type: String // List of VaultItem IDs
        }],
        folders: [{
            id: String,
            name: String,
            encryptedName: String // if we want to encrypt folder names too
        }],
        privacySettings: {
            autoAcceptConnections: { type: Boolean, default: false },
            autoJoinGroups: { type: String, enum: ['none', 'connections', 'specific'], default: 'none' },
            autoJoinWhitelist: [{ type: Schema.Types.ObjectId, ref: 'User' }]
        },
        twoFactorSecret: { type: String, select: false },
        is2FAEnabled: { type: Boolean, default: false },
        seenNotifications: [{ type: String }],
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation error in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

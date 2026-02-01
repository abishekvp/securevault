import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAccount extends Document {
    owner: mongoose.Types.ObjectId;
    folderId?: mongoose.Types.ObjectId;
    type: 'login' | 'note' | 'card' | 'identity';

    // We store metadata unencrypted for basic UI, or encrypted if strict ZK.
    // To allow server-side filtering/sorting, we might keep title unencrypted or rely on client.
    // For maximum privacy (Zero Knowledge), title should be encrypted.
    // But then list view is empty until decryption.
    title?: string; // Optional metadata for easier debugging/admin, but real title is in blob

    encryptedData: string; // The JSON blob of the item content
    // encryptedKey might be needed if we use per-item keys. 
    // For now, let's assume encryptedData is encrypted with the Master Key derived key directly, 
    // OR we use the envelope encryption:
    encryptedItemKey: string; // The symmetric key for this item, encrypted with Master Key

    favorite: boolean;
    trashDate?: Date; // If present, it's in trash. Delete after 30 days.

    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema: Schema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
        type: { type: String, required: true, default: 'login' },
        title: { type: String },
        username: { type: String }, // Metadata for list view
        url: { type: String },      // Metadata for list view

        encryptedData: { type: String, required: true },
        encryptedItemKey: { type: String, required: true },

        favorite: { type: Boolean, default: false },
        trashDate: { type: Date },
    },
    {
        timestamps: true,
        collection: 'accounts' // Explicitly set collection name as requested
    }
);

// Indexes for efficient querying
AccountSchema.index({ owner: 1, folderId: 1 });
AccountSchema.index({ owner: 1, trashDate: 1 });
AccountSchema.index({ trashDate: 1 }, { expireAfterSeconds: 2592000 }); // 30 days = 2592000 seconds (TTL Index)

const Account: Model<IAccount> = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);

export default Account;

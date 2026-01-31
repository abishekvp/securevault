import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShare extends Document {
    senderId: mongoose.Schema.Types.ObjectId;
    recipientId?: mongoose.Schema.Types.ObjectId;
    groupId?: mongoose.Schema.Types.ObjectId;
    itemId: mongoose.Schema.Types.ObjectId; // The VaultItem ID
    encryptedItemKey: string; // Key encrypted with Recipient's Public Key
    createdAt: Date;
}

const ShareSchema: Schema = new Schema(
    {
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
        groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
        itemId: { type: Schema.Types.ObjectId, ref: 'VaultItem', required: true },
        encryptedItemKey: { type: String, required: true },
    },
    { timestamps: true }
);

const Share: Model<IShare> = mongoose.models.Share || mongoose.model<IShare>('Share', ShareSchema);
export default Share;

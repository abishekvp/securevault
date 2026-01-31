import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroup extends Document {
    name: string;
    ownerId: any;
    // The Group Key is essentially the "Master Key" for the group. 
    // It is encrypted differently for each member.
    // However, to simplify, usually:
    // 1. Group has a Public/Private key pair? 
    // OR
    // 2. Group has a Symmetric Key.
    // The prompt implies "sharing accounts". 
    // If we use specific "Secret Key" mentioned in prompt for user, 
    // for groups we likely want a symmetric key wrapped for each member.

    // Members
    members: {
        userId: any;
        role: 'admin' | 'editor' | 'viewer';
        status: 'invited' | 'active';
        encryptedGroupKey?: string; // The Group Symmetric Key encrypted with Member's Public Key.
    }[];

    createdAt: Date;
    updatedAt: Date;
}

const GroupSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
            status: { type: String, enum: ['invited', 'active'], default: 'invited' },
            encryptedGroupKey: String // Critical for access
        }]
    },
    { timestamps: true }
);

const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);

export default Group;

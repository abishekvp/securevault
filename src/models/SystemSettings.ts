import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSettings extends Document {
    key: string;
    value: any;
    updatedBy?: string;
    updatedAt: Date;
}

const SystemSettingsSchema: Schema = new Schema(
    {
        key: { type: String, required: true, unique: true, index: true },
        value: { type: Schema.Types.Mixed, default: null },
        updatedBy: { type: String, default: null },
    },
    { timestamps: true, collection: 'system_settings' }
);

const SystemSettings: Model<ISystemSettings> = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;

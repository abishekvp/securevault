import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConfigItem extends Document {
    key: string;
    value: any;
    updatedAt: Date;
}

const ConfigItemSchema: Schema = new Schema(
    {
        key: { type: String, required: true, unique: true, index: true },
        value: { type: Schema.Types.Mixed, default: null },
    },
    { timestamps: true, collection: 'configurations' }
);

const ConfigItem: Model<IConfigItem> = mongoose.models.ConfigItem || mongoose.model<IConfigItem>('ConfigItem', ConfigItemSchema);

export default ConfigItem;

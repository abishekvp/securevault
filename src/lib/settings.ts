import ConfigItem from '@/models/ConfigItem';
import { DEFAULT_CONFIGS } from '@/lib/config/definitions';

export async function getSetting<T = any>(key: string): Promise<T> {
    try {
        const item = await ConfigItem.findOne({ key });
        if (item) return item.value as T;
        // Fallback: If not in DB, we return null (or expected type default if we strictly wanted safety, but request is "not local")
        // But to avoid crashing the UI, we might return undefined.
        console.warn(`Setting ${key} not found in DB.`);
        return undefined as unknown as T;
    } catch (e) {
        console.error(`Error fetching setting ${key}:`, e);
        return DEFAULT_CONFIGS[key] as T;
    }
}

export async function setSetting(key: string, value: any): Promise<void> {
    try {
        console.log(`[Settings] Attempting to set ${key} to:`, value);
        const result = await ConfigItem.findOneAndUpdate(
            { key },
            { $set: { value } },
            { upsert: true, new: true } // Upsert is crucial
        );
        console.log(`[Settings] Result for ${key}:`, result);
    } catch (e) {
        console.error(`[Settings] Error setting ${key}:`, e);
        throw e;
    }
}

export async function ensureDefaults(): Promise<void> {
    console.log("Ensuring default configurations...");
    const keys = Object.keys(DEFAULT_CONFIGS);

    // We can do this in parallel
    await Promise.all(keys.map(async (key) => {
        // Only insert if not exists ($setOnInsert)
        // We do NOT want to overwrite dynamic user changes with static defaults on restart
        await ConfigItem.findOneAndUpdate(
            { key },
            { $setOnInsert: { value: DEFAULT_CONFIGS[key] } },
            { upsert: true, new: true }
        );
    }));
    console.log("Default configurations check complete.");
}

import { CachedImage } from '../core/cached-image.interface';

export class ImageCache {
    private cache: Map<string, CachedImage> = new Map();
    private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

    private normalizeKey(key: string): string {
        return key.toLowerCase().replace(/\s+/g, '-');
    }

    get(model: string): string[] | null {
        const key = this.normalizeKey(model);
        const entry = this.cache.get(key);

        if (entry && (Date.now() - entry.timestamp < this.TTL)) {
            console.log(`[Cache] HIT for model: ${model}`);
            return entry.imageUrls;
        }

        console.log(`[Cache] MISS for model: ${model}`);
        return null;
    }

    set(model: string, imageUrls: string[]): void {
        const key = this.normalizeKey(model);
        const entry: CachedImage = {
            model,
            imageUrls,
            timestamp: Date.now(),
        };
        this.cache.set(key, entry);
        console.log(`[Cache] SET for model: ${model}`);
    }
}

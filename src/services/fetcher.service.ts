import { ImageSource } from '../core/image-source.interface';
import { ImageCache } from './cache.service';

export class ResilientImageFetcher {
    constructor(
        private sources: ImageSource[],
        private cache: ImageCache
    ) {}

    async fetchImageUrls(query: string): Promise<string[]> {
        const cachedUrls = this.cache.get(query);
        if (cachedUrls) {
            return cachedUrls;
        }

        console.log(`[Fetcher] Starting resilient fetch for: ${query}`);
        for (const source of this.sources) {
            try {
                console.log(`[Fetcher] Trying source: ${source.name}`);
                const imageUrls = await source.fetchImages(query);
                if (imageUrls.length > 0) {
                    console.log(`[Fetcher] Found ${imageUrls.length} images from ${source.name}.`);
                    this.cache.set(query, imageUrls);
                    return imageUrls;
                }
            } catch (error) {
                console.error(`[Fetcher] Source ${source.name} failed for query "${query}":`, error);
            }
        }

        console.log(`[Fetcher] All sources failed for query: ${query}`);
        return [];
    }
}

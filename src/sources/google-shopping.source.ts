import { ImageSource } from '../core/image-source.interface';
import { launch } from '@browserbasehq/stagehand';

export class GoogleShoppingSource implements ImageSource {
    name = 'google-shopping';

    async fetchImages(query: string): Promise<string[]> {
        console.log(`[GoogleShoppingSource] Starting image retrieval for: ${query}`);
        const browser = await launch();
        try {
            const page = await browser.newPage();
            const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
            console.log(`[GoogleShoppingSource] Navigating to: ${url}`);
            await page.goto(url);

            console.log('[GoogleShoppingSource] Waiting for image results to load...');
            await page.waitForSelector('img.TL92Hc');

            console.log('[GoogleShoppingSource] Extracting image URLs...');
            const imageUrls = await page.evaluate(() => {
                const images = Array.from(document.querySelectorAll('img.TL92Hc'));
                return images.map(img => img.getAttribute('src') || '');
            });

            console.log(`[GoogleShoppingSource] Extracted ${imageUrls.length} image URLs.`);
            return imageUrls.filter(url => url.startsWith('http') || url.startsWith('data:image'));
        } finally {
            console.log('[GoogleShoppingSource] Closing Stagehand session...');
            await browser.close();
        }
    }
}

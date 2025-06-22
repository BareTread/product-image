import { ImageSource } from '../core/image-source.interface';
import { launch } from '@browserbasehq/stagehand';

export class BingImageSource implements ImageSource {
    name = 'bing-images';

    async fetchImages(query: string): Promise<string[]> {
        console.log(`[BingImageSource] Starting image retrieval for: ${query}`);
        const browser = await launch();
        try {
            const page = await browser.newPage();
            console.log('[BingImageSource] Navigating to Bing Images...');
            await page.goto('https://www.bing.com/images/create');

            console.log(`[BingImageSource] Searching for: ${query}`);
            await page.waitForSelector('input[name="q"]');
            await page.type('input[name="q"]', query);
            await page.keyboard.press('Enter');

            console.log('[BingImageSource] Waiting for image results to load...');
            await page.waitForSelector('img.mimg');

            console.log('[BingImageSource] Extracting image URLs...');
            const imageUrls = await page.evaluate(() => {
                const images = Array.from(document.querySelectorAll('img.mimg'));
                return images.map(img => img.getAttribute('src') || '');
            });

            console.log(`[BingImageSource] Extracted ${imageUrls.length} image URLs.`);
            return imageUrls.filter(url => url.startsWith('http'));
        } finally {
            console.log('[BingImageSource] Closing Stagehand session...');
            await browser.close();
        }
    }
}

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { ResilientImageFetcher } from './services/fetcher.service';
import { ImageCache } from './services/cache.service';
import { BingImageSource } from './sources/bing.source';
import { GoogleShoppingSource } from './sources/google-shopping.source';

const imagesDir = path.join(__dirname, '../public/images');

if (fs.existsSync(imagesDir)) {
    fs.rmSync(imagesDir, { recursive: true, force: true });
}
fs.mkdirSync(imagesDir, { recursive: true });

interface ImageValidationResult {
  isProductPhoto: boolean;
  backgroundScore: number;
}

async function validateProductImage(imagePath: string): Promise<ImageValidationResult> {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      return { isProductPhoto: false, backgroundScore: 0 };
    }

    const borderSize = 5;
    const top = await image.clone().extract({ left: 0, top: 0, width, height: borderSize }).raw().toBuffer();
    const bottom = await image.clone().extract({ left: 0, top: height - borderSize, width, height: borderSize }).raw().toBuffer();
    const left = await image.clone().extract({ left: 0, top: 0, width: borderSize, height }).raw().toBuffer();
    const right = await image.clone().extract({ left: width - borderSize, top: 0, width: borderSize, height }).raw().toBuffer();

    const borderPixels = Buffer.concat([top, bottom, left, right]);
    let whitePixelCount = 0;
    for (let i = 0; i < borderPixels.length; i += metadata.channels || 3) {
        const r = borderPixels[i];
        const g = borderPixels[i + 1];
        const b = borderPixels[i + 2];
        if (r > 230 && g > 230 && b > 230) {
            whitePixelCount++;
        }
    }

    const totalPixelCount = (width * borderSize * 2) + (height * borderSize * 2) - (borderSize * borderSize * 4);
    const backgroundScore = (whitePixelCount / totalPixelCount);
    const isProductPhoto = backgroundScore > 0.95;

    console.log(`Image: ${path.basename(imagePath)}, Background Score: ${backgroundScore.toFixed(2)}`);

    return {
      isProductPhoto,
      backgroundScore,
    };
  } catch (error) {
    console.error(`Error validating image ${imagePath}:`, error);
    return { isProductPhoto: false, backgroundScore: 0 };
  }
}

async function downloadImage(url: string, model: string): Promise<string | null> {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');
        const modelName = model.replace(/\s+/g, '_').toLowerCase();
        const imagePath = path.join(imagesDir, `${modelName}_${Date.now()}.jpg`);
        fs.writeFileSync(imagePath, imageBuffer);
        console.log(`✅ Successfully downloaded image for ${model}`);
        return imagePath;
    } catch (error) {
        console.error(`❌ Failed to download image for ${model} from ${url}`);
        return null;
    }
}

async function runTests() {
    console.log('🧹 Cleaned up images directory.');
    console.log('🚀 Starting rigorous test run with background validation...');

    const shoeModels = [
        'Vivobarefoot Primus',
        'Be Lenka Champ',
        'Wildling Shoes Tanuki',
        'Bohempia Herb',
        'Freet Barefoot Flex',
    ];

    const cache = new ImageCache();
    const sources = [new BingImageSource(), new GoogleShoppingSource()];
    const fetcher = new ResilientImageFetcher(sources, cache);

    let successCount = 0;

    for (const model of shoeModels) {
        console.log(`\n--- Testing model: ${model} ---\n`);
        let foundValidImage = false;
        try {
            const imageUrls = await fetcher.fetchImageUrls(model);
            for (const imageUrl of imageUrls) {
                const imagePath = await downloadImage(imageUrl, model);
                if (imagePath) {
                    const validation = await validateProductImage(imagePath);
                    if (validation.isProductPhoto) {
                        console.log(`✅ Valid image found for ${model}: ${path.basename(imagePath)}`);
                        successCount++;
                        foundValidImage = true;
                        break;
                    }
                    console.log(`... Invalid background, trying next image for ${model}`);
                }
            }
            if (!foundValidImage) {
                console.log(`❌ No valid image found for ${model} after trying all candidates.`);
            }
        } catch (error) {
            console.error(`An error occurred while processing ${model}:`, error);
        }
    }

    console.log('\n--- Test Run Complete ---');
    console.log(`Total Tests: ${shoeModels.length}`);
    console.log(`✅ Successes: ${successCount}`);
    console.log(`❌ Failures: ${shoeModels.length - successCount}`);

    if (shoeModels.length - successCount > 0) {
        process.exit(1);
    }
}

runTests();

# Barefoot Shoe Image Scraper

This project is a resilient, multi-source image scraper designed to find high-quality product photos for various models of barefoot shoes.

## Features

- **Multi-Source Fetching**: Aggregates images from multiple sources (Bing Images, Google Shopping) to ensure high availability.
- **Resilient Architecture**: If one source fails, it automatically falls back to the next.
- **In-Memory Caching**: Caches results to speed up repeated queries for the same model.
- **Advanced Image Validation**: Uses `sharp` to analyze images, ensuring they are clean product photos with a white background.

## How to Run

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up your Stagehand API key:**
    Export your API key as an environment variable.
    ```bash
    export GOOGLE_GENERATIVE_AI_API_KEY="your_api_key_here"
    ```

3.  **Run the tests:**
    The main test script will fetch images for a predefined list of shoe models and validate them.
    ```bash
    npm test
    ```

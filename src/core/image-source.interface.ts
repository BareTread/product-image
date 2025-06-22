export interface ImageSource {
    name: string;
    fetchImages(query: string): Promise<string[]>;
}

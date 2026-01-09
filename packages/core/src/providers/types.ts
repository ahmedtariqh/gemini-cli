import type { GenerateContentResponse, GenerateContentParameters } from '@google/genai';

export type GenerateResponse = GenerateContentResponse;
export type GenerateOptions = GenerateContentParameters & { promptId?: string };
export type StreamChunk = GenerateContentResponse;

export interface ModelProvider {
    id: string;
    generateContent(options: GenerateOptions): Promise<GenerateResponse>;
    streamContent(options: GenerateOptions): Promise<AsyncGenerator<StreamChunk>>;
}

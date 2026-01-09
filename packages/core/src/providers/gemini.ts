import { GoogleGenAI } from '@google/genai';
import type { ModelProvider, GenerateOptions, GenerateResponse, StreamChunk } from './types.js';
import type { ContentGeneratorConfig } from '../core/contentGenerator.js';
import { InstallationManager } from '../utils/installationManager.js';

export class GeminiProvider implements ModelProvider {
    id = 'gemini';
    private client: GoogleGenAI;

    /**
     * @param config The content generator config (apiKey, etc)
     * @param usageStatsEnabled Whether to send usage stats
     * @param baseHeaders Optional base headers (User-Agent, etc)
     */
    constructor(
        config: ContentGeneratorConfig,
        usageStatsEnabled: boolean = false,
        baseHeaders: Record<string, string> = {},
    ) {
        let headers: Record<string, string> = { ...baseHeaders };
        
        if (usageStatsEnabled) {
            const installationManager = new InstallationManager();
            const installationId = installationManager.getInstallationId();
            headers = {
                ...headers,
                'x-gemini-api-privileged-user-id': `${installationId}`,
            };
        }
        
        const httpOptions = { headers };

        this.client = new GoogleGenAI({
            apiKey: config.apiKey === '' ? undefined : config.apiKey,
            vertexai: config.vertexai,
            httpOptions,
        });
    }

    async generateContent(options: GenerateOptions): Promise<GenerateResponse> {
        return this.client.models.generateContent(options);
    }

    async streamContent(
        options: GenerateOptions,
    ): Promise<AsyncGenerator<StreamChunk>> {
        return this.client.models.generateContentStream(options);
    }
}

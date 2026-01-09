import type { ModelProvider, GenerateOptions, GenerateResponse, StreamChunk } from './types.js';
import { robustJsonParse } from '../utils/json-parser.js';

export class OpenAICompatibleProvider implements ModelProvider {
  id = 'openai-compatible';
  
  constructor(
    private baseUrl: string, 
    private modelName: string,
    private apiKey?: string
  ) {
    if (this.baseUrl.endsWith('/')) {
        this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  private mapRequest(options: GenerateOptions): any {
    const messages: any[] = [];
    
    // Handle system instruction
    const systemInstruction = options.config?.systemInstruction;
    if (systemInstruction) {
        let content = '';
        if (typeof systemInstruction === 'string') {
             content = systemInstruction;
        } else if (typeof systemInstruction === 'object' && systemInstruction !== null && 'parts' in systemInstruction) {
             content = (systemInstruction as any).parts.map((p: any) => p.text).join('');
        }
        messages.push({ role: 'system', content });
    }

    // Map contents
    if (options.contents) {
        for (const content of (options.contents as any[])) {
            const role = content.role === 'model' ? 'assistant' : 'user';
            const parts = content.parts || [];
            const text = parts.map((p: any) => p.text).join('');
            messages.push({ role, content: text });
        }
    }
    
    return {
       model: this.modelName,
       messages,
       stream: false, // Override in generate/stream methods
    };
  }

  async generateContent(options: GenerateOptions): Promise<GenerateResponse> {
      const body = this.mapRequest(options);
      body.stream = false;
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey || 'noop'}`
          },
          body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error(`OpenAI request failed: ${res.statusText}`);
      const data = await res.json();
      return this.mapResponse(data);
  }
  
  async streamContent(options: GenerateOptions): Promise<AsyncGenerator<StreamChunk>> {
      return this._streamGenerator(options);
  }

  private async *_streamGenerator(options: GenerateOptions): AsyncGenerator<StreamChunk> {
      const body = this.mapRequest(options);
      body.stream = true;
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey || 'noop'}`
          },
          body: JSON.stringify(body)
      });

       if (!res.ok) throw new Error(`OpenAI request failed: ${res.statusText}`);
       if (!res.body) throw new Error('No response body');
       
       const reader = res.body.getReader();
       const decoder = new TextDecoder();
       let buffer = '';
       
       const toolCallBuffer: Record<number, { name: string; args: string }> = {};

       while (true) {
           const { done, value } = await reader.read();
           if (done) break;
           buffer += decoder.decode(value, { stream: true });
           
           const lines = buffer.split('\n');
           buffer = lines.pop() || '';
           
           for (const line of lines) {
               const trimmed = line.trim();
               if (!trimmed || trimmed === 'data: [DONE]') continue;
               if (trimmed.startsWith('data: ')) {
                   try {
                       const json = JSON.parse(trimmed.slice(6));
                       const choice = json.choices[0];
                       
                       // Handle Content
                       if (choice.delta?.content) {
                          yield {
                              candidates: [{
                                  content: { role: 'model', parts: [{ text: choice.delta.content }] },
                                  finishReason: undefined,
                              }]
                          } as unknown as GenerateResponse;
                       }

                       // Handle Tool Calls (Buffering)
                       if (choice.delta?.tool_calls) {
                           for (const tc of choice.delta.tool_calls) {
                               const idx = tc.index;
                               if (!toolCallBuffer[idx]) {
                                   toolCallBuffer[idx] = { name: '', args: '' };
                               }
                               if (tc.function?.name) toolCallBuffer[idx].name += tc.function.name;
                               if (tc.function?.arguments) toolCallBuffer[idx].args += tc.function.arguments;
                           }
                       }

                       // Handle Finish (Flush Tools)
                       if (choice.finish_reason) {
                           const toolCalls = Object.values(toolCallBuffer);
                           if (toolCalls.length > 0) {
                               const parts = toolCalls.map(tc => {
                                   let args = {};
                                   try {
                                       args = robustJsonParse(tc.args);
                                   } catch (e) {
                                       args = { error: 'Failed to parse JSON', raw: tc.args };
                                   }
                                   return {
                                       functionCall: {
                                           name: tc.name,
                                           args: args
                                       }
                                   };
                               });
                               yield {
                                   candidates: [{
                                       content: { role: 'model', parts },
                                       finishReason: choice.finish_reason.toUpperCase(),
                                   }]
                               } as unknown as GenerateResponse;
                           } else {
                               // Just finish signal if needed, though content usually ends before
                               yield {
                                   candidates: [{
                                       content: { role: 'model', parts: [] },
                                       finishReason: choice.finish_reason.toUpperCase(),
                                   }]
                               } as unknown as GenerateResponse;
                           }
                       }
                   } catch (e) {
                       // ignore
                   }
               }
           }
       }
  }

  private mapResponse(data: any): GenerateResponse {
      const choice = data.choices[0];
      const content = choice.delta?.content || choice.message?.content || '';
      return {
          candidates: [{
              content: { role: 'model', parts: [{ text: content }] },
              finishReason: choice.finish_reason ? choice.finish_reason.toUpperCase() : undefined,
          }]
      } as unknown as GenerateResponse;
  }
}

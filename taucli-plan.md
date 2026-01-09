# **Contribution Plan: TauCLI Transformation & Local Model Support**

Repository: ahmedtariqh/gemini-cli (Fork/Target)  
Target: Rename to taucli, enable local LLM execution (Ollama/LM Studio), and enhance stability.  
Language: TypeScript / Node.js

## **Phase 1: Architecture Refactoring (The Provider Pattern)**

**Objective:** Decouple the core CLI logic from the specific Google Gemini API implementation to allow for swappable backends (Google, Ollama, LM Studio) without breaking existing remote dependencies.

### **1.1 Interface Definition**

Task Description:  
Define a generic ModelProvider interface in packages/core that abstracts the common operations required by the CLI (streaming chat, generating content). This ensures the rest of the CLI doesn't know which AI is answering.  
**Technical Implementation Detail:**

* **File:** Create packages/core/src/providers/types.ts.  
* **Interface:**  
  export interface ModelProvider {  
    id: string;  
    generateContent(prompt: string, options?: GenerateOptions): Promise\<GenerateResponse\>;  
    streamContent(prompt: string, options?: GenerateOptions): AsyncGenerator\<StreamChunk\>;  
  }

### **1.2 Encapsulate Existing Google Logic**

Task Description:  
Move the current Google-specific API calls (using @google/generative-ai) into a new GeminiProvider class.

* **Critical Constraint:** Do *not* rename the imported packages or change the logic of *how* Google's API is called, just *where* it is called.

**Technical Implementation Detail:**

* **File:** Create packages/core/src/providers/gemini.ts.  
* **Action:** Move initialization logic (API key validation, model instantiation) into this class.  
* **Refactor:** Update the main execution loop in packages/core to call provider.streamContent() instead of direct SDK methods.

**Verification/Testing:**

* **Regression Test:** Run the CLI with the default Google provider. Verify that gemini prompt "test" still works exactly as before.

## **Phase 2: Local Model Integration (Ollama & LM Studio)**

**Objective:** Implement a single, robust provider that connects to local inference servers via standard HTTP protocols (OpenAI-compatible).

### **2.1 OpenAI-Compatible Provider**

Task Description:  
Both Ollama and LM Studio expose OpenAI-compatible API endpoints (/v1/chat/completions). Implement a generic OpenAICompatibleProvider.  
**Technical Implementation Detail:**

* **File:** Create packages/core/src/providers/openai\_compatible.ts.  
* **Logic:**  
  * Use fetch or axios to POST to the user-defined baseUrl.  
  * **Streaming:** Implement Server-Sent Events (SSE) parsing to handle streaming tokens, converting them to the CLI's internal StreamChunk format.  
* **Configuration Fields:**  
  * baseUrl: (Default: http://localhost:11434/v1 for Ollama, http://localhost:1234/v1 for LM Studio).  
  * modelName: (e.g., "llama3", "mistral").

### **2.2 Provider Factory & Switching Logic**

Task Description:  
Update the main entry point to select the provider based on configuration.  
**Technical Implementation Detail:**

* **File:** Update packages/core/src/client.ts (or equivalent core entry).  
* **Factory Logic:**  
  if (config.provider \=== 'ollama') return new OpenAICompatibleProvider({ baseUrl: 'http://localhost:11434/v1', ... });  
  if (config.provider \=== 'lmstudio') return new OpenAICompatibleProvider({ baseUrl: 'http://localhost:1234/v1', ... });

**Verification/Testing:**

* **Integration Test (Ollama):** Run ollama run llama3 locally. Configure CLI to use it. Verify text generation.  
* **Integration Test (LM Studio):** Start server on port 1234\. Configure CLI. Verify connection.

## **Phase 3: Rebranding (Gemini \-\> TauCLI)**

**Objective:** Rename the CLI identity, binary, and configuration paths as requested, while strictly preserving external dependency routes.

### **3.1 Binary & Package Renaming**

Task Description:  
Rename the executable binary and the project description, but keep dependencies in package.json untouched.  
**Technical Implementation Detail:**

* **File:** package.json (root and packages/cli).  
* **Change:**  
  "bin": {  
    "taucli": "./bin/run"  // Was "gemini"  
  },  
  "name": "taucli" // If applicable to the fork's publishing name

* **Verification:** Run npm link. Check that typing taucli \--version works in the terminal.

### **3.2 Configuration Path Migration**

Task Description:  
Update the ConfigManager to look for .taucli instead of .gemini.  
**Technical Implementation Detail:**

* **File:** Search for os.homedir() and .gemini string literals in packages/core and packages/cli.  
* **Change:**  
  * Old: path.join(os.homedir(), '.gemini')  
  * New: path.join(os.homedir(), '.taucli')  
* **Environment Variables:**  
  * Rename internal lookups for GEMINI\_DIR to TAUCLI\_DIR.  
  * Rename GEMINI\_API\_KEY to TAUCLI\_API\_KEY (optional, but keep GEMINI\_API\_KEY as a fallback for backward compatibility).

**Verification/Testing:**

* **Manual Test:** Delete \~/.gemini. Run taucli init. Verify \~/.taucli is created.  
* **Env Test:** Set TAUCLI\_DIR=/tmp/test. Run CLI. Verify it uses the temp dir.

## **Phase 4: Enhancements & Fixes**

**Objective:** Add requested "other features" to improve usability and stability.

### **4.1 Feature: Interactive Token Speedometer**

Task Description:  
Local models vary in speed. Add a "tokens per second" (t/s) indicator to the streaming output.  
**Technical Implementation Detail:**

* **File:** packages/cli/src/ui/stream-renderer.ts.  
* **Logic:** Track timestamp of chunks. Calculate (current\_tokens) / (elapsed\_seconds). Display in a dimmed footer during generation.

### **4.2 Fix: Robust JSON Error Handling**

Task Description:  
Local models often output malformed JSON. Improve the parser to recover from common errors (missing braces).  
**Technical Implementation Detail:**

* **File:** packages/core/src/utils/json-parser.ts.  
* **Logic:** Implement a "soft" JSON parser. If JSON.parse fails, attempt to append } or \] and retry before throwing.

### **4.3 Feature: Session Logging**

Task Description:  
Automatically save full conversation logs to a local file for debugging.  
**Technical Implementation Detail:**

* **File:** packages/core/src/logger.ts.  
* **Action:** If config.logSession is true, append interaction objects to \~/.taucli/logs/session\_\<timestamp\>.json.

## **Summary of Changes**

1. **Refactor**: Created ModelProvider interface, moved Google logic to GeminiProvider.  
2. **New Feature**: Added OpenAICompatibleProvider for **Ollama** and **LM Studio**.  
3. **Rebrand**: Renamed binary to taucli, config folder to .taucli, env var to TAUCLI\_DIR.  
4. **UX**: Added Token Counter, Robust JSON Parsing, and Session Logging.

This plan is ready for execution.
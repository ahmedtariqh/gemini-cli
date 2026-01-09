# TauCLI Setup Guide: Running Local LLMs (Ollama)

This guide walks you through installing `taucli` and configuring it to run
entirely locally using Ollama and the Gemma 2B model.

## Prerequisites

- **Node.js**: Version 20 or higher.
- **Git**: To clone the repository.
- **Ollama**: For running local models.
  [Download Ollama](https://ollama.com/download).

## 1. Install TauCLI

First, clone the repository (if you haven't already) and install the CLI
globally from the source.

```bash
# Clone the repository
git clone https://github.com/ahmedtariqh/gemini-cli.git
cd gemini-cli

# Install dependencies and build
npm install
npm run build

# Link the binary globally
npm link
```

Verify the installation:

```bash
taucli --version
```

## 2. Set Up Ollama

1.  **Install & Start Ollama**: Follow the instructions on the
    [Ollama website](https://ollama.com).
2.  **Pull the Model**: Open a new terminal and pull the Gemma 2B model:

    ```bash
    ollama pull gemma:2b
    ```

3.  **Start the Model Server** (if not running in the background):
    ```bash
    ollama serve
    ```

## 3. Configure TauCLI for Local Execution

Set the necessary environment variables to tell `taucli` to use your local
Ollama instance instead of Google's servers.

### Windows (PowerShell)

```powershell
# Set the Base URL to Ollama's local server
$env:TAUCLI_PROVIDER_BASE_URL="http://localhost:11434/v1"

# Specify the model you pulled
$env:TAUCLI_MODEL="gemma:2b"

# Set a dummy API key (required by the internal logic, but ignored by Ollama)
$env:TAUCLI_API_KEY="ollama"
```

### Windows (CMD)

```cmd
set TAUCLI_PROVIDER_BASE_URL=http://localhost:11434/v1
set TAUCLI_MODEL=gemma:2b
set TAUCLI_API_KEY=ollama
```

### Linux / macOS

```bash
export TAUCLI_PROVIDER_BASE_URL="http://localhost:11434/v1"
export TAUCLI_MODEL="gemma:2b"
export TAUCLI_API_KEY="ollama"
```

### Important: Configure Settings File

After setting the environment variables, you **must** create or update the
TauCLI settings file to tell it to use Ollama:

**Windows:** Create/edit `C:\Users\<YourUsername>\.taucli\settings.json`

**Linux/macOS:** Create/edit `~/.taucli/settings.json`

Add this configuration:

```json
{
  "authType": "ollama"
}
```

**Note:** The `authType` field is critical - without it, TauCLI will still try
to authenticate with Google even if the environment variables are set.

## 4. Run TauCLI

Now simply run the CLI:

```bash
taucli
```

You should see the `taucli` interface. When you type a prompt, it will be
processed locally by Gemma 2B via Ollama. You will also see a token generation
speed indicator (e.g., `45 t/s`) if the response is streaming.

## Troubleshooting

- **Connection Refused**: Ensure Ollama is running (`ollama serve`).
- **Model Not Found**: Check that you pulled the exact model name matching
  `TAUCLI_MODEL` (`ollama list` to verify).
- **Wrong Binary**: If `taucli` command is not found, try running
  `./packages/cli/dist/index.js` directly with `node` or re-run `npm link`.

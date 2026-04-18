# Cognitively Adaptive AI Assistant

A VS Code extension integrating large language models with cognitively inclusive interaction patterns — designed with diverse cognitive styles in mind.

## Features

### Adjustable Explanation Verbosity
The AI adapts its explanation style to your preference:
- **Brief** — Concise, one-line responses
- **Standard** — Balanced detail and clarity
- **Detailed** — Thorough, step-by-step explanations with edge cases

### Focus Mode
Suppresses non-essential AI suggestions during active coding sessions. Toggle manually or enable automatic idle detection.

### Structured Task Decomposition
Before generating code, the AI breaks your task into numbered steps you must acknowledge — providing explicit structure for those who benefit from it.

## Motivation

AI-powered programming tools are overwhelmingly designed for neurotypical workflows. This extension explores how interaction patterns can adapt to diverse cognitive styles, particularly supporting neurodiverse programmers.

## Requirements

- VS Code 1.85.0+
- API key for your chosen LLM provider (OpenAI, Anthropic, or a local Ollama instance)

## Configuration

```json
{
  "adaptiveAI.explanationVerbosity": "standard",
  "adaptiveAI.focusModeEnabled": false,
  "adaptiveAI.llmProvider": "openai",
  "adaptiveAI.openAIModel": "gpt-4o",
  "adaptiveAI.apiKey": "your-api-key"
}
```

Or set the `OPENAI_API_KEY` environment variable.

## Local Development

```bash
npm install
npm run watch    # Watch mode for development
npm run compile  # Production build
```

Press `F5` in VS Code to launch the extension in development mode.

## Tech Stack

- TypeScript
- VS Code Extension API
- OpenAI SDK / Anthropic SDK / Ollama REST API

## Architecture

```
src/
├── extension.ts         # Entry point, registers commands
├── AdaptiveAIPanel.ts   # Webview panel + message handling
├── SettingsManager.ts   # Configuration management
├── FocusModeManager.ts  # Focus mode state + idle detection
└── llm/
    └── LLMProvider.ts    # Unified LLM interface (OpenAI/Anthropic/Ollama)
```

## Project Status

This is an early-stage prototype developed as part of a PhD application. The goal is to demonstrate:
1. VS Code extension development with the webview API
2. LLM integration with configurable interaction parameters
3. Modular architecture separating concerns (LLM, settings, focus mode)

## License

MIT

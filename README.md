# Cognitively Adaptive AI Assistant

A VS Code extension integrating large language models with cognitively inclusive interaction patterns. It is designed for diverse cognitive styles.

### Screenshot
<img width="1343" height="798" alt="Screenshot 2026-04-21 at 10 20 02 PM" src="https://github.com/user-attachments/assets/bca23258-1d78-419a-8bf2-3f7d81851715" />

## Features

### Adjustable Explanation Verbosity
The AI adapts its explanation style to your preference:
- **Brief** — Concise, one-line responses
- **Standard** — Balanced detail and clarity
- **Detailed** — Thorough, step-by-step explanations with edge cases

### Focus Mode
Suppresses non-essential AI suggestions during active coding sessions. Toggle manually or enable automatic idle detection.

### Structured Task Decomposition
Before generating code, the AI breaks your task into numbered steps you must acknowledge, providing explicit structure for those who benefit from it.

### Response Speed Control
Adjustable delay before AI responses appear:
- **Fast** - Instant responses for quick iterations
- **Normal** - Slight pause for processing
- **Slow** - Longer delay for those who need more time between responses

### Configurable Font Size and High Contrast Toggle  

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
  "adaptiveAI.responseDelay": "normal",
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
- OpenAI SDK

## Architecture

```
src/
├── extension.ts         # Entry point, registers commands
├── AdaptiveAIPanel.ts  # Webview panel + message handling
├── SettingsManager.ts  # Configuration management
├── FocusModeManager.ts # Focus mode state + idle detection
└── llm/
    └── LLMProvider.ts   # Unified LLM interface (OpenAI/Anthropic/Ollama)
```
## Features to be implemented                                                                                                                        
  1. Session Timer with Breaks - 25/45/60 min interval reminders to prevent burnout                                                           
  2. Sequential Q&A Mode - One question at a time, AI waits for "Continue" before next answer                                                
  3. Checkpoint Summaries - Periodic recap of decisions/changes every N messages or 15 min
  4. Template Shortcuts - /explain, /refactor, /test, /review slash commands with autocomplete                                                
  5. Explicit Confirmations - Show diff and require "Apply/Reject" before code changes
  6. Copy Code Button - Easy extraction of AI-generated code blocks from chat
  7. Voice Input Support - Speech-to-text via VS Code's built-in dictation
  8. Context Recall - Remind user what a variable was when re-entering a file
  9. Minimal Mode - Collapse UI to only chat input + current message
  10. Persistent To-Do List - Track tasks mentioned during session
  11. Per-user cognitive profile preferences - Persist settings across sessions
  12. Distraction Blocking - Suppress VS Code notifications during active AI sessions                                                          
  13. Plain Language Toggle - Simplify technical jargon in explanations
  14. Multiple simultaneous LLM providers - Compare responses from different models

## License

MIT License

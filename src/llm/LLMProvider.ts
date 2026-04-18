import { SettingsManager, AdaptiveAISettings, VerbosityLevel } from '../SettingsManager';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  finishReason?: string;
}

const VERBOSITY_SYSTEM_PROMPTS: Record<VerbosityLevel, string> = {
  brief: 'You are a helpful coding assistant. Keep responses concise and to the point. Prioritize brevity but ensure accuracy.',
  standard: 'You are a helpful coding assistant. Provide balanced explanations with moderate detail. Aim for clarity.',
  detailed: 'You are a helpful coding assistant. Provide thorough, step-by-step explanations. Include edge cases, alternatives, and detailed reasoning. When writing code, explain each step.'
};

export class LLMProvider {
  constructor(private settingsManager: SettingsManager) {}

  private buildSystemPrompt(settings: AdaptiveAISettings): string {
    const verbosityPrompt = VERBOSITY_SYSTEM_PROMPTS[settings.explanationVerbosity];
    return `${verbosityPrompt}

You are integrated into a VS Code extension designed to be cognitively inclusive.
Adapt your communication style to the user's configured verbosity level.
When decomposing tasks, always provide numbered steps the user can acknowledge.`;
  }

  async sendMessage(messages: LLMMessage[], context: string = ''): Promise<LLMResponse> {
    const settings = this.settingsManager.getSettings();
    const systemPrompt = this.buildSystemPrompt(settings);

    // Prepend context to last user message if provided
    const processedMessages = [...messages];
    if (context) {
      const lastUserIndex = processedMessages.map(m => m.role).lastIndexOf('user');
      if (lastUserIndex >= 0) {
        processedMessages[lastUserIndex] = {
          ...processedMessages[lastUserIndex],
          content: `${processedMessages[lastUserIndex].content}\n\nContext: ${context}`
        };
      }
    }

    switch (settings.llmProvider) {
      case 'openai':
        return this.callOpenAI(processedMessages, systemPrompt, settings);
      case 'anthropic':
        return this.callAnthropic(processedMessages, systemPrompt, settings);
      case 'ollama':
        return this.callOllama(processedMessages, systemPrompt, settings);
      default:
        throw new Error(`Unknown LLM provider: ${settings.llmProvider}`);
    }
  }

  async decomposeIntoSteps(task: string): Promise<string[]> {
    const settings = this.settingsManager.getSettings();
    const systemPrompt = `${this.buildSystemPrompt(settings)}

IMPORTANT: You are being asked to decompose a coding task into steps.
Respond ONLY with a numbered list of steps, one per line. No other text.
Example format:
1. Understand the requirements
2. Set up the environment
3. Write the first unit test`;

    const response = await this.sendMessage([
      { role: 'user', content: `Decompose this task into clear, actionable steps: ${task}` }
    ], systemPrompt);

    return response.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line));
  }

  private async callOpenAI(
    messages: LLMMessage[],
    systemPrompt: string,
    settings: AdaptiveAISettings
  ): Promise<LLMResponse> {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: settings.apiKey });

    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: settings.openAIModel,
      messages: allMessages,
      max_tokens: 2048,
      temperature: 0.7,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      finishReason: response.choices[0]?.finish_reason
    };
  }

  private async callAnthropic(
    messages: LLMMessage[],
    systemPrompt: string,
    settings: AdaptiveAISettings
  ): Promise<LLMResponse> {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: settings.apiKey });

    // Anthropic uses a different message format
    const allMessages = [
      { role: 'user' as const, content: systemPrompt },
      ...messages
    ];

    const response = await anthropic.messages.create({
      model: settings.anthropicModel,
      max_tokens: 2048,
      messages: allMessages as { role: 'user' | 'assistant'; content: string }[]
    });

    const textContent = response.content.find(c => c.type === 'text');
    return {
      content: textContent?.type === 'text' ? textContent.text : '',
    };
  }

  private async callOllama(
    messages: LLMMessage[],
    systemPrompt: string,
    settings: AdaptiveAISettings
  ): Promise<LLMResponse> {
    const url = `${settings.ollamaBaseUrl}/api/chat`;
    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.ollamaModel,
        messages: allMessages,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as { message?: { content?: string } };
    return {
      content: data.message?.content || ''
    };
  }
}

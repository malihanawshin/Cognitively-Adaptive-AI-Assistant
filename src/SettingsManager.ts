import * as vscode from 'vscode';

export type VerbosityLevel = 'brief' | 'standard' | 'detailed';
export type LLMProviderType = 'openai' | 'anthropic' | 'ollama';
export type ResponseDelayLevel = 'fast' | 'normal' | 'slow';
export type FontSizeLevel = 'small' | 'medium' | 'large';

export interface AdaptiveAISettings {
  explanationVerbosity: VerbosityLevel;
  focusModeEnabled: boolean;
  llmProvider: LLMProviderType;
  openAIModel: string;
  anthropicModel: string;
  ollamaModel: string;
  apiKey: string;
  ollamaBaseUrl: string;
  idleDetectionEnabled: boolean;
  responseDelay: ResponseDelayLevel;
  fontSize: FontSizeLevel;
  highContrastEnabled: boolean;
}

const VERBOSITY_CYCLE: VerbosityLevel[] = ['brief', 'standard', 'detailed'];

export class SettingsManager {
  private configChangeEmitter = new vscode.EventEmitter<AdaptiveAISettings>();

  get configChange() {
    return this.configChangeEmitter.event;
  }

  getSettings(): AdaptiveAISettings {
    const config = vscode.workspace.getConfiguration('adaptiveAI');
    return {
      explanationVerbosity: (config.get('explanationVerbosity') as VerbosityLevel) || 'standard',
      focusModeEnabled: config.get('focusModeEnabled') as boolean || false,
      llmProvider: (config.get('llmProvider') as LLMProviderType) || 'openai',
      openAIModel: config.get('openAIModel') as string || 'gpt-4o',
      anthropicModel: config.get('anthropicModel') as string || 'claude-3-5-sonnet-latest',
      ollamaModel: config.get('ollamaModel') as string || 'llama3',
      apiKey: config.get('apiKey') as string || process.env.OPENAI_API_KEY || '',
      ollamaBaseUrl: config.get('ollamaBaseUrl') as string || 'http://localhost:11434',
      idleDetectionEnabled: config.get('idleDetectionEnabled') as boolean || true,
      responseDelay: (config.get('responseDelay') as ResponseDelayLevel) || 'normal',
      fontSize: (config.get('fontSize') as FontSizeLevel) || 'medium',
      highContrastEnabled: config.get('highContrastEnabled') as boolean || false,
    };
  }

  async cycleVerbosity(): Promise<void> {
    const settings = this.getSettings();
    const currentIndex = VERBOSITY_CYCLE.indexOf(settings.explanationVerbosity);
    const nextIndex = (currentIndex + 1) % VERBOSITY_CYCLE.length;
    await this.updateSetting('explanationVerbosity', VERBOSITY_CYCLE[nextIndex]);
    vscode.window.showInformationMessage(`Explanation verbosity set to: ${VERBOSITY_CYCLE[nextIndex]}`);
  }

  async cycleResponseDelay(): Promise<void> {
    const delayLevels: ResponseDelayLevel[] = ['fast', 'normal', 'slow'];
    const settings = this.getSettings();
    const currentIndex = delayLevels.indexOf(settings.responseDelay);
    const nextIndex = (currentIndex + 1) % delayLevels.length;
    await this.updateSetting('responseDelay', delayLevels[nextIndex]);
    const delayMessages = {
      fast: 'Lightning fast responses',
      normal: 'Normal response pace',
      slow: 'Slower responses for processing'
    };
    vscode.window.showInformationMessage(`Response speed: ${delayMessages[delayLevels[nextIndex]]}`);
  }

  async setFocusMode(enabled: boolean): Promise<void> {
    await this.updateSetting('focusModeEnabled', enabled);
  }

  async cycleFontSize(): Promise<void> {
    const fontSizes: FontSizeLevel[] = ['small', 'medium', 'large'];
    const settings = this.getSettings();
    const currentIndex = fontSizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % fontSizes.length;
    await this.updateSetting('fontSize', fontSizes[nextIndex]);
    vscode.window.showInformationMessage(`Font size set to: ${fontSizes[nextIndex]}`);
  }

  async setHighContrast(enabled: boolean): Promise<void> {
    await this.updateSetting('highContrastEnabled', enabled);
  }

  private async updateSetting(key: string, value: unknown): Promise<void> {
    const config = vscode.workspace.getConfiguration('adaptiveAI');
    await config.update(key, value, vscode.ConfigurationTarget.Global);
    this.configChangeEmitter.fire(this.getSettings());
  }

  getVerbosityInstruction(): string {
    const settings = this.getSettings();
    const instructions: Record<VerbosityLevel, string> = {
      brief: 'Provide concise, one-line explanations. Prioritize brevity.',
      standard: 'Provide balanced explanations with moderate detail.',
      detailed: 'Provide thorough, step-by-step explanations. Include edge cases and alternatives.'
    };
    return instructions[settings.explanationVerbosity];
  }

  getResponseDelayMs(): number {
    const settings = this.getSettings();
    const delays: Record<ResponseDelayLevel, number> = {
      fast: 0,
      normal: 500,
      slow: 1500
    };
    return delays[settings.responseDelay];
  }
}

import * as vscode from 'vscode';
import { SettingsManager } from './SettingsManager';

export class FocusModeManager {
  private context: vscode.ExtensionContext | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT_MS = 30000; // 30 seconds of idle triggers focus mode

  constructor(private settingsManager: SettingsManager) {}

  initialize(context: vscode.ExtensionContext): void {
    this.context = context;
    this.updateContextState();

    if (this.settingsManager.getSettings().idleDetectionEnabled) {
      this.setupIdleDetection();
    }

    // Listen for configuration changes
    this.settingsManager.configChange((settings) => {
      if (settings.idleDetectionEnabled) {
        this.setupIdleDetection();
      }
    });
  }

  async toggle(): Promise<void> {
    const settings = this.settingsManager.getSettings();
    await this.settingsManager.setFocusMode(!settings.focusModeEnabled);
    this.updateContextState();
    const newState = !settings.focusModeEnabled;
    vscode.window.showInformationMessage(
      newState ? 'Focus Mode enabled — AI suggestions paused' : 'Focus Mode disabled — AI suggestions active'
    );
  }

  private updateContextState(): void {
    if (!this.context) { return; }
    const settings = this.settingsManager.getSettings();
    vscode.commands.executeCommand(
      'setContext',
      'adaptiveAI.focusModeActive',
      settings.focusModeEnabled
    );
  }

  private setupIdleDetection(): void {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }

    // Check if window is focused periodically
    this.idleTimer = setInterval(() => {
      const settings = this.settingsManager.getSettings();
      if (!settings.idleDetectionEnabled) { return; }

      const window = vscode.window;
      if (!window.state.focused) {
        // Window lost focus — could enable focus mode here if desired
      }
    }, 10000);
  }

  isFocusModeActive(): boolean {
    return this.settingsManager.getSettings().focusModeEnabled;
  }

  dispose(): void {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }
  }
}

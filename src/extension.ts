import * as vscode from 'vscode';
import { AdaptiveAIPanel } from './AdaptiveAIPanel';
import { FocusModeManager } from './FocusModeManager';
import { SettingsManager } from './SettingsManager';
import { LLMProvider } from './llm/LLMProvider';

export function activate(context: vscode.ExtensionContext) {
  const settingsManager = new SettingsManager();
  const llmProvider = new LLMProvider(settingsManager);
  const focusModeManager = new FocusModeManager(settingsManager);
  const panel = new AdaptiveAIPanel(context, settingsManager, llmProvider, focusModeManager);

  // Register commands
  const openPanelCmd = vscode.commands.registerCommand('adaptiveAIPanel.open', () => {
    panel.show();
  });

  const focusModeCmd = vscode.commands.registerCommand('adaptiveAI.focusMode', async () => {
    await focusModeManager.toggle();
    const settings = settingsManager.getSettings();
    panel.panel?.webview.postMessage({ type: 'updateFocusMode', payload: settings.focusModeEnabled });
  });

  const cycleVerbosityCmd = vscode.commands.registerCommand('adaptiveAI.toggleVerbosity', async () => {
    await settingsManager.cycleVerbosity();
    const settings = settingsManager.getSettings();
    panel.panel?.webview.postMessage({ type: 'updateVerbosity', payload: settings.explanationVerbosity });
  });

  const cycleResponseDelayCmd = vscode.commands.registerCommand('adaptiveAI.cycleResponseDelay', async () => {
    await settingsManager.cycleResponseDelay();
    const settings = settingsManager.getSettings();
    panel.panel?.webview.postMessage({ type: 'updateResponseDelay', payload: settings.responseDelay });
  });

  const decomposeTaskCmd = vscode.commands.registerCommand('adaptiveAI.decomposeTask', async () => {
    await panel.decomposeTask();
  });

  const cycleFontSizeCmd = vscode.commands.registerCommand('adaptiveAI.cycleFontSize', async () => {
    await settingsManager.cycleFontSize();
    const settings = settingsManager.getSettings();
    panel.panel?.webview.postMessage({ type: 'updateFontSize', payload: settings.fontSize });
  });

  const toggleHighContrastCmd = vscode.commands.registerCommand('adaptiveAI.toggleHighContrast', async () => {
    const settings = settingsManager.getSettings();
    await settingsManager.setHighContrast(!settings.highContrastEnabled);
    const updatedSettings = settingsManager.getSettings();
    panel.panel?.webview.postMessage({ type: 'updateHighContrast', payload: updatedSettings.highContrastEnabled });
  });

  // Set initial focus mode state
  focusModeManager.initialize(context);

  context.subscriptions.push(
    openPanelCmd,
    focusModeCmd,
    cycleVerbosityCmd,
    cycleResponseDelayCmd,
    decomposeTaskCmd,
    cycleFontSizeCmd,
    toggleHighContrastCmd,
    panel
  );
}

export function deactivate() {}

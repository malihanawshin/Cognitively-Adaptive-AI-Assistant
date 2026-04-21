import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SettingsManager } from './SettingsManager';
import { LLMProvider, LLMMessage } from './llm/LLMProvider';
import { FocusModeManager } from './FocusModeManager';

export class AdaptiveAIPanel implements vscode.Disposable {
  public panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;
  private settingsManager: SettingsManager;
  private llmProvider: LLMProvider;
  private focusModeManager: FocusModeManager;
  private messageHistory: LLMMessage[] = [];
  private isDecomposeMode = false;
  private pendingTask = '';

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    llmProvider: LLMProvider,
    focusModeManager: FocusModeManager
  ) {
    this.context = context;
    this.settingsManager = settingsManager;
    this.llmProvider = llmProvider;
    this.focusModeManager = focusModeManager;
  }

  show(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two, true);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'adaptiveAIPanel',
      'Adaptive AI Assistant',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview')]
      }
    );

    this.panel.webview.html = this.loadWebviewContent();
    this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this));
    this.panel.onDidChangeViewState(() => {
      if (this.panel?.visible) {
        this.updateStatusBar();
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    }, null, this.context.subscriptions);
  }

  async decomposeTask(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.selection;
    const code = selection ? editor!.document.getText(selection) : '';

    if (!this.panel) {
      this.show();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isDecomposeMode = true;
    this.pendingTask = code;
    this.panel!.webview.postMessage({ type: 'enterDecomposeMode', task: code });
  }

  private async handleMessage(message: { type: string; payload?: unknown }): Promise<void> {
    switch (message.type) {
      case 'sendMessage':
        await this.handleUserMessage(message.payload as string);
        break;
      case 'enterDecomposeMode':
        await this.handleDecomposeMode(message.payload as string);
        break;
      case 'acknowledgeSteps':
        await this.handleStepAcknowledgement();
        break;
      case 'toggleFocusMode':
        await this.focusModeManager.toggle();
        const updatedSettings = this.settingsManager.getSettings();
        this.panel?.webview.postMessage({ type: 'updateFocusMode', payload: updatedSettings.focusModeEnabled });
        break;
      case 'cycleVerbosity':
        await this.settingsManager.cycleVerbosity();
        const newSettings = this.settingsManager.getSettings();
        this.panel?.webview.postMessage({ type: 'updateVerbosity', payload: newSettings.explanationVerbosity });
        break;
      case 'cycleResponseDelay':
        await this.settingsManager.cycleResponseDelay();
        const delaySettings = this.settingsManager.getSettings();
        this.panel?.webview.postMessage({ type: 'updateResponseDelay', payload: delaySettings.responseDelay });
        break;
      case 'cycleFontSize':
        await this.settingsManager.cycleFontSize();
        const fontSettings = this.settingsManager.getSettings();
        this.panel?.webview.postMessage({ type: 'updateFontSize', payload: fontSettings.fontSize });
        break;
      case 'toggleHighContrast':
        {
          const currentSettings = this.settingsManager.getSettings();
          await this.settingsManager.setHighContrast(!currentSettings.highContrastEnabled);
          const newSettings = this.settingsManager.getSettings();
          this.panel?.webview.postMessage({ type: 'updateHighContrast', payload: newSettings.highContrastEnabled });
        }
        break;
      case 'clearHistory':
        this.messageHistory = [];
        break;
    }
  }

  private async handleUserMessage(content: string): Promise<void> {
    if (this.focusModeManager.isFocusModeActive()) {
      this.panel?.webview.postMessage({
        type: 'showNotification',
        payload: { message: 'Focus Mode is active. AI responses are paused.', isError: true }
      });
      return;
    }

    this.messageHistory.push({ role: 'user', content });

    this.panel?.webview.postMessage({ type: 'setLoading', payload: true });

    try {
      const context = await this.getCurrentFileContext();
      const response = await this.llmProvider.sendMessage(this.messageHistory, context);

      this.messageHistory.push({ role: 'assistant', content: response.content });
      this.panel?.webview.postMessage({
        type: 'addMessage',
        payload: { role: 'assistant', content: response.content }
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        type: 'showNotification',
        payload: { message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, isError: true }
      });
    } finally {
      this.panel?.webview.postMessage({ type: 'setLoading', payload: false });
    }
  }

  private async handleDecomposeMode(task: string): Promise<void> {
    this.isDecomposeMode = true;
    this.pendingTask = task;

    this.panel?.webview.postMessage({ type: 'setLoading', payload: true });

    try {
      const steps = await this.llmProvider.decomposeIntoSteps(task);
      this.panel?.webview.postMessage({
        type: 'showSteps',
        payload: steps
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        type: 'showNotification',
        payload: { message: `Error decomposing task: ${error instanceof Error ? error.message : 'Unknown error'}`, isError: true }
      });
    } finally {
      this.panel?.webview.postMessage({ type: 'setLoading', payload: false });
    }
  }

  private async handleStepAcknowledgement(): Promise<void> {
    if (!this.pendingTask) { return; }

    this.isDecomposeMode = false;
    const task = this.pendingTask;
    this.pendingTask = '';

    const context = await this.getCurrentFileContext();

    const prompt = `Here is the task I decomposed:\n${task}\n\nNow generate the complete code solution:`;
    this.messageHistory.push({ role: 'user', content: prompt });

    this.panel?.webview.postMessage({ type: 'setLoading', payload: true });

    try {
      const response = await this.llmProvider.sendMessage(this.messageHistory, context);
      this.messageHistory.push({ role: 'assistant', content: response.content });
      this.panel?.webview.postMessage({
        type: 'addMessage',
        payload: { role: 'assistant', content: response.content }
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        type: 'showNotification',
        payload: { message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, isError: true }
      });
    } finally {
      this.panel?.webview.postMessage({ type: 'setLoading', payload: false });
    }
  }

  private async getCurrentFileContext(): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return ''; }

    const doc = editor.document;
    const selectedText = doc.getText(editor.selection);

    return `File: ${doc.fileName} (${doc.languageId})
Selected text: ${selectedText || '(none)'}
Full file content (first 2000 chars): ${doc.getText().slice(0, 2000)}`;
  }

  private updateStatusBar(): void {
    const settings = this.settingsManager.getSettings();
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = `AI: ${settings.explanationVerbosity} | Focus: ${settings.focusModeEnabled ? 'ON' : 'OFF'}`;
    statusBar.command = 'adaptiveAIPanel.open';
    statusBar.show();
    setTimeout(() => statusBar.dispose(), 5000);
  }

  private loadWebviewContent(): string {
    const htmlPath = path.join(this.context.extensionUri.fsPath, 'src', 'webview', 'panel.html');
    return fs.readFileSync(htmlPath, 'utf-8');
  }

  async serialize(): Promise<void> {}

  dispose(): void {
    this.panel?.dispose();
    this.panel = undefined;
  }
}
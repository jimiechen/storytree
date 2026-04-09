import * as vscode from "vscode";
import { EventEmitter } from "events";

export interface CaiodeConfig {
  queue: {
    timeout: number;
  };
  lock: {
    staleLockTimeout: number;
  };
  heartbeat: {
    interval: number;
    maxMisses: number;
  };
}

export class ConfigService extends EventEmitter {
  private config: CaiodeConfig;
  private disposable: vscode.Disposable;

  constructor() {
    super();
    this.config = this.loadConfig();
    this.disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("caiode")) {
        this.reloadConfig();
      }
    });
  }

  private loadConfig(): CaiodeConfig {
    const queueTimeout = vscode.workspace.getConfiguration("caiode").get<number>("queue.timeout", 30000);
    const staleLockTimeout = vscode.workspace.getConfiguration("caiode").get<number>("lock.staleLockTimeout", 10000);
    const heartbeatInterval = vscode.workspace.getConfiguration("caiode").get<number>("heartbeat.interval", 5000);
    const heartbeatMaxMisses = vscode.workspace.getConfiguration("caiode").get<number>("heartbeat.maxMisses", 3);

    return {
      queue: {
        timeout: queueTimeout,
      },
      lock: {
        staleLockTimeout: staleLockTimeout,
      },
      heartbeat: {
        interval: heartbeatInterval,
        maxMisses: heartbeatMaxMisses,
      },
    };
  }

  private reloadConfig(): void {
    const oldConfig = this.config;
    this.config = this.loadConfig();
    this.emit("configChanged", this.config, oldConfig);
  }

  getConfig(): CaiodeConfig {
    return { ...this.config };
  }

  get<T>(section: string): T | undefined {
    return vscode.workspace.getConfiguration("caiode").get<T>(section);
  }

  dispose(): void {
    this.disposable.dispose();
    this.removeAllListeners();
  }
}

let configService: ConfigService | undefined;

export function getConfigService(): ConfigService {
  if (!configService) {
    configService = new ConfigService();
  }
  return configService;
}

export function disposeConfigService(): void {
  if (configService) {
    configService.dispose();
    configService = undefined;
  }
}
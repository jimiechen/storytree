import * as fs from 'fs';
import * as path from 'path';
import { IDEAdapter, IDEAdapterConfig } from '../types';
import { CDPBasedAdapter } from './cdp-based-adapter';

// CDP 客户端接口
interface CDPClient {
  send(method: string, params?: any): Promise<any>;
}

export class IDEAdapterLoader {
  private cdpClient: CDPClient;
  private adapterDir: string;

  constructor(cdpClient: CDPClient, adapterDir: string) {
    this.cdpClient = cdpClient;
    this.adapterDir = adapterDir;
  }

  async detectAndLoad(): Promise<IDEAdapter> {
    const ideType = await this.detectIDEType();
    const configPath = path.join(this.adapterDir, `${ideType}.adapter.json`);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Adapter config not found for IDE type: ${ideType}`);
    }

    const config = this.loadJSON(configPath);
    return new CDPBasedAdapter(this.cdpClient, config);
  }

  async detectIDEType(): Promise<string> {
    // 通过 CDP 读取 window.title 或特征元素来检测 IDE 类型
    const script = `
      // 检测 Trae IDE
      if (document.title.includes('Trae')) {
        return 'trae';
      }
      // 检测 Cursor IDE
      else if (document.title.includes('Cursor')) {
        return 'cursor';
      }
      // 检测 Windsurf IDE
      else if (document.title.includes('Windsurf')) {
        return 'windsurf';
      }
      // 默认返回 trae
      return 'trae';
    `;

    const result = await this.cdpClient.send('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    return result.result.value;
  }

  // 配置热重载
  async watchAdapterConfig(callback: () => void): Promise<void> {
    // 监听 .caiode/adapters/ 目录变化
    fs.watch(this.adapterDir, (eventType, filename) => {
      if (eventType === 'change' && filename?.endsWith('.adapter.json')) {
        callback();
      }
    });
  }

  private loadJSON(filePath: string): IDEAdapterConfig {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as IDEAdapterConfig;
  }
}

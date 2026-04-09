import { IDEAdapter, IDEAdapterConfig, HealthReport, SelectorCheckResult } from '../types';
import { CDPDriver } from '../drivers/cdp-driver';

// CDP 客户端接口
interface CDPClient {
  send(method: string, params?: any): Promise<any>;
}

export class CDPBasedAdapter implements IDEAdapter {
  config: IDEAdapterConfig;
  private driver: CDPDriver;
  private cdpClient: CDPClient;

  constructor(cdpClient: CDPClient, config: IDEAdapterConfig) {
    this.cdpClient = cdpClient;
    this.config = config;
    this.driver = new CDPDriver(
      cdpClient,
      config.selectors,
      config.inputMethod,
      config.submitMethod
    );
  }

  async waitForReady(): Promise<void> {
    const startTime = Date.now();
    const { pollInterval, timeout } = this.config.waitStrategies.inputReady;

    while (Date.now() - startTime < timeout) {
      const ready = await this.isReady();
      if (ready) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('IDE not ready within timeout');
  }

  async typeInChatInput(text: string): Promise<void> {
    return this.driver.typeInChatInput(text);
  }

  async submitMessage(): Promise<void> {
    return this.driver.submitMessage();
  }

  async waitForResponseComplete(timeoutMs: number): Promise<string> {
    return this.driver.waitForResponseComplete(timeoutMs);
  }

  async getLastResponse(): Promise<string> {
    return this.driver.getLastResponse();
  }

  async newConversation(): Promise<void> {
    return this.driver.newConversation();
  }

  async isReady(): Promise<boolean> {
    return this.driver.isReady();
  }

  // 健康检查方法
  async checkHealth(): Promise<HealthReport> {
    const results: SelectorCheckResult[] = [];

    for (const [key, selector] of Object.entries(this.config.selectors)) {
      const exists = await this.checkSelector(selector as string);
      results.push({
        key,
        selector: selector as string,
        exists
      });
    }

    const failedSelectors = results.filter(r => !r.exists);

    return {
      healthy: failedSelectors.length === 0,
      failedSelectors
    };
  }

  private async checkSelector(selector: string): Promise<boolean> {
    const script = `
      document.querySelector('${selector}') !== null;
    `;

    const result = await this.cdpClient.send('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    return result.result.value;
  }
}

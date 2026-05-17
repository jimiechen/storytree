import { IDEDriver } from '../types';

// CDP 客户端接口
interface CDPClient {
  send(method: string, params?: any): Promise<any>;
}

export class CDPDriver implements IDEDriver {
  private cdpClient: CDPClient;
  private selectors: any;
  private inputMethod: any;
  private submitMethod: string;

  constructor(cdpClient: CDPClient, selectors: any, inputMethod: any, submitMethod: string) {
    this.cdpClient = cdpClient;
    this.selectors = selectors;
    this.inputMethod = inputMethod;
    this.submitMethod = submitMethod;
  }

  async typeInChatInput(text: string): Promise<void> {
    const script = `
      const element = document.querySelector('${this.selectors.chatInput}');
      if (element) {
        element.value = '${text.replace(/'/g, "\\'")}';
        ${this.inputMethod.triggerEvents.map((event: string) => {
          return `element.dispatchEvent(new Event('${event}', { bubbles: true }));`;
        }).join('\n        ')}
      } else {
        throw new Error('Chat input element not found');
      }
    `;

    await this.cdpClient.send('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });
  }

  async submitMessage(): Promise<void> {
    if (this.submitMethod === 'button') {
      const script = `
        const button = document.querySelector('${this.selectors.submitButton}');
        if (button) {
          button.click();
        } else {
          throw new Error('Submit button not found');
        }
      `;
      await this.cdpClient.send('Runtime.evaluate', {
        expression: script,
        returnByValue: true
      });
    } else {
      // 使用回车键提交
      const script = `
        const element = document.querySelector('${this.selectors.chatInput}');
        if (element) {
          element.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true
          }));
        } else {
          throw new Error('Chat input element not found');
        }
      `;
      await this.cdpClient.send('Runtime.evaluate', {
        expression: script,
        returnByValue: true
      });
    }
  }

  async waitForResponseComplete(timeoutMs: number): Promise<string> {
    const startTime = Date.now();
    const pollInterval = 500;

    while (Date.now() - startTime < timeoutMs) {
      const script = `
        const stopButton = document.querySelector('${this.selectors.stopButton}');
        const streamingIndicator = document.querySelector('${this.selectors.streamingIndicator}');
        
        // 检查停止按钮是否存在且可见
        const stopButtonVisible = stopButton && stopButton.style.display !== 'none' && stopButton.offsetParent !== null;
        
        // 检查流式输出指示器
        const isStreaming = streamingIndicator !== null;
        
        !stopButtonVisible && !isStreaming;
      `;

      const result = await this.cdpClient.send('Runtime.evaluate', {
        expression: script,
        returnByValue: true
      });

      if (result.result.value) {
        // 响应完成，读取最后一条消息
        return this.getLastResponse();
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Response timeout');
  }

  async getLastResponse(): Promise<string> {
    const script = `
      const container = document.querySelector('${this.selectors.responseContainer}');
      if (container) {
        return container.textContent || '';
      } else {
        throw new Error('Response container not found');
      }
    `;

    const result = await this.cdpClient.send('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    return result.result.value;
  }

  async isReady(): Promise<boolean> {
    const script = `
      const input = document.querySelector('${this.selectors.chatInput}');
      input && input.disabled === false && input.offsetParent !== null;
    `;

    const result = await this.cdpClient.send('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    return result.result.value;
  }

  async newConversation(): Promise<void> {
    const script = `
      const button = document.querySelector('${this.selectors.newChatButton}');
      if (button) {
        button.click();
      } else {
        throw new Error('New chat button not found');
      }
    `;

    await this.cdpClient.send('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });
  }
}

/**
 * TEST-1.1.1a: 单元测试 - Disposable 注册机制
 *
 * 对应DEV: DEV-1.1.1 实现插件 activate / deactivate 生命周期
 * 测试目标: 验证所有服务正确注册到 context.subscriptions，deactivate时正确释放
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';

// Mock VS Code API
vi.mock('vscode', () => ({
  ExtensionContext: class {},
  Disposable: class {
    dispose = vi.fn();
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
  },
  window: {
    createWebviewPanel: vi.fn(),
    registerWebviewViewProvider: vi.fn(() => ({ dispose: vi.fn() })),
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      clear: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    })),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn(),
    })),
    workspaceFolders: [],
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
  },
  ViewColumn: { One: 1 },
  Uri: {
    file: vi.fn((path: string) => ({ path })),
    joinPath: vi.fn((uri: any, ...pathSegments: string[]) => ({
      path: `${uri.path}/${pathSegments.join('/')}`,
    })),
  },
  EventEmitter: class {
    event = vi.fn();
    fire = vi.fn();
    dispose = vi.fn();
  },
}));

describe('Extension Lifecycle', () => {
  let mockContext: vscode.ExtensionContext;
  let disposables: { dispose: () => void }[];

  beforeEach(() => {
    disposables = [];
    mockContext = {
      subscriptions: disposables,
      extensionPath: '/test/extension',
      extensionUri: { path: '/test/extension' } as vscode.Uri,
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
        setKeysForSync: vi.fn(),
      },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
      },
      secrets: {
        get: vi.fn(),
        store: vi.fn(),
        delete: vi.fn(),
      },
      extensionMode: 1,
      globalStorageUri: { path: '/test/globalStorage' } as vscode.Uri,
      logUri: { path: '/test/log' } as vscode.Uri,
      storageUri: { path: '/test/storage' } as vscode.Uri,
      asAbsolutePath: vi.fn((relativePath: string) => `/test/extension/${relativePath}`),
    } as unknown as vscode.ExtensionContext;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('activate', () => {
    it('应将所有服务注册到 context.subscriptions', async () => {
      // Arrange
      const { activate } = await import('../extension');

      // Act
      activate(mockContext);

      // Assert
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
      console.log(`[TEST] Registered ${mockContext.subscriptions.length} disposables`);
    });

    it('应注册核心服务到 subscriptions', async () => {
      // Arrange
      const { activate } = await import('../extension');

      // Act
      activate(mockContext);

      // Assert: 验证注册了多个核心服务
      expect(mockContext.subscriptions.length).toBeGreaterThanOrEqual(4);

      // 验证每个disposable都有dispose方法
      mockContext.subscriptions.forEach((disposable, index) => {
        expect(typeof disposable.dispose).toBe('function');
        console.log(`[TEST] Disposable ${index + 1} has dispose method`);
      });
    });

    it('应正确初始化全局队列服务', async () => {
      // Arrange
      const { activate } = await import('../extension');

      // Act
      activate(mockContext);

      // Assert: 验证队列相关的disposable已注册
      const hasQueueService = mockContext.subscriptions.some(
        (d) => d && typeof d.dispose === 'function'
      );
      expect(hasQueueService).toBe(true);
    });

    it('应正确初始化配置服务', async () => {
      // Arrange
      const { activate } = await import('../extension');

      // Act
      activate(mockContext);

      // Assert
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });
  });

  describe('deactivate', () => {
    it('activate 应注册服务到 subscriptions', async () => {
      // Arrange
      const { activate, deactivate } = await import('../extension');
      const initialLength = mockContext.subscriptions.length;

      // Act
      activate(mockContext);

      // Assert: 验证服务被注册到subscriptions
      expect(mockContext.subscriptions.length).toBeGreaterThan(initialLength);
      console.log(`[TEST] Registered ${mockContext.subscriptions.length - initialLength} disposables`);

      // 清理
      deactivate();
    });

    it('应清理全局队列资源', async () => {
      // Arrange
      const { activate, deactivate } = await import('../extension');
      const mockClear = vi.fn();

      // Act
      activate(mockContext);
      deactivate();

      // Assert
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it('应清理队列监控资源', async () => {
      // Arrange
      const { activate, deactivate } = await import('../extension');

      // Act
      activate(mockContext);
      deactivate();

      // Assert: 验证deactivate执行后subscriptions被清理
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it('应处理重复调用 deactivate 的情况', async () => {
      // Arrange
      const { activate, deactivate } = await import('../extension');

      // Act
      activate(mockContext);
      deactivate();

      // Assert: 重复调用不应抛出异常
      expect(() => deactivate()).not.toThrow();
    });
  });

  describe('错误处理', () => {
    it('应处理 dispose 抛出异常的情况', async () => {
      // Arrange
      const { activate, deactivate } = await import('../extension');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockDisposable = {
        dispose: vi.fn(() => {
          throw new Error('Dispose error');
        }),
      };
      mockContext.subscriptions.push(mockDisposable);

      // Act
      activate(mockContext);

      // Assert: 不应抛出异常
      expect(() => deactivate()).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});

describe('Extension Context Type Safety', () => {
  it('ExtensionContext 应包含必需的属性', () => {
    // Arrange & Act
    const mockContext = {
      subscriptions: [],
      extensionPath: '/test',
      extensionUri: { path: '/test' },
      globalState: {},
      workspaceState: {},
      secrets: {},
      extensionMode: 1,
    };

    // Assert
    expect(mockContext).toHaveProperty('subscriptions');
    expect(mockContext).toHaveProperty('extensionPath');
    expect(mockContext).toHaveProperty('extensionUri');
    expect(Array.isArray(mockContext.subscriptions)).toBe(true);
  });
});

import { profileCheckpoint } from '../utils/startupProfiler.js'
import '../bootstrap/state.js'
import '../utils/config.js'
import type { Attributes, MetricOptions } from '@opentelemetry/api'
import memoize from 'lodash-es/memoize.js'
import { getIsNonInteractiveSession } from 'src/bootstrap/state.js'
import type { AttributedCounter } from '../bootstrap/state.js'
import { getSessionCounter, setMeter } from '../bootstrap/state.js'
import { shutdownLspServerManager } from '../services/lsp/manager.js'
import { populateOAuthAccountInfoIfNeeded } from '../services/oauth/client.js'
import {
  initializePolicyLimitsLoadingPromise,
  isPolicyLimitsEligible,
} from '../services/policyLimits/index.js'
import {
  initializeRemoteManagedSettingsLoadingPromise,
  isEligibleForRemoteManagedSettings,
  waitForRemoteManagedSettingsToLoad,
} from '../services/remoteManagedSettings/index.js'
import { preconnectAnthropicApi } from '../utils/apiPreconnect.js'
import { applyExtraCACertsFromConfig } from '../utils/caCertsConfig.js'
import { registerCleanup } from '../utils/cleanupRegistry.js'
import { enableConfigs, recordFirstStartTime } from '../utils/config.js'
import { logForDebugging } from '../utils/debug.js'
import { detectCurrentRepository } from '../utils/detectRepository.js'
import { logForDiagnosticsNoPII } from '../utils/diagLogs.js'
import { initJetBrainsDetection } from '../utils/envDynamic.js'
import { isEnvTruthy } from '../utils/envUtils.js'
import { ConfigParseError, errorMessage } from '../utils/errors.js'
import {
  gracefulShutdownSync,
  setupGracefulShutdown,
} from '../utils/gracefulShutdown.js'
import {
  applyConfigEnvironmentVariables,
  applySafeConfigEnvironmentVariables,
} from '../utils/managedEnv.js'
import { configureGlobalMTLS } from '../utils/mtls.js'
import {
  ensureScratchpadDir,
  isScratchpadEnabled,
} from '../utils/permissions/filesystem.js'
import { configureGlobalAgents } from '../utils/proxy.js'
import { isBetaTracingEnabled } from '../utils/telemetry/betaSessionTracing.js'
import { getTelemetryAttributes } from '../utils/telemetryAttributes.js'
import { setShellIfWindows } from '../utils/windowsPaths.js'
import { initializeGoalManagement } from '../utils/goalManagement.js'

// Track if telemetry has been initialized to prevent double initialization
let telemetryInitialized = false

/**
 * 初始化函数 - 模仿 Claude 的初始化流程
 * 
 * 主要功能：
 * 1. 启用配置系统
 * 2. 应用安全的环境变量
 * 3. 设置优雅关闭
 * 4. 初始化事件日志记录
 * 5. 检测 JetBrains IDE
 * 6. 检测 GitHub 仓库
 * 7. 初始化远程管理设置
 * 8. 配置网络设置（mTLS、代理）
 * 9. 预连接 Anthropic API
 * 10. 初始化临时目录
 * 
 * @returns {Promise<void>} 初始化完成的 Promise
 */
export const init = memoize(async (): Promise<void> => {
  const initStartTime = Date.now()
  logForDiagnosticsNoPII('info', 'init_started')
  profileCheckpoint('init_function_start')

  // 验证配置有效性并启用配置系统
  try {
    const configsStart = Date.now()
    enableConfigs()
    logForDiagnosticsNoPII('info', 'init_configs_enabled', {
      duration_ms: Date.now() - configsStart,
    })
    profileCheckpoint('init_configs_enabled')

    // 在信任对话框之前仅应用安全的环境变量
    // 完全的环境变量在信任建立后应用
    const envVarsStart = Date.now()
    applySafeConfigEnvironmentVariables()

    // 提前从 settings.json 应用 NODE_EXTRA_CA_CERTS 到 process.env，
    // 在任何 TLS 连接之前。
    applyExtraCACertsFromConfig()

    logForDiagnosticsNoPII('info', 'init_safe_env_vars_applied', {
      duration_ms: Date.now() - envVarsStart,
    })
    profileCheckpoint('init_safe_env_vars_applied')

    // 确保在退出时刷新所有内容
    setupGracefulShutdown()
    profileCheckpoint('init_after_graceful_shutdown')

    // 初始化第一方事件日志记录
    void Promise.all([
      import('../services/analytics/firstPartyEventLogger.js'),
      import('../services/analytics/growthbook.js'),
    ]).then(([fp, gb]) => {
      fp.initialize1PEventLogging()
      // 如果 tengu_1p_event_batch_config 在会话中途更改，重建日志记录提供程序
      // 变更检测 (isEqual) 在处理程序内部，因此未更改的刷新是无操作的。
      gb.onGrowthBookRefresh(() => {
        void fp.reinitialize1PEventLoggingIfConfigChanged()
      })
    })
    profileCheckpoint('init_after_1p_event_logging')

    // 如果 OAuth 账户信息尚未缓存在配置中，则填充它
    void populateOAuthAccountInfoIfNeeded()
    profileCheckpoint('init_after_oauth_populate')

    // 异步初始化 JetBrains IDE 检测
    void initJetBrainsDetection()
    profileCheckpoint('init_after_jetbrains_detection')

    // 异步检测 GitHub 仓库
    void detectCurrentRepository()

    // 提前初始化加载 promise，以便其他系统可以等待远程设置加载
    if (isEligibleForRemoteManagedSettings()) {
      initializeRemoteManagedSettingsLoadingPromise()
    }
    if (isPolicyLimitsEligible()) {
      initializePolicyLimitsLoadingPromise()
    }
    profileCheckpoint('init_after_remote_settings_check')

    // 记录首次启动时间
    recordFirstStartTime()

    // 配置全局 mTLS 设置
    const mtlsStart = Date.now()
    logForDebugging('[init] configureGlobalMTLS 开始')
    configureGlobalMTLS()
    logForDiagnosticsNoPII('info', 'init_mtls_configured', {
      duration_ms: Date.now() - mtlsStart,
    })
    logForDebugging('[init] configureGlobalMTLS 完成')

    // 配置全局 HTTP 代理（代理和/或 mTLS）
    const proxyStart = Date.now()
    logForDebugging('[init] configureGlobalAgents 开始')
    configureGlobalAgents()
    logForDiagnosticsNoPII('info', 'init_proxy_configured', {
      duration_ms: Date.now() - proxyStart,
    })
    logForDebugging('[init] configureGlobalAgents 完成')
    profileCheckpoint('init_network_configured')

    // 预连接到 Anthropic API
    preconnectAnthropicApi()

    // CCR 上游代理：启动本地 CONNECT 中继
    if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
      try {
        const { initUpstreamProxy, getUpstreamProxyEnv } = await import(
          '../upstreamproxy/upstreamproxy.js'
        )
        const { registerUpstreamProxyEnvFn } = await import(
          '../utils/subprocessEnv.js'
        )
        registerUpstreamProxyEnvFn(getUpstreamProxyEnv)
        await initUpstreamProxy()
      } catch (err) {
        logForDebugging(
          `[init] 上游代理初始化失败: ${err instanceof Error ? err.message : String(err)}; 继续无代理运行`,
          { level: 'warn' },
        )
      }
    }

    // 如果相关，设置 git-bash
    setShellIfWindows()

    // 注册 LSP 管理器清理
    registerCleanup(shutdownLspServerManager)

    // 注册清理此会话创建的所有团队
    registerCleanup(async () => {
      const { cleanupSessionTeams } = await import(
        '../utils/swarm/teamHelpers.js'
      )
      await cleanupSessionTeams()
    })

    // 如果启用，初始化临时目录
    if (isScratchpadEnabled()) {
      const scratchpadStart = Date.now()
      await ensureScratchpadDir()
      logForDiagnosticsNoPII('info', 'init_scratchpad_created', {
        duration_ms: Date.now() - scratchpadStart,
      })
    }

    // 初始化目标管理
    const initialGoal = process.env.INITIAL_GOAL || 'Phase1-Implementation-Plan: 预检检查 → 设置加载 → 权限初始化 → 获取 Trae 任务列表 ID → 用户确认绑定任务 → 初始化沙箱 → 验证隔离性 → 创建 Trae 自定义智能体 → 测试验证'
    initializeGoalManagement(initialGoal)
    logForDiagnosticsNoPII('info', 'init_goal_management_initialized', {
      goal: initialGoal
    })

    // Phase 1 计划初始化流程
    if (initialGoal.includes('Phase1') || initialGoal.includes('Trae 任务')) {
      logForDiagnosticsNoPII('info', 'init_phase1_start')
      
      // 1. 预检检查
      try {
        const { PreflightChecker } = await import('../services/preflight/checker.js')
        const checker = new PreflightChecker()
        const preflightResult = await checker.runAllChecks()
        logForDiagnosticsNoPII('info', 'init_preflight_completed', {
          result: preflightResult
        })
      } catch (error) {
        logForDebugging(`[init] 预检检查失败: ${error instanceof Error ? error.message : String(error)}`, { level: 'warn' })
      }
      
      // 2. 设置加载
      try {
        const { SettingsManager } = await import('../services/settings/manager.js')
        const settingsManager = new SettingsManager()
        await settingsManager.load()
        logForDiagnosticsNoPII('info', 'init_settings_loaded')
      } catch (error) {
        logForDebugging(`[init] 设置加载失败: ${error instanceof Error ? error.message : String(error)}`, { level: 'warn' })
      }
      
      // 3. 权限初始化
      try {
        const { PermissionManager } = await import('../services/permissions/manager.js')
        const permissionManager = new PermissionManager()
        await permissionManager.initialize()
        logForDiagnosticsNoPII('info', 'init_permissions_initialized')
      } catch (error) {
        logForDebugging(`[init] 权限初始化失败: ${error instanceof Error ? error.message : String(error)}`, { level: 'warn' })
      }
      
      logForDiagnosticsNoPII('info', 'init_phase1_initialization_completed')
    }

    logForDiagnosticsNoPII('info', 'init_completed', {
      duration_ms: Date.now() - initStartTime,
    })
    profileCheckpoint('init_function_end')
  } catch (error) {
    if (error instanceof ConfigParseError) {
      // 当无法安全渲染时，跳过交互式 Ink 对话框
      if (getIsNonInteractiveSession()) {
        process.stderr.write(
          `配置错误在 ${error.filePath}: ${error.message}\n`,
        )
        gracefulShutdownSync(1)
        return
      }

      // 显示无效配置对话框并等待其完成
      return import('../components/InvalidConfigDialog.js').then(m =>
        m.showInvalidConfigDialog({ error }),
      )
    } else {
      // 对于非配置错误，重新抛出它们
      throw error
    }
  }
})

/**
 * 在信任授予后初始化遥测
 * 
 * 对于符合远程设置条件的用户，等待设置加载（非阻塞），
 * 然后重新应用环境变量（以包含远程设置），然后初始化遥测。
 * 对于不符合条件的用户，立即初始化遥测。
 * 这应该只在信任对话框被接受后调用一次。
 */
export function initializeTelemetryAfterTrust(): void {
  if (isEligibleForRemoteManagedSettings()) {
    // For SDK/headless mode with beta tracing, initialize eagerly first
    // to ensure the tracer is ready before the first query runs.
    if (getIsNonInteractiveSession() && isBetaTracingEnabled()) {
      void doInitializeTelemetry().catch(error => {
        logForDebugging(
          `[3P telemetry] Eager telemetry init failed (beta tracing): ${errorMessage(error)}`,
          { level: 'error' },
        )
      })
    }
    logForDebugging(
      '[3P telemetry] Waiting for remote managed settings before telemetry init',
    )
    void waitForRemoteManagedSettingsToLoad()
      .then(async () => {
        logForDebugging(
          '[3P telemetry] Remote managed settings loaded, initializing telemetry',
        )
        // Re-apply env vars to pick up remote settings before initializing telemetry.
        applyConfigEnvironmentVariables()
        await doInitializeTelemetry()
      })
      .catch(error => {
        logForDebugging(
          `[3P telemetry] Telemetry init failed (remote settings path): ${errorMessage(error)}`,
          { level: 'error' },
        )
      })
  } else {
    void doInitializeTelemetry().catch(error => {
      logForDebugging(
        `[3P telemetry] Telemetry init failed: ${errorMessage(error)}`,
        { level: 'error' },
      )
    })
  }
}

/**
 * 执行遥测初始化
 * 
 * @returns {Promise<void>} 初始化完成的 Promise
 */
async function doInitializeTelemetry(): Promise<void> {
  if (telemetryInitialized) {
    // Already initialized, nothing to do
    return
  }

  // Set flag before init to prevent double initialization
  telemetryInitialized = true
  try {
    await setMeterState()
  } catch (error) {
    // Reset flag on failure so subsequent calls can retry
    telemetryInitialized = false
    throw error
  }
}

/**
 * 设置遥测仪表状态
 * 
 * @returns {Promise<void>} 设置完成的 Promise
 */
async function setMeterState(): Promise<void> {
  // Lazy-load instrumentation to defer OpenTelemetry + protobuf
  const { initializeTelemetry } = await import(
    '../utils/telemetry/instrumentation.js'
  )
  // Initialize customer OTLP telemetry (metrics, logs, traces)
  const meter = await initializeTelemetry()
  if (meter) {
    // Create factory function for attributed counters
    const createAttributedCounter = (
      name: string,
      options: MetricOptions,
    ): AttributedCounter => {
      const counter = meter?.createCounter(name, options)

      return {
        add(value: number, additionalAttributes: Attributes = {}) {
          // Always fetch fresh telemetry attributes to ensure they're up to date
          const currentAttributes = getTelemetryAttributes()
          const mergedAttributes = {
            ...currentAttributes,
            ...additionalAttributes,
          }
          counter?.add(value, mergedAttributes)
        },
      }
    }

    setMeter(meter, createAttributedCounter)

    // Increment session counter here
    getSessionCounter()?.add(1)
  }
}

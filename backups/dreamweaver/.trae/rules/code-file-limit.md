# 代码文件行数限制规则 (Code File Line Limit Rule)

> **⚠️ 全局生效**: 此规则适用于所有代码文件，所有 Agent 必须无条件遵守。

## 规则说明

每个代码文件不能超过 **500 行**（不包括空行和纯注释行）。

## 行数计算方式

### 计入行数
- 实际代码行（包括逻辑代码、函数定义、类定义等）
- 包含代码的注释行（如 `const x = 1; // 注释`）

### 不计入行数
- 纯空行
- 纯注释行（以 `//` 或 `/* */` 开头且不含代码的行）
- 文件头版权注释块

## 检查命令

```bash
# 统计实际代码行数（排除空行和纯注释行）
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.java" -o -name "*.go" -o -name "*.rs" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.git/*" \
  -exec wc -l {} + | sort -n
```

## 超限处理方案

当文件即将超过 500 行时，按以下优先级处理：

### 方案 1: 功能拆分 (推荐)
将大文件按功能拆分为多个小文件：
```
# 原文件
utils.ts (520行)

# 拆分后
utils/index.ts          (导出聚合)
utils/string-helpers.ts (150行)
utils/date-helpers.ts   (120行)
utils/validators.ts     (180行)
utils/formatters.ts     (90行)
```

### 方案 2: 提取组件/模块
将可复用逻辑提取为独立组件或模块：
```
# 原文件
UserManagement.tsx (550行)

# 拆分后
UserManagement/
├── index.tsx           (主组件，80行)
├── UserList.tsx        (用户列表，150行)
├── UserForm.tsx        (用户表单，180行)
├── UserFilters.tsx     (筛选组件，100行)
└── hooks/
    └── useUserData.ts  (数据逻辑，90行)
```

### 方案 3: 提取工具函数
将通用工具函数提取到 `utils/` 或 `helpers/` 目录：
```
# 原文件
api-client.ts (530行)

# 拆分后
api/
├── client.ts           (核心客户端，200行)
├── interceptors.ts     (拦截器，150行)
├── error-handlers.ts   (错误处理，120行)
└── types.ts            (类型定义，80行)
```

## 强制检查清单

编写代码时必须确认：
- [ ] 当前文件行数未超过 500 行
- [ ] 如接近限制，已规划拆分方案
- [ ] 拆分后的文件职责单一、内聚性高
- [ ] 拆分后的文件命名清晰、易于理解

## 禁止事项

- **禁止**: 任何代码文件超过 500 行
- **禁止**: 为了规避限制而删除必要注释
- **禁止**: 将多行代码压缩为一行
- **禁止**: 无理由拒绝拆分文件

## 例外情况

以下情况可申请例外（需记录原因）：
1. **自动生成的代码文件**（如 protobuf 生成、API 客户端生成）
2. **配置文件**（如大型路由配置、常量定义文件）
3. **第三方库修改**（需注明来源和修改内容）

例外申请格式：
```
<!-- FILE_EXCEPTION: 文件名 -->
<!-- REASON: 申请原因 -->
<!-- APPROVED_BY: 审批人 -->
<!-- DATE: 审批日期 -->
```

## 自动化集成

此规则与以下流程集成：
1. **代码审查** - 自动检查文件行数
2. **CI/CD** - 在构建前执行行数检查
3. **Pre-commit Hook** - 提交前警告超限文件

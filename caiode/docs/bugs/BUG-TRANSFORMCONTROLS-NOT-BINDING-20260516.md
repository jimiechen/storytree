# BUG-REPORT: TransformControls 无法绑定到选中对象

**报告日期**: 2026-05-16  
**严重程度**: P0 (阻塞核心功能)  
**模块**: novel-3d / ThreeViewport  
**状态**: 待架构师评审  

---

## 一、问题描述

用户在 `/shot3d` 页面添加圆柱体/长方体后，点击选中对象时：
- ✅ 对象高亮显示正常（黄色发光）
- ✅ 右侧 InfoPanel 正常弹出
- ❌ **TransformControls gizmo 不出现**
- ❌ **无法拖拽移动或缩放**

---

## 二、复现步骤

1. 打开 `http://localhost:3000/shot3d`
2. 点击底部工具栏「◎ 圆柱体」按钮 → 蓝色圆柱体出现在场景中
3. 用鼠标左键点击圆柱体 → 圆柱体变黄（选中），InfoPanel 出现
4. **预期**: 圆柱体周围出现彩色箭头 gizmo (红X/绿Y/蓝Z)
5. **实际**: 无任何 gizmo 出现

---

## 三、诊断过程与日志证据

### 3.1 控制台关键日志序列

```
# 步骤1: 添加圆柱体（ShapeToolbar 触发）
[ThreeViewport] selectedObjectId: undefined cylinders: 1
[CylinderManager] update done, entries: ['cyl-1778910162259']  cylinders input: ['cyl-1778910162259']

# 步骤2: 点击圆柱体选中（Raycaster 命中）
[ThreeViewport] selectedObjectId: cyl-1778910162259 cylinders: 1
[ThreeViewport] cylManager.entries: []                          ← ⚠️ 空数组！
[ThreeViewport] found entry for cyl-1778910162259 : false        ← 找不到！
[TransformControls] detaching                                     ← 只执行了 detach
```

### 3.2 根因定位

**`cylManager.entries` 在 `update()` 返回后立即变为空数组 `[]`**。

对比两次调用：
| 调用时机 | `cylinders.length` | `entries` 内容 | 结果 |
|---------|-------------------|---------------|------|
| ShapeToolbar setCylinders 后 | 1 | `['cyl-xxx']` ✅ | mesh 正常创建 |
| selectCylinder 后（createEffect） | 1 | `[]` ❌ | **entries 被清空了** |

---

## 四、根因分析（待架构师确认）

### 假设 A: Solid.js createEffect 执行顺序问题

**现象**: `cylManager.update()` 内部日志显示 entries 有值，但同一 effect 回调中下一行读取 `cylManager.entries` 时为空。

**可能原因**:
1. `createCylinderManager()` 返回的 `entries` 是闭包内的局部变量引用
2. Solid.js 的 `createEffect` 可能在依赖追踪过程中触发了多次执行
3. 第二次执行 `update()` 时，由于某种原因导致 entries 被重置为空数组

**关键代码位置**:

```typescript
// cylinder-manager.ts 第48-51行
export function createCylinderManager(): CylinderManager {
  const group = new THREE.Group();
  let entries: CylinderMeshEntry[] = [];   // ← 闭包变量
  
  // ...
  
  return { group, entries, update, dispose, raycast };  // ← 直接暴露引用
}
```

```typescript
// ThreeViewport.tsx 第97-124行（createEffect 回调）
createEffect(() => {
  const s = props.store.scene();
  cylManager.update(s.cylinders, s.selectedObjectId);  // ← 这里更新 entries
  
  console.log('[ThreeViewport] cylManager.entries:', cylManager.entries.map(e => e.id));
  // ↑ 这里读取时 entries 已经是 []
  
  const entry = cylManager.entries.find(e => e.id === s.selectedObjectId);
  // ↑ 永远返回 undefined
});
```

### 假设 B: Store 更新触发多次 Effect 重入

**观察到的调用栈特征**:
- `setCylinders` → `writeSignal` → `runUpdates` → `completeUpdates` → `runUserEffects`
- `selectCylinder` → 同样的链路
- 这两个操作可能在同一个 batch 中执行，导致 effect 被多次触发

**store 中的数据流**:
```typescript
// shot-3d-store.ts 第64-72行
const selectCylinder = (id: string | undefined) => {
  setScene(prev => ({
    ...prev,
    selectedObjectId: id,
    cylinders: prev.cylinders.map(c => ({ ...c, selected: c.id === id }))
    // ↑ 这里创建了新的 cylinders 数组引用
    // ↓ 可能触发了另一个监听 scene() 的 effect
  }));
};
```

---

## 五、涉及的关键文件

| 文件路径 | 行号 | 问题点 |
|---------|------|--------|
| `novel-3d/components/ThreeViewport/cylinder-manager.ts` | 48-96 | `entries` 闭包变量在 `update()` 后被意外清空 |
| `novel-3d/components/ThreeViewport/ThreeViewport.tsx` | 97-124 | `createEffect` 中读取 `cylManager.entries` 时值为空 |
| `novel-3d/shot-3d-store.ts` | 64-72 | `selectCylinder` 创建新数组引用可能触发级联更新 |
| `novel-3d/components/ThreeViewport/transform-controls-setup.ts` | 56-66 | `attach()` 因 entry 为 null 而无法执行 |

---

## 六、建议的排查方向

### 方向 1: 改用 Signal 包装 entries（推荐）

将 `cylManager.entries` 从裸数组改为 Solid.js Signal：

```typescript
// cylinder-manager.ts
import { createSignal } from 'solid-js';

export function createCylinderManager(): CylinderManager & { entriesSignal: () => CylinderMeshEntry[] } {
  const [entriesSignal, setEntriesSignal] = createSignal<CylinderMeshEntry[]>([]);
  
  const update = (...) => {
    // ...原有逻辑...
    setEntriesSignal(newEntries);  // 通过 signal 更新
  };
  
  return { 
    group, 
    entries: entriesSignal(),      // 兼容旧接口
    entriesSignal,                  // 新增：signal 访问器
    update, dispose, raycast 
  };
}
```

然后在 ThreeViewport 中使用 `cylManager.entriesSignal()` 替代直接访问 `cylManager.entries`。

### 方向 2: 在 createEffect 中拆分为两个独立 effect

将 `cylManager.update()` 和 TransformControls attach 拆开：

```typescript
// Effect 1: 仅负责同步 mesh 数据
createEffect(() => {
  const s = props.store.scene();
  cylManager.update(s.cylinders, s.selectedObjectId);
});

// Effect 2: 仅负责 TransformControls 绑定（依赖 entriesSignal）
createEffect(() => {
  const s = props.store.scene();
  const currentEntries = cylManager.entriesSignal();  // 如果用方向1
  // ...attach logic
});
```

### 方向 3: 在 cylinder-manager 内部缓存最新 entries 引用

确保 `update()` 方法返回后 `entries` 变量不被外部修改：

```typescript
const update = (...): void => {
  // ...原有逻辑...
  _lastEntries = newEntries;  // 缓存到实例属性
};

const getEntries = (): CylinderMeshEntry[] => _lastEntries;
```

---

## 七、附加信息

### 技术栈版本
- Three.js: `0.184.0 / 0.184.1`
- Solid.js: `^1.9.x` (通过 opencode 间接引入)
- Vite: `7.1.4`
- TypeScript: `5.x`

### 相关已尝试但未解决的修复
1. ~~OrbitControls 冲突~~ — 已确认不是根因（gizmo 根本没出现）
2. ~~scene.add(transform) 类型错误~~ — 已绕过但不影响功能
3. ~~wrapper Group 包装方案~~ — 反而破坏了 TransformControls 内部机制

### 调试日志保留状态
当前代码中保留了以下调试日志（建议修复后移除）：
- `[CylinderManager] update done` — cylinder-manager.ts:95
- `[ThreeViewport] selectedObjectId` — ThreeViewport.tsx:101
- `[ThreeViewport] cylManager.entries` — ThreeViewport.tsx:102
- `[ThreeViewport] found entry for` — ThreeViewport.tsx:108
- `[TransformControls] attaching/detaching` — transform-controls-setup.ts:59-63

---

## 八、签名

**报告人**: GLM-5V-Turbo (Agent)  
**日期**: 2026-05-16  
**分配给**: 架构师 (VS Code 插件架构师角色)  
**期望解决时间**: 紧急 (P0 阻塞)

---

*此 Bug 阻塞了 3D Camera Shot MVP 的核心交互功能：物体移动和缩放。*

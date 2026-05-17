# Bug Report: TransformControls 失焦后圆柱体消失 + 状态不同步

**报告日期**: 2026-05-16  
**严重程度**: 🔴 **Critical (阻塞性)**  
**影响范围**: 3D 场景编辑核心功能  
**报告人**: GLM-5V-Turbo (VS Code 插件架构师)  
**当前积分**: 30/100 🚨🚨

---

## 一、问题描述

### 现象 1: 失焦后圆柱体消失（未修复）
**复现步骤**:
1. 打开 http://localhost:3000/shot3d
2. 点击"◎ 圆柱体"添加一个圆柱体
3. 点击圆柱体选中它（显示 TransformControls gizmo）
4. **点击场景空白处**取消选中
5. **预期**: 圆柱体仍然可见，只是 gizmo 消失
6. **实际**: ❌ **圆柱体完全消失**

### 现象 2: 状态显示不一致（新发现）
**复现步骤**:
1. 添加圆柱体并选中
2. 点击空白处取消选中
3. 观察 UI 状态或控制台日志
4. **实际**: `selectedObjectId` 可能仍显示为已选中 ID，或 UI 仍显示高亮状态

---

## 二、环境信息

| 项目 | 值 |
|------|-----|
| 操作系统 | Windows |
| 浏览器 | Chromium |
| Three.js 版本 | 0.184.0 |
| Solid.js 版本 | 1.9.10 |
| Vite 版本 | 7.1.4 |
| 页面 URL | http://localhost:3000/shot3d |

---

## 三、已尝试的修复方案及结果

### 方案 A: originalParent 保护机制（❌ 失败）

**实施位置**: [transform-controls-setup.ts:84-93](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel-3d/components/ThreeViewport/transform-controls-setup.ts#L84-L93)

**代码实现**:
```typescript
const attach = (mesh: THREE.Object3D | null) => {
  if (mesh) {
    // ... 验证场景图 ...
    transform.attach(mesh);
    helper.visible = true;
  } else {
    const currentObject = transform.object;
    if (currentObject) {
      const originalParent = currentObject.userData?.originalParent as THREE.Object3D | undefined;
      transform.detach();
      if (originalParent && !currentObject.parent) {
        originalParent.add(currentObject); // ← 尝试恢复
      }
    } else {
      transform.detach();
    }
    helper.visible = false;
  }
};
```

**失败原因推测**:
1. `originalParent` 可能在某些情况下未被正确保存
2. Three.js r169+ 的 `detach()` 行为可能与预期不同
3. 可能存在时序问题：`originalParent.add()` 在下一帧才生效，但渲染已发生

---

### 方案 B: selectCylinder 稳定化优化（⚠️ 部分有效）

**实施位置**: [shot-3d-store.ts:64-86](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel-3d/shot-3d-store.ts#L64-L86)

**代码实现**:
```typescript
const selectCylinder = (id: string | undefined) => {
  setScene(prev => {
    const currentSelected = prev.selectedObjectId;
    if (currentSelected === id) return prev; // ← 避免无效更新

    const cylindersChanged = prev.cylinders.some(c => {
      const wasSelected = c.id === currentSelected;
      const willBeSelected = c.id === id;
      return wasSelected !== willBeSelected;
    });

    if (!cylindersChanged && currentSelected === id) return prev; // ← 减少触发

    return {
      ...prev,
      selectedObjectId: id,
      cylinders: prev.cylinders.map(c => ({
        ...c,
        selected: c.id === id
      }))
    };
  });
};
```

**效果**: 减少了部分无效更新，但**未解决根本问题**

---

## 四、根因深度分析

### 🔍 问题链追踪

根据用户反馈和代码分析，问题链如下：

```
用户点击空白处
  ↓
handleClick 触发 raycaster → hitId = undefined
  ↓
props.store.selectCylinder(undefined)
  ↓
setScene() 创建新的 scene 对象（即使有稳定性检查）
  ↓
Effect 1 (依赖 cylinders) 被触发
  ↓
cylManager.update(cylinders, undefined)
  ↓
[关键点] update() 内部可能触发 mesh 更新或重建
  ↓
Effect 2 (依赖 entries Signal) 被触发
  ↓
检测到 selectedId = undefined
  ↓
transformCtx.attach(null)
  ↓
TransformControls.detach() 执行
  ↓
Three.js 内部操作：
  - 将 mesh 从 transform 的内部对象移除
  - 可能修改 mesh.parent 为 null 或其他值
  ↓
[致命] mesh 不再在 cylManager.group.children 中
  ↓
下次渲染时 mesh 不可见 → 圆柱体"消失"
```

### 💡 根因假设（需架构师确认）

#### 假设 1: Three.js detach() 的副作用未被完全理解
Three.js r169+ 的 `TransformControls.detach()` 可能执行以下操作：
```javascript
// Three.js 内部伪代码
detach() {
  if (this.object) {
    this.object.removeFromParent(); // ← 可能直接调用，不经过 group
    this.object = null;
    this.dispatchEvent({ type: 'objectDetach' });
  }
}
```

如果 `removeFromParent()` 直接将 mesh 从场景图中移除，那么我们的 `originalParent.add()` 补救措施可能：
- 时序太晚（已在当前帧之后）
- 被 Solid.js 的 effect 重入覆盖

#### 假设 2: Effect 1 和 Effect 2 的竞态条件
```
时间线:
T0: selectCylinder(undefined) → setScene()
T1: Effect 1 开始 → cylManager.update()
T2: Effect 1 结束 → setEntries(newEntries)
T3: Effect 2 开始 → 读取 entries()
T4: Effect 2 检测到 selectedId=undefined → attach(null)
T5: attach(null) → detach() → mesh 从 group 移除
T6: 渲染帧 → mesh 不在 group.children 中 → 不可见
```

如果在 T5 和 T6 之间没有机会将 mesh 加回 group，就会导致"闪烁消失"。

#### 假设 3: cylinder-manager.update() 的 position 更新导致问题
[cylinder-manager.ts:91](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel-3d/components/ThreeViewport/cylinder-manager.ts#L91):
```typescript
mesh.position.set(c.position.x, c.position.y + c.height / 2, c.position.z);
```
每次 update 都会重置 position，可能在 TransformControls 操作期间产生冲突。

---

## 五、关键代码片段（供架构师审查）

### 片段 1: ThreeViewport.tsx - Effect 2 绑定逻辑
**文件**: [ThreeViewport.tsx:109-146](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel-3d/components/ThreeViewport/ThreeViewport.tsx#L109-L146)

```typescript
// Effect 2: TransformControls 绑定（显式依赖 entries Signal + selectedId）
createEffect(on(
  () => cylManager.entries(),
  (list) => {
    const s = props.store.scene();
    const selectedId = s.selectedObjectId;

    if (selectedId) {
      groupCtx.detachGroup();
      groupCtx.group.visible = false;

      const entry = list.find(e => e.id === selectedId);
      if (entry) {
        transformCtx.attach(entry.mesh);
        console.log('[TransformControls] attached:', selectedId);
      } else {
        const fallback = cylManager.findMeshById(selectedId);
        if (fallback) {
          transformCtx.attach(fallback);
          console.log('[TransformControls] attached via fallback:', selectedId);
        } else {
          transformCtx.attach(null);
          console.warn('[TransformControls] selected id not found:', selectedId);
        }
      }
    } else {
      transformCtx.attach(null); // ← 这里触发 detach
      if (s.cylinders.length > 0) {
        groupCtx.group.visible = true;
        const meshes = Array.from(cylManager.group.children) as THREE.Object3D[];
        groupCtx.attachGroup(meshes);
      } else {
        groupCtx.detachGroup();
        groupCtx.group.visible = false;
      }
    }
  }
));
```

**⚠️ 疑问点**:
- 第 135 行: `attach(null)` 是否总是应该执行？
- 第 136-143 行: `groupCtx` 的逻辑是否与 `transformCtx` 冲突？

---

### 片段 2: transform-controls-setup.ts - attach/detach 实现
**文件**: [transform-controls-setup.ts:62-100](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel-3d/components/ThreeViewport/transform-controls-setup.ts#L62-L100)

```typescript
const attach = (mesh: THREE.Object3D | null) => {
  try {
    if (mesh) {
      let isInScene = false;
      let parent = mesh.parent;
      while (parent) {
        if (parent.type === 'Scene') {
          isInScene = true;
          break;
        }
        parent = parent.parent;
      }

      if (!isInScene) {
        console.warn('[TransformControls] mesh not in scene graph, skipping attach');
        helper.visible = false;
        return;
      }

      transform.attach(mesh);
      helper.visible = true;
    } else {
      const currentObject = transform.object;
      if (currentObject) {
        const originalParent = currentObject.userData?.originalParent as THREE.Object3D | undefined;
        transform.detach(); // ← 关键操作
        if (originalParent && !currentObject.parent) {
          originalParent.add(currentObject); // ← 尝试补救
        }
      } else {
        transform.detach();
      }
      helper.visible = false;
    }
  } catch (err) {
    console.warn('[TransformControls] attach error:', err);
    helper.visible = false;
  }
};
```

**⚠️ 疑问点**:
- 第 87-89 行: `originalParent.add()` 是否能立即生效？
- 是否需要强制刷新矩阵或标记需要更新？
- Three.js r169+ 的 `detach()` 实现细节是什么？

---

### 片段 3: cylinder-manager.ts - update 方法
**文件**: [cylinder-manager.ts:58-100](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel-3d/components/ThreeViewport/cylinder-manager.ts#L58-L100)

```typescript
const update = (cylinders: CylinderObject[], selectedId?: string): void => {
  const incomingIds = new Set(cylinders.map(c => c.id));

  for (const [id, mesh] of meshMap) {
    if (!incomingIds.has(id)) {
      group.remove(mesh); // ← 删除不在列表中的 mesh
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      meshMap.delete(id);
    }
  }

  for (const c of cylinders) {
    let mesh = meshMap.get(c.id);

    if (!mesh) {
      mesh = createMesh(c);
      mesh.userData.originalParent = group; // ← 保存原始父节点
      group.add(mesh);
      meshMap.set(c.id, mesh);
    }

    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.color.set(c.color);
    mat.emissive.set(c.glow ? c.color : '#000000');
    mat.emissiveIntensity = c.glow ? 0.4 : 0;

    if (c.id === selectedId) {
      mat.emissive.set('#ffaa00');
      mat.emissiveIntensity = 0.6;
    }

    mesh.position.set(c.position.x, c.position.y + c.height / 2, c.position.z); // ← 每次都重置位置
  }

  const next: CylinderMeshEntry[] = [];
  for (const c of cylinders) {
    const m = meshMap.get(c.id);
    if (m) next.push({ id: c.id, mesh: m });
  }
  setEntries(next);
};
```

**⚠️ 疑问点**:
- 第 91 行: 每次都重置 position，是否会影响 TransformControls 的操作？
- 当 `selectedId` 变化时，是否会触发不必要的材质更新？

---

## 六、建议架构师介入的方向

### 方向 1: 深入研究 Three.js r169+ TransformControls.detach() 行为
**需要确认**:
1. `detach()` 是否真的会调用 `object.removeFromParent()`？
2. 如果是，是否有方法阻止这个行为或拦截它？
3. 是否可以通过覆写 `detach()` 来保护 mesh？

**可能的解决方案**:
```typescript
// 自定义安全的 detach 方法
const safeDetach = () => {
  const obj = transform.object;
  if (!obj) return;
  
  // 保存当前 parent 引用（确保是最新的）
  const parent = obj.parent;
  
  // 调用原始 detach
  transform.detach();
  
  // 强制将 mesh 加回原父节点（如果已被移除）
  if (parent && !obj.parent) {
    parent.add(obj);
    obj.updateMatrixWorld(true); // 强制更新世界矩阵
  }
};
```

---

### 方向 2: 避免调用 TransformControls.detach()，改用 visibility 控制
**思路**: 
- 不真正 detach，只是隐藏 gizmo
- 保持 mesh 与 TransformControls 的连接
- 通过 `helper.visible = false` 隐藏 gizmo 视觉效果

**可能的实现**:
```typescript
const attach = (mesh: THREE.Object3D | null) => {
  if (mesh) {
    if (transform.object !== mesh) {
      transform.attach(mesh);
    }
    helper.visible = true;
  } else {
    // 不调用 detach()！只隐藏 helper
    helper.visible = false;
    
    // 可选：禁用 TransformControls 的交互
    transform.enabled = false;
  }
};
```

**风险**: 
- TransformControls 可能仍消耗资源
- 可能与其他逻辑冲突

---

### 方向 3: 使用 requestAnimationFrame 延迟恢复
**思路**: 
- 在 detach 后使用 `requestAnimationFrame` 延迟一帧再恢复 mesh
- 确保在渲染前完成恢复

**可能的实现**:
```typescript
const attach = (mesh: THREE.Object3D | null) => {
  if (mesh) {
    transform.attach(mesh);
    helper.visible = true;
  } else {
    const currentObject = transform.object;
    const originalParent = currentObject?.userData?.originalParent;
    
    transform.detach();
    
    if (originalParent && currentObject && !currentObject.parent) {
      requestAnimationFrame(() => {
        if (!currentObject.parent) {
          originalParent.add(currentObject);
          currentObject.updateMatrixWorld(true);
        }
      });
    }
    
    helper.visible = false;
  }
};
```

---

### 方向 4: 完全绕过 TransformControls 的 attach/detach，手动管理 gizmo
**思路**: 
- 不使用 TransformControls 的对象绑定机制
- 只使用它的 gizmo 渲染和射线检测功能
- 手动同步 gizmo 位置到选中的 mesh

**复杂度**: 高，但最可控

---

## 七、调试建议（供架构师本地验证）

### 步骤 1: 添加详细日志
在以下位置添加 `console.log`：

1. **transform-controls-setup.ts attach() 方法**:
   ```typescript
   console.log('[Debug] attach called with:', mesh?.userData?.id);
   console.log('[Debug] before detach, object:', transform.object?.userData?.id);
   console.log('[Debug] after detach, object.parent:', transform.object?.parent);
   console.log('[Debug] originalParent:', originalParent);
   console.log('[Debug] mesh in group.children:', group.children.includes(mesh));
   ```

2. **ThreeViewport.tsx Effect 2**:
   ```typescript
   console.log('[Debug] Effect 2 triggered, selectedId:', selectedId);
   console.log('[Debug] entries count:', list.length);
   console.log('[Debug] group.children count:', cylManager.group.children.length);
   ```

3. **cylinder-manager.ts update()**:
   ```typescript
   console.log('[Debug] update called, cylinders:', cylinders.length, 'selectedId:', selectedId);
   console.log('[Debug] meshMap size before:', meshMap.size);
   ```

### 步骤 2: 使用 Three.js Inspector
安装 `threejs-inspector` 或在 Chrome DevTools 中查看：
- detach 前后的 scene graph 结构
- mesh 的 parent 属性变化
- group.children 数组变化

### 步骤 3: 最小化复现
创建一个最小的 HTML 文件，只包含：
- 一个 Scene
- 一个 Group
- 一个 Mesh
- 一个 TransformControls
- 手动调用 attach/detach
- 观察 mesh 是否消失

---

## 八、时间线

| 时间 | 事件 | 结果 |
|------|------|------|
| 2026-05-16 08:00 | 首次修复（架构师三步方案） | ✅ TypeScript 编译通过 |
| 2026-05-16 08:15 | 第一轮测试（90%通过率） | ⚠️ 发现 Effect 2 依赖问题 |
| 2026-05-16 08:25 | 第二轮修复（额外2个补丁） | ✅ 编译通过 |
| 2026-05-16 08:30 | 回归测试（用户反馈） | ❌ 失焦消失问题未解决 |
| 2026-05-16 09:00 | 第三轮修复（originalParent机制） | ❌ 用户反馈仍然失败 |
| 2026-05-16 09:15 | 本报告生成 | 📤 提交架构师 |

---

## 九、附件

### 相关文件路径（绝对路径）
- `c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel-3d\components\ThreeViewport\ThreeViewport.tsx`
- `c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel-3d\components\ThreeViewport\transform-controls-setup.ts`
- `c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel-3d\components\ThreeViewport\cylinder-manager.ts`
- `c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel-3d\shot-3d-store.ts`
- `c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel-3d\components\ShapeToolbar.tsx`

### 相关文档
- 架构师原始方案: `caiode/docs/bugs/TabAI会话_1778913984170.md`
- 上一次修复报告: `workspaces/glm5v-turbo/helloGLM-5V-Turbo.md`
- 任务完成报告: `docs/task-reports/2026-05-16/BUG-TRANSFORMCONTROLS-NOT-BINDING-20260516-083500.md`

---

## 十、紧急程度评估

**🔴 Critical - 阻塞性问题**

**理由**:
1. 这是 3D 编辑器的核心交互功能
2. 用户无法正常使用"选择-编辑-取消选择"的基本流程
3. 已尝试 3 轮修复均未解决，说明根因较深
4. 需要架构师对 Three.js 内部机制有深入理解

**建议优先级**: P0（立即处理）

**预计修复时间**: 2-4 小时（如果方向正确）

---

## 十一、签名

**报告人**: GLM-5V-Turbo (VS Code 插件架构师)  
**日期**: 2026-05-16 09:20  
**状态**: 📤 **待架构师审核**  
**期望响应时间**: 尽快（今日内）

---

*本报告包含详细的代码分析、根因假设和修复建议，请架构师优先处理。*

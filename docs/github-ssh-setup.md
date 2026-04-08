# GitHub SSH Key 配置指南

> **目的**: 配置 SSH Key 以便将项目推送到 `https://github.com/jimiechen/storytree.git`

## 快速配置步骤

### 1. 检查是否已有 SSH Key

```bash
ls -la ~/.ssh/*.pub
```

如果有文件输出（如 `id_ed25519.pub` 或 `id_rsa.pub`），可跳到**第 3 步**直接使用现有 Key。

### 2. 生成新的 SSH Key（如果没有）

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- 按回车接受默认路径 `~/.ssh/id_ed25519`
- 设置密码短语（可直接回车留空）

### 3. 复制公钥内容

```bash
cat ~/.ssh/id_ed25519.pub
```

**复制输出的完整内容**（以 `ssh-ed25519` 开头的一整行）

### 4. 添加到 GitHub

1. 打开 https://github.com/settings/keys
2. 点击 **"New SSH key"**
3. Title 填：`storytree2-mac`（或任意名称）
4. Key type 选择：`Authentication Key`
5. 粘贴刚才复制的公钥内容
6. 点击 **"Add SSH key"**

### 5. 测试连接

```bash
ssh -T git@github.com
```

成功会显示：
```
Hi jimiechen! You've successfully authenticated, but GitHub does not provide shell access.
```

### 6. 更新远程仓库地址为 SSH 格式

```bash
cd /Users/mac/StudioProjects/storytree2
git remote set-url github git@github.com:jimiechen/storytree.git
```

### 7. 推送代码

```bash
git push github --all
```

---

## 常见问题

### Q: 提示 "Permission denied (publickey)"
**A**: 公钥未正确添加到 GitHub，或私钥权限不对：
```bash
chmod 600 ~/.ssh/id_ed25519
```

### Q: HTTPS 可以用但 SSH 不行
**A**: 检查 SSH agent 是否运行：
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Q: 公司网络/代理导致连接失败
**A**: 如果需要通过代理连接 GitHub，编辑 `~/.ssh/config`：

```
Host github.com
    HostName github.com
    User git
    Port 22
    ProxyCommand nc -X 5 -x 127.0.0.1:7890 %h %p
```

（将 `7890` 替换为你的代理端口）

---

## 当前状态

| 项目 | 值 |
|-----|-----|
| 项目路径 | `/Users/mac/StudioProjects/storytree2` |
| 目标仓库 | `git@github.com:jimiechen/storytree.git` |
| 远程别名 | `github` |
| 当前远程 | 已添加，等待推送 |

---

**配置完成后告诉我，我会立即执行推送命令！**

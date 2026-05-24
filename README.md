# ⚡ AI Skill Hub Manager (v1.0.0 Release)

> 🚀 **零门槛、零依赖的 Windows 原生双端 AI 协同规则与本地技能库可视化管理器。**

**AI Skill Hub Manager** 是一款专为 AI 时代协同开发量身打造的 Windows 桌面客户端。本系统能够跨项目、跨框架高效管理、编辑您的 AI 技能约束文件（如 `.md` 开发规约与红线准则），并支持一键将选定的技能一键同步分发装载到您指定的任意开发项目中，自动在目标项目内构建高效的哈希校验与 `AGENTS.md` 索引目录。

---

## ✨ 核心特性

- 📦 **100% 独立单文件运行 (.exe)**：
  - 彻底摆脱“本地 Web 服务监听 + 浏览器套壳”的易冲突架构。基于 `pywebview` 引擎直读本地临时静态包，不监听任何端口，零网络依赖。
  - 彻底去除 CMD 黑窗口闪烁，双击即可秒级拉起原生清爽窗口。
- ⚙️ **全新升级的“自适应路径系统” (v1.0.0 版)**：
  - **路径完全去硬编码**：首次启动程序会自动创建本地 `skills/` 全局技能库文件夹。
  - **原生文件夹路径管理器**：支持在 UI 中直观地一键切换、选取自定义全局技能库（D 盘、C 盘、用户文档目录等），彻底适配各种系统差异与网络分发。
- 📂 **智能项目选取与状态哈希审计**：
  - 点击“关联开发项目”一键唤起 Windows 标准原生文件夹选择框，0 键盘输入，极致防错。
  - 精准进行项目备份与全局库文件哈希审计，智能呈现状态图标：
    - 🟢 **已同步 (Synced)**：项目端规约与全局库 MD5 校验绝对匹配。
    - 🟡 **有更新 (Out of sync)**：检测到全局技能指南被更新，提示一键物理分发同步。
    - ⚪ **未装载 (Unloaded)**：项目目录中暂无此技能规约。
- 📝 **内置等宽高级 Markdown 原生模态编辑器**：
  - 点击“编辑技能”直接唤起自带编辑框，模态置顶，光标秒级自动聚焦，支持实时渲染预览。
- 🎨 **大厂级 Premium 极客微动交互**：
  - stripe 风格双行数据看板、iOS 自适应滑块、自适应弹性伸缩高度的卡片排版。
  - 鼠标悬浮项目及卡片时，触发科技感动态呼吸边框微光特效（Border Glow Effect）。

---

## 📁 目录结构

```text
d:\DevApps\skill_store\
├── main.py              # pywebview 后端逻辑与 API 桥接层
├── static/              # 前端 SPA (明亮模式与 Glassmorphism 磨砂设计)
│   ├── index.html       # SPA 骨架模板
│   ├── index.css        # Premium 精致样式设计系统
│   └── app.js           # 前端数据交互与 toast 系统
├── config.json          # 本地自适应动态配置库 (自动生成，git 已忽略)
├── .gitignore           # 科学合理的 Git 过滤配置
└── README.md            # 项目说明文档
```

---

## 🛠️ 本地编译与打包

如果您想自行修改代码并进行二次编译，请按照如下步骤操作：

### 1. 环境准备
确保您的 Windows 系统已安装 Python 3.10+ 环境，并安装以下第三方依赖：
```bash
pip install pywebview pyinstaller
```

### 2. 开发者模式运行
在代码所在目录下运行：
```bash
python main.py
```

### 3. 一键编译打包 Standalone EXE
使用 PyInstaller 将所有前端资产及依赖完整压缩封装为一个独立的 EXE 运行包：
```bash
pyinstaller --noconsole --onefile --clean --add-data "static;static" main.py
```
编译完成后，可在 `dist/` 目录下找到生成的 `main.exe`，重命名为 `AI_Skill_Hub_Manager.exe` 即可发给团队的其他开发人员直接双击运行！

---

## 🚀 关于 1.0 正式版 GitHub 托管建议

为了保证代码仓库的极致干净与规范，我们已配置了完善的 `.gitignore` 过滤机制：
1. **源码管理**：代码仓库仅追踪 `main.py`、`static/` 文件夹及本说明文件。
2. **本地配置过滤**：用户的 `config.json` 与 `projects.json` 已自动过滤，确保不会将敏感路径或个人开发目录提交至云端。
3. **打包文件发布**：大型二进制编译包 `AI_Skill_Hub_Manager.exe` 已经过滤，**建议将其上传至您 GitHub 仓库的 `Releases`（版本发布）中作为附件资产**，方便用户下载，这符合开源界最正规的软件发布流程！

---

*⚡ Power by Advanced Agentic Coding - Antigravity.*

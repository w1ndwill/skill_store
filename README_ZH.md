# AI Skill Hub Manager v2.0

一款 Windows 桌面工具，用于统一管理 AI 开发规范。编写好开发规约后，一键同步到指定项目，以便 Cursor、Copilot、Windsurf、Claude 等 AI 工具自动读取。

## 核心功能

- **统一技能库** — 将编码规范、设计原则、质量红线等编写成 Markdown 文件，并在应用内集中管理。
- **一键同步项目** — 选择项目目录并勾选所需技能，自动同步到项目的 `.agent/skills/` 路径，并生成 `AGENTS.md` 索引文件。
- **状态追踪** — 基于 MD5 值校验，自动显示技能文件在项目中的同步状态（已同步、有更新、待移除）。
- **AI 辅助生成** — 支持对接 LLM（如 DeepSeek）进行联网搜索并直接生成技能文件，支持多会话历史记录。
- **纯本地运行** — 使用系统原生 WebView 渲染，不占用网络端口，不启动本地 Web 服务，内置 Lucide 图标和 Marked 解析器。
- **深色模式** — 界面支持浅色与深色主题切换。

## 快速开始

在 [Releases](https://github.com/w1ndwill/skill_store/releases) 页面下载 `AI_Skill_Hub_Manager.exe` 即可直接运行，无需安装。

首次启动时，程序会在同级目录下自动创建 `skills/` 文件夹。将你的 `.md` 规范文件放入该文件夹，或直接在应用内新建即可。

## 从源码运行

```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
pip install pywebview ddgs requests
python main.py
```

使用 PyInstaller 打包成单文件 exe：

```bash
pip install pyinstaller
pyinstaller AI_Skill_Hub_Manager.spec
```

## 技术栈

- **后端**：Python + `pywebview`（使用系统原生 WebView2 内核）
- **前端**：HTML5, CSS3, JavaScript
- **AI 与搜索**：DeepSeek API + DuckDuckGo Search

## 目录结构

```
├── main.py              # 后端 API 桥接、文件读写、AI 集成
├── static/
│   ├── index.html       # 界面骨架
│   ├── index.css        # 样式
│   ├── app.js           # 前端业务逻辑
│   ├── lucide.min.js    # 本地图标库
│   └── marked.min.js    # 本地 Markdown 渲染器
├── app.ico              # 应用图标
└── .gitignore
```

## 开源协议

MIT

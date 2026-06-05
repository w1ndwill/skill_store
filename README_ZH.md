# AI Skill Hub Manager v2.0

一款 Windows 桌面小工具，用来管理 AI 开发规范文件。写好一份规范，一键同步到所有项目，Cursor、Copilot、Windsurf、Claude 等工具会自动读取。

## 核心功能

- **Apple 质感 UI** — 借鉴 macOS 设计语言，采用卡片分组式设置布局，全面支持深色模式，交互动效流畅细腻。
- **统一管理技能库** — 把编码规范、设计原则、质量红线编写成 Markdown 文件，在应用内进行统一管理与编辑。
- **一键同步项目** — 自由选择项目文件夹，勾选需要的技能一键同步。工具会自动将文件拷贝至 `.agent/skills/` 并生成 `AGENTS.md` 索引文件。
- **状态实时追踪** — 基于 MD5 值对比，一眼直观辨别各技能的同步状态（已同步、有更新、待移除）。
- **AI 技能顾问** — 支持通过对话式 LLM（如 DeepSeek 等）联网搜索并直接生成技能文件。支持多会话历史记录持久化保存。
- **零安装与本地化** — 本地内置 Lucide 图标与 Marked 渲染器，不启动本地 Web 服务器，无端口监听，安全纯净。

## 快速开始

在 [Releases](https://github.com/w1ndwill/skill_store/releases) 页面下载 `AI_Skill_Hub_Manager.exe` 双击即可运行，无需安装。

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

- **后端**：Python + `pywebview`（使用系统原生 WebView2 内核）— 无 Electron 冗余，不占用网络端口。
- **前端**：HTML5, CSS3 (Vanilla), JavaScript (ES6)。
- **AI 与搜索**：DeepSeek API（支持自定义模型名称） + DuckDuckGo Search。

## 目录结构

```
├── main.py              # 后端：API 桥接、文件读写、AI 集成
├── static/
│   ├── index.html       # 界面骨架
│   ├── index.css        # 样式与设计系统
│   ├── app.js           # 前端业务逻辑
│   ├── lucide.min.js    # 本地图标库
│   └── marked.min.js    # 本地 Markdown 渲染器
├── app.ico              # 应用图标
└── .gitignore
```

## 开源协议

MIT

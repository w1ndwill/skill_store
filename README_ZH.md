# AI Skill Hub Manager

一个 Windows 桌面小工具，用来管理各个项目的 AI 编码规范。

把开发规约写成 Markdown 文件，选好哪个项目需要哪些规则，一键同步过去。Cursor、Copilot、Windsurf、Claude 等工具会自动从 `.agent/skills/` 目录读取这些规范。

## 主要功能

- **技能库管理** — 把编码标准、设计约定、Review 检查项之类的东西统一写成 `.md` 文件，集中存放。
- **标签分类** — 给技能打标签（比如"前端"、"Git"、"Python"），在界面上按标签筛选。
- **一键同步** — 选个项目目录，勾上需要的技能，点一下就复制到项目的 `.agent/skills/` 下，同时生成 `AGENTS.md` 索引。
- **同步状态** — 用 MD5 对比文件变化，一眼就能看出哪些是最新的、哪些改过了、哪些还没同步。
- **AI 对话** — 接入 LLM（比如 DeepSeek），支持联网搜索，可以直接让 AI 帮你写技能文件。支持多轮会话。
- **纯本地运行** — 用系统自带的 WebView2 渲染界面，不起本地服务，不占端口。

## 快速上手

去 [Releases](https://github.com/w1ndwill/skill_store/releases) 页面下载 `AI_Skill_Hub_Manager.exe`，双击就能用，不用安装。

第一次启动会在同级目录创建 `skills/` 文件夹，把你的 `.md` 规范文件丢进去就行，也可以在应用里直接新建。

## 从源码运行

```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
pip install pywebview ddgs requests
python main.py
```

打包成单文件 exe：

```bash
pip install pyinstaller
pyinstaller AI_Skill_Hub_Manager.spec
```

## 技术栈

- Python + [pywebview](https://pywebview.flowrl.com/)（系统原生 WebView2）
- HTML / CSS / JS 前端
- DeepSeek API + DuckDuckGo 联网搜索

## 目录结构

```
├── main.py              # 后端：文件读写、API 桥接、AI 对话
├── static/
│   ├── index.html       # 页面结构
│   ├── index.css        # 样式
│   ├── app.js           # 前端逻辑
│   ├── lucide.min.js    # 图标库（本地打包）
│   └── marked.min.js    # Markdown 解析器（本地打包）
├── app.ico              # 应用图标
└── .gitignore
```

## 开源协议

MIT

# AI Skill Hub Manager v2.0

一款 Windows 桌面小工具，用来管理 AI 开发规范文件。写好一份规范，一键同步到所有项目，Cursor、Copilot、Claude 等工具会自动读取。

## 能做什么

- **管理技能库** — 把编码规范、设计原则、质量红线写成 Markdown 文件，统一管理和编辑
- **一键同步** — 选择项目文件夹，勾选需要的技能，点同步。工具会把文件拷贝到 `.agent/skills/` 并自动生成 `AGENTS.md` 索引
- **状态追踪** — 基于 MD5 对比，一眼看出哪些已同步、哪些有更新、哪些待处理
- **AI 辅助** — 描述你想要的规范，内置的 AI 助手会搜索网络并生成完整的技能文件（需要 DeepSeek API Key）
- **中英双语** — 界面完整支持中文和英文，一键切换

## 怎么用

去 [Releases](https://github.com/w1ndwill/skill_store/releases) 下载 `AI_Skill_Hub_Manager.exe`，双击运行。无需安装。

首次启动会在 exe 旁边自动创建 `skills/` 文件夹。把你的 `.md` 技能文件放进去，或者在应用里新建。

AI 功能需要在设置里填 DeepSeek API Key，然后点侧边栏的 "AI 搜索" 按钮就能用了。想用什么模型都可以自己填（比如 `deepseek-chat`、`deepseek-reasoner` 等）。

## 从源码运行

```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
pip install pywebview ddgs requests
python main.py
```

打包成独立 exe：

```bash
pip install pyinstaller
pyinstaller --clean --noconsole --onefile --icon=app.ico --add-data "static;static" --add-data "app.ico;." --hidden-import=ddgs --hidden-import=requests --hidden-import=lxml --hidden-import=httpx --hidden-import=h2 --name AI_Skill_Hub_Manager main.py
```

## 技术栈

- Python + pywebview（WebView2 内核），不监听端口，不需要网络
- 前端纯 HTML/CSS/JS，图标用 Lucide，Markdown 渲染用 Marked
- AI 对话接 DeepSeek API，联网搜索用 DuckDuckGo
- PyInstaller 打包成单文件 exe

## 目录结构

```
├── main.py              # 后端：API 桥接、文件读写、AI 集成
├── static/
│   ├── index.html       # 界面骨架
│   ├── index.css        # 样式
│   ├── app.js           # 前端逻辑
│   ├── lucide.min.js    # 图标库（本地打包）
│   └── marked.min.js    # Markdown 渲染（本地打包）
├── app.ico              # 应用图标
├── config.json          # 用户配置（自动生成，不上传 git）
└── .gitignore
```

## License

MIT

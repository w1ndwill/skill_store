# SkillHub

一个 Windows 桌面小工具，用来管理各个项目的 AI 编码规范。

当前版本：**3.0.1** · [3.0 发布说明](docs/RELEASE_3.0.md) · [更新日志](CHANGELOG.md)

把开发规约写成 Markdown 文件，选好哪个项目需要哪些规则，一键同步过去。Cursor、Copilot、Windsurf、Claude 等工具会自动从 `.agent/skills/` 目录读取这些规范。

## 主要功能

- **技能库管理** — 把编码标准、设计约定、Review 检查项之类的东西统一写成 `.md` 文件，集中存放。
- **无 AI 导入体检** — 导入 Markdown、ZIP、单个 `SKILL.md` 文件夹或包含 `skills/*/SKILL.md` 的技能集合时，本地完成元数据规范化、逐项去重、安全扫描和上游归档；不配置 API Key 也能完整使用。
- **直接复制自动发现** — 直接放进活动 `skills/` 的新文件会在刷新或下次启动时提示体检，可原地优化或保留原样登记。
- **集合折叠管理** — 标准技能仓库及包含 `.agent/skills/*.md` 的组合包在列表中显示为一张父卡；点开后可分别启用或停用子技能，项目同步只装载启用项。
- **可审阅的 AI 适配** — 保留原有 frontmatter；AI 改写只停留在暂存区，展示统一差异并获得明确确认后才导入。
- **标签分类** — 给技能打标签（比如"前端"、"Git"、"Python"），在界面上按标签筛选。
- **一键同步** — 选个项目目录，勾上需要的技能，点一下就复制到项目的 `.agent/skills/` 下，同时生成 `AGENTS.md` 索引。
- **同步状态** — 用 MD5 对比文件变化，一眼就能看出哪些是最新的、哪些改过了、哪些还没同步。
- **AI 对话** — 接入 LLM（比如 DeepSeek），支持联网搜索，可以直接让 AI 帮你写技能文件。支持多轮会话。
- **纯本地运行** — 用系统自带的 WebView2 渲染界面，不起本地服务，不占端口。

## 快速上手

去 [Releases](https://github.com/w1ndwill/skill_store/releases) 页面下载 `SkillHub.exe`，双击就能用，不用安装。

第一次启动会在用户数据目录（Windows 默认是 `%LOCALAPPDATA%\SkillHub\skills`）创建可写活动技能库，并从只读的 `original-skills/` 原版基线初始化。本地初始化会自动补齐元数据、移除模板运行残留并消除组合技能冲突，不需要 AI。点击“导入技能”可以选择 `.md`、`.zip` 或技能文件夹；导入过程同样不依赖 AI。原始下载文件会归档在活动技能库的 `.skill-hub/imports/upstream/`，检查后的优化版本才会进入活动库。

仓库不再保存第二份活动 `skills/` 副本：`original-skills/` 只负责保留原版，实际优化、导入和编辑都发生在设置中指定的外部活动技能库。

## 从源码运行

```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
pip install -r requirements.txt
python main.py
```

打包成单文件 exe：

```bash
pip install pyinstaller
pyinstaller SkillHub.spec
```

## 技术栈

- Python + [pywebview](https://pywebview.flowrl.com/)（系统原生 WebView2）
- HTML / CSS / JS 前端
- DeepSeek API + DuckDuckGo 联网搜索

## 目录结构

```
├── main.py              # 后端：文件读写、API 桥接、AI 对话
├── original-skills/     # 随程序打包的只读原版技能基线
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

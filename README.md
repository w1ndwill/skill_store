# SkillHub

[English](README_EN.md) · [使用说明书](docs/SkillHub使用说明书.md) · [下载 SkillHub](https://github.com/w1ndwill/skill_store/releases) · [MIT License](LICENSE)

SkillHub 是一个本地运行的 Windows Skill 工作台，用来集中管理 AI 开发规约，并为每个项目维护清晰、可预览、可回退的 Skill 配置。

![SkillHub 技能库](docs/screenshots/skill-library.png)

当前版本：**3.2.0**

## 主要功能

- **统一技能库**：管理 Markdown 规则、标准 `SKILL.md` 文件夹，以及包含多个子 Skill 的集合；支持从界面新增、调整和删除类别。
- **项目独立配置**：每个项目单独选择所需 Skill，不同项目之间互不影响。
- **同步预览**：写入前查看新增、更新、移除和冲突，确认后再同步到 `.agent/skills/`。
- **集合管理**：集合总开关控制整个集合是否参与项目，子开关用于选择集合中的具体 Skill。
- **文档查看与编辑**：直接查看 Skill 元数据和渲染后的 Markdown，并从界面进入源码编辑。
- **明确的查看模式**：未选择目标项目时只查看 Skill；选择项目后再调整启用范围。
- **SkillOps Agent**：模型通过 Function Calling 自主检索、读取、审查和研究 Skill，生成变更草案，并在用户批准后保存或同步。
- **结构化记忆与运行记录**：项目事实、用户偏好和历史决策按相关性检索；工具调用与批准结果以脱敏摘要保存在本机。
- **本地数据管理**：技能库、项目配置、聊天记录、Agent 记忆和同步备份保存在本机。
- **单实例运行**：Windows 命名互斥体阻止重复启动，第二次启动会唤醒已有窗口并立即退出。
- **同步撤销**：保留最近一次同步记录，可在项目文件未被继续修改时安全撤销。

## 界面

### 项目 Skill 配置

![项目 Skill 配置](docs/screenshots/project-configuration.png)

项目页面集中显示分类、搜索、同步状态和启用范围。底部操作栏汇总当前变化，并在执行前打开同步预览。

### SkillOps Agent

![SkillOps Agent 工作区](docs/screenshots/ai-assistant.png)

输入一个 Skill 生命周期管理目标后，Agent 会自主选择只读检查、联网研究、草案预览等工具。它可以读取 `skillhub.cn/install/skillhub.md`，搜索 SkillHub 官方目录，并把精确 slug 对应的 ZIP 安全解压到隔离区；包哈希、文件树哈希和同名冲突全部确认后，才会发起安装审批。它也可以从公开 GitHub 仓库预览并安装由 SHA-256 锁定的原始 `SKILL.md`。仓库级目标会扫描 `skills/*/SKILL.md` 并保留为 Skill 集合，只有明确指定安装名时才按单个 Skill 处理。单次任务默认最多进行 32 轮决策；连续重复相同工具决策会提前停止，避免无进展循环。预览成功后若模型只用文字询问批准，运行时会要求它调用对应 `apply_` 工具，不能把未进入审批门的安装误报为完成。对话正文可以直接选择，也支持复制单条消息、代码块、生成预览或整段会话；右侧执行记录可收起。工具时间线只显示经过筛选的参数和结果摘要，并自动省略较早记录。记忆可以查看、关闭或清理。模型或 API 不支持 Function Calling 时，Agent 会明确报错，不会伪造工具调用。

### Skill 集合

![Skill 集合管理](docs/screenshots/collection-manager.png)

集合内的子 Skill 可以分别查看和选择。集合停用时，整个集合不参与项目配置；子项选择仍保存在本地。

### Skill 文档

![Skill 文档详情](docs/screenshots/skill-detail.png)

详情面板同时展示来源、分类、标签、元数据和 Markdown 正文，方便在启用前了解 Skill 的实际内容。

设置中可开启“导入时生成双语说明”。SkillHub 只将标题和说明发送到已配置的兼容 OpenAI 接口，并按系统语言显示中文或英文译文；翻译保存在本地显示缓存中，不会改写第三方 `SKILL.md`。通过官方 SkillHub 目录安装时，会优先复用目录已有的本地化说明，同样只写显示缓存。

## 使用流程

1. 导入 `.md`、`.zip`、标准 Skill 文件夹或 Skill 集合。
2. 查看 Skill 的名称、说明、分类和正文。
3. 添加目标项目，为项目选择需要的 Skill。
4. 打开同步预览，确认文件变化。
5. 同步后由项目中的 `AGENTS.md` 和 `.agent/skills/` 提供给 AI 开发工具使用。

## 下载与运行

前往 [GitHub Releases](https://github.com/w1ndwill/skill_store/releases) 下载 `SkillHub.exe`。程序为便携版，无需安装。

首次启动时，SkillHub 会创建本地技能库：

```text
%LOCALAPPDATA%\SkillHub\skills
```

导入文件的归档、同步状态和备份由 SkillHub 在本地数据目录中维护。源码仓库不包含个人 Skill、API Key、聊天记录或项目配置。

## 从源码运行

```powershell
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python main.py
```

构建便携版：

```powershell
python -m pip install pyinstaller
pyinstaller --clean --noconfirm SkillHub.spec
```

## 仓库结构

```text
├── agent_runtime.py         # Agent 循环、工具协议、审批、记忆与运行记录
├── main.py                  # 后端、文件操作、同步与 Agent 工具适配
├── static/
│   ├── index.html           # 应用结构
│   ├── index.css            # 界面样式
│   ├── app.js               # 前端状态与交互
│   ├── lucide.min.js        # 本地图标库
│   └── marked.min.js        # 本地 Markdown 渲染器
├── docs/screenshots/        # README 界面截图
├── SkillHub.spec            # PyInstaller 构建入口
├── app.ico                  # 应用图标
└── requirements.txt         # 运行依赖
```

## 安全边界

- API Key 只保存在本地配置中，界面仅显示脱敏状态。
- Agent 记忆和运行记录不保存 API Key、完整敏感文件或隐藏思维链。
- 所有 `apply_` 写工具在执行前必须获得用户批准；同名目录必须明确选择替换、保留两个版本或取消。
- 导入过程不执行仓库中的 hooks、MCP 服务或安装脚本。
- ZIP 路径穿越、符号链接来源和目标路径冲突会被拒绝。
- 项目中不受 SkillHub 管理的同名文件不会被静默覆盖。
- 发布程序不包含私人 Skill、本地配置、测试目录、聊天记录、Agent 记忆或运行日志。

## 技术栈

- Python + [pywebview](https://pywebview.flowrl.com/)
- 系统 WebView2
- HTML、CSS、JavaScript
- 可选的 OpenAI 兼容接口与 DuckDuckGo 联网搜索

## 开源协议

[MIT](LICENSE)

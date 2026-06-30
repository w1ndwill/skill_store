// ==========================================
// SkillHub - pywebview Frontend
// ==========================================

let projects = [];
let skills = [];
let currentProjectPath = null;
let enabledSkills = new Set();
let editingFilename = null;
let isViewingSkill = false;
let displaySkillsByFilename = new Map();
let activeCollectionId = null;

// i18n & Theme State
let currentLanguage = 'zh';
let currentTheme = 'light';
let defaultScanDir = '';
let deepseekApiKey = '';
let deepseekModel = 'deepseek-chat';
let apiBase = 'https://api.deepseek.com/v1';
let hasAiKey = false;
let apiKeyHint = '';
let aiImportOptimization = false;
let aiGeneratedSkill = null; // cached AI result
let activeCategoryFilter = null; // active category filter (null = show all)
let searchRenderTimer = null;
let hasRenderedSkillCards = false;

// DOM cache
const projectList = document.getElementById('project-list');
const cardsGrid = document.getElementById('cards-grid');
const syncBtn = document.getElementById('sync-btn');
const undoSyncBtn = document.getElementById('undo-sync-btn');
const currentProjectTitle = document.getElementById('current-project-title');
const currentProjectDesc = document.getElementById('current-project-desc');
const editorModal = document.getElementById('editor-modal');
const modalTitle = document.getElementById('modal-title');
const modalEmoji = document.getElementById('modal-emoji');
const modalBody = document.getElementById('modal-body');
const markdownTextarea = document.getElementById('markdown-textarea');
const markdownPreview = document.getElementById('markdown-preview');
const modalTabEdit = document.getElementById('modal-tab-edit');
const modalTabPreview = document.getElementById('modal-tab-preview');
const modalCloseFooter = document.getElementById('modal-close-footer');
const modalSaveBtn = document.getElementById('modal-save-btn');
const toastContainer = document.getElementById('toast-container');
const searchInput = document.getElementById('search-input');
const skillsDirPath = document.getElementById('skills-dir-path');
const toolbarStats = document.getElementById('toolbar-stats');
const categoryFilterBar = document.getElementById('category-filter-bar');
const collectionModal = document.getElementById('collection-modal');
const collectionModalTitle = document.getElementById('collection-modal-title');
const collectionModalSummary = document.getElementById('collection-modal-summary');
const collectionMembersList = document.getElementById('collection-members-list');
const collectionModalHint = document.getElementById('collection-modal-hint');

// ------------------------------------------
// Bilingual i18n Dictionary
// ------------------------------------------
const locales = {
  zh: {
    sidebarTitle: 'SkillHub',
    sidebarSub: '本地技能可视化管理器',
    btnAssociate: '关联项目',
    btnNewSkill: '新建技能',
    headingProjects: '目标项目',
    emptyProjects: '暂无关联项目',
    emptyProjectsSub: '点击上方按钮选取文件夹',
    btnSettings: '系统设置',
    noProjectTitle: '请选择一个项目进行配置',
    noProjectDesc: '选择左侧项目后，可在此管理技能装载',
    syncBtn: '一键同步技能',
    syncingBtn: '同步中…',
    syncPreviewTitle: '同步变更预览',
    syncPreviewIntro: '确认后才会写入项目：',
    syncPreviewConflict: '存在需要明确确认的覆盖冲突。',
    syncPreviewNoChanges: '当前项目已经是最新状态',
    syncApply: '应用同步',
    undoSyncTitle: '撤销最近同步',
    undoSyncMessage: '将恢复最近一次同步修改过的文件。同步后又被手动编辑的文件会自动跳过。',
    undoSyncConfirm: '撤销同步',
    toastUndoSuccess: '最近一次同步已撤销',
    toastUndoPartial: '撤销完成，但跳过了已被再次修改的文件: ',
    toastUndoFail: '撤销失败: ',
    statTotal: '全局技能库',
    statSynced: '已装载',
    statUnsynced: '待更新',
    listHeader: '全局技能列表',
    listHeaderProject: '项目技能装载配置',
    searchPlaceholder: '搜索技能名称、标签…',
    statusSynced: '已同步',
    statusUpdated: '有更新',
    statusPendingMount: '待装载',
    statusPendingUnmount: '待移除',
    statusUnloaded: '未装载',
    statusReadonly: '全局只读',
    btnViewSkill: '查看文档',
    btnEditSkill: '编辑技能',
    toggleLabel: '启用装载',
    viewModalTitle: '查看文档',
    viewModalTabSource: 'Markdown 源码',
    viewModalTabPreview: '文档预览',
    viewModalClose: '关闭',
    editModalTitle: '编辑技能',
    editModalTabSource: '编辑源码',
    editModalTabPreview: '实时预览',
    editModalCancel: '取消',
    editModalSave: '保存并更新',
    toastLoadFail: '获取列表失败: ',
    toastConfigFail: '获取系统配置失败: ',
    toastProjectFail: '获取项目列表失败: ',
    toastAssocSuccess: '已关联项目: ',
    toastAssocExists: '该项目已关联',
    toastCreateSuccess: '技能文件已创建: ',
    toastCreateExists: '该文件已存在',
    toastSaveSuccess: '全局技能已保存',
    toastSyncSuccess: '同步完成！已装载 ',
    toastSyncFail: '同步失败: ',
    toastRemoveSuccess: '项目已移除',
    toastPathUpdate: '全局技能库路径已更新',
    toastRefreshSuccess: '全局技能库已成功重扫描刷新 🟢',
    toastSettingsSaved: '系统配置已保存并生效 ⚙️',
    settingsTitle: '系统设置',
    settingsCancel: '取消',
    settingsSave: '保存配置',
    settingsHeadingGeneral: '通用偏好',
    settingsLabelLang: '系统语言 (Language)',
    settingsDescLang: '切换整个界面的显示语言',
    settingsLabelTheme: '界面主题 (Theme)',
    settingsDescTheme: '选择明亮模式或护眼深色模式',
    settingsThemeLight: '☀️ 明亮模式 (Light)',
    settingsThemeDark: '🌙 深色模式 (Dark)',
    settingsHeadingPaths: '路径管理',
    settingsLabelSkillsdir: '全局技能库路径',
    settingsDescSkillsdir: '存放全局技能规约 Markdown 文件的目录',
    settingsLabelScandir: '项目默认扫描起点',
    settingsDescScandir: '点击“关联项目”时，默认打开的初始目录',
    settingsHeadingAI: 'AI 与大模型配置',
    settingsLabelApibase: 'API 接口地址 (Base URL)',
    settingsDescApibase: '自定义 OpenAI 兼容接口，例如：官方 https://api.deepseek.com/v1，本地 Ollama 填 http://localhost:11434/v1，SiliconFlow 填 https://api.siliconflow.cn/v1',
    settingsLabelApikey: 'API 密钥 (API Key)',
    settingsDescApikey: '用于 AI 智能编写和辅助生成技能内容',
    settingsLabelAimodel: 'AI 模型名称 (Model)',
    settingsDescAimodel: '输入你要调用的模型，如 deepseek-chat, qwen2.5:7b, gpt-4o 等',
    btnTestConnection: '测试连接',
    exitProjectMode: '已退出项目配置模式，返回全局只读视图',
    confirmRemove: '确定要移除此项目的关联吗？\n不会删除项目中的任何文件。',
    defaultDesc: '此技能暂无详细描述信息。'
  },
  en: {
    sidebarTitle: 'SkillHub',
    sidebarSub: 'Local Skill Manager',
    btnAssociate: 'Link Project',
    btnNewSkill: 'New Skill',
    headingProjects: 'Target Projects',
    emptyProjects: 'No Linked Projects',
    emptyProjectsSub: 'Click button above to select folder',
    btnSettings: 'Settings',
    noProjectTitle: 'Select a project to configure',
    noProjectDesc: 'Select a project on the left to manage skill mounts',
    syncBtn: 'Sync Skills Now',
    syncingBtn: 'Syncing...',
    syncPreviewTitle: 'Sync Change Preview',
    syncPreviewIntro: 'Files will only be written after confirmation:',
    syncPreviewConflict: 'Explicit confirmation is required for overwrite conflicts.',
    syncPreviewNoChanges: 'This project is already up to date',
    syncApply: 'Apply Sync',
    undoSyncTitle: 'Undo Last Sync',
    undoSyncMessage: 'Files changed by the most recent sync will be restored. Files edited afterward will be skipped.',
    undoSyncConfirm: 'Undo Sync',
    toastUndoSuccess: 'The most recent sync was undone',
    toastUndoPartial: 'Undo completed, but skipped files edited afterward: ',
    toastUndoFail: 'Undo failed: ',
    statTotal: 'Global Skill Library',
    statSynced: 'Currently Loaded',
    statUnsynced: 'Pending Update',
    listHeader: 'Global Skills List',
    listHeaderProject: 'Project Skill Mount Configs',
    searchPlaceholder: 'Search skills, tags...',
    statusSynced: 'Synced',
    statusUpdated: 'Updated',
    statusPendingMount: 'Pending Mount',
    statusPendingUnmount: 'Pending Removal',
    statusUnloaded: 'Unloaded',
    statusReadonly: 'Global Read-Only',
    btnViewSkill: 'View Docs',
    btnEditSkill: 'Edit Skill',
    toggleLabel: 'Enable Mount',
    viewModalTitle: 'View Docs',
    viewModalTabSource: 'Markdown Source',
    viewModalTabPreview: 'Document Preview',
    viewModalClose: 'Close',
    editModalTitle: 'Edit Skill',
    editModalTabSource: 'Edit Source',
    editModalTabPreview: 'Live Preview',
    editModalCancel: 'Cancel',
    editModalSave: 'Save & Update',
    toastLoadFail: 'Failed to fetch skill list: ',
    toastConfigFail: 'Failed to fetch configuration: ',
    toastProjectFail: 'Failed to fetch projects list: ',
    toastAssocSuccess: 'Linked project: ',
    toastAssocExists: 'This project is already linked',
    toastCreateSuccess: 'Skill file created: ',
    toastCreateExists: 'File already exists',
    toastSaveSuccess: 'Global skill saved successfully',
    toastSyncSuccess: 'Sync completed! Loaded ',
    toastSyncFail: 'Sync failed: ',
    toastRemoveSuccess: 'Project association removed',
    toastPathUpdate: 'Global skills path updated',
    toastRefreshSuccess: 'Global skill library rescanned & refreshed 🟢',
    toastSettingsSaved: 'Settings saved and applied ⚙️',
    settingsTitle: 'System Settings',
    settingsCancel: 'Cancel',
    settingsSave: 'Save Settings',
    settingsHeadingGeneral: 'General Preferences',
    settingsLabelLang: 'System Language',
    settingsDescLang: 'Switch display language across the interface',
    settingsLabelTheme: 'Theme Mode',
    settingsDescTheme: 'Choose light or eye-protection dark mode',
    settingsThemeLight: '☀️ Light Mode',
    settingsThemeDark: '🌙 Dark Mode',
    settingsHeadingPaths: 'Paths Management',
    settingsLabelSkillsdir: 'Global Skill Library Path',
    settingsDescSkillsdir: 'Folder storing global Markdown files',
    settingsLabelScandir: 'Project Scan Starting Path',
    settingsDescScandir: 'Default folder shown when adding a project',
    settingsHeadingAI: 'AI & Large Model Configs',
    settingsLabelApibase: 'API Base URL',
    settingsDescApibase: 'Custom OpenAI-compatible base URL. e.g. DeepSeek: https://api.deepseek.com/v1, local Ollama: http://localhost:11434/v1, SiliconFlow: https://api.siliconflow.cn/v1',
    settingsLabelApikey: 'API Key',
    settingsDescApikey: 'Used for AI generation and search-assisted writing',
    settingsLabelAimodel: 'AI Model Name',
    settingsDescAimodel: 'Enter target model name, e.g. deepseek-chat, qwen2.5:7b, gpt-4o',
    btnTestConnection: 'Test Link',
    exitProjectMode: 'Exited project configuration mode, returned to global read-only view',
    confirmRemove: 'Are you sure you want to unlink this project?\nNo files will be deleted from your disk.',
    defaultDesc: 'No detailed description available for this skill.'
  }
};

const skillTranslations = {
  zh: {
    'Git提交规范.md': {
      title: 'Git 提交规范',
      category: 'Development',
      description: '用于创建或审查提交信息与仓库卫生；不会自行提交、推送或改写历史。'
    },
    'frontend_optimization.md': {
      title: '前端性能优化技能指南',
      category: 'Development',
      description: '现代 Web 应用全方位性能优化指南，旨在提升用户体验、Lighthouse 评分及核心网页指标。'
    },
    'handoff.md': {
      title: 'AI 会话接力与状态恢复',
      category: 'Workflow',
      description: '用于跨会话继续任务或用户明确要求交接；不用于团队发布和代码移交。'
    },
    'process_optimization.md': {
      title: '开发与运行流程优化',
      category: 'Workflow',
      description: '用于有数据支持的开发、构建、CI/CD 和运行时优化，强调先测量再改进。'
    },
    'python_env_isolation.md': {
      title: 'Python 环境与依赖隔离',
      category: 'Development',
      description: '遵循项目已有包管理器和锁文件，安全隔离 Python 环境与依赖。'
    },
    'run_recording.md': {
      title: '安全的运行记录与可观测性',
      category: 'Development',
      description: '设计日志、追踪和诊断记录，同时执行数据最小化、脱敏和受控留存。'
    },
    '代码移交标准.md': {
      title: '团队代码与运维移交',
      category: 'Workflow',
      description: '用于版本发布、团队换手或运维接管前的长期可维护性交付。'
    },
    '前端性能优化规范.md': {
      title: '前端性能优化',
      category: 'Development',
      description: '基于测量数据优化前端加载、交互、渲染与资源性能，避免固定阈值。'
    },
    'superpowers-template': {
      title: 'Superpowers 工程工作流',
      category: 'Workflow',
      description: '为中大型实现任务提供按风险裁剪的分析、规划、执行和验证流程。'
    },
    'brainstorm.md': {
      title: 'Superpowers 分析与方案探索',
      category: 'Workflow',
      description: '用于需求模糊、存在架构取舍或影响多个模块的任务。'
    },
    'planning.md': {
      title: 'Superpowers 实施规划',
      category: 'Workflow',
      description: '用于多文件、多阶段、跨会话或高风险实现任务。'
    },
    'tdd_execution.md': {
      title: 'Superpowers 测试驱动执行',
      category: 'Development',
      description: '对可测试的行为变化执行 TDD，并为其他任务提供等价验证路径。'
    },
    'verification.md': {
      title: 'Superpowers 验证与交付',
      category: 'Workflow',
      description: '执行与风险匹配的验证、回归检查和结果说明。'
    },
    'codegraph_analysis.md': {
      title: '代码图谱静态分析与依赖审计',
      category: 'Development',
      description: '分析模块依赖、调用链和耦合风险，并按需生成可验证的 Mermaid 图。'
    }
  },
  en: {
    'Git提交规范.md': {
      title: 'Git Commit Guideline',
      category: 'Development',
      description: 'Create or review Conventional Commit messages and repository hygiene without automatically committing or pushing.'
    },
    'frontend_optimization.md': {
      title: 'Frontend Performance Optimization Skill Guide',
      category: 'Development',
      description: 'Comprehensive performance optimization guide for modern web apps, aimed at improving user experience, Lighthouse scores, and Core Web Vitals.'
    },
    'handoff.md': {
      title: 'AI Session Handoff & Context Resume',
      category: 'Workflow',
      description: 'Capture task state when work must continue in another session; not for release handoffs.'
    },
    'process_optimization.md': {
      title: 'Development & Runtime Process Optimization',
      category: 'Workflow',
      description: 'Measure and improve observable development, build, CI/CD, and runtime bottlenecks.'
    },
    'python_env_isolation.md': {
      title: 'Python Environment & Dependency Isolation',
      category: 'Development',
      description: 'Follow the project package manager and lockfile while isolating Python environments and dependencies.'
    },
    'run_recording.md': {
      title: 'Secure Run Recording & Observability',
      category: 'Development',
      description: 'Design logs, traces, and diagnostics with data minimization, redaction, and controlled retention.'
    },
    '代码移交标准.md': {
      title: 'Team Code & Operations Handoff',
      category: 'Workflow',
      description: 'Prepare maintainable delivery before a release, team transition, or operations takeover.'
    },
    '前端性能优化规范.md': {
      title: 'Frontend Performance Optimization',
      category: 'Development',
      description: 'Optimize measured frontend loading, interaction, rendering, and asset performance without fixed thresholds.'
    },
    'superpowers-template': {
      title: 'Superpowers Engineering Workflow',
      category: 'Workflow',
      description: 'Risk-scaled analysis, planning, execution, and verification for medium or large implementation tasks.'
    },
    'brainstorm.md': {
      title: 'Superpowers Analysis & Design Exploration',
      category: 'Workflow',
      description: 'Use for ambiguous requirements, architectural tradeoffs, or changes spanning multiple modules.'
    },
    'planning.md': {
      title: 'Superpowers Implementation Planning',
      category: 'Workflow',
      description: 'Plan multi-file, multi-stage, cross-session, or high-risk implementations.'
    },
    'tdd_execution.md': {
      title: 'Superpowers Test-Driven Execution',
      category: 'Development',
      description: 'Apply TDD to testable behavior changes and equivalent validation to other task types.'
    },
    'verification.md': {
      title: 'Superpowers Verification & Delivery',
      category: 'Workflow',
      description: 'Perform risk-scaled final verification, regression checks, and evidence-based delivery.'
    },
    'codegraph_analysis.md': {
      title: 'Code Graph Static Analysis & Dependency Audit',
      category: 'Development',
      description: 'Analyze module dependencies, call paths, and coupling risks, with verifiable Mermaid diagrams when useful.'
    }
  }
};

const tagTranslations = {
  zh: {
    'Git': 'Git',
    'Collaboration': '协作',
    'Basic': '基础',
    'General': '常规',
    'Python': 'Python',
    'Env Isolation': '环境隔离',
    'Team Collaboration': '团队协作',
    'Workflow': '工作流',
    'Rules': '规范',
    'Standards': '规范',
    'Frontend': '前端',
    'Optimization': '优化',
    'Performance': '性能',
    '协作': '协作',
    '基础': '基础',
    '常规': '常规',
    '环境隔离': '环境隔离',
    '团队协作': '团队协作',
    '工作流': '工作流',
    '规范': '规范',
    '前端': '前端',
    '优化': '优化',
    '性能': '性能',
    '主控': '主控',
    '模板': '模板',
    '项目级': '项目级',
    'Master': '主控',
    'Template': '模板',
    'Project-Level': '项目级'
  },
  en: {
    'Git': 'Git',
    '协作': 'Collaboration',
    '基础': 'Basic',
    '常规': 'General',
    'Python': 'Python',
    '环境隔离': 'Env Isolation',
    '团队协作': 'Team Collaboration',
    '工作流': 'Workflow',
    '规范': 'Rules',
    '前端': 'Frontend',
    '优化': 'Optimization',
    '性能': 'Performance',
    'Collaboration': 'Collaboration',
    'Basic': 'Basic',
    'General': 'General',
    'Env Isolation': 'Env Isolation',
    'Team Collaboration': 'Team Collaboration',
    'Workflow': 'Workflow',
    'Rules': 'Rules',
    'Frontend': 'Frontend',
    'Optimization': 'Optimization',
    'Performance': 'Performance',
    '主控': 'Master',
    '模板': 'Template',
    '项目级': 'Project-Level',
    'Master': 'Master',
    'Template': 'Template',
    'Project-Level': 'Project-Level'
  }
};

const categoryTranslations = {
  zh: {
    'Development': '编程开发',
    'Workflow': '工作流程',
    'Uncategorized': '未分类',
    '编程开发': '编程开发',
    '工作流程': '工作流程',
    '未分类': '未分类'
  },
  en: {
    '编程开发': 'Development',
    '工作流程': 'Workflow',
    '未分类': 'Uncategorized',
    'Development': 'Development',
    'Workflow': 'Workflow',
    'Uncategorized': 'Uncategorized'
  }
};

// Wait for pywebview bridge
window.addEventListener('pywebviewready', () => {
  init();
});

async function init() {
  await fetchConfig();
  await fetchSkills();
  await fetchProjects();
  lucide.createIcons();
  checkForUnregisteredSkills();
}

async function fetchConfig() {
  try {
    const config = await window.pywebview.api.get_config();
    skillsDirPath.textContent = config.skills_dir;
    skillsDirPath.title = config.skills_dir;
    projects = config.projects || [];
    currentLanguage = config.language || 'zh';
    currentTheme = config.theme || 'light';
    defaultScanDir = config.default_scan_dir || '';
    deepseekModel = config.deepseek_model || 'deepseek-chat';
    apiBase = config.api_base || 'https://api.deepseek.com/v1';
    hasAiKey = Boolean(config.has_ai_key);
    apiKeyHint = config.api_key_hint || '';
    aiImportOptimization = Boolean(config.ai_import_optimization);

    applyTheme(currentTheme);
    applyLanguage(currentLanguage);
    updateAIConfigurationIndicators();
  } catch (e) {
    showToast(currentLanguage === 'zh' ? '获取系统配置失败: ' + e : 'Failed to fetch config: ' + e, 'error');
  }
}

function applyTheme(theme) {
  currentTheme = theme;
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

function applyLanguage(lang) {
  currentLanguage = lang;
  const t = locales[lang];
  
  // Sidebar
  document.querySelector('.brand-title h1').textContent = t.sidebarTitle;
  document.querySelector('.brand-title p').textContent = t.sidebarSub;
  document.getElementById('btn-add-project').innerHTML = `<i data-lucide="folder-plus" style="width:15px;height:15px;"></i> ${t.btnAssociate}`;
  document.getElementById('btn-new-skill').innerHTML = `<i data-lucide="file-plus" style="width:15px;height:15px;"></i> ${t.btnNewSkill}`;
  document.getElementById('btn-import-skill').innerHTML = `<i data-lucide="download" style="width:15px;height:15px;"></i> ${lang === 'zh' ? '导入技能' : 'Import Skill'}`;
  document.querySelector('.sidebar-section .section-title h2').textContent = t.headingProjects;
  document.getElementById('sidebar-settings-text').textContent = t.btnSettings;

  // Main Header / Project View
  if (!currentProjectPath) {
    currentProjectTitle.textContent = t.noProjectTitle;
    currentProjectDesc.textContent = t.noProjectDesc;
  } else {
    const proj = projects.find(p => p.path === currentProjectPath);
    if (proj) {
      currentProjectTitle.textContent = proj.name;
    }
  }
  
  // Sync Button Text
  syncBtn.innerHTML = `<i data-lucide="refresh-cw" style="width:16px;height:16px;"></i> ${t.syncBtn}`;
  undoSyncBtn.title = t.undoSyncTitle;
  
  // Search Controls & Header Title
  if (!currentProjectPath) {
    document.querySelector('.content-toolbar h3').textContent = t.listHeader;
  } else {
    document.querySelector('.content-toolbar h3').textContent = t.listHeaderProject;
  }
  searchInput.placeholder = t.searchPlaceholder;
  document.getElementById('btn-refresh-skills').title = lang === 'zh' ? '刷新全局技能库' : 'Refresh Global Skills';

  // Modals (Editor)
  modalTabEdit.textContent = isViewingSkill ? t.viewModalTabSource : t.editModalTabSource;
  modalTabPreview.textContent = isViewingSkill ? t.viewModalTabPreview : t.editModalTabPreview;
  modalCloseFooter.textContent = isViewingSkill ? t.viewModalClose : t.editModalCancel;
  modalSaveBtn.innerHTML = `<i data-lucide="save" style="width:16px;height:16px;"></i> ${t.editModalSave}`;

  // Modals (Settings)
  document.getElementById('settings-modal-title').textContent = t.settingsTitle;
  document.getElementById('settings-heading-general').textContent = t.settingsHeadingGeneral;
  document.getElementById('settings-label-lang').textContent = t.settingsLabelLang;
  document.getElementById('settings-desc-lang').textContent = t.settingsDescLang;
  document.getElementById('settings-label-theme').textContent = t.settingsLabelTheme;
  document.getElementById('settings-desc-theme').textContent = t.settingsDescTheme;
  document.getElementById('settings-theme-option-light').textContent = t.settingsThemeLight;
  document.getElementById('settings-theme-option-dark').textContent = t.settingsThemeDark;
  document.getElementById('settings-heading-paths').textContent = t.settingsHeadingPaths;
  document.getElementById('settings-label-skillsdir').textContent = t.settingsLabelSkillsdir;
  document.getElementById('settings-desc-skillsdir').textContent = t.settingsDescSkillsdir;
  document.getElementById('settings-label-scandir').textContent = t.settingsLabelScandir;
  document.getElementById('settings-desc-scandir').textContent = t.settingsDescScandir;
  document.getElementById('settings-btn-cancel').textContent = t.settingsCancel;
  document.getElementById('settings-btn-save').innerHTML = `<i data-lucide="save" style="width:16px;height:16px;"></i> ${t.settingsSave}`;

  // Modals (Settings AI Section)
  document.getElementById('settings-heading-ai').textContent = t.settingsHeadingAI;
  document.getElementById('settings-label-apibase').textContent = t.settingsLabelApibase;
  document.getElementById('settings-desc-apibase').textContent = t.settingsDescApibase;
  document.getElementById('settings-label-apikey').textContent = t.settingsLabelApikey;
  document.getElementById('settings-desc-apikey').textContent = t.settingsDescApikey;
  document.getElementById('settings-label-ai-import').textContent = lang === 'zh'
    ? '导入时使用 AI 优化'
    : 'Use AI optimization during import';
  document.getElementById('settings-desc-ai-import').textContent = lang === 'zh'
    ? '开启后先完成本地体检，再调用 AI 优化入口文档；导入前会显示差异并要求确认。'
    : 'Runs local validation, then asks AI to optimize the entry document; the diff must be reviewed and accepted before import.';
  document.getElementById('settings-label-aimodel').textContent = t.settingsLabelAimodel;
  document.getElementById('settings-desc-aimodel').textContent = t.settingsDescAimodel;
  document.getElementById('btn-test-connection').innerHTML = `<i data-lucide="zap" style="width:13px;height:13px;"></i> ${t.btnTestConnection}`;

  // Re-render components to apply dynamic texts
  renderProjectsList();
  renderCategoryFilterBar();
  renderSkillsGrid();
  updateStatistics();
  updateAIConfigurationIndicators();
  lucide.createIcons();
}

// ------------------------------------------
// Data Layer (pywebview bridge)
// ------------------------------------------

async function fetchSkills() {
  try {
    skills = await window.pywebview.api.get_skills();
    renderCategoryFilterBar();
    renderSkillsGrid();
  } catch (e) {
    showToast(locales[currentLanguage].toastLoadFail + e, 'error');
  }
}

async function fetchProjects() {
  try {
    projects = await window.pywebview.api.get_projects();
    renderProjectsList();
    updateStatistics();
  } catch (e) {
    showToast(locales[currentLanguage].toastProjectFail + e, 'error');
  }
}

function updateStatistics() {
  if (!currentProjectPath) {
    toolbarStats.style.display = 'none';
    return;
  }
  const proj = projects.find(p => p.path === currentProjectPath);
  let synced = 0, unsynced = 0;
  if (proj && !proj.error) {
    Object.values(proj.skills_status || {}).forEach(s => {
      if (s === 'synced') synced++;
      if (s === 'out_of_sync') unsynced++;
    });
  }
  const t = locales[currentLanguage];
  toolbarStats.innerHTML = `
    <span><span class="toolbar-stat-dot synced"></span>${synced} ${t.statSynced}</span>
    <span>·</span>
    <span><span class="toolbar-stat-dot unsynced"></span>${unsynced} ${t.statUnsynced}</span>`;
  toolbarStats.style.display = 'flex';
}

// ------------------------------------------
// Rendering
// ------------------------------------------

function renderProjectsList() {
  projectList.innerHTML = '';
  if (projects.length === 0) {
    projectList.innerHTML = `
      <div class="empty-state" style="padding:2rem 1rem;">
        <div class="empty-state-icon">📂</div>
        <h4>${locales[currentLanguage].emptyProjects}</h4>
        <p>${locales[currentLanguage].emptyProjectsSub}</p>
      </div>`;
    return;
  }
  projects.forEach(proj => {
    const item = document.createElement('div');
    item.className = `project-item ${proj.path === currentProjectPath ? 'active' : ''}`;
    const errorBadge = proj.error
      ? `<span style="font-size:0.65rem;color:#d1242f;font-weight:600;">⚠️ ${currentLanguage === 'zh' ? '路径无效' : 'Invalid Path'}</span>`
      : '';
    const encodedPath = encodeURIComponent(proj.path);
    const escapedPath = proj.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    item.innerHTML = `
      <div class="project-details" onclick="handleSelectProject(decodeURIComponent('${encodedPath}'))">
        <span class="project-name">${escapeHtml(proj.name)}</span>
        <span class="project-path">${escapeHtml(proj.path)}</span>
        ${errorBadge}
      </div>
      <button class="delete-project-btn btn-icon" onclick="handleDeleteProject(event, '${escapedPath}')" title="移除项目">
        <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
      </button>`;
    projectList.appendChild(item);
  });
  lucide.createIcons();
}

function getSmartEmojiAndTags(skill) {
  let emoji = skill.emoji || '📄';
  let tags = [...(skill.tags || [])];
  
  const text = (skill.title + ' ' + skill.filename + ' ' + skill.description).toLowerCase();
  
  // Smart Emoji fallbacks if default page is used
  if (emoji === '📄' || emoji === '📝' || emoji === '\ud83d\udcc4') {
    if (text.includes('git') || text.includes('commit') || text.includes('版本')) {
      emoji = '🌱';
    } else if (text.includes('性能') || text.includes('优化') || text.includes('performance') || text.includes('speed')) {
      emoji = '🚀';
    } else if (text.includes('接力') || text.includes('交接') || text.includes('handoff') || text.includes('resume')) {
      emoji = '🔄';
    } else if (text.includes('安全') || text.includes('security') || text.includes('safe') || text.includes('密')) {
      emoji = '🛡️';
    } else if (text.includes('规范') || text.includes('guideline') || text.includes('rule') || text.includes('标准') || text.includes('约')) {
      emoji = '📋';
    } else if (text.includes('测试') || text.includes('test') || text.includes('jest') || text.includes('unit')) {
      emoji = '🧪';
    } else if (text.includes('前端') || text.includes('frontend') || text.includes('css') || text.includes('html')) {
      emoji = '🎨';
    }
  }
  
  // Smart automatic Tag cleanup/enforcement
  if (tags.length === 0 || (tags.length === 1 && (tags[0] === '常规' || tags[0] === 'General' || tags[0] === '常规, 基础'))) {
    const newTags = [];
    if (text.includes('git') || text.includes('commit')) newTags.push('Git');
    if (text.includes('性能') || text.includes('优化') || text.includes('performance')) newTags.push(currentLanguage === 'zh' ? '性能' : 'Performance');
    if (text.includes('交接') || text.includes('接力') || text.includes('handoff')) newTags.push(currentLanguage === 'zh' ? '交接' : 'Handoff');
    if (text.includes('安全') || text.includes('security')) newTags.push(currentLanguage === 'zh' ? '安全' : 'Security');
    if (text.includes('规范') || text.includes('规约') || text.includes('rule')) newTags.push(currentLanguage === 'zh' ? '规范' : 'Rules');
    if (text.includes('前端') || text.includes('web') || text.includes('css')) newTags.push(currentLanguage === 'zh' ? '前端' : 'Frontend');
    
    if (newTags.length > 0) {
      tags = newTags;
    }
  }
  
  return { emoji, tags };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script, iframe, object, embed, link, meta').forEach(node => node.remove());
  template.content.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:') || value.startsWith('data:text/html')) {
        node.removeAttribute(attr.name);
      }
    });
  });
  return template.innerHTML;
}

function renderMarkdown(markdown) {
  return sanitizeHtml(marked.parse(markdown || ''));
}

function buildDisplaySkills() {
  const groups = new Map();
  skills.forEach(skill => {
    const collectionId = skill.collection?.id;
    if (!collectionId) return;
    if (!groups.has(collectionId)) groups.set(collectionId, []);
    groups.get(collectionId).push(skill);
  });

  const emitted = new Set();
  const display = [];
  skills.forEach(skill => {
    const collectionId = skill.collection?.id;
    if (!collectionId) {
      display.push(skill);
      return;
    }
    if (emitted.has(collectionId)) return;
    emitted.add(collectionId);
    const members = groups.get(collectionId) || [];
    const primary = members.find(member => member.filename === collectionId) || members[0];
    const enabledCount = members.filter(member => member.collection?.enabled).length;
    const tags = Array.from(new Set(members.flatMap(member => member.tags || []))).slice(0, 5);
    display.push({
      ...primary,
      filename: `@collection:${collectionId}`,
      title: primary.collection?.title || primary.title,
      emoji: '🧰',
      tags,
      is_dir: true,
      is_collection: true,
      collection_id: collectionId,
      collection_members: members,
      collection_child_count: members.filter(
        member => member.filename !== collectionId
      ).length,
      collection_enabled_count: enabledCount,
      search_text: members.map(member => [
        member.title,
        member.description,
        member.filename,
        ...(member.tags || [])
      ].join(' ')).join(' ')
    });
  });
  displaySkillsByFilename = new Map(
    display.map(skill => [skill.filename, skill])
  );
  return display;
}

function getCardFilename(event) {
  const card = event.target.closest('.skill-card');
  return card?.dataset.filename || '';
}

function handleCardsGridClick(event) {
  const filename = getCardFilename(event);
  if (!filename) return;
  const displaySkill = displaySkillsByFilename.get(filename);
  if (displaySkill?.is_collection) {
    if (event.target.closest('label, input, a')) return;
    event.stopPropagation();
    openCollectionModal(displaySkill.collection_id);
    return;
  }
  if (event.target.closest('.js-edit-skill')) {
    event.stopPropagation();
    openEditorModal(filename);
    return;
  }
  if (event.target.closest('.js-delete-skill')) {
    event.stopPropagation();
    handleDeleteSkill(filename);
    return;
  }
  if (event.target.closest('button, label, input, a')) return;
  openSkillViewer(filename);
}

function handleCardsGridChange(event) {
  if (!event.target.matches('.js-toggle-skill')) return;
  const filename = getCardFilename(event);
  const displaySkill = displaySkillsByFilename.get(filename);
  if (displaySkill?.is_collection) {
    handleToggleCollectionMount(displaySkill, event.target.checked);
  } else if (filename) {
    handleToggleSkill(filename, event.target.checked);
  }
}

function updateAIConfigurationIndicators() {
  const isZh = currentLanguage === 'zh';
  const status = document.getElementById('api-config-status');
  const summary = document.getElementById('api-config-summary');
  const importSummary = document.getElementById('import-mode-summary');
  const keyInput = document.getElementById('settings-apikey');
  const toggle = document.getElementById('settings-ai-import-optimization');

  if (status) {
    status.className = `config-status ${hasAiKey ? 'ready' : 'neutral'}`;
    status.textContent = hasAiKey
      ? `${isZh ? '已配置' : 'Configured'} ${apiKeyHint}`
      : (isZh ? '未配置 API Key' : 'API Key not configured');
  }
  if (summary) {
    summary.className = `service-status ${hasAiKey ? 'ready' : 'neutral'}`;
    summary.textContent = hasAiKey
      ? `${isZh ? 'AI 已配置' : 'AI configured'} ${apiKeyHint}`
      : (isZh ? 'AI 未配置' : 'AI not configured');
  }
  if (importSummary) {
    const usingAi = aiImportOptimization && hasAiKey;
    importSummary.className = `service-status ${usingAi ? 'ai' : 'local'}`;
    importSummary.textContent = usingAi
      ? (isZh ? '导入：本地 + AI' : 'Import: Local + AI')
      : (isZh ? '导入：本地体检' : 'Import: Local checks');
    importSummary.title = aiImportOptimization && !hasAiKey
      ? (isZh ? 'AI 优化已开启，但未配置 API Key；导入时自动使用本地结果。' : 'AI optimization is enabled without an API key; imports automatically use local results.')
      : '';
  }
  if (keyInput) {
    keyInput.placeholder = hasAiKey
      ? (isZh ? `已配置 ${apiKeyHint}；输入新 Key 可替换` : `Configured ${apiKeyHint}; enter a new key to replace`)
      : 'sk-...';
  }
  if (toggle) toggle.checked = aiImportOptimization;
}

function handleCardsGridKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const filename = getCardFilename(event);
  if (!filename || event.target.closest('button, label, input, a')) return;
  event.preventDefault();
  const displaySkill = displaySkillsByFilename.get(filename);
  if (displaySkill?.is_collection) {
    openCollectionModal(displaySkill.collection_id);
  } else {
    openSkillViewer(filename);
  }
}

cardsGrid.addEventListener('click', handleCardsGridClick);
cardsGrid.addEventListener('change', handleCardsGridChange);
cardsGrid.addEventListener('keydown', handleCardsGridKeydown);

// Get canonical category name (e.g. 'Development', 'Workflow', 'Uncategorized', or raw custom string)
function getCanonicalCategory(skill) {
  let cat = skill.category;
  
  // Check translation dictionary for override
  const trans = skillTranslations['zh']?.[skill.filename];
  if (trans && trans.category) {
    cat = trans.category;
  }
  
  if (!cat) {
    cat = skill.is_dir ? 'Workflow' : 'Uncategorized';
  }
  
  // Normalize known Chinese categories to canonical English keys
  if (cat === '编程开发') return 'Development';
  if (cat === '工作流程') return 'Workflow';
  if (cat === '未分类') return 'Uncategorized';
  
  return cat;
}

// Translate canonical category to current language for UI
function getLocalizedCategory(canonicalCat) {
  return categoryTranslations[currentLanguage]?.[canonicalCat] || canonicalCat;
}

// Render dynamic category pills
function renderCategoryFilterBar() {
  if (!categoryFilterBar) return;
  
  // Extract all unique canonical categories from currently loaded skills
  const categoriesSet = new Set();
  buildDisplaySkills().forEach(skill => {
    categoriesSet.add(getCanonicalCategory(skill));
  });
  
  const uniqueCanonicalCategories = Array.from(categoriesSet).sort();
  
  const allLabel = currentLanguage === 'zh' ? '全部' : 'All';
  let html = `<button class="category-pill ${activeCategoryFilter === null ? 'active' : ''}" onclick="handleSelectCategory(null)">${allLabel}</button>`;
  
  uniqueCanonicalCategories.forEach(canonicalCat => {
    const localizedLabel = getLocalizedCategory(canonicalCat);
    const isActive = activeCategoryFilter === canonicalCat;
    html += `<button class="category-pill ${isActive ? 'active' : ''}" onclick="handleSelectCategory('${canonicalCat.replace(/'/g, "\\'")}')">${localizedLabel}</button>`;
  });
  
  categoryFilterBar.innerHTML = html;
}

// Handle category select
window.handleSelectCategory = function(canonicalCat) {
  activeCategoryFilter = canonicalCat;
  renderCategoryFilterBar();
  renderSkillsGrid();
};

function renderSkillsGrid() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  let filtered = buildDisplaySkills();
  
  // Filter by Search Query
  if (query) {
    filtered = filtered.filter(s => {
      const text = [
        s.title,
        s.description,
        s.filename,
        s.search_text || '',
        ...(s.tags || [])
      ].join(' ').toLowerCase();
      return text.includes(query);
    });
  }
  
  // Filter by Category
  if (activeCategoryFilter) {
    filtered = filtered.filter(s => {
      return getCanonicalCategory(s) === activeCategoryFilter;
    });
  }

  cardsGrid.innerHTML = '';
  if (filtered.length === 0) {
    cardsGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🔍</div>
        <h4>${currentLanguage === 'zh' ? '未找到匹配的技能' : 'No matching skills found'}</h4>
        <p>${currentLanguage === 'zh' ? '请更换关键词或新建技能' : 'Change keywords or create a new skill'}</p>
      </div>`;
    return;
  }

  const activeProj = currentProjectPath ? projects.find(p => p.path === currentProjectPath) : null;
  const statusMap = activeProj ? (activeProj.skills_status || {}) : {};
  const fragment = document.createDocumentFragment();

  filtered.forEach((skill, index) => {
    const card = document.createElement('div');
    card.className = `skill-card${skill.is_collection ? ' collection-card' : ''}`;
    card.dataset.filename = skill.filename;
    card.style.transitionDelay = `${index * 35}ms`;

    // Apply 100% Local Smart Classifier for Emojis and Tags
    const smart = getSmartEmojiAndTags(skill);
    const resolvedEmoji = smart.emoji;
    const resolvedTags = smart.tags;

    let badgeHTML = '';
    let isChecked = false;

    if (currentProjectPath && activeProj && !activeProj.error) {
      let physicalStatus = statusMap[skill.filename] || 'unloaded';
      let isLocallyEnabled = enabledSkills.has(skill.filename);
      if (skill.is_collection) {
        const activeMembers = skill.collection_members.filter(
          member => member.collection?.enabled
        );
        const memberStatuses = activeMembers.map(
          member => statusMap[member.filename] || 'unloaded'
        );
        isLocallyEnabled = activeMembers.length > 0 && activeMembers.every(
          member => enabledSkills.has(member.filename)
        );
        if (memberStatuses.length && memberStatuses.every(status => status === 'synced')) {
          physicalStatus = 'synced';
        } else if (memberStatuses.length && memberStatuses.every(status => status === 'unloaded')) {
          physicalStatus = 'unloaded';
        } else {
          physicalStatus = 'out_of_sync';
        }
      }

      if (isLocallyEnabled) {
        isChecked = true;
        if (physicalStatus === 'synced') {
          badgeHTML = `<span class="status-badge synced"><span class="status-dot"></span>${locales[currentLanguage].statusSynced}</span>`;
        } else if (physicalStatus === 'out_of_sync') {
          badgeHTML = `<span class="status-badge out-of-sync"><span class="status-dot"></span>${locales[currentLanguage].statusUpdated}</span>`;
        } else {
          badgeHTML = `<span class="status-badge pending-mount"><span class="status-dot"></span>${locales[currentLanguage].statusPendingMount}</span>`;
        }
      } else {
        isChecked = false;
        if (physicalStatus === 'synced' || physicalStatus === 'out_of_sync') {
          badgeHTML = `<span class="status-badge pending-unmount"><span class="status-dot"></span>${locales[currentLanguage].statusPendingUnmount}</span>`;
        } else {
          badgeHTML = `<span class="status-badge unloaded"><span class="status-dot"></span>${locales[currentLanguage].statusUnloaded}</span>`;
        }
      }
    } else {
      badgeHTML = skill.is_collection
        ? `<span class="status-badge unloaded"><span class="status-dot"></span>${skill.collection_enabled_count}/${skill.collection_members.length} ${currentLanguage === 'zh' ? '已启用' : 'enabled'}</span>`
        : `<span class="status-badge unloaded"><span class="status-dot"></span>${locales[currentLanguage].statusReadonly}</span>`;
    }

    // Apply Dynamic Bilingual Translation Mapping for Skill Content
    let resolvedTitle = skill.title;
    let resolvedDesc = skill.description;
    const trans = skillTranslations[currentLanguage]?.[skill.filename];
    if (trans) {
      resolvedTitle = trans.title;
      resolvedDesc = trans.description;
    } else if (skill.description === '此技能暂无详细描述信息。') {
      resolvedDesc = locales[currentLanguage].defaultDesc;
    }

    // Split Chinese and English parts for clean layout
    let mainTitle = resolvedTitle;
    let subTitle = '';
    const parenMatch = resolvedTitle.match(/^([^()（）]+)[(（]([^)）]+)[)）]/);
    if (parenMatch) {
      mainTitle = parenMatch[1].trim();
      subTitle = parenMatch[2].trim();
    }

    // Translate Tags
    const translatedTags = resolvedTags.map(t => tagTranslations[currentLanguage]?.[t] || t);
    const tagsHTML = translatedTags.map(t => `<span class="badge">${escapeHtml(t)}</span>`).join('');
    const safeTitle = escapeHtml(resolvedTitle);
    const safeMainTitle = escapeHtml(mainTitle);
    const safeSubTitle = escapeHtml(subTitle);
    const safeDesc = escapeHtml(resolvedDesc);
    const displayFilename = skill.is_collection
      ? `${skill.collection_child_count} ${currentLanguage === 'zh' ? '个子技能' : 'child skills'}`
      : skill.filename;
    const safeFilename = escapeHtml(displayFilename);
    const cardTitle = skill.is_collection
      ? (currentLanguage === 'zh' ? `点击管理 ${resolvedTitle} 的子技能` : `Manage child skills in ${resolvedTitle}`)
      : (currentLanguage === 'zh' ? `点击查看 ${resolvedTitle} 的 Markdown 文档` : `Click to view the Markdown document for ${resolvedTitle}`);
    const actionButtons = skill.is_collection
      ? `
          <button type="button" class="btn btn-secondary btn-icon js-edit-skill" title="${currentLanguage === 'zh' ? '管理子技能' : 'Manage child skills'}" style="padding: 0.5rem; height: 32px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.8rem;">
            <i data-lucide="list-tree" style="width:14px;height:14px;"></i>${currentLanguage === 'zh' ? '管理子技能' : 'Manage'}
          </button>`
      : `
          <button type="button" class="btn btn-secondary btn-icon js-edit-skill" title="${escapeHtml(locales[currentLanguage].btnEditSkill)}" style="padding: 0.5rem; height: 32px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.8rem;">
            <i data-lucide="edit-3" style="width:14px;height:14px;"></i>${locales[currentLanguage].btnEditSkill}
          </button>
          <button type="button" class="btn btn-danger-outline btn-icon js-delete-skill" title="${currentLanguage === 'zh' ? '删除技能' : 'Delete Skill'}" style="padding: 0.5rem; height: 32px; width: 32px; display: inline-flex; align-items: center; justify-content: center;">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>`;

    card.innerHTML = `
      <div class="card-header">
        <div class="skill-meta">
          <div class="skill-emoji">${escapeHtml(resolvedEmoji)}</div>
          <div class="skill-info">
            <h4 class="skill-title" title="${safeTitle}">${safeMainTitle}</h4>
            ${subTitle ? `<span class="skill-subtitle" title="${safeSubTitle}">${safeSubTitle}</span>` : ''}
          </div>
        </div>
        ${badgeHTML}
      </div>
      <p class="card-body" title="${safeDesc}">${safeDesc}</p>
      <div class="card-meta-line">
        <span class="skill-tag${skill.is_collection ? ' collection-count' : ''}" title="${safeFilename}">${skill.is_collection ? '🧩 ' : (skill.is_dir ? '📁 ' : '')}${safeFilename}</span>
        <div class="card-tags">${tagsHTML}</div>
      </div>
      <div class="card-footer">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          ${actionButtons}
        </div>
        ${currentProjectPath && activeProj && !activeProj.error ? `
          <label class="switch-label">
            <span>${locales[currentLanguage].toggleLabel}</span>
            <label class="switch">
              <input type="checkbox" class="js-toggle-skill" ${isChecked ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </label>` : ''}
      </div>`;
    card.title = cardTitle;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', cardTitle);
    fragment.appendChild(card);
  });
  cardsGrid.appendChild(fragment);
  lucide.createIcons();

  // Staggered card entrance animation only on the first full render.
  requestAnimationFrame(() => {
    const cards = cardsGrid.querySelectorAll('.skill-card');
    if (hasRenderedSkillCards) {
      cards.forEach(card => card.classList.add('visible'));
      return;
    }
    cards.forEach((card, i) => setTimeout(() => card.classList.add('visible'), i * 40));
    hasRenderedSkillCards = true;
  });
}

// ------------------------------------------
// Event Handlers
// ------------------------------------------

async function handlePickProject() {
  try {
    const result = await window.pywebview.api.add_project_via_dialog();
    if (!result) return;
    if (result.error) {
      showToast(currentLanguage === 'zh' ? '该项目已关联' : 'This project is already linked', 'warning');
      return;
    }
    showToast(locales[currentLanguage].toastAssocSuccess + result.name, 'success');
    currentProjectPath = result.path;
    await fetchProjects();
    handleSelectProject(result.path);
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '关联项目失败: ' : 'Failed to link project: ') + e, 'error');
  }
}

async function handleCreateSkill() {
  const filename = await showCustomDialog({
    title: currentLanguage === 'zh' ? '新建技能' : 'New Skill',
    message: currentLanguage === 'zh' ? '请输入新技能文件名 (例如: 代码安全规范.md)' : 'Enter new skill filename (e.g. CodeSafety.md)',
    emoji: '💡',
    isPrompt: true,
    placeholder: 'CodeSafety.md'
  });
  if (!filename) return;
  try {
    const result = await window.pywebview.api.create_skill(filename);
    if (result.error) {
      showToast(currentLanguage === 'zh' ? result.error : 'File already exists', 'warning');
      return;
    }
    showToast(locales[currentLanguage].toastCreateSuccess + result.filename, 'success');
    await fetchSkills();
    openEditorModal(result.filename);
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '创建失败: ' : 'Failed to create skill: ') + e, 'error');
  }
}

function handleSelectProject(path) {
  if (currentProjectPath === path) {
    currentProjectPath = null;
    enabledSkills.clear();
    currentProjectTitle.textContent = locales[currentLanguage].noProjectTitle;
    currentProjectDesc.textContent = locales[currentLanguage].noProjectDesc;
    syncBtn.setAttribute('disabled', 'true');
    undoSyncBtn.setAttribute('disabled', 'true');
    syncBtn.classList.remove('pulsing-btn', 'active');
    renderProjectsList();
    renderSkillsGrid();
    updateStatistics();
    lucide.createIcons();
    showToast(locales[currentLanguage].exitProjectMode, 'success');
    return;
  }

  const proj = projects.find(p => p.path === path);
  if (!proj) return;
  if (proj.error) showToast(currentLanguage === 'zh' ? `项目路径无法访问: ${proj.error}` : `Project path inaccessible: ${proj.error}`, 'warning');
  currentProjectPath = path;
  _loadProjectState(proj);
}

// Reload the currently selected project's data without toggling selection
function refreshCurrentProject() {
  if (!currentProjectPath) return;
  const proj = projects.find(p => p.path === currentProjectPath);
  if (!proj) return;
  _loadProjectState(proj);
}

function _loadProjectState(proj) {
  enabledSkills.clear();
  if (Array.isArray(proj.enabled_skills)) {
    proj.enabled_skills.forEach(filename => enabledSkills.add(filename));
  } else {
    Object.entries(proj.skills_status || {}).forEach(([fname, status]) => {
      if (status === 'synced' || status === 'out_of_sync') enabledSkills.add(fname);
    });
  }
  currentProjectTitle.textContent = proj.name;
  currentProjectDesc.innerHTML = `<i data-lucide="folder" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${escapeHtml(proj.path)}`;
  syncBtn.removeAttribute('disabled');
  syncBtn.classList.add('pulsing-btn');
  undoSyncBtn.disabled = !proj.can_undo_sync;
  renderProjectsList();
  renderSkillsGrid();
  updateStatistics();
  lucide.createIcons();
}

function handleToggleSkill(filename, isEnabled) {
  if (isEnabled) enabledSkills.add(filename);
  else enabledSkills.delete(filename);
  syncBtn.classList.add('active');
  renderSkillsGrid();
}

function handleToggleCollectionMount(collectionSkill, isEnabled) {
  collectionSkill.collection_members
    .filter(member => member.collection?.enabled)
    .forEach(member => {
      if (isEnabled) enabledSkills.add(member.filename);
      else enabledSkills.delete(member.filename);
    });
  syncBtn.classList.add('active');
  renderSkillsGrid();
}

function getCollectionDisplaySkill(collectionId) {
  return buildDisplaySkills().find(
    skill => skill.is_collection && skill.collection_id === collectionId
  );
}

function openCollectionModal(collectionId) {
  const collectionSkill = getCollectionDisplaySkill(collectionId);
  if (!collectionSkill) return;
  activeCollectionId = collectionId;
  collectionModalTitle.textContent = collectionSkill.title;
  const hasPrimary = collectionSkill.collection_members.some(
    member => member.filename === collectionId
  );
  const childCount = collectionSkill.collection_child_count;
  collectionModalSummary.textContent = currentLanguage === 'zh'
    ? `${hasPrimary ? '1 个主控 + ' : ''}${childCount} 个子技能，可分别启用或停用`
    : `${hasPrimary ? '1 controller + ' : ''}${childCount} child skills; enable each independently`;
  collectionModalHint.textContent = currentLanguage === 'zh'
    ? '停用不会删除文件；项目将在下次同步时移除该子技能。'
    : 'Disabling keeps the files in the library; projects remove the child on next sync.';

  collectionMembersList.innerHTML = collectionSkill.collection_members.map(member => {
    const displayFilename = member.display_filename || member.filename;
    const translation = skillTranslations[currentLanguage]?.[displayFilename];
    const title = translation?.title || member.title;
    const description = translation?.description || member.description;
    const enabled = Boolean(member.collection?.enabled);
    const smart = getSmartEmojiAndTags(member);
    return `
      <div class="collection-member ${enabled ? 'enabled' : ''}" data-filename="${escapeHtml(member.filename)}">
        <div class="collection-member-main">
          <span class="collection-member-emoji">${escapeHtml(smart.emoji)}</span>
          <div class="collection-member-copy">
            <div class="collection-member-title">${escapeHtml(title)}</div>
            <div class="collection-member-description">${escapeHtml(description)}</div>
            <div class="collection-member-file">${escapeHtml(displayFilename)}</div>
          </div>
        </div>
        <div class="collection-member-actions">
          <button type="button" class="btn btn-secondary btn-icon js-view-collection-member" data-filename="${escapeHtml(member.filename)}" title="${currentLanguage === 'zh' ? '查看文档' : 'View docs'}">
            <i data-lucide="eye" style="width:14px;height:14px;"></i>
          </button>
          <span class="collection-member-state">${enabled ? (currentLanguage === 'zh' ? '启用' : 'On') : (currentLanguage === 'zh' ? '停用' : 'Off')}</span>
          <label class="switch">
            <input type="checkbox" class="js-collection-member-toggle" data-filename="${escapeHtml(member.filename)}" ${enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>`;
  }).join('');
  collectionModal.classList.add('active');
  lucide.createIcons();
}

function closeCollectionModal() {
  collectionModal.classList.remove('active');
  activeCollectionId = null;
}

collectionMembersList.addEventListener('change', async event => {
  if (!event.target.matches('.js-collection-member-toggle')) return;
  const input = event.target;
  const filename = input.dataset.filename;
  const enabled = input.checked;
  input.disabled = true;
  try {
    const result = await window.pywebview.api.set_collection_member_enabled(
      activeCollectionId,
      filename,
      enabled
    );
    if (result.error) throw new Error(result.error);
    if (!enabled) enabledSkills.delete(filename);
    await fetchSkills();
    if (currentProjectPath) syncBtn.classList.add('active');
    const collectionId = activeCollectionId;
    if (collectionId) openCollectionModal(collectionId);
    const member = getCollectionDisplaySkill(collectionId)?.collection_members?.find(
      item => item.filename === filename
    );
    const displayFilename = member?.display_filename || filename;
    showToast(
      currentLanguage === 'zh'
        ? `${displayFilename} 已${enabled ? '启用' : '停用'}`
        : `${displayFilename} ${enabled ? 'enabled' : 'disabled'}`,
      'success'
    );
  } catch (error) {
    input.checked = !enabled;
    input.disabled = false;
    showToast(
      (currentLanguage === 'zh' ? '更新子技能失败: ' : 'Failed to update child skill: ') + error,
      'error'
    );
  }
});

collectionMembersList.addEventListener('click', event => {
  const button = event.target.closest('.js-view-collection-member');
  if (!button) return;
  const filename = button.dataset.filename;
  closeCollectionModal();
  openSkillViewer(filename);
});

async function handleDeleteProject(event, path) {
  event.stopPropagation();
  const confirmed = await showCustomDialog({
    title: currentLanguage === 'zh' ? '解除关联' : 'Unlink Project',
    message: locales[currentLanguage].confirmRemove,
    emoji: '📂'
  });
  if (!confirmed) return;
  try {
    await window.pywebview.api.delete_project(path);
    showToast(locales[currentLanguage].toastRemoveSuccess, 'success');
    if (currentProjectPath === path) {
      currentProjectPath = null;
      currentProjectTitle.textContent = locales[currentLanguage].noProjectTitle;
      currentProjectDesc.textContent = locales[currentLanguage].noProjectDesc;
      syncBtn.setAttribute('disabled', 'true');
      undoSyncBtn.setAttribute('disabled', 'true');
      syncBtn.classList.remove('pulsing-btn', 'active');
    }
    await fetchProjects();
    renderSkillsGrid();
    updateStatistics();
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '移除失败: ' : 'Failed to remove: ') + e, 'error');
  }
}

async function handleSyncSkills() {
  if (!currentProjectPath) return;
  syncBtn.setAttribute('disabled', 'true');
  syncBtn.classList.remove('active');
  const originalHTML = syncBtn.innerHTML;
  syncBtn.innerHTML = `<span class="loading-spinner"></span> ${locales[currentLanguage].syncingBtn}`;

  try {
    const selectedSkills = Array.from(enabledSkills);
    let preview = await window.pywebview.api.preview_sync(currentProjectPath, selectedSkills);
    if (preview.error) throw new Error(preview.error);

    const changedCount = preview.summary.add + preview.summary.modify + preview.summary.delete + preview.summary.preserve;
    if (changedCount === 0) {
      showToast(locales[currentLanguage].syncPreviewNoChanges, 'success');
      return;
    }

    const confirmed = await showCustomDialog({
      title: locales[currentLanguage].syncPreviewTitle,
      message: formatSyncPreview(preview),
      emoji: '↻',
      confirmText: locales[currentLanguage].syncApply
    });
    if (!confirmed) return;

    let acceptedBundleFiles = false;
    if (preview.has_restricted_bundle_files) {
      acceptedBundleFiles = await showCustomDialog({
        title: currentLanguage === 'zh' ? '授权 Bundle 额外文件' : 'Authorize Extra Bundle Files',
        message: [
          currentLanguage === 'zh'
            ? '以下文件位于 README 和 .agent/skills 之外，将写入项目目录：'
            : 'These files are outside README and .agent/skills and will be written into the project:',
          '',
          ...preview.restricted_bundle_files.map(path => `• ${path}`)
        ].join('\n'),
        emoji: '⚠️',
        confirmText: currentLanguage === 'zh' ? '授权这些文件' : 'Authorize Files'
      });
      if (!acceptedBundleFiles) return;
    }

    let result = await window.pywebview.api.sync_skills(
      currentProjectPath,
      selectedSkills,
      Boolean(preview.has_conflicts),
      preview.plan_token,
      Boolean(acceptedBundleFiles)
    );
    if (result.requires_confirmation) {
      preview = result.preview;
      const reconfirmed = await showCustomDialog({
        title: locales[currentLanguage].syncPreviewTitle,
        message: formatSyncPreview(preview),
        emoji: '!',
        confirmText: locales[currentLanguage].syncApply
      });
      if (!reconfirmed) return;
      acceptedBundleFiles = false;
      if (preview.has_restricted_bundle_files) {
        acceptedBundleFiles = await showCustomDialog({
          title: currentLanguage === 'zh' ? '重新授权 Bundle 额外文件' : 'Reauthorize Extra Bundle Files',
          message: preview.restricted_bundle_files.map(path => `• ${path}`).join('\n'),
          emoji: '⚠️',
          confirmText: currentLanguage === 'zh' ? '授权这些文件' : 'Authorize Files'
        });
        if (!acceptedBundleFiles) return;
      }
      result = await window.pywebview.api.sync_skills(
        currentProjectPath,
        selectedSkills,
        true,
        preview.plan_token,
        Boolean(acceptedBundleFiles)
      );
    }
    if (result.requires_bundle_file_confirmation) {
      preview = result.preview;
      acceptedBundleFiles = await showCustomDialog({
        title: currentLanguage === 'zh' ? '授权 Bundle 额外文件' : 'Authorize Extra Bundle Files',
        message: preview.restricted_bundle_files.map(path => `• ${path}`).join('\n'),
        emoji: '⚠️',
        confirmText: currentLanguage === 'zh' ? '授权这些文件' : 'Authorize Files'
      });
      if (!acceptedBundleFiles) return;
      result = await window.pywebview.api.sync_skills(
        currentProjectPath,
        selectedSkills,
        Boolean(preview.has_conflicts),
        preview.plan_token,
        true
      );
    }
    if (result.error) throw new Error(result.error);
    showToast(locales[currentLanguage].toastSyncSuccess + result.synced_count + (currentLanguage === 'zh' ? ' 项技能' : ' skills'), 'success');
    await fetchProjects();
    refreshCurrentProject();
  } catch (e) {
    showToast(locales[currentLanguage].toastSyncFail + e, 'error');
  } finally {
    syncBtn.innerHTML = originalHTML;
    if (currentProjectPath) {
      syncBtn.removeAttribute('disabled');
      syncBtn.classList.add('pulsing-btn');
    }
    lucide.createIcons();
  }
}

function formatImportPreview(preview) {
  const isZh = currentLanguage === 'zh';
  const kindLabels = {
    markdown: isZh ? 'Markdown 技能' : 'Markdown skill',
    standard: isZh ? '标准 SKILL.md 技能包' : 'Standard SKILL.md package',
    collection: isZh ? '标准技能集合' : 'Standard skill collection',
    bundle: isZh ? 'SkillHub 组合技能包' : 'SkillHub bundle'
  };
  const changeLabels = {
    added_frontmatter: isZh ? '已补充完整元数据' : 'Added complete metadata',
    completed_frontmatter: isZh ? '已补齐缺失元数据' : 'Completed missing metadata',
    normalized_metadata: isZh ? '已规范化元数据格式' : 'Normalized metadata',
    converted_to_utf8: isZh ? '已转换为 UTF-8' : 'Converted to UTF-8',
    completed_standard_skill_metadata: isZh ? '已补齐 SKILL.md 的 name/description' : 'Completed SKILL.md name/description',
    created_bundle_readme: isZh ? '已为组合技能创建 README.md' : 'Created bundle README.md',
    ai_optimized: isZh ? 'AI 已优化入口文档' : 'AI optimized the entry document'
  };
  const processingMode = preview.ai_used
    ? (isZh ? '本地规则体检 + AI 优化' : 'Local validation + AI optimization')
    : preview.ai_requested
      ? (isZh ? '本地规则体检（AI 已回退）' : 'Local validation (AI fallback)')
      : (isZh ? '本地规则体检（未调用 AI）' : 'Local validation (AI not called)');
  const lines = [
    `${isZh ? '来源' : 'Source'}: ${preview.source_name}`,
    `${isZh ? '类型' : 'Type'}: ${kindLabels[preview.kind] || preview.kind}`,
    `${isZh ? '处理方式' : 'Processing'}: ${processingMode}`
  ];
  if (preview.kind === 'collection') {
    lines.push(
      `${isZh ? '集合内容' : 'Collection'}: ${preview.collection_count} ${
        isZh ? '个技能' : 'skills'
      }`,
      `${isZh ? '本次安装' : 'To install'}: ${preview.installable_count}`,
      `${isZh ? '更新' : 'Updates'}: ${preview.update_count || 0}`,
      `${isZh ? '冲突' : 'Conflicts'}: ${preview.conflict_count || 0}`,
      `${isZh ? '跳过重复' : 'Duplicates skipped'}: ${preview.duplicate_count}`
    );
    preview.collection_items?.forEach(item => {
      const statuses = {
        duplicate: isZh
          ? `跳过，与 ${item.duplicate_of} 内容相同`
          : `skip, identical to ${item.duplicate_of}`,
        update: isZh
          ? `更新 ${item.active_name}`
          : `update ${item.active_name}`,
        conflict: isZh
          ? `冲突：${item.active_name} 含本地修改`
          : `conflict: ${item.active_name} has local changes`,
        install: isZh
          ? `安装为 ${item.active_name}`
          : `install as ${item.active_name}`
      };
      const status = statuses[item.action] || statuses.install;
      lines.push(`• ${item.source_name}: ${status}`);
    });
  } else {
    lines.splice(
      1,
      0,
      `${isZh ? '导入为' : 'Import as'}: ${preview.active_name}`
    );
  }
  if (preview.replace_existing) {
    lines.push(
      `${isZh ? '应用方式' : 'Apply mode'}: ${
        isZh ? '原地更新，原文件会先归档' : 'Update in place after archiving the original'
      }`
    );
  }
  if (preview.changes?.length) {
    lines.push('', isZh ? '自动处理：' : 'Automatic changes:');
    preview.changes.forEach(code => lines.push(`• ${changeLabels[code] || code}`));
  }
  const ordinaryFindings = (preview.findings || []).filter(item => item.severity !== 'high');
  if (ordinaryFindings.length) {
    lines.push('', isZh ? `普通提示（${ordinaryFindings.length}）：` : `Standard findings (${ordinaryFindings.length}):`);
    ordinaryFindings.slice(0, 8).forEach(item => {
      lines.push(`• ${isZh ? item.message_zh : item.message_en}${item.path ? ` [${item.path}]` : ''}`);
    });
    if (ordinaryFindings.length > 8) {
      lines.push(isZh ? `…另有 ${ordinaryFindings.length - 8} 项` : `…and ${ordinaryFindings.length - 8} more`);
    }
  }
  if (preview.has_high_risk) {
    lines.push(
      '',
      isZh
        ? '检测到高风险项；普通导入确认后将单独展示并确认。'
        : 'High-risk findings were detected and will be shown in a separate confirmation.'
    );
  }
  if (preview.duplicate_of) {
    lines.push('', `${isZh ? '检测到完全重复' : 'Exact duplicate detected'}: ${preview.duplicate_of}`);
  }
  if (preview.ai_used) {
    lines.push(
      '',
      isZh
        ? 'AI 已改写入口文档；导入前还需要审阅并确认差异。'
        : 'AI rewrote the entry document; review and accept the diff before importing.'
    );
  }
  return lines.join('\n');
}

function formatAiImportDiff(preview) {
  const isZh = currentLanguage === 'zh';
  const sections = [];
  if (preview.kind === 'collection') {
    preview.collection_items?.forEach(item => {
      if (!item.ai_used) return;
      sections.push(
        `=== ${item.source_name} ===`,
        item.ai_diff || (isZh ? 'AI 未产生文本差异。' : 'AI produced no text difference.'),
        ''
      );
    });
  } else {
    sections.push(
      preview.ai_diff || (isZh ? 'AI 未产生文本差异。' : 'AI produced no text difference.')
    );
  }
  return [
    isZh
      ? '下面仅显示 AI 对暂存副本的改动。原版已经归档；确认后才会写入技能库。'
      : 'These are AI changes to the staged copy only. The upstream original is archived; nothing enters the library until you accept.',
    '',
    ...sections
  ].join('\n');
}

async function handleImportSkill() {
  const isZh = currentLanguage === 'zh';
  const selection = await showCustomDialog({
    title: isZh ? '导入技能' : 'Import Skill',
    message: isZh
      ? `基础导入始终使用本地规则。当前模式：${aiImportOptimization && hasAiKey ? '本地体检 + AI 优化' : '本地体检'}。请选择 Markdown/ZIP 文件、单个技能文件夹，或包含 skills/*/SKILL.md 的技能集合。`
      : `Local validation always runs. Current mode: ${aiImportOptimization && hasAiKey ? 'Local + AI optimization' : 'Local validation'}. Select a Markdown/ZIP file, one skill folder, or a collection containing skills/*/SKILL.md.`,
    emoji: '📥',
    confirmText: isZh ? '选择文件' : 'Choose File',
    secondaryText: isZh ? '选择文件夹' : 'Choose Folder',
    secondaryValue: 'folder'
  });
  if (!selection) return;
  const importKind = selection === 'folder' ? 'folder' : 'file';
  let preview;
  try {
    preview = await window.pywebview.api.preview_skill_import_via_dialog(importKind);
  } catch (e) {
    showToast((isZh ? '导入分析失败: ' : 'Import analysis failed: ') + e, 'error');
    return;
  }
  if (!preview) return;
  if (preview.error) {
    showToast((isZh ? '导入分析失败: ' : 'Import analysis failed: ') + preview.error, 'error');
    return;
  }

  const confirmed = await showCustomDialog({
    title: preview.can_import
      ? (isZh ? '确认导入' : 'Confirm Import')
      : (isZh ? '无需重复导入' : 'Duplicate Skill'),
    message: formatImportPreview(preview),
    emoji: preview.findings?.some(item => item.severity === 'high') ? '⚠️' : '📋',
    confirmText: preview.can_import ? (isZh ? '导入' : 'Import') : (isZh ? '关闭' : 'Close')
  });
  if (!confirmed || !preview.can_import) {
    try {
      await window.pywebview.api.discard_skill_import(preview.token);
    } catch (_e) {
      // Staged previews are also cleaned automatically after 24 hours.
    }
    return;
  }

  let acceptedHighRisk = false;
  if (preview.has_high_risk) {
    acceptedHighRisk = await showCustomDialog({
      title: isZh ? '单独确认高风险项' : 'Confirm High-Risk Findings',
      message: preview.findings
        .filter(item => item.severity === 'high')
        .map(item => `• ${isZh ? item.message_zh : item.message_en}${item.path ? ` [${item.path}]` : ''}`)
        .join('\n'),
      emoji: '⚠️',
      confirmText: isZh ? '确认风险并继续' : 'Accept Risk and Continue'
    });
    if (!acceptedHighRisk) {
      await window.pywebview.api.discard_skill_import(preview.token);
      return;
    }
  }

  let acceptedCollectionConflicts = false;
  if ((preview.conflict_count || 0) > 0) {
    acceptedCollectionConflicts = await showCustomDialog({
      title: isZh ? '确认覆盖集合冲突' : 'Confirm Collection Conflicts',
      message: preview.collection_items
        .filter(item => item.action === 'conflict')
        .map(item => `• ${item.source_name} → ${item.active_name}`)
        .join('\n'),
      emoji: '⚠️',
      confirmText: isZh ? '覆盖本地修改' : 'Overwrite Local Changes'
    });
    if (!acceptedCollectionConflicts) {
      await window.pywebview.api.discard_skill_import(preview.token);
      return;
    }
  }

  let acceptedAiChanges = false;
  if (preview.ai_used) {
    acceptedAiChanges = await showCustomDialog({
      title: isZh ? '审阅 AI 改写差异' : 'Review AI Changes',
      message: formatAiImportDiff(preview),
      emoji: '✨',
      confirmText: isZh ? '接受改写并导入' : 'Accept Changes and Import'
    });
    if (!acceptedAiChanges) {
      try {
        await window.pywebview.api.discard_skill_import(preview.token);
      } catch (_e) {
        // Staged previews are also cleaned automatically after 24 hours.
      }
      return;
    }
  }

  try {
    const result = await window.pywebview.api.apply_skill_import(
      preview.token,
      Boolean(acceptedAiChanges),
      Boolean(acceptedHighRisk),
      Boolean(acceptedCollectionConflicts)
    );
    if (result.requires_high_risk_confirmation) {
      throw new Error(
        isZh
          ? '高风险扫描结果尚未获得独立确认。'
          : 'High-risk findings have not been independently accepted.'
      );
    }
    if (result.requires_ai_confirmation) {
      throw new Error(
        isZh
          ? 'AI 改写尚未获得明确确认。'
          : 'AI changes have not been explicitly accepted.'
      );
    }
    if (result.error) throw new Error(result.error);
    if (result.kind === 'collection') {
      const skipped = result.skipped_duplicates?.length || 0;
      showToast(
        isZh
          ? `已导入 ${result.filenames.length} 个技能${skipped ? `，跳过 ${skipped} 个重复项` : ''}`
          : `Imported ${result.filenames.length} skills${skipped ? `; skipped ${skipped} duplicate(s)` : ''}`,
        'success'
      );
    } else {
      showToast(
        isZh
          ? `已通过${result.ai_used ? '本地体检和 AI 优化' : '本地体检'}导入：${result.filename}`
          : `Imported with ${result.ai_used ? 'local validation and AI optimization' : 'local validation'}: ${result.filename}`,
        'success'
      );
    }
    await fetchSkills();
    if (currentProjectPath) {
      await fetchProjects();
      refreshCurrentProject();
    }
    if (result.kind !== 'collection' || result.filenames?.length === 1) {
      openEditorModal(result.filename);
    }
  } catch (e) {
    showToast((isZh ? '导入失败: ' : 'Import failed: ') + e, 'error');
  }
}

async function checkForUnregisteredSkills() {
  const isZh = currentLanguage === 'zh';
  let scan;
  try {
    scan = await window.pywebview.api.scan_unregistered_skills();
  } catch (e) {
    showToast((isZh ? '检查新增技能失败: ' : 'Failed to scan new skills: ') + e, 'error');
    return;
  }
  if (!scan || scan.error || !scan.skills?.length) return;

  const names = scan.skills.slice(0, 8).map(item => {
    const state = item.change_type === 'modified'
      ? (isZh ? '（内容已变化）' : ' (content changed)')
      : '';
    return `• ${item.filename}${state}`;
  });
  if (scan.skills.length > 8) {
    names.push(isZh ? `…另有 ${scan.skills.length - 8} 个` : `…and ${scan.skills.length - 8} more`);
  }
  const choice = await showCustomDialog({
    title: isZh ? `发现 ${scan.skills.length} 个待体检技能` : `${scan.skills.length} skills need validation`,
    message: [
      isZh
        ? '这些技能是新复制的，或登记后内容发生了变化：'
        : 'These skills are newly copied or changed since they were registered:',
      '',
      ...names,
      '',
      isZh
        ? '可以逐个体检并原地优化，也可以保留原样并登记。'
        : 'Validate and optimize them in place, or keep them unchanged and register them.'
    ].join('\n'),
    emoji: '🆕',
    confirmText: isZh ? '逐个体检' : 'Validate',
    secondaryText: isZh ? '全部保留原样' : 'Keep All',
    secondaryValue: 'keep-all'
  });
  if (!choice) return;
  if (choice === 'keep-all') {
    for (const item of scan.skills) {
      await window.pywebview.api.acknowledge_unregistered_skill(item.filename);
    }
    showToast(isZh ? '新增技能已登记并保留原样' : 'New skills registered unchanged', 'success');
    return;
  }

  for (const item of scan.skills) {
    let preview;
    try {
      preview = await window.pywebview.api.preview_unregistered_skill(item.filename);
    } catch (e) {
      showToast(`${item.filename}: ${e}`, 'error');
      continue;
    }
    if (!preview || preview.error) {
      showToast(`${item.filename}: ${preview?.error || 'Preview failed'}`, 'error');
      continue;
    }
    const apply = await showCustomDialog({
      title: isZh ? `体检：${item.filename}` : `Validate: ${item.filename}`,
      message: formatImportPreview(preview),
      emoji: preview.findings?.some(finding => finding.severity === 'high') ? '⚠️' : '📋',
      confirmText: isZh ? '应用优化' : 'Apply',
      secondaryText: isZh ? '保留原样' : 'Keep Original',
      secondaryValue: 'keep'
    });
    if (apply === true) {
      let acceptedHighRisk = false;
      if (preview.has_high_risk) {
        acceptedHighRisk = await showCustomDialog({
          title: isZh ? '单独确认高风险项' : 'Confirm High-Risk Findings',
          message: preview.findings
            .filter(finding => finding.severity === 'high')
            .map(finding => `• ${isZh ? finding.message_zh : finding.message_en}`)
            .join('\n'),
          emoji: '⚠️',
          confirmText: isZh ? '确认风险并继续' : 'Accept Risk and Continue'
        });
        if (!acceptedHighRisk) {
          await window.pywebview.api.discard_skill_import(preview.token);
          continue;
        }
      }
      let acceptedAiChanges = false;
      if (preview.ai_used) {
        acceptedAiChanges = await showCustomDialog({
          title: isZh ? '审阅 AI 改写差异' : 'Review AI Changes',
          message: formatAiImportDiff(preview),
          emoji: '✨',
          confirmText: isZh ? '接受改写并应用' : 'Accept Changes and Apply'
        });
        if (!acceptedAiChanges) {
          await window.pywebview.api.discard_skill_import(preview.token);
          continue;
        }
      }
      const result = await window.pywebview.api.apply_skill_import(
        preview.token,
        Boolean(acceptedAiChanges),
        Boolean(acceptedHighRisk)
      );
      if (result.error) {
        showToast(`${item.filename}: ${result.error}`, 'error');
      } else {
        showToast(
          isZh
            ? `已原地处理：${result.filename}`
            : `Processed in place: ${result.filename}`,
          'success'
        );
      }
    } else {
      await window.pywebview.api.discard_skill_import(preview.token);
      if (apply === 'keep') {
        await window.pywebview.api.acknowledge_unregistered_skill(item.filename);
      } else {
        break;
      }
    }
  }
  await fetchSkills();
  if (currentProjectPath) {
    await fetchProjects();
    refreshCurrentProject();
  }
}

function formatSyncPreview(preview) {
  const summary = preview.summary;
  const isZh = currentLanguage === 'zh';
  const countLine = isZh
    ? `新增 ${summary.add}  修改 ${summary.modify}  删除 ${summary.delete}  保留 ${summary.preserve}`
    : `Add ${summary.add}  Modify ${summary.modify}  Delete ${summary.delete}  Preserve ${summary.preserve}`;
  const lines = [locales[currentLanguage].syncPreviewIntro, countLine];
  if (preview.has_conflicts) {
    lines.push('', locales[currentLanguage].syncPreviewConflict);
  }

  const labels = isZh
    ? { add: '新增', modify: '修改', delete: '删除', preserve: '保留' }
    : { add: 'ADD', modify: 'MOD', delete: 'DEL', preserve: 'KEEP' };
  const visibleChanges = preview.changes.filter(item => item.action !== 'unchanged');
  visibleChanges.slice(0, 14).forEach(item => {
    const conflict = item.conflict ? ' !' : '';
    lines.push(`${labels[item.action] || item.action}${conflict}  ${item.path}`);
  });
  if (visibleChanges.length > 14) {
    const remaining = visibleChanges.length - 14;
    lines.push(isZh ? `…另有 ${remaining} 项` : `...and ${remaining} more`);
  }
  return lines.join('\n');
}

async function handleUndoSync() {
  if (!currentProjectPath || undoSyncBtn.disabled) return;
  const confirmed = await showCustomDialog({
    title: locales[currentLanguage].undoSyncTitle,
    message: locales[currentLanguage].undoSyncMessage,
    emoji: '↶',
    confirmText: locales[currentLanguage].undoSyncConfirm
  });
  if (!confirmed) return;

  undoSyncBtn.disabled = true;
  syncBtn.disabled = true;
  try {
    const result = await window.pywebview.api.undo_last_sync(currentProjectPath);
    if (result.error) throw new Error(result.error);
    if (result.skipped_count > 0) {
      showToast(locales[currentLanguage].toastUndoPartial + result.skipped.join(', '), 'warning');
    } else {
      showToast(locales[currentLanguage].toastUndoSuccess, 'success');
    }
    await fetchProjects();
    refreshCurrentProject();
  } catch (e) {
    showToast(locales[currentLanguage].toastUndoFail + e, 'error');
  } finally {
    if (currentProjectPath) {
      syncBtn.disabled = false;
      const project = projects.find(item => item.path === currentProjectPath);
      undoSyncBtn.disabled = !project?.can_undo_sync;
    }
    lucide.createIcons();
  }
}

function handleSearch() {
  clearTimeout(searchRenderTimer);
  searchRenderTimer = setTimeout(renderSkillsGrid, 120);
}

// ------------------------------------------
// Editor Modal
// ------------------------------------------

function resetSkillModalForEditing() {
  isViewingSkill = false;
  markdownTextarea.readOnly = false;
  modalSaveBtn.style.display = '';
  modalTabEdit.textContent = locales[currentLanguage].editModalTabSource;
  modalTabPreview.textContent = locales[currentLanguage].editModalTabPreview;
  modalCloseFooter.textContent = locales[currentLanguage].editModalCancel;
}

function resetSkillModalForViewing() {
  isViewingSkill = true;
  editingFilename = null;
  markdownTextarea.readOnly = true;
  modalSaveBtn.style.display = 'none';
  modalTabEdit.textContent = locales[currentLanguage].viewModalTabSource;
  modalTabPreview.textContent = locales[currentLanguage].viewModalTabPreview;
  modalCloseFooter.textContent = locales[currentLanguage].viewModalClose;
}

async function openEditorModal(filename) {
  resetSkillModalForEditing();
  editingFilename = filename;
  modalBody.className = 'modal-body tab-edit';
  modalTabEdit.classList.add('active');
  modalTabPreview.classList.remove('active');
  const skill = skills.find(s => s.filename === filename);
  modalEmoji.textContent = skill ? skill.emoji : '📄';
  modalTitle.textContent = (currentLanguage === 'zh' ? `编辑技能: ` : 'Edit Skill: ') + (skill ? skill.title : filename);
  markdownTextarea.value = currentLanguage === 'zh' ? '加载中…' : 'Loading...';
  markdownTextarea.setAttribute('disabled', 'true');
  editorModal.classList.add('active');
  try {
    const data = await window.pywebview.api.get_skill_content(filename);
    if (data.error) throw new Error(data.error);
    markdownTextarea.value = data.content;
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '加载失败: ' : 'Failed to load: ') + e, 'error');
    closeEditorModal();
  } finally {
    markdownTextarea.removeAttribute('disabled');
    markdownTextarea.focus();
  }
  lucide.createIcons();
}

async function openSkillViewer(filename) {
  resetSkillModalForViewing();
  modalBody.className = 'modal-body tab-preview';
  modalTabEdit.classList.remove('active');
  modalTabPreview.classList.add('active');
  const skill = skills.find(s => s.filename === filename);
  modalEmoji.textContent = skill ? skill.emoji : '📄';
  modalTitle.textContent = `${locales[currentLanguage].viewModalTitle}: ${skill ? skill.title : filename}`;
  markdownTextarea.value = currentLanguage === 'zh' ? '加载中...' : 'Loading...';
  markdownPreview.innerHTML = `<p>${currentLanguage === 'zh' ? '加载中...' : 'Loading...'}</p>`;
  markdownTextarea.setAttribute('disabled', 'true');
  editorModal.classList.add('active');
  try {
    const data = await window.pywebview.api.get_skill_content(filename);
    if (data.error) throw new Error(data.error);
    markdownTextarea.value = data.content;
    markdownPreview.innerHTML = renderMarkdown(data.content);
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '加载失败: ' : 'Failed to load: ') + e, 'error');
    closeEditorModal();
  } finally {
    markdownTextarea.removeAttribute('disabled');
  }
  lucide.createIcons();
}

function closeEditorModal() {
  editorModal.classList.remove('active');
  editingFilename = null;
  isViewingSkill = false;
  markdownTextarea.readOnly = false;
  modalSaveBtn.style.display = '';
}

function switchModalTab(tab) {
  if (tab === 'edit') {
    modalTabEdit.classList.add('active');
    modalTabPreview.classList.remove('active');
    modalBody.className = 'modal-body tab-edit';
  } else {
    modalTabEdit.classList.remove('active');
    modalTabPreview.classList.add('active');
    modalBody.className = 'modal-body tab-preview';
    markdownPreview.innerHTML = renderMarkdown(markdownTextarea.value);
  }
}

async function handleSaveSkill() {
  if (isViewingSkill) return;
  if (!editingFilename) return;
  try {
    const result = await window.pywebview.api.save_skill(editingFilename, markdownTextarea.value);
    if (result.error) throw new Error(result.error);
    showToast(locales[currentLanguage].toastSaveSuccess, 'success');
    closeEditorModal();
    await fetchSkills();
    await checkForUnregisteredSkills();
    if (currentProjectPath) {
      await fetchProjects();
      refreshCurrentProject();
    }
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '保存失败: ' : 'Failed to save: ') + e, 'error');
  }
}

// ------------------------------------------
// Toast System
// ------------------------------------------

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  let icon = 'check', iconClass = 'success';
  if (type === 'error') { icon = 'x'; iconClass = 'error'; }
  else if (type === 'warning') { icon = 'alert-triangle'; iconClass = 'warning'; }
  toast.innerHTML = `
    <div class="toast-icon ${iconClass}">
      <i data-lucide="${icon}" style="width:14px;height:14px;"></i>
    </div>
    <span class="toast-message">${message}</span>`;
  toastContainer.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

async function handleChangeSkillsDir() {
  try {
    const result = await window.pywebview.api.change_skills_dir();
    if (!result) return;
    showToast(locales[currentLanguage].toastPathUpdate, 'success');
    skillsDirPath.textContent = result.skills_dir;
    skillsDirPath.title = result.skills_dir;
    await fetchSkills();
    await fetchProjects();
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '更改全局技能库失败: ' : 'Failed to change skills directory: ') + e, 'error');
  }
}

async function handleRefreshSkills() {
  const icon = document.querySelector('#btn-refresh-skills i');
  if (icon) {
    icon.classList.add('spinning');
  }
  try {
    await fetchSkills();
    if (currentProjectPath) {
      await fetchProjects();
      
      const proj = projects.find(p => p.path === currentProjectPath);
      if (proj) {
        enabledSkills.clear();
        Object.entries(proj.skills_status || {}).forEach(([fname, status]) => {
          if (status === 'synced' || status === 'out_of_sync') enabledSkills.add(fname);
        });
        currentProjectTitle.textContent = proj.name;
        currentProjectDesc.innerHTML = `<i data-lucide="folder" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${escapeHtml(proj.path)}`;
        updateStatistics();
      }
      renderProjectsList();
      renderSkillsGrid();
    }
    showToast(locales[currentLanguage].toastRefreshSuccess, 'success');
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '刷新技能库失败: ' : 'Failed to refresh skills: ') + e, 'error');
  } finally {
    if (icon) {
      setTimeout(() => {
        icon.classList.remove('spinning');
      }, 500);
    }
  }
}

// ------------------------------------------
// Settings Modal Handlers
// ------------------------------------------

const settingsModal = document.getElementById('settings-modal');
const settingsLanguage = document.getElementById('settings-language');
const settingsTheme = document.getElementById('settings-theme');
const settingsSkillsDir = document.getElementById('settings-skills-dir');
const settingsScanDir = document.getElementById('settings-scan-dir');

function openSettingsModal() {
  settingsLanguage.value = currentLanguage;
  settingsTheme.value = currentTheme;
  settingsSkillsDir.value = skillsDirPath.textContent;
  settingsScanDir.value = defaultScanDir;
  document.getElementById('settings-aimodel').value = deepseekModel;
  document.getElementById('settings-apibase').value = apiBase;
  // API key field: leave empty placeholder — user must re-enter to change
  document.getElementById('settings-apikey').value = '';
  document.getElementById('settings-apikey').type = 'password';
  document.getElementById('settings-ai-import-optimization').checked = aiImportOptimization;
  updateAIConfigurationIndicators();

  settingsModal.classList.add('active');
  lucide.createIcons();
}

function closeSettingsModal() {
  settingsModal.classList.remove('active');
}

async function handleSettingsPickSkillsDir() {
  try {
    const result = await window.pywebview.api.change_skills_dir();
    if (!result) return;
    settingsSkillsDir.value = result.skills_dir;
    showToast(locales[currentLanguage].toastPathUpdate, 'success');
  } catch (e) {
    showToast('Failed to select path: ' + e, 'error');
  }
}

async function handleSettingsPickScanDir() {
  try {
    const result = await window.pywebview.api.pick_default_scan_dir();
    if (!result) return;
    settingsScanDir.value = result.default_scan_dir;
    showToast(currentLanguage === 'zh' ? '默认扫描起点已更新' : 'Default projects path updated', 'success');
  } catch (e) {
    showToast('Failed to select path: ' + e, 'error');
  }
}

async function handleSaveSettings() {
  try {
    const settings = {
      skills_dir: settingsSkillsDir.value,
      language: settingsLanguage.value,
      theme: settingsTheme.value,
      default_scan_dir: settingsScanDir.value,
      ai_import_optimization: document.getElementById('settings-ai-import-optimization').checked
    };
    const result = await window.pywebview.api.save_settings(settings);

    // Save AI config separately if API key, model, or base URL changed
    const apiKeyInput = document.getElementById('settings-apikey');
    const modelInput = document.getElementById('settings-aimodel');
    const apiBaseInput = document.getElementById('settings-apibase');
    const newModel = modelInput.value.trim() || deepseekModel;
    const newApiBase = apiBaseInput.value.trim() || apiBase;

    if (apiKeyInput.value.trim() || newApiBase !== apiBase || newModel !== deepseekModel) {
      const aiResult = await window.pywebview.api.save_ai_config(
        apiKeyInput.value.trim(),
        newModel,
        newApiBase
      );
      hasAiKey = Boolean(aiResult.has_ai_key);
      apiKeyHint = aiResult.api_key_hint || apiKeyHint;
    }
    deepseekModel = newModel;
    apiBase = newApiBase;

    currentLanguage = result.language;
    currentTheme = result.theme;
    defaultScanDir = result.default_scan_dir;
    aiImportOptimization = Boolean(result.ai_import_optimization);
    skillsDirPath.textContent = result.skills_dir;
    skillsDirPath.title = result.skills_dir;

    applyTheme(currentTheme);
    applyLanguage(currentLanguage);
    updateAIConfigurationIndicators();

    closeSettingsModal();
    showToast(locales[currentLanguage].toastSettingsSaved, 'success');
  } catch (e) {
    showToast('Failed to save settings: ' + e, 'error');
  }
}

// ------------------------------------------
// AI Chat Modal (with session management)
// ------------------------------------------

const aiModal = document.getElementById('ai-modal');
const aiChatMessages = document.getElementById('ai-chat-messages');
const aiChatInput = document.getElementById('ai-chat-input');
const aiSendBtn = document.getElementById('ai-send-btn');
const aiSkillPreview = document.getElementById('ai-skill-preview');
const aiSkillContent = document.getElementById('ai-skill-content');
const aiWebSearchToggle = document.getElementById('ai-web-search-toggle');
const aiSessionList = document.getElementById('ai-session-list');

let aiChatHistory = [];
let aiIsLoading = false;
let currentSessionId = null;
let allSessions = [];

async function openAIModal() {
  aiIsLoading = false;
  aiGeneratedSkill = null;
  aiSkillPreview.style.display = 'none';
  aiModal.classList.add('active');
  await loadSessionList(true);
  lucide.createIcons();
  setTimeout(() => aiChatInput.focus(), 200);
}

async function closeAIModal() {
  aiModal.classList.remove('active');
  await saveCurrentSession();
}

async function loadSessionList(selectSession = false) {
  try {
    allSessions = await window.pywebview.api.chat_list_sessions();
  } catch (e) {
    if (selectSession) allSessions = [];
  }
  renderSessionList();
  if (!selectSession) return;

  const preferredSession = allSessions.find(session => session.id === currentSessionId) || allSessions[0];
  if (preferredSession) {
    await switchToSession(preferredSession.id, false);
  } else {
    await createNewSession(false);
  }
}

function renderSessionList() {
  aiSessionList.innerHTML = '';
  allSessions.forEach(s => {
    const div = document.createElement('div');
    div.className = 'ai-session-item' + (s.id === currentSessionId ? ' active' : '');
    div.onclick = async () => { await switchToSession(s.id); };
    div.innerHTML = `
      <div class="ai-session-item-title">${escapeHtml(s.title || '未命名')}</div>
      <div class="ai-session-item-meta">${s.msg_count || 0} 条消息</div>
      <button class="ai-session-del" onclick="event.stopPropagation();deleteSession('${s.id}')" title="删除">×</button>`;
    aiSessionList.appendChild(div);
  });
}

async function switchToSession(sid, saveBeforeSwitch = true) {
  if (sid === currentSessionId && aiChatHistory.length > 0) {
    renderSessionList();
    renderChatHistory();
    return;
  }
  if (saveBeforeSwitch) {
    await saveCurrentSession();
  }
  currentSessionId = sid;
  aiChatHistory = [];
  aiSkillPreview.style.display = 'none';
  aiGeneratedSkill = null;

  try {
    const r = await window.pywebview.api.chat_load_session(sid);
    if (r.session && r.session.messages) {
      aiChatHistory = r.session.messages;
    }
  } catch (e) { /* ignore */ }

  renderSessionList();
  renderChatHistory();
}

async function createNewSession(saveBeforeCreate = true) {
  if (saveBeforeCreate) {
    await saveCurrentSession();
  }
  currentSessionId = 's_' + Date.now();
  aiChatHistory = [];
  aiSkillPreview.style.display = 'none';
  aiGeneratedSkill = null;
  allSessions.unshift({ id: currentSessionId, title: '新会话', msg_count: 0 });
  renderSessionList();
  renderChatHistory();
}

async function deleteSession(sid) {
  try { await window.pywebview.api.chat_delete_session(sid); } catch (e) {}
  allSessions = allSessions.filter(s => s.id !== sid);
  if (sid === currentSessionId) {
    currentSessionId = null;
    aiChatHistory = [];
  }
  renderSessionList();
  if (allSessions.length > 0 && !currentSessionId) {
    await switchToSession(allSessions[0].id, false);
  } else if (allSessions.length === 0) {
    await createNewSession(false);
  }
  renderChatHistory();
}

async function saveCurrentSession() {
  if (!currentSessionId || aiChatHistory.length === 0) return true;
  const title = aiChatHistory.find(m => m.role === 'user')?.content?.slice(0, 30) || '未命名';
  const messages = aiChatHistory.map(message => ({ ...message }));
  try {
    const result = await window.pywebview.api.chat_save_session(
      currentSessionId,
      title,
      messages
    );
    if (result?.error) throw new Error(result.error);
    const existing = allSessions.find(session => session.id === currentSessionId);
    if (existing) {
      existing.title = title;
      existing.msg_count = messages.length;
    } else {
      allSessions.unshift({
        id: currentSessionId,
        title,
        msg_count: messages.length
      });
    }
    return true;
  } catch (e) {
    showToast(
      (currentLanguage === 'zh' ? '会话保存失败: ' : 'Failed to save chat: ') + (e.message || e),
      'error'
    );
    return false;
  }
}

function renderChatHistory() {
  aiChatMessages.innerHTML = '';
  if (aiChatHistory.length === 0) {
    aiChatMessages.innerHTML = `
      <div class="ai-chat-empty">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;">✨</div>
        <h4 style="font-weight:700;margin-bottom:0.25rem;color:var(--text-primary);">AI 技能顾问</h4>
        <p style="color:var(--text-tertiary);font-size:0.78rem;">告诉我你的项目需求，我帮你梳理并生成专业的开发技能规范</p>
      </div>`;
  } else {
    aiChatHistory.forEach(m => {
      appendChatBubble(m.role, m.content);
    });
  }
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

// --- Chat interaction ---

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAIMessage();
  }
}

async function sendAIMessage() {
  const text = aiChatInput.value.trim();
  if (!text || aiIsLoading) return;

  const emptyEl = aiChatMessages.querySelector('.ai-chat-empty');
  if (emptyEl) emptyEl.remove();

  appendChatBubble('user', text);
  aiChatInput.value = '';
  aiChatHistory.push({ role: 'user', content: text });

  if (aiWebSearchToggle.checked) {
    try {
      const sr = await window.pywebview.api.ai_web_search(text);
      if (sr.results && sr.results.length > 0) {
        const ctx = '以下是最新网络搜索结果（供参考）：\n' +
          sr.results.map(r => `- [${r.title}](${r.href}): ${r.body.slice(0, 200)}`).join('\n');
        aiChatHistory.push({ role: 'user', content: ctx });
      }
    } catch (e) {}
  }

  const typingId = showTypingIndicator();
  aiIsLoading = true;
  aiSendBtn.setAttribute('disabled', 'true');

  try {
    const result = await window.pywebview.api.ai_chat(
      aiChatHistory.map(m => ({ role: m.role, content: m.content })),
      'chat'
    );
    removeTypingIndicator(typingId);
    if (result.error) {
      appendChatBubble('ai', '❌ ' + result.error);
    } else {
      appendChatBubble('ai', result.reply);
      aiChatHistory.push({ role: 'assistant', content: result.reply });
    }
    await saveCurrentSession();
    await loadSessionList(false);
  } catch (e) {
    removeTypingIndicator(typingId);
    appendChatBubble('ai', '❌ ' + (e.message || e));
  } finally {
    aiIsLoading = false;
    aiSendBtn.removeAttribute('disabled');
    aiChatInput.focus();
  }
}

async function handleNewSession() {
  await createNewSession();
  aiChatInput.focus();
}

async function handleAIGenerateSkill() {
  if (aiChatHistory.length === 0 || aiIsLoading) return;
  const typingId = showTypingIndicator();
  aiIsLoading = true;
  try {
    const result = await window.pywebview.api.ai_chat(
      aiChatHistory.map(m => ({ role: m.role, content: m.content })),
      'generate'
    );
    removeTypingIndicator(typingId);
    if (result.error) {
      appendChatBubble('ai', '❌ ' + result.error);
    } else if (result.skill) {
      aiGeneratedSkill = result.skill;
      aiSkillContent.innerHTML = renderMarkdown(aiGeneratedSkill.content || '');
      aiSkillPreview.style.display = 'block';
      aiChatHistory.push({ role: 'assistant', content: '✅ 技能已生成，请在下方预览并保存' });
      appendChatBubble('ai', '✅ 技能已生成！你可以在下方预览，满意后点击 **保存**。');
      await saveCurrentSession();
      await loadSessionList(false);
    }
  } catch (e) {
    removeTypingIndicator(typingId);
    appendChatBubble('ai', '❌ ' + (e.message || e));
  } finally {
    aiIsLoading = false;
  }
}

async function handleAISave() {
  if (!aiGeneratedSkill) return;
  let fname = (aiGeneratedSkill.title || 'ai_skill')
    .replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_').slice(0, 60);
  if (!fname) fname = 'ai_generated_skill';
  fname += '.md';
  try {
    const r = await window.pywebview.api.ai_save_skill({ filename: fname, content: aiGeneratedSkill.content });
    if (r.error) throw new Error(r.error);
    showToast((currentLanguage === 'zh' ? '✅ 已保存: ' : '✅ Saved: ') + r.filename, 'success');
    aiSkillPreview.style.display = 'none';
    aiGeneratedSkill = null;
    await fetchSkills();
    if (currentProjectPath) { await fetchProjects(); refreshCurrentProject(); }
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '保存失败: ' : 'Failed: ') + e, 'error');
  }
}

async function handleAIRegenerate() {
  aiSkillPreview.style.display = 'none';
  aiGeneratedSkill = null;
  if (aiChatHistory.length > 0 && aiChatHistory[aiChatHistory.length - 1].role === 'assistant') {
    aiChatHistory.pop();
  }
  await handleAIGenerateSkill();
}

// --- Connection Test ---

async function handleAITestConnection() {
  const btn = document.getElementById('btn-test-connection');
  const resultDiv = document.getElementById('test-result');
  const origHTML = btn.innerHTML;

  btn.innerHTML = '<div class="loading-spinner" style="width:14px;height:14px;"></div>';
  btn.setAttribute('disabled', 'true');
  resultDiv.style.display = 'none';

  try {
    // Save the model and base URL first (they might have changed)
    const modelInput = document.getElementById('settings-aimodel');
    const apiKeyInput = document.getElementById('settings-apikey');
    const apiBaseInput = document.getElementById('settings-apibase');
    const newModel = modelInput.value.trim() || 'deepseek-chat';
    const newApiBase = apiBaseInput.value.trim() || 'https://api.deepseek.com/v1';

    const savedConfig = await window.pywebview.api.save_ai_config(
      apiKeyInput.value.trim(),
      newModel,
      newApiBase
    );
    hasAiKey = Boolean(savedConfig.has_ai_key);
    apiKeyHint = savedConfig.api_key_hint || apiKeyHint;
    deepseekModel = newModel;
    apiBase = newApiBase;

    const result = await window.pywebview.api.ai_test_connection();
    resultDiv.style.display = 'block';
    if (result.ok) {
      resultDiv.style.background = 'var(--green-soft)';
      resultDiv.style.color = 'var(--green)';
      resultDiv.textContent = (currentLanguage === 'zh'
        ? `✅ 连接成功！模型: ${result.model}，延迟: ${result.latency_ms}ms`
        : `✅ Connected! Model: ${result.model}, Latency: ${result.latency_ms}ms`);
      updateAIConfigurationIndicators();
    } else {
      resultDiv.style.background = 'var(--rose-soft)';
      resultDiv.style.color = 'var(--rose)';
      resultDiv.textContent = '❌ ' + result.error;
    }
  } catch (e) {
    resultDiv.style.display = 'block';
    resultDiv.style.background = 'var(--rose-soft)';
    resultDiv.style.color = 'var(--rose)';
    resultDiv.textContent = '❌ ' + e;
  } finally {
    btn.innerHTML = origHTML;
    btn.removeAttribute('disabled');
    lucide.createIcons();
  }
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('settings-apikey');
  const icon = document.getElementById('apikey-eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

// --- Chat UI Helpers ---

function appendChatBubble(role, text) {
  const div = document.createElement('div');
  div.className = `ai-chat-bubble ai-chat-${role}`;
  div.innerHTML = `<div class="ai-chat-bubble-content">${renderMarkdown(text)}</div>`;
  aiChatMessages.appendChild(div);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  lucide.createIcons();
}

let _typingCounter = 0;
function showTypingIndicator() {
  const id = ++_typingCounter;
  const div = document.createElement('div');
  div.className = 'ai-chat-bubble ai-chat-ai';
  div.id = `typing-${id}`;
  div.innerHTML = '<div class="ai-chat-bubble-content"><div class="ai-typing"><span></span><span></span><span></span></div></div>';
  aiChatMessages.appendChild(div);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(`typing-${id}`);
  if (el) el.remove();
}

// ------------------------------------------
// Custom Dialog Modal System
// ------------------------------------------

let dialogResolve = null;

function showCustomDialog({
  title,
  message,
  emoji = '💬',
  isPrompt = false,
  placeholder = '',
  defaultValue = '',
  confirmText = '',
  secondaryText = '',
  secondaryValue = 'secondary'
}) {
  return new Promise((resolve) => {
    dialogResolve = resolve;
    
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-message').textContent = message;
    document.getElementById('dialog-emoji').textContent = emoji;
    
    const inputContainer = document.getElementById('dialog-input-container');
    const inputEl = document.getElementById('dialog-input');
    
    if (isPrompt) {
      inputContainer.style.display = 'block';
      inputEl.value = defaultValue;
      inputEl.placeholder = placeholder;
    } else {
      inputContainer.style.display = 'none';
    }
    
    document.getElementById('dialog-btn-cancel').textContent = locales[currentLanguage].editModalCancel || 'Cancel';
    document.getElementById('dialog-btn-confirm').textContent = confirmText || (currentLanguage === 'zh' ? '确定' : 'Confirm');
    const secondaryBtn = document.getElementById('dialog-btn-secondary');
    secondaryBtn.style.display = secondaryText ? 'inline-flex' : 'none';
    secondaryBtn.textContent = secondaryText;
    secondaryBtn.onclick = () => {
      const resolve = dialogResolve;
      dialogResolve = null;
      const modal = document.getElementById('dialog-modal');
      if (modal) modal.classList.remove('active');
      if (resolve) resolve(secondaryValue);
    };
    
    const confirmBtn = document.getElementById('dialog-btn-confirm');
    confirmBtn.onclick = () => {
      const val = isPrompt ? inputEl.value.trim() : true;
      const resolve = dialogResolve;
      dialogResolve = null;
      
      const modal = document.getElementById('dialog-modal');
      if (modal) modal.classList.remove('active');
      
      if (resolve) resolve(val);
    };
    
    document.getElementById('dialog-modal').classList.add('active');
    
    if (isPrompt) {
      setTimeout(() => {
        inputEl.focus();
        inputEl.select();
      }, 50);
    }
  });
}

function closeDialogModal() {
  const modal = document.getElementById('dialog-modal');
  if (modal) modal.classList.remove('active');
  if (dialogResolve) {
    const resolve = dialogResolve;
    dialogResolve = null;
    resolve(null);
  }
}

// Keyboard shortcuts for Custom Dialog Modal (Null-Safe)
const dialogInput = document.getElementById('dialog-input');
if (dialogInput) {
  dialogInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const confirmBtn = document.getElementById('dialog-btn-confirm');
      if (confirmBtn) confirmBtn.click();
    } else if (e.key === 'Escape') {
      closeDialogModal();
    }
  });
}

// ------------------------------------------
// Delete Skill Feature
// ------------------------------------------

async function handleDeleteSkill(filename) {
  const confirmed = await showCustomDialog({
    title: currentLanguage === 'zh' ? '删除技能' : 'Delete Skill',
    message: currentLanguage === 'zh' ? `确定要从全局技能库中物理删除 "${filename}" 吗？该操作不可撤销！` : `Are you sure you want to permanently delete "${filename}" from the global library? This cannot be undone!`,
    emoji: '🗑️'
  });
  if (!confirmed) return;
  
  try {
    const result = await window.pywebview.api.delete_skill(filename);
    if (result.error) throw new Error(result.error);
    showToast(currentLanguage === 'zh' ? '🗑️ 技能已物理删除' : '🗑️ Skill file permanently deleted', 'success');
    await fetchSkills();
    if (currentProjectPath) {
      await fetchProjects();
      refreshCurrentProject();
    }
  } catch (e) {
    showToast((currentLanguage === 'zh' ? '删除失败: ' : 'Failed to delete: ') + e, 'error');
  }
}

// ------------------------------------------
// Explicit Global Window Scope Bindings
// ------------------------------------------
window.handleChangeSkillsDir = handleChangeSkillsDir;
window.handleRefreshSkills = handleRefreshSkills;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.handleSettingsPickSkillsDir = handleSettingsPickSkillsDir;
window.handleSettingsPickScanDir = handleSettingsPickScanDir;
window.handleSaveSettings = handleSaveSettings;
window.handlePickProject = handlePickProject;
window.handleCreateSkill = handleCreateSkill;
window.handleImportSkill = handleImportSkill;
window.handleSelectProject = handleSelectProject;
window.handleToggleSkill = handleToggleSkill;
window.handleDeleteProject = handleDeleteProject;
window.handleSyncSkills = handleSyncSkills;
window.handleSearch = handleSearch;
window.openSkillViewer = openSkillViewer;
window.openEditorModal = openEditorModal;
window.openCollectionModal = openCollectionModal;
window.closeCollectionModal = closeCollectionModal;
window.closeEditorModal = closeEditorModal;
window.switchModalTab = switchModalTab;
window.handleSaveSkill = handleSaveSkill;
window.closeDialogModal = closeDialogModal;
window.handleDeleteSkill = handleDeleteSkill;
window.showCustomDialog = showCustomDialog;
window.openAIModal = openAIModal;
window.closeAIModal = closeAIModal;
window.sendAIMessage = sendAIMessage;
window.handleChatKeydown = handleChatKeydown;
window.handleAIGenerateSkill = handleAIGenerateSkill;
window.handleAISave = handleAISave;
window.handleAIRegenerate = handleAIRegenerate;
window.handleAITestConnection = handleAITestConnection;
window.toggleApiKeyVisibility = toggleApiKeyVisibility;
window.handleNewSession = handleNewSession;
window.deleteSession = deleteSession;

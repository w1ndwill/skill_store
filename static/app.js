// ==========================================
// AI Skill Hub Manager - pywebview Frontend
// ==========================================

let projects = [];
let skills = [];
let currentProjectPath = null;
let enabledSkills = new Set();
let editingFilename = null;

// i18n & Theme State
let currentLanguage = 'zh';
let currentTheme = 'light';
let defaultScanDir = '';
let deepseekApiKey = '';
let deepseekModel = 'deepseek-chat';
let aiGeneratedSkill = null; // cached AI result
let activeCategoryFilter = null; // active category filter (null = show all)

// DOM cache
const projectList = document.getElementById('project-list');
const cardsGrid = document.getElementById('cards-grid');
const syncBtn = document.getElementById('sync-btn');
const currentProjectTitle = document.getElementById('current-project-title');
const currentProjectDesc = document.getElementById('current-project-desc');
const editorModal = document.getElementById('editor-modal');
const modalTitle = document.getElementById('modal-title');
const modalEmoji = document.getElementById('modal-emoji');
const modalBody = document.getElementById('modal-body');
const markdownTextarea = document.getElementById('markdown-textarea');
const markdownPreview = document.getElementById('markdown-preview');
const toastContainer = document.getElementById('toast-container');
const searchInput = document.getElementById('search-input');
const skillsDirPath = document.getElementById('skills-dir-path');
const toolbarStats = document.getElementById('toolbar-stats');
const categoryFilterBar = document.getElementById('category-filter-bar');

// ------------------------------------------
// Bilingual i18n Dictionary
// ------------------------------------------
const locales = {
  zh: {
    sidebarTitle: 'AI Skill Hub',
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
    btnEditSkill: '编辑技能',
    toggleLabel: '启用装载',
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
    exitProjectMode: '已退出项目配置模式，返回全局只读视图',
    confirmRemove: '确定要移除此项目的关联吗？\n不会删除项目中的任何文件。',
    defaultDesc: '此技能暂无详细描述信息。'
  },
  en: {
    sidebarTitle: 'AI Skill Hub',
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
    btnEditSkill: 'Edit Skill',
    toggleLabel: 'Enable Mount',
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
    exitProjectMode: 'Exited project configuration mode, returned to global read-only view',
    confirmRemove: 'Are you sure you want to unlink this project?\nNo files will be deleted from your disk.',
    defaultDesc: 'No detailed description available for this skill.'
  }
};

const skillTranslations = {
  zh: {
    'Git提交规范.md': {
      title: 'Git提交规范',
      category: 'Development',
      description: '遵循 Angular 规范的 Git Commit 消息标准，让项目的版本演进历史清晰、规范且可追溯。'
    },
    'frontend_optimization.md': {
      title: '前端性能优化技能指南',
      category: 'Development',
      description: '现代 Web 应用全方位性能优化指南，旨在提升用户体验、Lighthouse 评分及核心网页指标。'
    },
    'handoff.md': {
      title: '流程接力与工作交接技能指南',
      category: 'Workflow',
      description: 'AI 开发上下文无损交接与接力指南，有效解决长会话记忆衰退及多阶段开发无缝恢复问题。'
    },
    'process_optimization.md': {
      title: '流程优化技能指南',
      category: 'Workflow',
      description: '系统化软件开发与系统运行流程优化指南，覆盖本地开发、构建部署及运行时执行效率。'
    },
    'python_env_isolation.md': {
      title: 'Python 虚拟环境与依赖管理规范',
      category: 'Development',
      description: '指导 AI 助手在开发 Python 项目时自动创建和使用本地专属虚拟环境，杜绝全局环境污染与依赖冲突。'
    },
    'run_recording.md': {
      title: '运行记录与可观测性技能指南',
      category: 'Development',
      description: '高质量系统运行记录与可观测性指南，涵盖结构化日志分级、异常监控以及诊断审计规范。'
    },
    '代码移交标准.md': {
      title: '代码移交标准',
      category: 'Workflow',
      description: '用于保障代码开发完成后，平滑、无缝地移交给其他开发者或运维团队的主动审查与交接清单。'
    },
    '前端性能优化规范.md': {
      title: '前端性能优化规范',
      category: 'Development',
      description: '涵盖图片延迟加载、虚拟列表、代码分割、静态资源缓存以及打包体积压缩的本地开发与交付指南。'
    },
    'superpowers-template': {
      title: 'Superpowers 主控模版',
      category: 'Workflow',
      description: 'Superpowers 技能体系的主控模板文件夹，包含全局 of Agent 工作流与核心规划/脑暴/执行规约。'
    },
    'brainstorm.md': {
      title: 'Superpowers 头脑风暴技能',
      category: 'Workflow',
      description: 'Superpowers 体系的第一阶段：头脑风暴，确保在做出设计决策前充分分析问题空间。'
    },
    'planning.md': {
      title: 'Superpowers 规划技能',
      category: 'Workflow',
      description: 'Superpowers 体系的第二阶段：规划，确保在实现前有详尽的步骤路线图。'
    },
    'tdd_execution.md': {
      title: 'Superpowers TDD 执行技能',
      category: 'Development',
      description: 'Superpowers 体系的第三阶段：测试驱动执行，确保实现过程规范、增量可追踪。'
    },
    'verification.md': {
      title: 'Superpowers 验证技能',
      category: 'Development',
      description: 'Superpowers 体系的第四阶段：验证，确保产出物达到高质量工程标准。'
    },
    'codegraph_analysis.md': {
      title: '代码图谱静态分析与依赖图构建',
      category: 'Development',
      description: '指导 AI 助手如何高效分析复杂代码库、提取文件与组件间的耦合关系，并绘制高清晰度的代码拓扑图谱。'
    }
  },
  en: {
    'Git提交规范.md': {
      title: 'Git Commit Guideline',
      category: 'Development',
      description: 'Follow Angular specs for Git Commit messages, making version history clear, standardized, and traceable.'
    },
    'frontend_optimization.md': {
      title: 'Frontend Performance Optimization Skill Guide',
      category: 'Development',
      description: 'Comprehensive performance optimization guide for modern web apps, aimed at improving user experience, Lighthouse scores, and Core Web Vitals.'
    },
    'handoff.md': {
      title: 'Handoff & Context Resume Skill Guide',
      category: 'Workflow',
      description: 'Resolves memory decay from context saturation, implementing seamless lossless state recovery and context handoff between sessions.'
    },
    'process_optimization.md': {
      title: 'Process Optimization Skill Guide',
      category: 'Workflow',
      description: 'Systematic software development and execution process optimization guide, covering local dev, build deployment, and runtime efficiency.'
    },
    'python_env_isolation.md': {
      title: 'Python Virtual Env & Dependency Management',
      category: 'Development',
      description: 'Guide AI assistants to automatically create and use local virtual environments when developing Python projects, preventing global package conflicts.'
    },
    'run_recording.md': {
      title: 'Run Recording & Logging Skill Guide',
      category: 'Development',
      description: 'High-quality system logging and observability guide, covering structured log levels, exception monitoring, and diagnostics/auditing.'
    },
    '代码移交标准.md': {
      title: 'Code Handoff Standards',
      category: 'Workflow',
      description: 'An active review and handoff checklist to ensure smooth, seamless transition of code to other developers or ops teams.'
    },
    '前端性能优化规范.md': {
      title: 'Frontend Performance Optimization Standards',
      category: 'Development',
      description: 'Local development and delivery guide covering image lazy loading, virtual lists, code splitting, asset caching, and bundle compression.'
    },
    'superpowers-template': {
      title: 'Superpowers Master Template',
      category: 'Workflow',
      description: 'Master template folder for Superpowers skill system, containing global Agent workflows and planning/brainstorming/execution rules.'
    },
    'brainstorm.md': {
      title: 'Superpowers Brainstorming Skill',
      category: 'Workflow',
      description: 'Phase 1 of Superpowers: Brainstorming, ensuring thorough problem analysis before design decisions.'
    },
    'planning.md': {
      title: 'Superpowers Planning Skill',
      category: 'Workflow',
      description: 'Phase 2 of Superpowers: Planning, ensuring a documented step-by-step roadmap before implementation.'
    },
    'tdd_execution.md': {
      title: 'Superpowers TDD Execution Skill',
      category: 'Development',
      description: 'Phase 3 of Superpowers: Test-driven execution, ensuring disciplined and trackable implementation.'
    },
    'verification.md': {
      title: 'Superpowers Verification Skill',
      category: 'Development',
      description: 'Phase 4 of Superpowers: Verification, ensuring output meets high-quality engineering standards.'
    },
    'codegraph_analysis.md': {
      title: 'Code Graph Static Analysis & Dependency Mapping',
      category: 'Development',
      description: 'Guides AI assistants in efficiently analyzing complex codebases, extracting coupling relationships, and drawing code topology graphs.'
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
    // API key is masked as "***" if set; actual value only used via save_ai_config

    applyTheme(currentTheme);
    applyLanguage(currentLanguage);
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
  
  // Search Controls & Header Title
  if (!currentProjectPath) {
    document.querySelector('.content-toolbar h3').textContent = t.listHeader;
  } else {
    document.querySelector('.content-toolbar h3').textContent = t.listHeaderProject;
  }
  searchInput.placeholder = t.searchPlaceholder;
  document.getElementById('btn-refresh-skills').title = lang === 'zh' ? '刷新全局技能库' : 'Refresh Global Skills';

  // Modals (Editor)
  document.querySelectorAll('.modal-tab')[0].textContent = t.editModalTabSource;
  document.querySelectorAll('.modal-tab')[1].textContent = t.editModalTabPreview;
  document.querySelectorAll('#editor-modal footer button')[0].textContent = t.editModalCancel;
  document.querySelectorAll('#editor-modal footer button')[1].innerHTML = `<i data-lucide="save" style="width:16px;height:16px;"></i> ${t.editModalSave}`;

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

  // Re-render components to apply dynamic texts
  renderProjectsList();
  renderCategoryFilterBar();
  renderSkillsGrid();
  updateStatistics();
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
    const escapedPath = proj.path.replace(/\\/g, '\\\\');
    item.innerHTML = `
      <div class="project-details" onclick="handleSelectProject('${escapedPath}')">
        <span class="project-name">${proj.name}</span>
        <span class="project-path">${proj.path}</span>
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
  skills.forEach(skill => {
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
  let filtered = skills;
  
  // Filter by Search Query
  if (query) {
    filtered = filtered.filter(s => {
      const text = [s.title, s.description, s.filename, ...s.tags].join(' ').toLowerCase();
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

  filtered.forEach((skill, index) => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.style.transitionDelay = `${index * 35}ms`;

    // Apply 100% Local Smart Classifier for Emojis and Tags
    const smart = getSmartEmojiAndTags(skill);
    const resolvedEmoji = smart.emoji;
    const resolvedTags = smart.tags;

    let badgeHTML = '';
    let isChecked = false;

    if (currentProjectPath && activeProj && !activeProj.error) {
      const physicalStatus = statusMap[skill.filename] || 'unloaded';
      const isLocallyEnabled = enabledSkills.has(skill.filename);

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
      badgeHTML = `<span class="status-badge unloaded"><span class="status-dot"></span>${locales[currentLanguage].statusReadonly}</span>`;
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
    const tagsHTML = translatedTags.map(t => `<span class="badge">${t}</span>`).join('');

    card.innerHTML = `
      <div class="card-header">
        <div class="skill-meta">
          <div class="skill-emoji">${resolvedEmoji}</div>
          <div class="skill-info">
            <h4 class="skill-title" title="${resolvedTitle}">${mainTitle}</h4>
            ${subTitle ? `<span class="skill-subtitle" title="${subTitle}">${subTitle}</span>` : ''}
          </div>
        </div>
        ${badgeHTML}
      </div>
      <p class="card-body" title="${resolvedDesc}">${resolvedDesc}</p>
      <div class="card-meta-line">
        <span class="skill-tag" title="${skill.filename}">${skill.is_dir ? '📁 ' : ''}${skill.filename}</span>
        <div class="card-tags">${tagsHTML}</div>
      </div>
      <div class="card-footer">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-secondary btn-icon" onclick="openEditorModal('${skill.filename}')" title="${locales[currentLanguage].btnEditSkill}" style="padding: 0.5rem; height: 32px; display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.8rem;">
            <i data-lucide="edit-3" style="width:14px;height:14px;"></i>${locales[currentLanguage].btnEditSkill}
          </button>
          <button class="btn btn-danger-outline btn-icon" onclick="handleDeleteSkill('${skill.filename}')" title="${currentLanguage === 'zh' ? '删除技能' : 'Delete Skill'}" style="padding: 0.5rem; height: 32px; width: 32px; display: inline-flex; align-items: center; justify-content: center;">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
        ${currentProjectPath && activeProj && !activeProj.error ? `
          <label class="switch-label">
            <span>${locales[currentLanguage].toggleLabel}</span>
            <label class="switch">
              <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="handleToggleSkill('${skill.filename}', this.checked)">
              <span class="slider"></span>
            </label>
          </label>` : ''}
      </div>`;
    cardsGrid.appendChild(card);
  });
  lucide.createIcons();

  // Staggered card entrance animation
  requestAnimationFrame(() => {
    const cards = cardsGrid.querySelectorAll('.skill-card');
    cards.forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 40);
    });
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
  Object.entries(proj.skills_status || {}).forEach(([fname, status]) => {
    if (status === 'synced' || status === 'out_of_sync') enabledSkills.add(fname);
  });
  currentProjectTitle.textContent = proj.name;
  currentProjectDesc.innerHTML = `<i data-lucide="folder" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${proj.path}`;
  syncBtn.removeAttribute('disabled');
  syncBtn.classList.add('pulsing-btn');
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
  
  const icon = syncBtn.querySelector('i');
  if (icon) {
    icon.classList.add('spinning');
  }

  const originalHTML = syncBtn.innerHTML;
  syncBtn.innerHTML = `<span class="loading-spinner"></span> ${locales[currentLanguage].syncingBtn}`;

  try {
    const result = await window.pywebview.api.sync_skills(currentProjectPath, Array.from(enabledSkills));
    if (result.error) throw new Error(result.error);
    showToast(locales[currentLanguage].toastSyncSuccess + result.synced_count + (currentLanguage === 'zh' ? ' 项技能' : ' skills'), 'success');
    await fetchProjects();
    refreshCurrentProject();
  } catch (e) {
    showToast(locales[currentLanguage].toastSyncFail + e, 'error');
  } finally {
    syncBtn.innerHTML = originalHTML;
    syncBtn.removeAttribute('disabled');
    syncBtn.classList.add('pulsing-btn');
    if (icon) {
      icon.classList.remove('spinning');
    }
  }
}

function handleSearch() {
  renderSkillsGrid();
}

// ------------------------------------------
// Editor Modal
// ------------------------------------------

async function openEditorModal(filename) {
  editingFilename = filename;
  modalBody.className = 'modal-body tab-edit';
  const tabs = document.querySelectorAll('.modal-tab');
  tabs[0].classList.add('active');
  tabs[1].classList.remove('active');
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

function closeEditorModal() {
  editorModal.classList.remove('active');
  editingFilename = null;
}

function switchModalTab(tab) {
  const tabs = document.querySelectorAll('.modal-tab');
  if (tab === 'edit') {
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
    modalBody.className = 'modal-body tab-edit';
  } else {
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
    modalBody.className = 'modal-body tab-preview';
    markdownPreview.innerHTML = marked.parse(markdownTextarea.value);
  }
}

async function handleSaveSkill() {
  if (!editingFilename) return;
  try {
    const result = await window.pywebview.api.save_skill(editingFilename, markdownTextarea.value);
    if (result.error) throw new Error(result.error);
    showToast(locales[currentLanguage].toastSaveSuccess, 'success');
    closeEditorModal();
    await fetchSkills();
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
        currentProjectDesc.innerHTML = `<i data-lucide="folder" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${proj.path}`;
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
  // API key field: leave empty placeholder — user must re-enter to change
  document.getElementById('settings-apikey').value = '';
  document.getElementById('settings-apikey').type = 'password';

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
      default_scan_dir: settingsScanDir.value
    };
    const result = await window.pywebview.api.save_settings(settings);

    // Save AI config separately if API key changed
    const apiKeyInput = document.getElementById('settings-apikey');
    const modelInput = document.getElementById('settings-aimodel');
    const newModel = modelInput.value.trim() || deepseekModel;
    if (apiKeyInput.value.trim()) {
      await window.pywebview.api.save_ai_config(apiKeyInput.value.trim(), newModel);
    } else if (newModel !== deepseekModel) {
      await window.pywebview.api.save_ai_config('', newModel);
    }
    deepseekModel = newModel;

    currentLanguage = result.language;
    currentTheme = result.theme;
    defaultScanDir = result.default_scan_dir;
    skillsDirPath.textContent = result.skills_dir;
    skillsDirPath.title = result.skills_dir;

    applyTheme(currentTheme);
    applyLanguage(currentLanguage);

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
  await loadSessionList();
  lucide.createIcons();
  setTimeout(() => aiChatInput.focus(), 200);
}

function closeAIModal() {
  saveCurrentSession();
  aiModal.classList.remove('active');
}

async function loadSessionList() {
  try {
    allSessions = await window.pywebview.api.chat_list_sessions();
  } catch (e) { allSessions = []; }
  renderSessionList();
  // Auto-select most recent or create new
  if (allSessions.length > 0) {
    switchToSession(allSessions[0].id);
  } else {
    createNewSession();
  }
}

function renderSessionList() {
  aiSessionList.innerHTML = '';
  allSessions.forEach(s => {
    const div = document.createElement('div');
    div.className = 'ai-session-item' + (s.id === currentSessionId ? ' active' : '');
    div.onclick = () => { saveCurrentSession(); switchToSession(s.id); };
    div.innerHTML = `
      <div class="ai-session-item-title">${escapeHtml(s.title || '未命名')}</div>
      <div class="ai-session-item-meta">${s.msg_count || 0} 条消息</div>
      <button class="ai-session-del" onclick="event.stopPropagation();deleteSession('${s.id}')" title="删除">×</button>`;
    aiSessionList.appendChild(div);
  });
}

async function switchToSession(sid) {
  saveCurrentSession(); // save current before switching
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

async function createNewSession() {
  saveCurrentSession();
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
    switchToSession(allSessions[0].id);
  } else if (allSessions.length === 0) {
    createNewSession();
  }
  renderChatHistory();
}

function saveCurrentSession() {
  if (!currentSessionId || aiChatHistory.length === 0) return;
  const title = aiChatHistory.find(m => m.role === 'user')?.content?.slice(0, 30) || '未命名';
  window.pywebview.api.chat_save_session(currentSessionId, title, aiChatHistory).catch(() => {});
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
    saveCurrentSession();
    await loadSessionList();
    renderSessionList();
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
  createNewSession();
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
      aiSkillContent.innerHTML = marked.parse(aiGeneratedSkill.content || '');
      aiSkillPreview.style.display = 'block';
      aiChatHistory.push({ role: 'assistant', content: '✅ 技能已生成，请在下方预览并保存' });
      appendChatBubble('ai', '✅ 技能已生成！你可以在下方预览，满意后点击 **保存**。');
      saveCurrentSession();
      await loadSessionList();
      renderSessionList();
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
    // Save the model first (it might have changed)
    const modelInput = document.getElementById('settings-aimodel');
    const apiKeyInput = document.getElementById('settings-apikey');
    if (apiKeyInput.value.trim()) {
      await window.pywebview.api.save_ai_config(apiKeyInput.value.trim(), modelInput.value.trim() || 'deepseek-chat');
    } else {
      await window.pywebview.api.save_ai_config('', modelInput.value.trim() || 'deepseek-chat');
    }

    const result = await window.pywebview.api.ai_test_connection();
    resultDiv.style.display = 'block';
    if (result.ok) {
      resultDiv.style.background = 'var(--green-soft)';
      resultDiv.style.color = 'var(--green)';
      resultDiv.textContent = (currentLanguage === 'zh'
        ? `✅ 连接成功！模型: ${result.model}，延迟: ${result.latency_ms}ms`
        : `✅ Connected! Model: ${result.model}, Latency: ${result.latency_ms}ms`);
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
  div.innerHTML = `<div class="ai-chat-bubble-content">${marked.parse(text)}</div>`;
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

function showCustomDialog({ title, message, emoji = '💬', isPrompt = false, placeholder = '', defaultValue = '' }) {
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
    document.getElementById('dialog-btn-confirm').textContent = currentLanguage === 'zh' ? '确定' : 'Confirm';
    
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
  console.log('handleDeleteSkill requested for:', filename);
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
window.handleSelectProject = handleSelectProject;
window.handleToggleSkill = handleToggleSkill;
window.handleDeleteProject = handleDeleteProject;
window.handleSyncSkills = handleSyncSkills;
window.handleSearch = handleSearch;
window.openEditorModal = openEditorModal;
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

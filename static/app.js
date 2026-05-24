// ==========================================
// AI Skill Hub Manager - pywebview Frontend
// ==========================================

let projects = [];
let skills = [];
let currentProjectPath = null;
let enabledSkills = new Set();
let editingFilename = null;

// DOM cache
const projectList = document.getElementById('project-list');
const cardsGrid = document.getElementById('cards-grid');
const syncBtn = document.getElementById('sync-btn');
const currentProjectTitle = document.getElementById('current-project-title');
const currentProjectDesc = document.getElementById('current-project-desc');
const statTotalSkills = document.getElementById('stat-total-skills');
const statSyncedSkills = document.getElementById('stat-synced-skills');
const statUnsyncedSkills = document.getElementById('stat-unsynced-skills');
const editorModal = document.getElementById('editor-modal');
const modalTitle = document.getElementById('modal-title');
const modalEmoji = document.getElementById('modal-emoji');
const modalBody = document.getElementById('modal-body');
const markdownTextarea = document.getElementById('markdown-textarea');
const markdownPreview = document.getElementById('markdown-preview');
const toastContainer = document.getElementById('toast-container');
const searchInput = document.getElementById('search-input');
const skillsDirPath = document.getElementById('skills-dir-path');

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
  } catch (e) {
    showToast('获取系统配置失败: ' + e, 'error');
  }
}


// ------------------------------------------
// Data Layer (pywebview bridge)
// ------------------------------------------

async function fetchSkills() {
  try {
    skills = await window.pywebview.api.get_skills();
    statTotalSkills.textContent = skills.length;
    renderSkillsGrid();
  } catch (e) {
    showToast('获取技能列表失败: ' + e, 'error');
  }
}

async function fetchProjects() {
  try {
    projects = await window.pywebview.api.get_projects();
    renderProjectsList();
    updateStatistics();
  } catch (e) {
    showToast('获取项目列表失败: ' + e, 'error');
  }
}

function updateStatistics() {
  if (!currentProjectPath) {
    statSyncedSkills.textContent = '\u2014';
    statUnsyncedSkills.textContent = '\u2014';
    return;
  }
  const proj = projects.find(p => p.path === currentProjectPath);
  if (!proj || proj.error) {
    statSyncedSkills.textContent = '0';
    statUnsyncedSkills.textContent = '0';
    return;
  }
  let synced = 0, unsynced = 0;
  Object.values(proj.skills_status || {}).forEach(s => {
    if (s === 'synced') synced++;
    if (s === 'out_of_sync') unsynced++;
  });
  statSyncedSkills.textContent = synced;
  statUnsyncedSkills.textContent = unsynced;
}

// ------------------------------------------
// Rendering
// ------------------------------------------

function renderProjectsList() {
  projectList.innerHTML = '';
  if (projects.length === 0) {
    projectList.innerHTML = `
      <div class="empty-state" style="padding:2rem 1rem;">
        <div class="empty-state-icon">\ud83d\udcc2</div>
        <h4>暂无关联项目</h4>
        <p>点击上方按钮选取文件夹</p>
      </div>`;
    return;
  }
  projects.forEach(proj => {
    const item = document.createElement('div');
    item.className = `project-item ${proj.path === currentProjectPath ? 'active' : ''}`;
    const errorBadge = proj.error
      ? `<span style="font-size:0.65rem;color:#d1242f;font-weight:600;">\u26a0 路径无效</span>`
      : '';
    // Escape backslashes for onclick
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

function renderSkillsGrid() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  let filtered = skills;
  if (query) {
    filtered = skills.filter(s => {
      const text = [s.title, s.description, s.filename, ...s.tags].join(' ').toLowerCase();
      return text.includes(query);
    });
  }

  cardsGrid.innerHTML = '';
  if (filtered.length === 0) {
    cardsGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">\ud83d\udd0d</div>
        <h4>未找到匹配的技能</h4>
        <p>请更换关键词或新建技能</p>
      </div>`;
    return;
  }

  const activeProj = currentProjectPath ? projects.find(p => p.path === currentProjectPath) : null;
  const statusMap = activeProj ? (activeProj.skills_status || {}) : {};

  filtered.forEach(skill => {
    const card = document.createElement('div');
    card.className = 'skill-card';

    let badgeHTML = '';
    let isChecked = false;

    if (currentProjectPath && activeProj && !activeProj.error) {
      const status = statusMap[skill.filename] || 'unloaded';
      if (status === 'synced') {
        badgeHTML = `<span class="status-badge synced"><span class="status-dot"></span>已同步</span>`;
        isChecked = true;
      } else if (status === 'out_of_sync') {
        badgeHTML = `<span class="status-badge out-of-sync"><span class="status-dot"></span>有更新</span>`;
        isChecked = true;
      } else {
        badgeHTML = `<span class="status-badge unloaded"><span class="status-dot"></span>未装载</span>`;
      }
    } else {
      badgeHTML = `<span class="status-badge unloaded"><span class="status-dot"></span>全局只读</span>`;
    }

    const tagsHTML = skill.tags.map(t => `<span class="badge">${t}</span>`).join('');

    card.innerHTML = `
      <div class="card-header">
        <div class="skill-meta">
          <div class="skill-emoji">${skill.emoji || '\ud83d\udcc4'}</div>
          <div class="skill-info">
            <h4 class="skill-title">${skill.title}</h4>
            <span class="skill-tag">${skill.filename}</span>
          </div>
        </div>
        ${badgeHTML}
      </div>
      <p class="card-body">${skill.description}</p>
      <div class="card-tags">${tagsHTML}</div>
      <div class="card-footer">
        <button class="btn btn-secondary btn-icon" onclick="openEditorModal('${skill.filename}')" title="编辑技能">
          <i data-lucide="edit-3" style="width:14px;height:14px;margin-right:4px;"></i>编辑技能
        </button>
        ${currentProjectPath && activeProj && !activeProj.error ? `
          <label class="switch-label">
            <span>启用装载</span>
            <label class="switch">
              <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="handleToggleSkill('${skill.filename}', this.checked)">
              <span class="slider"></span>
            </label>
          </label>` : ''}
      </div>`;
    cardsGrid.appendChild(card);
  });
  lucide.createIcons();
}

// ------------------------------------------
// Event Handlers
// ------------------------------------------

async function handlePickProject() {
  try {
    const result = await window.pywebview.api.add_project_via_dialog();
    if (!result) return;
    if (result.error) {
      showToast(result.error, 'warning');
      return;
    }
    showToast(`\u2705 已关联项目: ${result.name}`, 'success');
    currentProjectPath = result.path;
    await fetchProjects();
    handleSelectProject(result.path);
  } catch (e) {
    showToast('关联项目失败: ' + e, 'error');
  }
}

async function handleCreateSkill() {
  const filename = prompt('请输入新技能文件名 (例如: 代码安全规范.md)');
  if (!filename) return;
  try {
    const result = await window.pywebview.api.create_skill(filename);
    if (result.error) {
      showToast(result.error, 'warning');
      return;
    }
    showToast(`\u2705 技能文件已创建: ${result.filename}`, 'success');
    await fetchSkills();
    openEditorModal(result.filename);
  } catch (e) {
    showToast('创建失败: ' + e, 'error');
  }
}

function handleSelectProject(path) {
  const proj = projects.find(p => p.path === path);
  if (!proj) return;
  if (proj.error) showToast(`项目路径无法访问: ${proj.error}`, 'warning');
  currentProjectPath = path;
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
}

async function handleDeleteProject(event, path) {
  event.stopPropagation();
  if (!confirm('确定要移除此项目的关联吗？\n不会删除项目中的任何文件。')) return;
  try {
    await window.pywebview.api.delete_project(path);
    showToast('项目已移除', 'success');
    if (currentProjectPath === path) {
      currentProjectPath = null;
      currentProjectTitle.textContent = '请选择一个项目进行配置';
      currentProjectDesc.textContent = '选择左侧项目后，可在此管理技能装载';
      syncBtn.setAttribute('disabled', 'true');
      syncBtn.classList.remove('pulsing-btn', 'active');
    }
    await fetchProjects();
    renderSkillsGrid();
    updateStatistics();
  } catch (e) {
    showToast('移除失败: ' + e, 'error');
  }
}

async function handleSyncSkills() {
  if (!currentProjectPath) return;
  const originalHTML = syncBtn.innerHTML;
  syncBtn.innerHTML = `<span class="loading-spinner"></span> 同步中\u2026`;
  syncBtn.setAttribute('disabled', 'true');
  syncBtn.classList.remove('active');
  try {
    const result = await window.pywebview.api.sync_skills(currentProjectPath, Array.from(enabledSkills));
    if (result.error) throw new Error(result.error);
    showToast(`\u2728 同步完成！已装载 ${result.synced_count} 项技能`, 'success');
    await fetchProjects();
    handleSelectProject(currentProjectPath);
  } catch (e) {
    showToast('同步失败: ' + e, 'error');
  } finally {
    syncBtn.innerHTML = originalHTML;
    syncBtn.removeAttribute('disabled');
    syncBtn.classList.add('pulsing-btn');
    lucide.createIcons();
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
  modalEmoji.textContent = skill ? skill.emoji : '\ud83d\udcc4';
  modalTitle.textContent = `编辑技能: ${skill ? skill.title : filename}`;
  markdownTextarea.value = '加载中\u2026';
  markdownTextarea.setAttribute('disabled', 'true');
  editorModal.classList.add('active');
  try {
    const data = await window.pywebview.api.get_skill_content(filename);
    if (data.error) throw new Error(data.error);
    markdownTextarea.value = data.content;
  } catch (e) {
    showToast('加载失败: ' + e, 'error');
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
    showToast('\ud83d\udcc1 全局技能已保存', 'success');
    closeEditorModal();
    await fetchSkills();
    if (currentProjectPath) {
      await fetchProjects();
      handleSelectProject(currentProjectPath);
    }
  } catch (e) {
    showToast('保存失败: ' + e, 'error');
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
    showToast('✅ 全局技能库路径已更新', 'success');
    skillsDirPath.textContent = result.skills_dir;
    skillsDirPath.title = result.skills_dir;
    await fetchSkills();
    await fetchProjects();
  } catch (e) {
    showToast('更改全局技能库失败: ' + e, 'error');
  }
}


// A collection workbench: every edit stays in a draft until Save.
let collectionEditorState=null;
const collectionEditorElement=document.getElementById('collection-editor');
function collectionEditorDraftKey(id){return 'skillhub.collection-editor.'+encodeURIComponent(skillsDirPath.textContent+'|'+id);}
function collectionEditorChanges(state){
  const changes={policies:{...state.policies},documents:{...state.documents},expected_versions:{}};
  const names=new Set([...Object.keys(changes.policies),...Object.keys(changes.documents)]);
  if(state.sharedDirty){changes.shared_rules=state.shared;state.items.forEach(item=>names.add(item.filename));}
  for(const name of names)changes.expected_versions[name]=state.versions[name];
  return changes;
}
function retainCollectionEditorDraft(state){
  if(!state?.ready)return;
  try{localStorage.setItem(collectionEditorDraftKey(state.id),JSON.stringify({policies:state.policies,documents:state.documents,shared:state.shared,sharedDirty:state.sharedDirty,versions:state.versions,collectionVersion:state.collectionVersion}));}catch(_){}
}
async function openCollectionEditor(id){
  const collection=getCollectionDisplaySkill(id);if(!collection)return;
  if(collectionEditorState)closeCollectionEditor();
  closeCollectionModal();
  const state={id,title:collection.title,members:collection.collection_members,items:[],versions:{},policies:{},documents:{},shared:'',sharedDirty:false,selected:null,ready:false,busy:false};
  collectionEditorState=state;
  document.getElementById('collection-editor-title').textContent=state.title;
  document.getElementById('collection-editor-search').value='';
  refreshCollectionEditorLabels();renderCollectionEditor();activateModal(collectionEditorElement);
  try{
    const result=await window.pywebview.api.get_collection_editor_data(id);
    if(collectionEditorState!==state)return;if(result.error)throw new Error(result.error);
    state.items=result.items;state.versions=Object.fromEntries(result.items.map(item=>[item.filename,item.version]));state.collectionVersion=result.collection_version;
    state.shared=result.shared_rules;state.savedShared=result.shared_rules;state.ready=true;
    try{const draft=JSON.parse(localStorage.getItem(collectionEditorDraftKey(id))||'null');
      if(draft){state.policies=draft.policies||{};state.documents=draft.documents||{};state.shared=draft.sharedDirty?draft.shared:state.shared;state.sharedDirty=Boolean(draft.sharedDirty);
        const dirty=new Set([...Object.keys(state.policies),...Object.keys(state.documents),...(state.sharedDirty?state.items.map(item=>item.filename):[])]);
        dirty.forEach(name=>{if(draft.versions?.[name])state.versions[name]=draft.versions[name];});
        if(dirty.size)state.collectionVersion=draft.collectionVersion;}
    }catch(_){}
    renderCollectionEditor();
  }catch(error){if(collectionEditorState===state)document.getElementById('collection-editor-status').textContent=error.message;}
}
function closeCollectionEditor(back=false){
  const state=collectionEditorState;retainCollectionEditorDraft(state);collectionEditorState=null;
  deactivateModal(collectionEditorElement);if(back&&state)openCollectionModal(state.id);
}
function refreshCollectionEditorLabels(){
  const text={
    'collection-editor-back':['← 返回集合','← Back to collection'],'collection-editor-kicker':['集合编辑','Collection editor'],
    'collection-editor-members-label':['成员','Members'],'collection-editor-policy-heading':['调用方式','Invocation'],
    'collection-editor-explicit-label':['仅显式调用','Explicit-only'],'collection-editor-explicit-help':['由你使用 $skill-name 主动调用。','Invoke it directly with $skill-name.'],
    'collection-editor-auto-label':['允许自动调用','Automatic allowed'],'collection-editor-auto-help':['请求匹配时，Agent 可以自动选择。','The agent can select it for matching requests.'],
    'collection-editor-shared-heading':['共同要求','Shared requirements'],'collection-editor-shared-hint':['保存后应用到所有成员，保留各自原有规则。','Applied to all members on Save; existing member rules are retained.'],
    'collection-editor-document-heading':['成员规则','Member instructions'],'collection-editor-document-hint':['只修改当前成员的 Skill 文档。','Edits only this member’s Skill document.'],
    'collection-editor-save-hint':['修改技能库原件；项目和发布副本需更新后生效。','Edits library sources; update project and published copies to apply.'],
    'collection-editor-save':['保存修改','Save changes']};
  for(const [id,pair] of Object.entries(text))document.getElementById(id).textContent=uiText(...pair);
  document.getElementById('collection-editor-all').querySelector('strong').textContent=uiText('整个集合','Entire collection');
  document.getElementById('collection-editor-search').placeholder=uiText('搜索成员…','Search members…');
}
function renderCollectionEditorNavigation(){
  const state=collectionEditorState;if(!state)return;
  const query=document.getElementById('collection-editor-search').value.trim().toLocaleLowerCase();
  document.getElementById('collection-editor-all').classList.toggle('active',state.selected===null);
  document.getElementById('collection-editor-count').textContent=uiText(`${state.members.length} 个成员`,`${state.members.length} members`);
  const navigation=document.getElementById('collection-editor-members');navigation.replaceChildren();
  for(const member of state.members){
    const title=member.display_title||member.title||member.filename;
    if(![title,member.filename].join(' ').toLocaleLowerCase().includes(query))continue;
    const button=document.createElement('button');button.type='button';button.className='collection-editor-nav'+(state.selected===member.filename?' active':'');
    button.setAttribute('aria-current',state.selected===member.filename?'true':'false');
    const name=document.createElement('strong');name.textContent=title;button.append(name);
    if(title.trim().toLocaleLowerCase()!==member.filename.replace(/\.md$/i,'').trim().toLocaleLowerCase()){
      const filename=document.createElement('small');filename.textContent=member.filename;button.append(filename);
    }
    button.onclick=()=>selectCollectionEditorMember(member.filename);navigation.append(button);
  }
}
function renderCollectionEditor(){
  const state=collectionEditorState;if(!state)return;renderCollectionEditorNavigation();
  const member=state.members.find(item=>item.filename===state.selected);
  const items=state.selected?state.items.filter(item=>item.filename===state.selected):state.items;
  const supported=items.filter(item=>item.supported);
  const values=new Set(supported.map(item=>state.policies[item.filename]??item.allow_implicit_invocation));
  document.getElementById('collection-editor-scope').textContent=state.selected?uiText('成员设置','Member settings'):uiText('统一设置','Collection defaults');
  document.getElementById('collection-editor-heading').textContent=member?(member.display_title||member.title||member.filename):uiText('整个集合','Entire collection');
  document.getElementById('collection-editor-description').textContent=member?(member.display_description||member.description||''):uiText('统一调整调用方式和共同要求，再按需为成员单独设置。','Set invocation and shared requirements here, then adjust individual members as needed.');
  document.getElementById('collection-editor-policy-hint').textContent=values.size>1?uiText('成员当前设置不同。选择一种方式可统一当前范围。','Members have different settings. Choose a policy to align this scope.'):
    state.selected?uiText('仅影响当前成员。','Applies only to this member.'):uiText(`应用范围：${supported.length} 个可配置成员。`,`Applies to ${supported.length} configurable members.`);
  for(const radio of collectionEditorElement.querySelectorAll('[name="collection-editor-policy"]')){radio.checked=values.size===1&&values.has(radio.value==='true');radio.disabled=!state.ready||state.busy||!supported.length;}
  document.getElementById('collection-editor-shared-section').hidden=Boolean(state.selected);
  const shared=document.getElementById('collection-editor-shared');shared.value=state.shared;shared.disabled=!state.ready||state.busy;
  document.getElementById('collection-editor-document-section').hidden=!state.selected;
  const item=items[0],editor=document.getElementById('collection-editor-document');editor.value=state.selected?(state.documents[state.selected]??item?.skill_content??''):'';editor.disabled=!state.ready||state.busy||!item?.editable;
  updateCollectionEditorSaveState();
}
function selectCollectionEditorMember(filename){const state=collectionEditorState;if(!state)return;state.selected=filename;renderCollectionEditor();}
function stageCollectionEditorPolicy(value){
  const state=collectionEditorState;if(!state?.ready||state.busy)return;
  for(const item of state.items.filter(item=>item.supported&&(!state.selected||item.filename===state.selected))){if(value===item.allow_implicit_invocation)delete state.policies[item.filename];else state.policies[item.filename]=value;}
  retainCollectionEditorDraft(state);renderCollectionEditor();
}
function stageCollectionEditorRules(value){const state=collectionEditorState;if(!state?.ready||state.busy)return;state.shared=value;state.sharedDirty=value!==state.savedShared;retainCollectionEditorDraft(state);updateCollectionEditorSaveState();}
function stageCollectionEditorDocument(value){const state=collectionEditorState;if(!state?.ready||state.busy||!state.selected)return;const item=state.items.find(item=>item.filename===state.selected);if(value===item.skill_content)delete state.documents[state.selected];else state.documents[state.selected]=value;retainCollectionEditorDraft(state);updateCollectionEditorSaveState();}
function updateCollectionEditorSaveState(){
  const state=collectionEditorState;if(!state)return;const count=Object.keys(collectionEditorChanges(state).expected_versions).length;
  document.getElementById('collection-editor-status').textContent=!state.ready?uiText('读取集合…','Loading collection…'):state.busy?uiText('正在保存…','Saving…'):count?uiText(`${count} 个成员有未保存修改`,`${count} members have unsaved changes`):uiText('所有修改已保存','All changes saved');
  document.getElementById('collection-editor-save').disabled=!state.ready||state.busy||!count;
}
async function saveCollectionEditor(){
  const state=collectionEditorState;if(!state?.ready||state.busy)return;
  const changes=collectionEditorChanges(state);if(!Object.keys(changes.expected_versions).length)return;
  const draftKey=collectionEditorDraftKey(state.id);let submittedDraft=null;try{submittedDraft=localStorage.getItem(draftKey);}catch(_){}
  state.busy=true;renderCollectionEditor();
  try{
    const result=await window.pywebview.api.save_collection_editor_data(state.id,changes,state.collectionVersion);
    if(result.error)throw new Error(result.error);
    try{if(localStorage.getItem(draftKey)===submittedDraft)localStorage.removeItem(draftKey);}catch(_){}
    if(collectionEditorState!==state){showToast(uiText('集合设置已在后台保存','Collection settings saved in the background'),'success');return;}
    state.policies={};state.documents={};state.sharedDirty=false;
    const loaded=await window.pywebview.api.get_collection_editor_data(state.id);
    if(collectionEditorState!==state)return;if(loaded.error)throw new Error(loaded.error);
    state.items=loaded.items;state.versions=Object.fromEntries(loaded.items.map(item=>[item.filename,item.version]));state.collectionVersion=loaded.collection_version;state.shared=loaded.shared_rules;state.savedShared=loaded.shared_rules;state.sharedDirty=false;state.policies={};state.documents={};
    await fetchSkills();if(currentProjectPath){await fetchProjects();queuePendingSyncSummary();}
    showToast(uiText('集合设置已保存','Collection settings saved'),'success');
  }catch(error){showToast(error.message,'error');if(collectionEditorState===state)retainCollectionEditorDraft(state);}
  finally{if(collectionEditorState===state){state.busy=false;renderCollectionEditor();}}
}

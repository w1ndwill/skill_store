const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../static/workspace-tools.js'),'utf8');
function extract(name){const pattern=new RegExp('^(?:async )?function '+name+'\\(', 'm');const start=pattern.exec(source).index;const next=/\n(?:async )?function \w+\(/.exec(source.slice(start+1));return source.slice(start,next?start+1+next.index:undefined);}
function setup(choices=[]){const calls=[];const c=vm.createContext({toolBusy:false,toolCloseRequested:false,inspectionQueue:[],currentLanguage:'zh',
 uiText:(a,b)=>a,showCustomDialog:async()=>choices.shift(),drawQueue:()=>{},fetchSkills:async()=>{},formatImportPreview:()=>'',formatAiImportDiff:()=>'',
 window:{pywebview:{api:{apply_skill_import:async(...args)=>{calls.push(args);return{ok:true};}}}}});
 for(const name of ['applyQueueItem','applySelected','reviewQueueItem'])vm.runInContext(extract(name),c);return{c,calls};}
test('high-risk items cannot enter the bulk apply path',async()=>{const {c,calls}=setup([true]);c.inspectionQueue=[
 {filename:'safe',status:'ready',selected:true,preview:{token:'safe'}},
 {filename:'risk',status:'ready',selected:true,preview:{token:'risk',has_high_risk:true}},
 {filename:'ai',status:'ready',selected:true,preview:{token:'ai',ai_used:true}}];await c.applySelected();assert.deepEqual(calls,[['safe',false,false]]);});
test('declining separate high-risk confirmation prevents application',async()=>{const {c,calls}=setup([true,false]);await c.reviewQueueItem({filename:'risk',preview:{token:'r',has_high_risk:true,findings:[]}});assert.equal(calls.length,0);});
test('AI and high-risk decisions are forwarded independently',async()=>{const {c,calls}=setup([true,true,true]);await c.reviewQueueItem({filename:'both',preview:{token:'both',ai_used:true,has_high_risk:true,findings:[]}});assert.deepEqual(calls,[['both',true,true]]);});
test('failed item remains retryable while other bulk items complete',async()=>{const {c}=setup([true]);c.window.pywebview.api.apply_skill_import=async token=>token==='bad'?{error:'disk full'}:{ok:true};c.inspectionQueue=['bad','good'].map(token=>({filename:token,status:'ready',selected:true,preview:{token}}));await c.applySelected();assert.equal(c.inspectionQueue[0].status,'failed');assert.equal(c.inspectionQueue[1].status,'done');});
test('skipping an item acknowledges its inspected version before marking it skipped',async()=>{
 const calls=[];const c=vm.createContext({toolBusy:false,drawQueue:()=>{},fetchSkills:async()=>{},window:{pywebview:{api:{
  acknowledge_unregistered_skill:async(...args)=>{calls.push(['ack',...args]);return{ok:true};},
  discard_skill_import:async token=>{calls.push(['discard',token]);return{ok:true};}
 }}}});
 for(const name of ['acknowledgeQueueItem','skipQueueItem'])vm.runInContext(extract(name),c);
 const item={filename:'lab1031-server.md',hash:'inspected-hash',status:'pending',selected:true,preview:{token:'preview'}};
 await c.skipQueueItem(item);
 assert.deepEqual(calls,[['ack','lab1031-server.md','inspected-hash'],['discard','preview']]);
 assert.equal(item.status,'skipped');assert.equal(item.selected,false);assert.equal(item.preview,null);
});
test('failed skip remains visible and retryable',async()=>{
 const c=vm.createContext({toolBusy:false,drawQueue:()=>{},fetchSkills:async()=>{},window:{pywebview:{api:{
  acknowledge_unregistered_skill:async()=>({error:'skill changed'})
 }}}});
 for(const name of ['acknowledgeQueueItem','skipQueueItem'])vm.runInContext(extract(name),c);
 const item={filename:'lab1031-server.md',hash:'old-hash',status:'pending',selected:true};
 await c.skipQueueItem(item);
 assert.equal(item.status,'failed');assert.equal(item.error,'skill changed');
});
test('inspection queue renders a completed skip without another skip button',()=>{
 const body={children:[],replaceChildren(){this.children=[];},append(item){this.children.push(item);}};
 const footer={textContent:''};
 const c=vm.createContext({toolBusy:false,toolKind:'inspection',inspectionRunning:false,inspectionInspectButton:null,inspectionPauseButton:null,inspectionQueue:[{filename:'lab1031-server.md',status:'skipped',selected:false}],
  toolBody:body,toolFooter:footer,uiText:a=>a,
  document:{createElement:tag=>({tag,children:[],setAttribute(){},append(...items){this.children.push(...items);}})},
  toolButton:(label,action,parent)=>{parent.append({tag:'button',label,action});}
 });
 vm.runInContext(extract('drawQueue'),c);c.drawQueue();
 assert.equal(footer.textContent,'已完成 1 / 1');
 assert.equal(body.children[0].children.some(child=>child.tag==='button'&&child.label==='跳过'),false);
});
test('keeping selected items acknowledges their scanned hashes',async()=>{
 const calls=[];const c=vm.createContext({toolBusy:false,toolCloseRequested:false,inspectionQueue:[],drawQueue:()=>{},fetchSkills:async()=>{},window:{pywebview:{api:{
  acknowledge_unregistered_skill:async(...args)=>{calls.push(args);return{ok:true};}
 }}}});
 for(const name of ['acknowledgeQueueItem','keepSelected'])vm.runInContext(extract(name),c);
 const item={filename:'sample.md',hash:'visible-hash',status:'pending',selected:true};c.inspectionQueue=[item];
 await c.keepSelected();
 assert.deepEqual(calls,[['sample.md','visible-hash']]);assert.equal(item.status,'done');
});
test('sorting retains all skills regardless of deployment status',()=>{const elements={'skill-state-filter':{value:'unpublished'},'skill-sort':{value:'name'}};
 const c=vm.createContext({listPreferenceKey:'library',listPreferences:new Map(),currentProjectPath:null,currentLanguage:'zh',searchInput:{value:''},activeCategoryFilter:null,document:{getElementById:id=>elements[id]}});vm.runInContext(extract('workspaceFilterSkills'),c);
 const filtered=c.workspaceFilterSkills([{filename:'new',title:'new'},{filename:'old',title:'old',codex_global_status:'outdated',global_target_states:[{enabled:true,status:'outdated'}]}]);assert.equal(filtered.length,2);assert.equal(filtered[0].filename,'new');});
function projectSortContext(mode='name'){
 const sort={value:mode};const c=vm.createContext({listPreferenceKey:'project',listPreferences:new Map(),currentProjectPath:'project',currentLanguage:'en',searchInput:{value:''},activeCategoryFilter:null,
  projects:[{path:'project',skills_status:{'z-loaded':'synced','y-outdated':'out_of_sync','child-loaded':'synced'}}],document:{getElementById:()=>sort}});
 vm.runInContext(extract('workspaceFilterSkills'),c);return{c,sort};
}
test('applied project copies precede unmounted skills while retaining name order within groups',()=>{
 const {c}=projectSortContext();const items=[{filename:'a-unmounted'},{filename:'z-loaded'},{filename:'b-global-only',codex_global_enabled:true},{filename:'y-outdated'}];
 const sorted=c.workspaceFilterSkills(items);
 assert.deepEqual(Array.from(sorted,item=>item.filename),['y-outdated','z-loaded','a-unmounted','b-global-only']);
 assert.deepEqual(items.map(item=>item.filename),['a-unmounted','z-loaded','b-global-only','y-outdated']);
});
test('partially applied collections and project-only skills are included in the applied group',()=>{
 const {c}=projectSortContext();const sorted=c.workspaceFilterSkills([{filename:'a-unused'},{filename:'z-project-only',project_only:true},
  {filename:'y-collection',is_collection:true,collection_members:[{filename:'child-unused'},{filename:'child-loaded'}]}]);
 assert.deepEqual(Array.from(sorted,item=>item.filename),['y-collection','z-project-only','a-unused']);
});
test('modified-date sorting respects applied groups and uses the active project status',()=>{
 const {c}=projectSortContext('modified');const items=[{filename:'a-unused',modified_at:100},{filename:'z-loaded',modified_at:1},{filename:'y-outdated',modified_at:2}];
 assert.deepEqual(Array.from(c.workspaceFilterSkills(items),item=>item.filename),['y-outdated','z-loaded','a-unused']);
 c.projects[0].skills_status={'a-unused':'synced'};
 assert.deepEqual(Array.from(c.workspaceFilterSkills(items),item=>item.filename),['a-unused','y-outdated','z-loaded']);
});
test('library mode retains its ordinary sorting after leaving a project',()=>{
 const {c}=projectSortContext();c.currentProjectPath=null;c.listPreferenceKey='library';
 assert.deepEqual(Array.from(c.workspaceFilterSkills([{filename:'z-loaded'},{filename:'a-unused'}]),item=>item.filename),['a-unused','z-loaded']);
});
test('pagination bounds DOM work and exposes the remaining rows',()=>{const e={};for(const id of ['skill-state-filter','skill-sort','skill-page-prev','skill-page-next','skill-page-number','skill-pages'])e[id]={value:''};const c=vm.createContext({listPage:0,listPageSignature:'',currentProjectPath:null,searchInput:{value:''},activeCategoryFilter:null,document:{getElementById:id=>e[id]}});vm.runInContext(extract('paginateSkillRows'),c);
 const rows=Array.from({length:2000},(_,i)=>i);assert.equal(c.paginateSkillRows(rows).length,100);c.listPage=1;assert.equal(c.paginateSkillRows(rows)[0],100);assert.equal(e['skill-page-number'].textContent,'2 / 20');});
test('session module loads before app bindings and all shipped scripts exist',()=>{const root=path.join(__dirname,'../static');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(html.indexOf('src="session-controller.js"')<html.indexOf('src="app.js'));
 for(const match of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);}});

test('restoring a single Markdown draft never enables unsupported metadata writes',async()=>{
 const draft={snapshot:{skillContent:'draft',openaiYaml:'',openaiForm:{},category:'',createOpenaiYaml:false},version:{},at:1};
 const c=vm.createContext({editingFilename:'demo.md',window:{pywebview:{api:{load_editor_draft:async()=>({draft})}}},localStorage:{getItem:()=>null},getEditorSnapshot:()=>JSON.stringify({skillContent:'original'}),showCustomDialog:async()=>true,uiText:a=>a,editorOpenaiForm:{},editorOpenaiYamlSupported:false,editorOpenaiYamlInitialContent:'',markdownTextarea:{},populateSkillCategoryOptions:()=>{},populateOpenaiForm:()=>{},updateEditorDirtyState:()=>{},showToast:()=>{}});
 c.editorViewId=1;vm.runInContext(extract('restoreEditorDraft'),c);await c.restoreEditorDraft();assert.equal(c.editorOpenaiYamlDirty,false);assert.equal(c.editorOpenaiFormDirty,false);assert.equal(c.editorOpenaiYamlCreateRequested,false);assert.equal(c.markdownTextarea.value,'draft');
});
test('a skill-body-only draft does not create untouched package metadata',async()=>{
 const draft={snapshot:{skillContent:'draft',openaiYaml:'interface: {}',openaiForm:{},category:'',createOpenaiYaml:false},version:{},at:1};
 const c=vm.createContext({editingFilename:'demo',window:{pywebview:{api:{load_editor_draft:async()=>({draft})}}},localStorage:{getItem:()=>null},getEditorSnapshot:()=>JSON.stringify({skillContent:'original'}),showCustomDialog:async()=>true,uiText:a=>a,editorOpenaiForm:{},editorOpenaiYamlSupported:true,editorOpenaiYamlInitialContent:'interface: {}',markdownTextarea:{},populateSkillCategoryOptions:()=>{},populateOpenaiForm:()=>{},updateEditorDirtyState:()=>{},showToast:()=>{}});
 c.editorViewId=1;vm.runInContext(extract('restoreEditorDraft'),c);await c.restoreEditorDraft();assert.equal(c.editorOpenaiYamlDirty,false);assert.equal(c.editorOpenaiFormDirty,false);assert.equal(c.editorOpenaiYamlCreateRequested,false);
});

function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};}
function inspectionContext(api={}){
 const calls=[];
 const c=vm.createContext({toolBusy:false,toolCloseRequested:false,toolKind:'inspection',inspectionRunning:false,inspectionPauseRequested:false,inspectionModalVisible:true,
  inspectionQueue:[],drawQueue:()=>{},fetchSkills:async()=>{},showToast:()=>{},uiText:a=>a,
  showCustomDialog:async()=>true,formatImportPreview:()=>'',formatAiImportDiff:()=>'',
  window:{pywebview:{api:{preview_unregistered_skill:async name=>({token:name}),
   apply_skill_import:async token=>{calls.push(['apply',token]);return{ok:true};},
   acknowledge_unregistered_skill:async name=>{calls.push(['ack',name]);return{ok:true};},
   discard_skill_import:async token=>{calls.push(['discard',token]);return{ok:true};},...api}}}});
 for(const name of ['inspectAll','acknowledgeQueueItem','skipQueueItem','applyQueueItem','reviewQueueItem','keepSelected'])vm.runInContext(extract(name),c);
 return{c,calls};
}
test('ready items can be reviewed and applied while the next inspection is waiting',async()=>{
 const next=deferred(),entered=deferred();
 const {c,calls}=inspectionContext({preview_unregistered_skill:async name=>{
  if(name==='second'){entered.resolve();return next.promise;}return{token:name};
 }});
 c.inspectionQueue=[{filename:'first',status:'pending'},{filename:'second',status:'pending'}];
 const running=c.inspectAll();await entered.promise;
 assert.equal(c.inspectionRunning,true);assert.equal(c.toolBusy,false);
 await c.reviewQueueItem(c.inspectionQueue[0]);
 assert.equal(c.inspectionQueue[0].status,'done');assert.ok(calls.some(call=>call[0]==='apply'));
 next.resolve({token:'second'});await running;
 assert.equal(c.inspectionQueue[1].status,'ready');assert.equal(c.inspectionRunning,false);
});
test('checking items are protected but other pending items can be skipped',async()=>{
 const next=deferred();const inspected=[];
 const {c}=inspectionContext({preview_unregistered_skill:async name=>{inspected.push(name);return next.promise;}});
 c.inspectionQueue=[{filename:'checking',status:'pending',selected:true},{filename:'later',status:'pending'}];
 const running=c.inspectAll();
 await c.skipQueueItem(c.inspectionQueue[0]);assert.equal(c.inspectionQueue[0].status,'checking');
 await c.keepSelected();assert.equal(c.inspectionQueue[0].status,'checking');
 await c.skipQueueItem(c.inspectionQueue[1]);assert.equal(c.inspectionQueue[1].status,'skipped');
 next.resolve({token:'current'});await running;assert.deepEqual(inspected,['checking']);
});
test('pause completes the current request and can resume the remaining items',async()=>{
 const next=deferred();const inspected=[];
 const {c}=inspectionContext({preview_unregistered_skill:async name=>{inspected.push(name);return inspected.length===1?next.promise:{token:name};}});
 c.inspectionQueue=[{filename:'first',status:'pending'},{filename:'second',status:'pending'}];
 const running=c.inspectAll();c.inspectionPauseRequested=true;next.resolve({token:'first'});await running;
 assert.equal(c.inspectionQueue[1].status,'pending');
 await c.inspectAll();assert.deepEqual(inspected,['first','second']);assert.equal(c.inspectionQueue[1].status,'ready');
});
test('closing during inspection keeps checking later items in the background',async()=>{
 const first=deferred(),started=deferred(),inspected=[],toasts=[];
 const {c}=inspectionContext({preview_unregistered_skill:async name=>{inspected.push(name);if(name==='first'){started.resolve();return first.promise;}return{token:name};}});
 c.toolModal={};c.deactivateModal=()=>{};c.showToast=(message,kind,options)=>toasts.push({message,kind,options});
 vm.runInContext(extract('closeWorkspaceTool'),c);
 c.inspectionQueue=[{filename:'first',status:'pending'},{filename:'second',status:'pending'}];
 const running=c.inspectAll();await started.promise;c.closeWorkspaceTool();
 assert.equal(c.inspectionModalVisible,false);assert.equal(c.inspectionPauseRequested,false);
 first.resolve({token:'first'});await running;
 assert.deepEqual(inspected,['first','second']);assert.equal(c.inspectionQueue[1].status,'ready');
 assert.equal(toasts.at(-1).options.actionLabel,'打开队列');
});
test('retrying a translation warning replaces its preview and discards only the old token',async()=>{
 const {c,calls}=inspectionContext({preview_unregistered_skill:async()=>({token:'new',display_translation_used:true})});
 const item={filename:'retry',status:'ready',preview:{token:'old',display_translation_error:'truncated'}};
 c.inspectionQueue=[item];await c.inspectAll(item);
 assert.equal(item.preview.token,'new');assert.equal(item.status,'ready');assert.deepEqual(calls,[['discard','old']]);
});
test('workspace modal can close during a mutation without releasing its write lock',()=>{
 let closed=false;const c=vm.createContext({toolBusy:true,toolCloseRequested:false,toolKind:'trash',inspectionRunning:false,
  toolModal:{},deactivateModal:()=>closed=true,showToast(){},uiText:a=>a});
 vm.runInContext(extract('closeWorkspaceTool'),c);c.closeWorkspaceTool();
 assert.equal(closed,true);assert.equal(c.toolBusy,true);assert.equal(c.toolCloseRequested,true);
});

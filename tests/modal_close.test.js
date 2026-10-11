const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const app=fs.readFileSync(path.join(__dirname,'../static/app.js'),'utf8');
const workspace=fs.readFileSync(path.join(__dirname,'../static/workspace-tools.js'),'utf8');
const rules=fs.readFileSync(path.join(__dirname,'../static/project-rules-editor.js'),'utf8');
function extract(source,name){const start=new RegExp('^(?:async )?function '+name+'\\(', 'm').exec(source).index;const end=source.indexOf('\n}',start)+2;return source.slice(start,end);}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};}
function element(){return{value:'',hidden:false,disabled:false,textContent:'',style:{},classList:{contains:()=>true},setAttribute(){},addEventListener(){},append(){},focus(){}};}
function rulesHarness(api={}){
 const elements=new Map(),storage=new Map();const el=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 const c=vm.createContext({Map,Date,Promise,clearTimeout(){},setTimeout(){},uiText:a=>a,showToast(){},showCustomDialog:async()=>true,
  document:{createElement:element,getElementById:el,body:{append(){}},addEventListener(){}},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},
  activateModal:e=>e.active=true,deactivateModal:e=>e.active=false,fetchProjects:async()=>{},currentProjectPath:'',refreshCurrentProject(){},
  window:{addEventListener(){},pywebview:{api:{
   get_project_rules_editor_data:async project=>({project_path:project,content:'rules '+project,version:{hash:project},exists:true}),
   load_editor_draft:async()=>({}),save_editor_draft:async()=>({ok:true}),clear_editor_draft:async()=>({ok:true}),...api}}}});
 vm.runInContext(rules,c);return{c,el,storage};
}
test('rules editor closes while loading and ignores its late response',async()=>{
 const load=deferred();const {c,el}=rulesHarness({get_project_rules_editor_data:()=>load.promise});
 const opening=c.openProjectRulesEditor('A');assert.equal(el('project-rules-editor').active,undefined);
 await c.closeProjectRulesEditor();
 assert.equal(vm.runInContext('rulesEditor.active',c),false);
 load.resolve({project_path:'A',content:'late A',version:{},exists:true});await opening;
 assert.notEqual(el('rules-editor-text').value,'late A');
});
test('closing dirty rules preserves a local draft without waiting for disk',async()=>{
 const disk=deferred();const {c,el,storage}=rulesHarness({save_editor_draft:()=>disk.promise});
 await c.openProjectRulesEditor('A');el('rules-editor-text').value='unsaved A';
 assert.equal(await c.closeProjectRulesEditor(),true);
 assert.equal(JSON.parse(storage.get('@project-rules:A')).snapshot.skillContent,'unsaved A');
 assert.equal(vm.runInContext('rulesEditor.active',c),false);disk.resolve({ok:true});
});
test('save completion from a closed rules editor cannot change the next editor',async()=>{
 const disk=deferred(),calls=[];const {c,el}=rulesHarness({save_project_rules:(...args)=>{calls.push(args);return disk.promise;}});
 await c.openProjectRulesEditor('A');el('rules-editor-text').value='saved A';
 const save=c.saveProjectRulesFromEditor();await Promise.resolve();await c.closeProjectRulesEditor();
 await c.openProjectRulesEditor('B');disk.resolve({content:'saved A',version:{hash:'updated'}});await save;
 assert.equal(calls[0][0],'A');assert.equal(calls[0][1],'saved A');assert.equal(el('rules-editor-text').value,'rules B');
 assert.equal(vm.runInContext('rulesEditor.active',c),true);
});
test('AI panel closes immediately even if saving the chat is pending',async()=>{
 const saved=deferred();let closed=false;const c=vm.createContext({aiModal:{},deactivateModal:()=>closed=true,saveCurrentSession:()=>saved.promise});
 vm.runInContext(extract(app,'closeAIModal'),c);await c.closeAIModal();assert.equal(closed,true);saved.resolve(true);
});
test('late skill save never closes or edits a newly opened editor',async()=>{
 const saved=deferred();let closed=false;
 const c=vm.createContext({isViewingSkill:false,editingFilename:'A',editorSaveBusy:false,editorViewId:1,editorVersion:{hash:'A'},
  modalSaveBtn:{},editorOpenaiFormDirty:false,editorOpenaiYamlContent:'',editorOpenaiYamlExists:false,editorOpenaiYamlDirty:false,editorOpenaiYamlCreateRequested:false,
  syncActiveEditorBuffer(){},getEditorContentWithCategory:async()=> 'content A',getEditorSnapshot:()=> 'snapshot A',
  window:{pywebview:{api:{save_skill_editor_data:()=>saved.promise}}},currentLanguage:'zh',showToast(){},fetchSkills:async()=>{},
  closeEditorModal:()=>closed=true,locales:{zh:{toastSaveSuccess:'saved'}}});
 vm.runInContext(extract(app,'handleSaveSkill'),c);const saving=c.handleSaveSkill();await Promise.resolve();
 c.editorViewId=2;c.editingFilename='B';c.editorSaveBusy=true;saved.resolve({ok:true});await saving;
 assert.equal(c.editingFilename,'B');assert.equal(closed,false);assert.equal(c.editorSaveBusy,true);
});
test('dismissed confirmation resolves as cancellation',async()=>{
 let answer='pending',hidden=false;const c=vm.createContext({document:{getElementById:()=>({})},deactivateModal:()=>hidden=true,dialogResolve:value=>answer=value});
 vm.runInContext(extract(app,'closeDialogModal'),c);c.closeDialogModal();assert.equal(answer,null);assert.equal(hidden,true);
});
test('sync review presents package count and file count separately',()=>{
 const c=vm.createContext({currentLanguage:'zh',locales:{zh:{syncPreviewTitle:'同步',syncApply:'确认'}},formatSyncPreview:()=> 'detail'});
 vm.runInContext(extract(app,'buildSyncReview'),c);
 const review=c.buildSyncReview({summary:{delete:761},skill_summary:{delete:29},removed_skills:[{filename:'nature-figure',file_count:126}]});
 assert.equal(review.metrics[2].value,29);assert.match(review.metrics[2].label,/761/);assert.match(review.sections[0].items[0],/nature-figure.*126/);
});

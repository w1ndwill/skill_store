const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../static/collection-editor.js'),'utf8');
function setup(){
 const calls=[],storage=new Map(),elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',disabled:false});return elements.get(id);};
 const state={id:'nature',ready:true,busy:false,shared:'',savedShared:'',sharedDirty:false,selected:null,policies:{},documents:{},versions:{a:{hash:'a'},b:{hash:'b'}},collectionVersion:'v1',items:['a','b'].map(filename=>({filename,supported:true,editable:true,skill_content:'original '+filename,allow_implicit_invocation:true}))};
 const c=vm.createContext({state,document:{getElementById:el},skillsDirPath:{textContent:'library'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  uiText:a=>a,showToast(){},deactivateModal:e=>e.closed=true,window:{pywebview:{api:{save_collection_editor_data:async(...args)=>{calls.push(args);return{ok:true,updated:['a','b']};},get_collection_editor_data:async()=>({items:state.items,collection_version:'v2',shared_rules:state.shared})}}},
  fetchSkills:async()=>{},currentProjectPath:null});
 vm.runInContext(source,c);vm.runInContext('collectionEditorState=state;renderCollectionEditor=()=>{};',c);return{c,state,calls,storage};
}
test('collection and member policy edits are drafts until Save',async()=>{
 const {c,state,calls}=setup();c.stageCollectionEditorPolicy(false);assert.equal(calls.length,0);assert.deepEqual(JSON.parse(JSON.stringify(state.policies)),{a:false,b:false});
 state.selected='b';c.stageCollectionEditorPolicy(true);assert.deepEqual(JSON.parse(JSON.stringify(state.policies)),{a:false});
 await c.saveCollectionEditor();assert.equal(calls.length,1);assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1].policies)),{a:false});
});
test('shared requirements and member documents are submitted together with reviewed versions',async()=>{
 const {c,state,calls}=setup();c.stageCollectionEditorRules('Use Chinese.');state.selected='b';c.stageCollectionEditorDocument('custom b');
 await c.saveCollectionEditor();const changes=calls[0][1];assert.equal(changes.shared_rules,'Use Chinese.');assert.equal(changes.documents.b,'custom b');assert.deepEqual(Object.keys(changes.expected_versions).sort(),['a','b']);
});
test('closing the editor retains its draft and does not submit writes',()=>{
 const {c,state,calls,storage}=setup();c.stageCollectionEditorRules('Keep references.');c.closeCollectionEditor();
 assert.equal(calls.length,0);assert.equal(vm.runInContext('collectionEditorState',c),null);assert.equal(JSON.parse([...storage.values()][0]).shared,'Keep references.');
});
test('reverting shared requirements removes the pending shared edit',()=>{
 const {c,state}=setup();c.stageCollectionEditorRules('draft');c.stageCollectionEditorRules('');assert.equal(state.sharedDirty,false);assert.equal(Object.keys(c.collectionEditorChanges(state).expected_versions).length,0);
});
test('a late save error cannot overwrite a newer editor draft',async()=>{
 const {c,state,storage}=setup();let reject;const pending=new Promise((_,no)=>reject=no);
 c.window.pywebview.api.save_collection_editor_data=()=>pending;
 c.stageCollectionEditorRules('old draft');const saving=c.saveCollectionEditor();c.closeCollectionEditor();
 const key=[...storage.keys()][0];storage.set(key,'newer draft');reject(new Error('disk failure'));await saving;
 assert.equal(storage.get(key),'newer draft');
});

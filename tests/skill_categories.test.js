const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../static/app.js'), 'utf8');
function extract(name) {
  const start = new RegExp('^(?:async )?function ' + name + '\\(', 'm').exec(source).index;
  const next = /\n(?:async )?function \w+\(/.exec(source.slice(start + 1));
  return source.slice(start, next ? start + 1 + next.index : undefined);
}
function setup(category, render) {
  const context = vm.createContext({
    activeEditorSource: 'skill', markdownTextarea: {value: 'nested source'},
    skillCategorySelect: {value: category}, loadedEditorCategory: '工程效率',
    getSkillCategorySelectValue: value => value,
    window: {pywebview: {api: {render_skill_category: render}}},
  });
  vm.runInContext(extract('getEditorContentWithCategory'), context);
  return context;
}
test('unchanged category preserves source without rendering', async () => {
  const context = setup('工程效率', () => {throw new Error('should not render');});
  assert.equal(await context.getEditorContentWithCategory(), 'nested source');
});
test('editor awaits the shared category renderer before using its content', async () => {
  const calls = [];
  const context = setup('工程质量', async (...args) => {
    calls.push(args);
    return {content: 'updated nested source'};
  });
  assert.equal(await context.getEditorContentWithCategory(), 'updated nested source');
  assert.deepEqual(calls, [['nested source', '工程质量']]);
});
test('invalid YAML blocks category save instead of submitting broken content', async () => {
  const context = setup('', async () => ({error: 'Invalid Skill frontmatter'}));
  await assert.rejects(context.getEditorContentWithCategory(), /Invalid Skill frontmatter/);
});

import { STYLE } from './style.js';

const words = {
  timing: ['保存的工具说明在下次会话构建工具表时生效。', 'Saved tool text is used the next time a session builds its tool definitions.'],
  save: ['保存修改', 'Save changes'], refresh: ['刷新', 'Refresh'], reset: ['恢复默认', 'Restore defaults'],
  search: ['筛选工具名或说明', 'Filter tool names or descriptions'],
  dirty: ['有未保存的工具说明', 'Unsaved tool text'], saved: ['工具说明已保存。', 'Tool text saved.'],
  restored: ['已移除部署覆盖。', 'Deployment overrides removed.'],
  switchTitle: ['放弃未保存的修改？', 'Discard unsaved changes?'], switchBody: ['刷新会替换当前编辑内容。', 'Refreshing replaces the current draft.'],
  resetTitle: ['恢复全部工具说明？', 'Restore all tool text?'], resetBody: ['移除本部署的工具说明覆盖，并放弃未保存的修改。', 'Remove this deployment’s tool text overrides and discard unsaved changes.'],
  default: ['默认文字', 'Default text'], noDescription: ['尚未声明说明', 'No description declared'],
  description: ['说明', 'Description'], title: ['标题', 'Title'], toolDescription: ['工具描述', 'Tool description'],
  parametersDescription: ['参数整体说明', 'Description of all parameters'],
  schema: ['完整 JSON Schema', 'Full JSON Schema'], empty: ['没有匹配的工具', 'No matching tools'],
  sourceDefault: ['扩展默认', 'Extension default'], sourcePackage: ['bot 包覆盖', 'Bot package override'], sourceDeployment: ['部署覆盖', 'Deployment override'],
  invalidFile: ['覆盖文件无法读取，使用上层默认文字。', 'The override file cannot be read; inherited text is used.'],
  stale: ['以下覆盖字段已不存在，未应用：', 'These override fields no longer exist and are not applied:'],
  copy: ['复制定义', 'Copy definition'], copied: ['工具定义已复制。', 'Tool definition copied.'],
};

const element = (tag, className = '', text = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
};

export function mountTools(ctx) {
  const t = key => words[key][ctx.language?.startsWith('zh') ? 0 : 1];
  const root = element('section', 'abc-music am-tooltext'), style = element('style'); style.textContent = STYLE;
  const toolbar = element('div', 'am-row am-tooltext-toolbar'), search = element('input'), status = element('div', 'am-status');
  const warnings = element('div', 'am-tooltext-warnings'), list = element('div', 'am-list'), empty = element('div', 'am-empty', t('empty'));
  search.type = 'search'; search.className = 'grow'; search.placeholder = t('search'); search.setAttribute('aria-label', t('search'));
  status.setAttribute('role', 'status'); empty.hidden = true;
  root.append(style, element('p', 'am-help am-tooltext-timing', t('timing')), toolbar, status, warnings, list, empty); ctx.root.append(root);
  let state, controls = [], cards = [], busy = false;
  const on = (node, type, fn) => node.addEventListener(type, fn, { signal: ctx.signal });
  const say = (text, bad = false) => { status.textContent = text; status.classList.toggle('bad', bad); };
  const dirty = () => controls.some(({ input, field }) => input.value !== field.text);
  const action = (label, fn, className = '') => {
    const node = element('button', className, label); node.type = 'button';
    on(node, 'click', () => { void Promise.resolve().then(fn).catch(error => { if (!ctx.signal.aborted) say(error.message, true); }); });
    return node;
  };
  const save = action(t('save'), async () => {
    await run(async () => {
      const overrides = structuredClone(state.overrides);
      for (const { input, field, tool } of controls) {
        overrides[tool] ??= {};
        if (input.value === field.inheritedText) delete overrides[tool][field.path];
        else overrides[tool][field.path] = input.value;
      }
      draw(await ctx.invoke('save', [{ expectedRevision: state.revision, overrides }])); say(t('saved'));
    });
  }, 'primary');
  const refresh = action(t('refresh'), async () => {
    if (dirty() && !await ctx.ui.confirm({ title: t('switchTitle'), body: t('switchBody') })) return;
    await run(async () => { draw(await ctx.invoke('list')); say(''); });
  });
  const reset = action(t('reset'), async () => {
    if (!await ctx.ui.confirm({ title: t('resetTitle'), body: t('resetBody'), danger: true })) return;
    await run(async () => { draw(await ctx.invoke('reset', [{ expectedRevision: state.revision }])); say(t('restored')); });
  });
  toolbar.append(search, save, refresh, reset);
  ctx.guardLeave(() => dirty() ? t('dirty') : null);

  function update() {
    save.disabled = busy || !state || !dirty(); refresh.disabled = busy;
    reset.disabled = busy || !state || !Object.keys(state.overrides).length && !state.warnings.some(warning => warning.layer === 'deployment' && warning.error);
    for (const control of controls) { control.input.disabled = busy; control.reset.disabled = busy || control.input.value === control.field.inheritedText; }
  }
  async function run(fn) {
    if (busy) return;
    busy = true; update();
    try { await fn(); } finally { if (!ctx.signal.aborted) { busy = false; update(); } }
  }
  function filter() {
    const query = search.value.trim().toLocaleLowerCase();
    for (const card of cards) card.node.hidden = !card.searchText().toLocaleLowerCase().includes(query);
    empty.hidden = cards.some(card => !card.node.hidden);
  }
  on(search, 'input', filter);

  function draw(next) {
    if (ctx.signal.aborted) return;
    state = next; controls = []; cards = []; list.replaceChildren(); warnings.replaceChildren();
    for (const warning of state.warnings) warnings.append(element('p', 'am-status bad', `${warning.error ? t('invalidFile') : t('stale')} ${warning.layer}: ${warning.error || `${warning.tool}${warning.path}`}`));
    for (const tool of state.tools) {
      const card = element('details', 'am-tool-card'), summary = element('summary', 'am-tool-summary');
      const name = element('code', '', tool.name), brief = element('span', 'muted', tool.description), source = element('span', 'am-tool-source');
      summary.append(name, brief, source); card.append(summary);
      const memoKey = `tool:${tool.name}`; card.open = ctx.memo.get(memoKey, false);
      on(card, 'toggle', () => ctx.memo.set(memoKey, card.open));
      const body = element('div', 'am-tool-body'), fields = element('div', 'am-tool-fields'), raw = element('details', 'am-tool-raw'), json = element('pre');
      const modelSchema = { name: tool.name, description: tool.description, parameters: structuredClone(tool.parameters) };
      const toolControls = [];
      const renderRaw = () => {
        const draft = structuredClone(modelSchema);
        for (const control of toolControls) {
          if (control.input.value === control.field.text) continue;
          const keys = control.field.path.slice(1).split('/').map(key => key.replaceAll('~1', '/').replaceAll('~0', '~')), last = keys.pop();
          let node = draft; for (const key of keys) node = node[key]; node[last] = control.input.value;
        }
        json.textContent = JSON.stringify(draft, null, 2);
        brief.textContent = toolControls.find(control => control.field.path === '/description').input.value;
        source.textContent = toolControls.some(control => control.input.value !== control.field.inheritedText) ? t('sourceDeployment') : tool.fields.some(field => field.inheritedSource === 'package') ? t('sourcePackage') : t('sourceDefault');
      };
      for (const field of tool.fields) {
        const box = element('div', `am-tool-field${field.path === '/description' ? ' wide' : ''}`), input = element('textarea'), label = element('label');
        const inputId = `${tool.name}-${toolControls.length}`;
        input.id = inputId; input.value = field.text; input.rows = field.path === '/description' ? 4 : 2;
        input.spellcheck = false; input.placeholder = t('noDescription'); input.dataset.path = field.path;
        label.htmlFor = inputId;
        label.textContent = field.path === '/description' ? t('toolDescription')
          : field.path === '/parameters/description' ? t('parametersDescription')
          : field.keyword === 'description' && ctx.language?.startsWith('zh') ? `${field.location} 参数说明`
          : `${field.location} · ${t(field.keyword)}`;
        const defaultView = element('details', 'am-tool-default'), defaultText = element('pre', '', field.inheritedText || t('noDescription'));
        defaultView.append(element('summary', '', t('default')), defaultText);
        const restore = action(t('reset'), () => { input.value = field.inheritedText; renderRaw(); update(); say(dirty() ? t('dirty') : ''); });
        const footer = element('div', 'am-row am-tool-field-footer'); footer.append(defaultView, restore);
        box.append(label, input, footer); fields.append(box);
        const control = { input, field, reset: restore, tool: tool.name }; controls.push(control); toolControls.push(control);
        on(input, 'input', () => { renderRaw(); update(); say(dirty() ? t('dirty') : ''); filter(); });
      }
      raw.append(element('summary', '', t('schema')), action(t('copy'), async () => { await navigator.clipboard.writeText(json.textContent); say(t('copied')); }), json);
      body.append(element('div', 'muted', `tags: ${tool.tags.join(', ')}${['barrierAfter', 'endsTurn', 'interruptible'].filter(key => tool[key]).map(key => ` · ${key}`).join('')}`), fields, raw);
      card.append(body); list.append(card); renderRaw();
      cards.push({ node: card, searchText: () => `${tool.name} ${toolControls.map(control => `${control.field.location} ${control.input.value}`).join(' ')}` });
    }
    filter(); update();
  }
  void run(async () => draw(await ctx.invoke('list'))).catch(error => { if (!ctx.signal.aborted) say(error.message, true); });
}

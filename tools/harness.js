import bundle from '/webui.js';
let active = null, guard = null, toastTimer;
const tabs = document.querySelector('#tabs'), panel = document.querySelector('#panel');
const titles = { scores: '乐谱', works: '作品', instruments: '乐器' };
async function refresh() {
  const manifest = await (await fetch('/manifest')).json();
  const badges = document.querySelector('#badges'); badges.replaceChildren();
  for (const badge of manifest.badges) { const node = document.createElement('span'); node.textContent = `${badge.label} ${badge.value}`; badges.append(node); }
}
function confirm({ title, body }) {
  return new Promise(resolve => {
    const dialog = document.querySelector('#confirm'); dialog.querySelector('h3').textContent = title; dialog.querySelector('p').textContent = body;
    document.querySelector('#yes').onclick = () => { dialog.close(); resolve(true); };
    document.querySelector('#no').onclick = () => { dialog.close(); resolve(false); };
    dialog.oncancel = () => resolve(false); dialog.showModal();
  });
}
async function mount(id) {
  if (guard?.() && !await confirm({ title: '离开当前乐谱？', body: guard() })) return;
  active?.dispose(); panel.replaceChildren(); guard = null;
  for (const button of tabs.children) button.classList.toggle('active', button.dataset.panel === id);
  const controller = new AbortController(), owned = [];
  const call = async (method, args, binary) => {
    const response = await fetch(`/api/${id}/${method}`, { method: 'POST', body: JSON.stringify(args || []), headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error((await response.json()).error);
    return binary ? response.blob() : response.json();
  };
  const ctx = {
    root: panel, language: 'zh', signal: controller.signal,
    own(resource) { owned.push(resource); return resource; },
    invoke: (method, args) => call(method, args, false), invokeBinary: (method, args) => call(method, args, true),
    refresh, guardLeave(fn) { guard = fn; return { dispose() { guard = null; } }; },
    pickPath({ title }) {
      // The standalone preview uses a path field in place of the host-native picker.
      return new Promise(resolve => {
        const dialog = document.createElement('dialog'), heading = document.createElement('h3'), label = document.createElement('label'), input = document.createElement('input'), choose = document.createElement('button'), cancel = document.createElement('button');
        heading.textContent = title; label.textContent = '本地预览：文件绝对路径'; input.style.width = '100%'; label.append(input); choose.textContent = '导入'; cancel.textContent = '取消';
        const done = value => { dialog.remove(); resolve(value); };
        choose.onclick = () => done(input.value || null); cancel.onclick = () => done(null); dialog.oncancel = () => done(null);
        controller.signal.addEventListener('abort', () => done(null), { once: true });
        dialog.append(heading, label, choose, cancel); panel.append(dialog); dialog.showModal();
      });
    },
    memo: { get(key, fallback) { try { return JSON.parse(localStorage.getItem(`abc-preview:${id}:${key}`)) ?? fallback; } catch { return fallback; } }, set(key, value) { localStorage.setItem(`abc-preview:${id}:${key}`, JSON.stringify(value)); } },
    stream(handlers) { const stream = new EventSource('/events'); stream.onmessage = event => handlers.message(event.data); const resource = { dispose() { stream.close(); } }; owned.push(resource); return resource; },
    ui: { confirm, toast(text) { const box = document.querySelector('#toast'); box.textContent = text; box.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { box.hidden = true; }, 4000); } },
  };
  active = { dispose() { controller.abort(); for (const resource of new Set(owned)) resource.dispose(); } };
  bundle.panels[id].mount(ctx); await refresh();
}
for (const [id, title] of Object.entries(titles)) { const button = document.createElement('button'); button.textContent = title; button.dataset.panel = id; button.onclick = () => mount(id); tabs.append(button); }
await mount('scores');

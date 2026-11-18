/*
 * Focuzap content script (isolated world).
 *
 * WhatsApp Web's markup is obfuscated and changes often, so this script relies
 * only on the few hooks that have been stable for years (#side, #pane-side,
 * #main, data-icon attributes, contenteditable/input search box) and tags
 * elements with data attributes that focus.css then hides.
 */
(() => {
  const ROOT = document.documentElement;
  const PHONE_MIN_DIGITS = 8;

  // Default to "on" immediately so the chat list never flashes on load.
  ROOT.classList.add('focuzap-on');
  ROOT.dataset.focuzap = 'on';

  let enabled = true;
  let resumeTimer = null;

  // ---------- state (pause / resume) ----------

  function applyState(pausedUntil) {
    clearTimeout(resumeTimer);
    const now = Date.now();
    enabled = !(pausedUntil && pausedUntil > now);
    ROOT.classList.toggle('focuzap-on', enabled);
    ROOT.dataset.focuzap = enabled ? 'on' : 'off';
    if (!enabled) {
      resumeTimer = setTimeout(() => applyState(0), pausedUntil - now + 50);
    }
    cleanTitle();
    schedule();
  }

  chrome.storage.local.get({ pausedUntil: 0 }, ({ pausedUntil }) => applyState(pausedUntil));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.pausedUntil) applyState(changes.pausedUntil.newValue || 0);
  });

  // ---------- title / favicon (unread counters) ----------

  function cleanTitle() {
    if (!enabled) return;
    const t = document.title;
    const clean = t.replace(/^\(\d+\)\s*/, '');
    if (clean !== t) document.title = clean;
  }

  const ICON_URL = chrome.runtime.getURL('icons/icon-48.png');
  function lockFavicon() {
    if (!enabled) return;
    for (const link of document.querySelectorAll('link[rel~="icon"]')) {
      if (link.href !== ICON_URL) link.href = ICON_URL;
    }
  }

  // Runs synchronously (not throttled) so it also works in background tabs,
  // which is exactly when the "(3) WhatsApp" title would lure you back.
  new MutationObserver(() => {
    cleanTitle();
    lockFavicon();
  }).observe(ROOT, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['href'] });

  // ---------- side pane ----------

  function findSearchInput(side) {
    return side.querySelector(
      '[contenteditable="true"][role="textbox"], [contenteditable="true"], input[type="text"], input[type="search"], input:not([type])'
    );
  }

  function readQuery(el) {
    if (!el) return '';
    const v = 'value' in el && typeof el.value === 'string' ? el.value : el.innerText || '';
    return v.trim();
  }

  function phoneDigits(query) {
    if (!/^[+\d\s().-]+$/.test(query)) return null;
    const digits = query.replace(/\D/g, '');
    return digits.length >= PHONE_MIN_DIGITS ? digits : null;
  }

  function formatPhone(digits) {
    return '+' + digits;
  }

  function ensurePanel(side, anchor) {
    let panel = side.querySelector(':scope > .focuzap-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'focuzap-panel';
      panel.innerHTML = `
        <div class="focuzap-hint">
          <p class="focuzap-title">Who do you need to talk to?</p>
          <p class="focuzap-sub">Search by name or phone number (with country code). Everything else stays out of sight.</p>
          <p class="focuzap-sub focuzap-keys"><kbd>Ctrl</kbd>+<kbd>K</kbd> search · <kbd>Esc</kbd> close chat</p>
        </div>
        <button type="button" class="focuzap-phone" hidden></button>
      `;
      panel.querySelector('.focuzap-phone').addEventListener('click', (e) => {
        const digits = e.currentTarget.dataset.digits;
        if (digits) location.href = `https://web.whatsapp.com/send?phone=${digits}`;
      });
    }
    // Keep it right after the search box container.
    if (panel.previousElementSibling !== anchor) anchor.after(panel);
    return panel;
  }

  function updatePanel(panel, query) {
    const hint = panel.querySelector('.focuzap-hint');
    const btn = panel.querySelector('.focuzap-phone');
    const digits = phoneDigits(query);

    const hintHidden = query.length > 0;
    if (hint.hidden !== hintHidden) hint.hidden = hintHidden;

    if (digits) {
      const label = `Open chat with ${formatPhone(digits)}`;
      if (btn.textContent !== label) btn.textContent = label;
      btn.dataset.digits = digits;
      if (btn.hidden) btn.hidden = false;
    } else if (!btn.hidden) {
      btn.hidden = true;
    }
    const panelHidden = !hintHidden ? false : !digits;
    if (panel.hidden !== panelHidden) panel.hidden = panelHidden;
  }

  function tagSideChildren(side, searchInput) {
    for (const child of side.children) {
      const keep =
        child.classList.contains('focuzap-panel') ||
        child.id === 'pane-side' ||
        child.querySelector('#pane-side') ||
        (searchInput && child.contains(searchInput));
      if (keep) {
        if (child.hasAttribute('data-focuzap-hide')) child.removeAttribute('data-focuzap-hide');
      } else if (!child.hasAttribute('data-focuzap-hide')) {
        child.setAttribute('data-focuzap-hide', '');
      }
    }
  }

  // 2026 layout: the side header (wordmark, Menu, New chat) is a sibling of
  // #side instead of a child of it.
  function tagSideHeader(side) {
    const parent = side.parentElement;
    if (!parent) return;
    for (const sib of parent.children) {
      if (sib === side || sib.tagName !== 'HEADER') continue;
      if (sib.contains(document.getElementById('main'))) continue;
      if (!sib.hasAttribute('data-focuzap-hide')) sib.setAttribute('data-focuzap-hide', '');
    }
  }

  // ---------- navigation rail (Status / Channels / Communities / Meta AI) ----------

  // 2026 layout: rail buttons carry data-navbar-item. Older layouts: data-icon names.
  const RAIL_ICONS =
    '[data-navbar-item], [data-icon*="status"], [data-icon*="newsletter"], [data-icon*="community"], [data-icon*="channel"]';

  function tagNavRail() {
    const side = document.getElementById('side');
    for (const icon of document.querySelectorAll(RAIL_ICONS)) {
      if (side && side.contains(icon)) continue;
      if (icon.closest('#main')) continue;
      const rail = icon.closest('header');
      if (rail && !rail.contains(side) && !rail.hasAttribute('data-focuzap-invisible')) {
        rail.setAttribute('data-focuzap-invisible', '');
      }
      return;
    }
  }

  // ---------- keyboard shortcuts ----------
  //
  // WhatsApp Web's own: Ctrl+Alt+/ focuses search, Esc closes the open chat.
  // Focuzap adds Ctrl+K (Cmd+K) as a friendlier alias for search, and blocks
  // Ctrl+Alt+N ("new chat"), which opens your full contact list.

  function focusSearch() {
    const side = document.getElementById('side');
    const input = side && findSearchInput(side);
    if (!input) return;
    input.focus();
    if (typeof input.select === 'function') {
      input.select();
    } else {
      const range = document.createRange();
      range.selectNodeContents(input);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  window.addEventListener(
    'keydown',
    (e) => {
      if (!enabled) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.altKey && !e.shiftKey && e.code === 'KeyK') {
        e.preventDefault();
        e.stopPropagation();
        focusSearch();
      } else if (e.ctrlKey && e.altKey && !e.shiftKey && e.code === 'KeyN') {
        e.preventDefault();
        e.stopPropagation();
        focusSearch();
      }
    },
    true
  );

  // ---------- clear search once a chat is opened ----------

  function clearSearch(input) {
    if (typeof input.value === 'string' && input.tagName === 'INPUT') {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    // contenteditable (Lexical): go through the editor's own input pipeline.
    input.focus();
    const range = document.createRange();
    range.selectNodeContents(input);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('delete');
  }

  function focusComposer() {
    const composer = document.querySelector('#main footer [contenteditable="true"]');
    if (composer) composer.focus();
  }

  let lastChatKey = null;
  let clearTimer = null;

  function currentChatKey() {
    const header = document.querySelector('#main header');
    if (!header) return null;
    return (header.innerText || '').split('\n')[0].trim() || null;
  }

  function watchChatOpen(side, input, query) {
    const key = currentChatKey();
    if (key === lastChatKey) return;
    lastChatKey = key;
    if (!key || !query || !input) return;
    clearTimeout(clearTimer);
    // Let WhatsApp finish opening the chat (it focuses the composer) first.
    clearTimer = setTimeout(() => {
      if (!enabled || !readQuery(input)) return;
      clearSearch(input);
      focusComposer();
    }, 150);
  }

  // ---------- main tick ----------

  function tick() {
    const side = document.getElementById('side');
    if (!side) return;

    const input = findSearchInput(side);
    const query = readQuery(input);
    ROOT.classList.toggle('focuzap-searching', query.length > 0);

    tagSideChildren(side, input);
    tagSideHeader(side);
    tagNavRail();
    if (enabled) watchChatOpen(side, input, query);

    if (input) {
      const anchor = [...side.children].find((c) => c.contains(input));
      if (anchor) updatePanel(ensurePanel(side, anchor), query);
    }
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      tick();
    }, 30);
  }

  new MutationObserver(schedule).observe(ROOT, { subtree: true, childList: true, characterData: true });
  document.addEventListener('input', schedule, true);
  document.addEventListener('keyup', schedule, true);
})();

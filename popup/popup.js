const statusEl = document.getElementById('status');
const focusedEl = document.getElementById('focused-actions');
const pausedEl = document.getElementById('paused-actions');

let pausedUntil = 0;

function render() {
  const left = pausedUntil - Date.now();
  if (left > 0) {
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    statusEl.textContent = `Paused · focus returns in ${m}:${String(s).padStart(2, '0')}`;
    statusEl.classList.add('paused');
    focusedEl.hidden = true;
    pausedEl.hidden = false;
  } else {
    statusEl.textContent = 'Focus mode is on';
    statusEl.classList.remove('paused');
    focusedEl.hidden = false;
    pausedEl.hidden = true;
  }
}

chrome.storage.local.get({ pausedUntil: 0 }, (v) => {
  pausedUntil = v.pausedUntil;
  render();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.pausedUntil) {
    pausedUntil = changes.pausedUntil.newValue || 0;
    render();
  }
});

for (const btn of document.querySelectorAll('[data-minutes]')) {
  btn.addEventListener('click', () => {
    chrome.storage.local.set({ pausedUntil: Date.now() + Number(btn.dataset.minutes) * 60000 });
  });
}

document.getElementById('resume').addEventListener('click', () => {
  chrome.storage.local.set({ pausedUntil: 0 });
});

setInterval(render, 1000);

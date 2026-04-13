/* ── UNP Deck Engine ───────────────────────────────────────────── */
/* Lightweight presentation engine — no dependencies               */
/* Keys: ←→ navigate, O overview, P presenter, F fullscreen        */
/* ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const deck = document.querySelector('.deck');
  if (!deck) return;

  const slides = Array.from(deck.querySelectorAll('.slide'));
  const total = slides.length;
  let current = 0;
  let presenterWin = null;
  let startTime = null;
  const channel = new BroadcastChannel('unp-deck');

  // ── Slide dimensions (must match CSS) ────────────────────────
  const SLIDE_W = 1600;
  const SLIDE_H = 900;

  // ── UI elements ──────────────────────────────────────────────
  const progress = document.createElement('div');
  progress.className = 'deck-progress';
  document.body.appendChild(progress);

  const counter = document.createElement('div');
  counter.className = 'deck-counter';
  document.body.appendChild(counter);

  // ── Scaling ─────────────────────────────────────────────────
  // Scale all slides to fit the viewport while maintaining 16:9.
  // Like a projector: letterboxed, never stretched.
  function resizeSlides() {
    if (document.body.classList.contains('overview-mode')) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / SLIDE_W, vh / SLIDE_H);

    slides.forEach(function (s) {
      s.style.transform = 'scale(' + scale + ')';
    });
  }

  window.addEventListener('resize', resizeSlides);
  resizeSlides();

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    // Read hash
    const hash = window.location.hash;
    if (hash && hash.startsWith('#s')) {
      const n = parseInt(hash.slice(2), 10);
      if (n >= 1 && n <= total) current = n - 1;
    }
    goTo(current, true);
  }

  // ── Navigation ───────────────────────────────────────────────
  function goTo(index, instant) {
    if (index < 0 || index >= total) return;

    const prev = slides[current];
    const next = slides[index];

    if (!instant && prev !== next) {
      prev.classList.remove('active');
      prev.classList.add('exiting');
      setTimeout(() => prev.classList.remove('exiting'), 400);
    } else if (prev !== next) {
      prev.classList.remove('active');
    }

    current = index;
    next.classList.add('active');

    // Update UI
    const pct = ((current + 1) / total) * 100;
    progress.style.width = pct + '%';
    counter.textContent = (current + 1) + ' / ' + total;
    window.location.hash = 's' + (current + 1);

    // Resolve builds on this slide
    resolveBuildState(next);

    // Sync presenter
    syncPresenter();
    channel.postMessage({ type: 'goto', index: current });
  }

  function next() {
    // Check for unresolved builds first
    const slide = slides[current];
    const hiddenBuilds = slide.querySelectorAll('.build:not(.visible)');
    if (hiddenBuilds.length > 0) {
      hiddenBuilds[0].classList.add('visible');
      return;
    }
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function resolveBuildState(slide) {
    // On backward nav, show all builds; on forward, they'll reveal on click
    // Actually: show all builds from previously visited slides
    // For simplicity: builds are revealed by pressing → within a slide
  }

  // ── Overview mode ────────────────────────────────────────────
  let overviewActive = false;

  function toggleOverview() {
    overviewActive = !overviewActive;
    document.body.classList.toggle('overview-mode', overviewActive);

    if (overviewActive) {
      // Remove scaling transforms for grid layout
      slides.forEach(s => {
        s.style.transform = 'none';
        s.classList.add('active');
        s.classList.remove('exiting');
      });
      // Click to jump
      slides.forEach((s, i) => {
        s._overviewClick = () => {
          toggleOverview();
          goTo(i);
        };
        s.addEventListener('click', s._overviewClick);
      });
    } else {
      slides.forEach((s, i) => {
        if (i !== current) s.classList.remove('active');
        if (s._overviewClick) {
          s.removeEventListener('click', s._overviewClick);
          delete s._overviewClick;
        }
      });
      // Reapply scaling
      resizeSlides();
    }
  }

  // ── Presenter mode ───────────────────────────────────────────
  function openPresenter() {
    if (presenterWin && !presenterWin.closed) {
      presenterWin.focus();
      return;
    }

    startTime = startTime || Date.now();

    presenterWin = window.open('', 'presenter', 'width=900,height=600');
    const doc = presenterWin.document;
    doc.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Presenter — Notes</title>
<link rel="stylesheet" href="deck.css">
<style>
  body {
    background: #1a1a2e;
    color: #e0e0e0;
    font-family: 'DM Sans', sans-serif;
    margin: 0;
    padding: 1rem;
    overflow-y: auto;
  }
  .p-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #333;
  }
  .p-counter {
    font-family: 'DM Mono', monospace;
    font-size: 0.8rem;
    color: #B9975B;
  }
  .p-timer {
    font-family: 'DM Mono', monospace;
    font-size: 1.3rem;
    color: #B9975B;
  }
  .p-title {
    font-family: 'Instrument Serif', serif;
    font-size: 1.2rem;
    color: #fff;
    margin-bottom: 1rem;
  }
  .p-notes {
    font-size: 0.88rem;
    line-height: 1.7;
    color: #ccc;
    white-space: pre-wrap;
    max-width: 700px;
  }
  .p-next {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #333;
  }
  .p-next-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }
  .p-next-title {
    font-size: 0.9rem;
    color: #888;
  }
</style>
</head><body>
<div class="p-header">
  <span class="p-counter" id="pc"></span>
  <span class="p-timer" id="pt">00:00</span>
</div>
<div class="p-title" id="ptitle"></div>
<div class="p-notes" id="pnotes"></div>
<div class="p-next">
  <div class="p-next-label">Next</div>
  <div class="p-next-title" id="pnext"></div>
</div>
<script>
  const ch = new BroadcastChannel('unp-deck');
  ch.onmessage = e => {
    if (e.data.type === 'sync') {
      document.getElementById('pc').textContent = e.data.counter;
      document.getElementById('ptitle').textContent = e.data.title;
      document.getElementById('pnotes').textContent = e.data.notes;
      document.getElementById('pnext').textContent = e.data.nextTitle || '— fin —';
    }
    if (e.data.type === 'timer') {
      document.getElementById('pt').textContent = e.data.elapsed;
    }
  };
  // Forward key events to main window
  document.addEventListener('keydown', e => {
    ch.postMessage({ type: 'key', key: e.key, ctrlKey: e.ctrlKey });
  });
</script>
</body></html>`);
    doc.close();
    syncPresenter();
    startTimer();
  }

  function syncPresenter() {
    if (!presenterWin || presenterWin.closed) return;

    const slide = slides[current];
    const notesEl = slide.querySelector('.notes');
    const notes = notesEl ? notesEl.textContent.trim() : '(no notes)';
    const title = getSlideTitle(slide);
    const nextTitle = current + 1 < total ? getSlideTitle(slides[current + 1]) : null;

    channel.postMessage({
      type: 'sync',
      counter: (current + 1) + ' / ' + total,
      title: title,
      notes: notes,
      nextTitle: nextTitle
    });
  }

  function getSlideTitle(slide) {
    const h1 = slide.querySelector('h1');
    if (h1) return h1.textContent.trim();
    const h2 = slide.querySelector('h2');
    if (h2) return h2.textContent.trim();
    return '(untitled)';
  }

  let timerInterval = null;
  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      if (!startTime) return;
      const elapsed = Date.now() - startTime;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      const str = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      channel.postMessage({ type: 'timer', elapsed: str });
    }, 1000);
  }

  // ── Keyboard ─────────────────────────────────────────────────
  function handleKey(e) {
    // Don't capture in contenteditable
    if (e.target.isContentEditable) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        if (overviewActive) return;
        next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        if (overviewActive) return;
        prev();
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(total - 1);
        break;
      case 'o':
      case 'O':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleOverview();
        }
        break;
      case 'p':
      case 'P':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          openPresenter();
        }
        break;
      case 'f':
      case 'F':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }
        break;
      case 'e':
      case 'E':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleEdit();
        }
        break;
      case 'Escape':
        if (editMode) {
          e.preventDefault();
          toggleEdit();
        } else if (overviewActive) {
          e.preventDefault();
          toggleOverview();
        }
        break;
    }
  }

  document.addEventListener('keydown', handleKey);

  // Listen for key forwarding from presenter window
  channel.onmessage = function (e) {
    if (e.data.type === 'key') {
      handleKey({ key: e.data.key, ctrlKey: e.data.ctrlKey, metaKey: false, target: document.body, preventDefault: function(){} });
    }
  };

  // ── Touch support ────────────────────────────────────────────
  let touchStartX = 0;
  let touchStartY = 0;

  deck.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  deck.addEventListener('touchend', function (e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  }, { passive: true });

  // ── Edit mode ──────────────────────────────────────────────
  // Press E to toggle edit mode. All text becomes contenteditable.
  // Ctrl+S exports clean HTML. Auto-saves to localStorage.
  let editMode = false;
  const EDIT_SELECTORS = 'h1, h2, h3, p, li, .quote, .key-point, td, th';
  const STORAGE_KEY = 'unp-deck-edits-' + (document.title || location.pathname).replace(/[^a-z0-9]/gi, '-').slice(0, 60);
  let autoSaveTimer = null;

  // Home button — link back to companion site
  const homeBtn = document.createElement('a');
  homeBtn.className = 'deck-home-btn';
  homeBtn.textContent = '⌂';
  homeBtn.title = 'Retour au site';
  homeBtn.href = '../c2/index.html';
  document.body.appendChild(homeBtn);

  // Edit toggle button (clickable — works in iframes where keys don't)
  const editBtn = document.createElement('button');
  editBtn.className = 'deck-edit-btn';
  editBtn.textContent = '✎';
  editBtn.title = 'Toggle edit mode (E)';
  editBtn.addEventListener('click', function (ev) {
    ev.stopPropagation();
    toggleEdit();
  });
  document.body.appendChild(editBtn);

  // Edit indicator badge
  const editBadge = document.createElement('div');
  editBadge.className = 'deck-edit-badge';
  editBadge.textContent = 'EDIT';
  editBadge.style.display = 'none';
  document.body.appendChild(editBadge);

  function toggleEdit() {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    editBadge.style.display = editMode ? 'block' : 'none';

    const els = deck.querySelectorAll(EDIT_SELECTORS);
    els.forEach(function (el) {
      if (editMode) {
        el.setAttribute('contenteditable', 'true');
      } else {
        el.removeAttribute('contenteditable');
      }
    });

    if (editMode) {
      autoSaveTimer = setInterval(saveEdits, 5000);
    } else {
      if (autoSaveTimer) clearInterval(autoSaveTimer);
      autoSaveTimer = null;
      saveEdits();
    }
  }

  function saveEdits() {
    var data = {};
    slides.forEach(function (s, i) {
      data['s' + (i + 1)] = s.innerHTML;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* quota */ }
  }

  function loadEdits() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      var loaded = false;
      slides.forEach(function (s, i) {
        var key = 's' + (i + 1);
        if (data[key]) {
          s.innerHTML = data[key];
          loaded = true;
        }
      });
      return loaded;
    } catch (e) { return false; }
  }

  function clearEdits() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function exportClean() {
    // Temporarily strip edit attributes
    var els = deck.querySelectorAll('[contenteditable]');
    els.forEach(function (el) { el.removeAttribute('contenteditable'); });
    document.body.classList.remove('edit-mode');
    editBadge.style.display = 'none';

    var html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

    // Restore
    if (editMode) {
      document.body.classList.add('edit-mode');
      editBadge.style.display = 'block';
      els.forEach(function (el) { el.setAttribute('contenteditable', 'true'); });
    }

    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'c1-deck-edited.html';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Load saved edits on startup
  if (loadEdits()) {
    console.log('[deck] Restored saved edits from localStorage');
  }

  // Hook Ctrl+S and Ctrl+Shift+X (need separate listener for modifier combos)
  document.addEventListener('keydown', function (ev) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') {
      ev.preventDefault();
      if (editMode) exportClean();
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key === 'X') {
      ev.preventDefault();
      if (confirm('Clear all saved edits and reload?')) clearEdits();
    }
  });

  // ── Go ───────────────────────────────────────────────────────
  init();
})();

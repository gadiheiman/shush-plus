/* modal.js – חלון קופץ כללי: נסגר ב-Esc, בלחיצה על הרקע או בכפתור */
(function () {
  const { h } = DOM;
  let lastFocus = null;

  /** סוגר את החלון הפתוח */
  function close() {
    const m = document.querySelector('.modal-back');
    if (m) m.remove();
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKey);
    if (lastFocus) lastFocus.focus();
  }

  const onKey = (e) => { if (e.key === 'Escape') close(); };

  /** פותח חלון עם כותרת ותוכן */
  function open(title, ...content) {
    close();
    lastFocus = document.activeElement;
    const x = h('button', { type: 'button', class: 'icon-btn modal-x', 'aria-label': 'סגירה' }, '✕');
    x.addEventListener('click', close);
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'modal-head' }, h('h2', null, title), x),
      h('div', { class: 'modal-body' }, content));
    const back = h('div', { class: 'modal-back' }, box);
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    document.body.append(back);
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', onKey);
    x.focus();
  }

  window.Modal = { open, close };
})();

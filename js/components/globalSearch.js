/* globalSearch.js – חיפוש כללי בכותרת העליונה, זמין בכל מסך.
   במחשב: שדה חיפוש בכותרת. בנייד: כפתור 🔍 שפותח שורת חיפוש מתחת לכותרת.
   התוצאות מקובצות לפי סוג, ולחיצה מעבירה למקום הנכון באפליקציה. */
(function () {
  const { h } = DOM;
  const ACTIONS = {
    view: (it) => Router.go(it.viewId),
    town: (it) => { Store.set({ town: it.town }); Router.go('town'); },
    unit: (it) => ClinicFinder.showUnit(it.unit),
    obj: (it) => focusObjection('objections', it.says),
    ret: (it) => focusObjection('retain', it.says),
    adv: () => Router.go('why'),
    quiz: () => Router.go('train')
  };

  /** מעבר למסך התנגדויות כשההתנגדות שנבחרה מסוננת ופתוחה */
  function focusObjection(view, says) {
    Store.set({ objFocus: { view, says } });
    if (location.hash === '#' + view) Router.go(view); else location.hash = view;
  }

  /** מסמן את החלק שהוקלד בתוך הכותרת */
  function highlight(text, q) {
    const i = text.indexOf(q.trim());
    if (!q.trim() || i < 0) return text;
    return [text.slice(0, i), h('mark', null, text.slice(i, i + q.trim().length)), text.slice(i + q.trim().length)];
  }

  /** בונה את הרכיב: שדה, כפתור לנייד ולוח תוצאות */
  function render() {
    let flat = [], active = -1;
    const input = h('input', { type: 'search', class: 'gs-input', placeholder: 'חיפוש: יישוב, מרפאה, התנגדות…', 'aria-label': 'חיפוש כללי',
      role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'gs-panel', autocomplete: 'off', enterkeyhint: 'search' });
    const clear = h('button', { type: 'button', class: 'gs-clear', 'aria-label': 'ניקוי החיפוש', hidden: true }, '✕');
    const panel = h('div', { id: 'gs-panel', class: 'gs-panel', role: 'listbox', hidden: true });
    const box = h('div', { class: 'gs-box' }, h('span', { class: 'gs-ic', 'aria-hidden': 'true' }, '🔍'), input, clear);
    const opener = h('button', { type: 'button', class: 'gs-open', 'aria-label': 'פתיחת חיפוש', 'aria-expanded': 'false' }, '🔍');
    const wrap = h('div', { class: 'gs' }, opener, box, panel);

    /** סגירת לוח התוצאות (ובנייד גם שורת החיפוש) */
    const close = (all) => {
      panel.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1;
      if (all) { wrap.classList.remove('gs-on'); opener.setAttribute('aria-expanded', 'false'); }
    };

    /** ביצוע הפעולה של תוצאה */
    const pick = (it) => {
      Analytics.event('global-search', SearchIndex.norm(input.value).slice(0, 40));
      close(true); input.blur();
      ACTIONS[it.g](it);
    };

    /** בונה את לוח התוצאות לפי מה שהוקלד */
    const draw = () => {
      const q = input.value;
      clear.hidden = !q;
      const groups = SearchIndex.search(q);
      flat = [];
      if (!q.trim() || q.trim().length < 2) return close(false);
      DOM.clear(panel).append(
        groups.length
          ? h('div', { class: 'gs-count' }, `${groups.reduce((s, g) => s + g.total, 0)} תוצאות`)
          : h('p', { class: 'gs-empty' }, 'לא נמצאו תוצאות. נסו מילה אחרת.'),
        ...groups.map((g) => h('section', { class: 'gs-group' },
          h('h3', null, h('span', { 'aria-hidden': 'true' }, g.group.icon), ` ${g.group.name} · ${g.total}`),
          ...g.items.map((it) => {
            const idx = flat.push(it) - 1;
            const row = h('button', { type: 'button', class: 'gs-item', role: 'option', id: 'gs-o' + idx },
              h('span', { class: 'gs-title' }, highlight(it.title, q)), it.sub ? h('span', { class: 'gs-sub' }, it.sub) : null);
            row.addEventListener('click', () => pick(it));
            return row;
          }))));
      panel.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
    };

    /** מקלדת: חצים, Enter ו-Esc */
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') return close(true);
      if (!flat.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length;
        panel.querySelectorAll('.gs-item').forEach((el, i) => el.setAttribute('aria-selected', String(i === active)));
        panel.querySelector('#gs-o' + active)?.scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', 'gs-o' + active);
      } else if (e.key === 'Enter') { e.preventDefault(); pick(flat[Math.max(active, 0)]); }
    });
    input.addEventListener('input', draw);
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2) draw(); });
    clear.addEventListener('click', () => { input.value = ''; draw(); input.focus(); });
    opener.addEventListener('click', () => {
      const on = !wrap.classList.contains('gs-on');
      wrap.classList.toggle('gs-on', on);
      opener.setAttribute('aria-expanded', String(on));
      if (on) input.focus(); else close(true);
    });
    // לחיצה מחוץ לחיפוש סוגרת
    document.addEventListener('pointerdown', (e) => { if (!wrap.contains(e.target)) close(true); });
    window.addEventListener('hashchange', () => close(true));
    return wrap;
  }

  window.GlobalSearch = { render };
})();

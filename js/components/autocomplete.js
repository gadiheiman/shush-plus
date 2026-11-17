/* autocomplete.js – השלמה אוטומטית שעובדת גם בנייד (datalist לא נתמך היטב בדפדפני מובייל).
   שימוש: Autocomplete.attach(input, () => options, onPick) */
(function () {
  const { h } = DOM;
  const MAX = 8;
  let seq = 0;

  /** מנרמל טקסט להשוואה: בלי גרשיים, מקפים ורווחים כפולים */
  const norm = (s) => String(s).replace(/["'״׳`\-–]/g, ' ').replace(/\s+/g, ' ').trim();

  /** מסנן ומדרג: התחלה מדויקת → התחלת מילה → מכיל */
  function match(options, q, prefixOnly) {
    const n = norm(q);
    if (!n) return options.slice(0, MAX);
    const starts = [], word = [], has = [];
    for (const o of options) {
      const t = norm(o);
      if (t.startsWith(n)) starts.push(o);
      else if (prefixOnly) continue;
      else if (t.includes(' ' + n)) word.push(o);
      else if (t.includes(n)) has.push(o);
      if (starts.length >= MAX) break;
    }
    return [...starts, ...word, ...has].slice(0, MAX);
  }

  /** מסמן את החלק שהוקלד בתוך האפשרות */
  function label(o, q) {
    const i = q ? o.indexOf(q.trim()) : -1;
    if (i < 0) return o;
    return [o.slice(0, i), h('b', null, o.slice(i, i + q.trim().length)), o.slice(i + q.trim().length)];
  }

  /**
   * מחבר השלמה אוטומטית לשדה
   * @param {HTMLInputElement} input
   * @param {() => string[]} getOptions – רשימת האפשרויות הנוכחית
   * @param {(value:string) => void} [onPick] – נקרא אחרי בחירה
   * @param {{prefixOnly?:boolean, openEmpty?:boolean}} [opts] – prefixOnly: רק אפשרויות שמתחילות במה שהוקלד (למספרי בית);
   *   openEmpty: לפתוח את הרשימה גם כשהשדה ריק (למשל רחובות אחרי בחירת יישוב)
   */
  function attach(input, getOptions, onPick, opts = {}) {
    const id = 'ac-' + (++seq);
    const list = h('ul', { id, class: 'ac-list', role: 'listbox', hidden: true });
    let items = [], active = -1;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', id);
    input.setAttribute('aria-expanded', 'false');
    input.parentElement.classList.add('ac-wrap');
    input.after(list);

    const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };

    /** בחירת ערך */
    const pick = (v) => {
      input.value = v;
      close();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (onPick) onPick(v);
    };

    /** בונה את הרשימה מחדש לפי מה שהוקלד */
    const render = () => {
      if (input.disabled) return close();
      // שדה ריק: לא פותחים רשימה (כדי לא לכסות כפתורים), אלא אם ביקשו
      if (!input.value.trim() && !opts.openEmpty) return close();
      items = match(getOptions(), input.value, opts.prefixOnly);
      // אם הערך כבר זהה לאפשרות היחידה – אין טעם להציג
      if (!items.length || (items.length === 1 && items[0] === input.value.trim())) return close();
      DOM.clear(list).append(...items.map((o, i) => {
        const li = h('li', { role: 'option', id: `${id}-${i}`, class: 'ac-opt', 'aria-selected': String(i === active) }, label(o, input.value));
        // pointerdown לפני blur, כדי שהבחירה תיקלט גם במגע
        li.addEventListener('pointerdown', (e) => { e.preventDefault(); pick(o); });
        return li;
      }));
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };

    /** מקלדת: חיצים, Enter, Esc */
    input.addEventListener('keydown', (e) => {
      if (list.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
        input.setAttribute('aria-activedescendant', `${id}-${active}`);
      } else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(items[active]); }
      else if (e.key === 'Escape') close();
    });
    input.addEventListener('input', (e) => { if (e.isTrusted !== false) { active = -1; render(); } });
    input.addEventListener('focus', render);
    input.addEventListener('blur', () => setTimeout(close, 120));
    // מגע מחוץ לשדה ולרשימה סוגר (בנייד blur לא תמיד מגיע)
    document.addEventListener('pointerdown', (e) => { if (!list.hidden && e.target !== input && !list.contains(e.target)) close(); });
    return { close, refresh: render };
  }

  window.Autocomplete = { attach };
})();

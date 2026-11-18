/* ui.js – רכיבי ממשק משותפים: כותרת מסך, בורר קופה, בורר יישוב, תגית רמת פער, צ'יפים */
(function () {
  const { h } = DOM;

  /** כותרת מסך עם תווית קטנה ותיאור */
  function viewHead(kicker, title, lead) {
    return h('header', { class: 'view-head' },
      h('span', { class: 'kicker' }, kicker),
      h('h1', null, title),
      lead ? h('p', { class: 'lead' }, lead) : null);
  }

  /** קבוצת צ'יפים לבחירה. multi=true מאפשר כמה */
  function chips({ items, value, onChange, multi = false, label, max }) {
    const wrap = h('div', { class: 'chips', role: multi ? 'group' : 'radiogroup', 'aria-label': label });
    const sel = new Set(multi ? value : [value]);
    items.forEach((it) => {
      const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(sel.has(it.id)) },
        it.icon ? h('span', { class: 'chip-ic', 'aria-hidden': 'true' }, it.icon) : null, it.name);
      b.addEventListener('click', () => {
        if (multi) {
          if (sel.has(it.id)) sel.delete(it.id);
          else { if (max && sel.size >= max) return; sel.add(it.id); }
          onChange([...sel]);
        } else onChange(it.id);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  /** בורר קופה של המבוטח – מסונכרן עם Store */
  function fundPicker(onChange) {
    return h('div', { class: 'field' },
      h('span', { class: 'field-label' }, 'המבוטח נמצא היום ב:'),
      chips({ items: SCRIPTS.funds, value: Store.get('fund'), label: 'קופה נוכחית',
        onChange: (id) => { Store.set({ fund: id }); onChange && onChange(id); } }));
  }

  /**
   * שורת חיפוש: שדה + כפתורי "חיפוש" ו"איפוס" בתוך טופס (Enter = חיפוש)
   * @returns {{form:HTMLFormElement, input:HTMLInputElement}}
   */
  function searchRow({ id, label, placeholder, value = '', onSearch, onReset, type = 'text' }) {
    const input = h('input', { id, class: 'input', type, value, autocomplete: 'off', placeholder, enterkeyhint: 'search' });
    const go = h('button', { type: 'submit', class: 'btn btn-primary btn-sm' }, '🔍 חיפוש');
    const reset = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '↺ איפוס');
    const form = h('form', { class: 'search-row', role: 'search' },
      h('div', { class: 'field grow' }, h('label', { class: 'field-label', for: id }, label), input),
      h('div', { class: 'search-btns' }, go, reset));
    form.addEventListener('submit', (e) => { e.preventDefault(); input.blur(); onSearch(input.value.trim()); });
    reset.addEventListener('click', () => { input.value = ''; input.removeAttribute('aria-invalid'); onReset(); input.focus(); });
    return { form, input };
  }

  /** בורר יישוב: השלמה אוטומטית (גם בנייד), חיפוש ואיפוס – מסונכרן עם Store */
  function townPicker(onChange, id = 'town-input') {
    const commit = (v) => {
      if (TownInsights.findTown(v)) { input.setAttribute('aria-invalid', 'false'); Store.set({ town: v }); Analytics.event('town-search', v); onChange && onChange(v); }
      else input.setAttribute('aria-invalid', 'true');
    };
    const { form, input } = searchRow({
      id, label: '🏘️ יישוב המבוטח', placeholder: 'הקלידו שם יישוב…', value: Store.get('town'),
      onSearch: commit, onReset: () => {}
    });
    // בחירה מהרשימה מחפשת מיד
    Autocomplete.attach(input, () => TOWNS.map((t) => t.n), (v) => commit(v));
    return form;
  }

  /** תגית רמת פער */
  const LEVELS = { high: ['פער גדול', 'hot'], mid: ['פער בינוני', 'warm'], low: ['נוכחות מתחרה', 'cool'] };
  function levelPill(level) {
    const [t, c] = LEVELS[level];
    return h('span', { class: `pill pill-${c}` }, t);
  }

  /** כרטיס עם כותרת */
  function card(title, ...kids) {
    return h('section', { class: 'card' }, title ? h('h2', { class: 'card-title' }, title) : null, ...kids);
  }

  window.UI = { viewHead, chips, fundPicker, townPicker, searchRow, levelPill, card };
})();

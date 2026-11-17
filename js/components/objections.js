/* objections.js – מסכי התנגדויות: גיוס ושימור. רכיב אחד (factory) עם חיפוש, סינון וכרטיסים נפתחים */
(function () {
  const { h } = DOM;

  /** כרטיס התנגדות */
  function objCard(o, open) {
    const hasAsk = o.ask && o.ask !== '—';
    return h('details', { class: 'obj', open: open || null },
      h('summary', null, h('span', { class: 'obj-tag' }, o.tag), h('span', { class: 'obj-says' }, `💬 "${o.says}"`)),
      h('div', { class: 'obj-body' },
        h('p', { class: 'obj-ans' }, '✅ ', o.ans),
        hasAsk ? h('p', { class: 'obj-ask' }, h('strong', null, '❓ שאלת המשך: '), o.ask) : null,
        h('div', { class: 'row-gap' }, DOM.copyBtn(hasAsk ? `${o.ans}\n${o.ask}` : o.ans, 'העתקת התשובה'), o.src ? U.srcLink(o.src) : null)));
  }

  /** עקרונות השימור: כרטיס קומפקטי מתקפל. במחשב פתוח, בנייד סגור כברירת מחדל */
  function rulesStrip(rules) {
    const open = !window.matchMedia('(max-width: 700px)').matches;
    return h('details', { class: 'rules-box', open },
      h('summary', null, h('span', null, `🧭 ${rules.length} עקרונות לכל שיחת שימור`), h('span', { class: 'rules-hint' }, 'הצגה / הסתרה')),
      h('ul', { class: 'rules-list' }, rules.map(([ic, t, p, src]) =>
        h('li', null, h('span', { class: 'rule-ic', 'aria-hidden': 'true' }, ic),
          h('div', null, h('strong', null, t), ' – ', h('span', { class: 'rule-txt' }, p), src ? [' ', U.srcLink(src)] : null)))));
  }

  /**
   * יוצר מסך התנגדויות
   * @param {{id, title, icon, color, section, kicker, head, lead, items:()=>Array, rules?:()=>Array, byFund?:boolean}} cfg
   */
  function makeView(cfg) {
    const local = { q: '', tag: 'הכול', open: false };

    /** סינון לפי חיפוש, תגית וקופה */
    function filtered() {
      const fund = Store.get('fund'), q = local.q.trim();
      return cfg.items().filter((o) =>
        (!cfg.byFund || !o.fund || o.fund === fund || fund === 'unk') &&
        (local.tag === 'הכול' || o.tag === local.tag) &&
        (!q || (o.says + o.ans + (o.ask || '')).includes(q)));
    }

    Router.register({
      id: cfg.id, title: cfg.title, icon: cfg.icon, color: cfg.color,
      render(el) {
        const list = h('div', { class: 'obj-list' });
        const draw = () => {
          const items = filtered();
          DOM.clear(list).append(...(items.length ? items.map((o) => objCard(o, local.open)) : [h('p', { class: 'empty' }, '🔎 לא נמצאה התנגדות כזו. נסו מילה אחרת.')]));
        };
        const rerender = () => { DOM.clear(el); this.render(el); };
        const tags = ['הכול', ...new Set(cfg.items().map((o) => o.tag))].map((t) => ({ id: t, name: t }));
        const sid = cfg.id + '-search';
        const count = h('p', { class: 'fine' });
        const apply = (q) => { local.q = q; draw(); count.textContent = `${filtered().length} התנגדויות · לחיצה על כרטיס פותחת את התשובה`; };
        const { form: searchForm, input: search } = UI.searchRow({
          id: sid, label: '🔍 חיפוש', placeholder: 'מה המבוטח אמר? למשל: תור, מחיר, אפליקציה', value: local.q,
          onSearch: apply, onReset: () => { local.q = ''; local.tag = 'הכול'; rerender(); }
        });
        // סינון חי בזמן הקלדה + השלמה אוטומטית מתוך משפטי המבוטחים
        search.addEventListener('input', () => apply(search.value.trim()));
        Autocomplete.attach(search, () => cfg.items().map((o) => o.says.replace(/^["״]|["״]$/g, '')), (v) => apply(v));
        const toggle = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, local.open ? '➖ לסגור הכול' : '➕ לפתוח הכול');
        toggle.addEventListener('click', () => { local.open = !local.open; rerender(); });

        el.append(
          UI.viewHead(cfg.kicker, cfg.head, cfg.lead),
          ...(cfg.rules ? [rulesStrip(cfg.rules())] : []),
          searchForm,
          h('div', { class: 'controls' },
            h('div', { class: 'field' }, h('span', { class: 'field-label' }, '🏷️ נושא'),
              UI.chips({ label: 'נושא', items: tags, value: local.tag, onChange: (id) => { local.tag = id; rerender(); } })),
            toggle),
          count,
          list);
        apply(local.q);
      }
    });
  }

  /* גיוס */
  makeView({
    id: 'objections', title: 'טיפול בהתנגדויות-גיוס', icon: '🛡️', color: 'violet', byFund: true,
    kicker: '🚀 גיוס · טיפול בהתנגדויות', head: 'כשמבוטח של קופה אחרת אומר "לא"',
    lead: 'מקשיבים עד הסוף, מסכימים עם מה שנכון, ועונים בעובדה אחת ובשאלה. התנגדות היא לא סירוב – היא הזמנה להבין מה חשוב לו.',
    items: () => window.OBJECTIONS
  });

  /* שימור */
  makeView({
    id: 'retain', title: 'טיפול בהתנגדויות-שימור', icon: '🤝', color: 'coral',
    kicker: '🤝 שימור ושירות · טיפול בהתנגדויות', head: 'כשמבוטח כללית מתלונן או שוקל לעזוב',
    lead: 'רוב המבוטחים לא עוזבים בגלל הקופה, אלא בגלל חוויה אחת שלא טופלה. קודם מבינים מה קרה, אחר כך פותרים – ורק אז מזכירים מה הוא עלול לאבד.',
    items: () => window.RETENTION.items, rules: () => window.RETENTION.rules
  });
})();

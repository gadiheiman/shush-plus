/* calculator.js – מחשבון חיסכון בביטוח המשלים: משפחה לפי גילים, מול מכבי או מאוחדת */
(function () {
  const { h } = DOM;
  const local = { vs: 'maccabi', tier: 'top', ages: [40, 38, 12, 8] };
  const VS = [{ id: 'maccabi', name: 'מכבי' }, { id: 'meuhedet', name: 'מאוחדת' }];
  const TIERS = [{ id: 'basic', name: 'רובד בסיסי' }, { id: 'top', name: 'רובד עליון' }];

  /** עורך בני משפחה: שורה לכל אחד עם גיל */
  function familyEditor(onChange) {
    const rows = local.ages.map((age, i) => {
      const inp = h('input', { id: `age-${i}`, class: 'input input-age', type: 'number', min: 0, max: 110, value: age, 'aria-label': `גיל בן משפחה ${i + 1}` });
      inp.addEventListener('change', () => { local.ages[i] = Math.max(0, Math.min(110, Number(inp.value) || 0)); onChange(); });
      const del = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'הסרה' }, '✕');
      del.addEventListener('click', () => { local.ages.splice(i, 1); onChange(); });
      return h('div', { class: 'member' }, h('span', { 'aria-hidden': 'true' }, age <= 18 ? '🧒' : '🧑'), inp, h('small', null, 'שנים'), local.ages.length > 1 ? del : null);
    });
    const add = (age, label) => { const b = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, label); b.addEventListener('click', () => { local.ages.push(age); onChange(); }); return b; };
    return h('div', { class: 'family' }, rows, h('div', { class: 'row-gap' }, add(35, '+ מבוגר'), add(6, '+ ילד'), add(70, '+ 65+')));
  }

  /** תוצאה: חיסכון חודשי ושנתי + פירוט */
  function result() {
    const tier = local.vs === 'meuhedet' ? 'basic' : local.tier;
    const c = PricingCalc.familyCost('clalit', tier, local.ages);
    const o = PricingCalc.familyCost(local.vs, tier, local.ages);
    const diff = o.total - c.total;
    const good = diff > 0;
    return h('section', { class: `card calc-res ${good ? 'is-good' : ''}` },
      h('span', { class: 'kicker' }, `${c.plan} מול ${o.plan}`),
      h('div', { class: 'calc-big' },
        h('div', null, h('b', null, U.money(Math.abs(diff) * 12)), h('span', null, good ? 'חיסכון בשנה' : 'יותר בשנה')),
        h('div', null, h('b', null, U.money(Math.abs(diff))), h('span', null, good ? 'חיסכון בחודש' : 'יותר בחודש'))),
      h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, 'גיל'), h('th', null, 'כללית'), h('th', null, PRICING.funds[local.vs].name))),
        h('tbody', null, c.lines.map((l, i) => h('tr', null,
          h('td', null, l.age), h('td', null, l.price === 0 ? 'חינם' : U.num(l.price) + ' ₪'), h('td', null, U.num(o.lines[i].price) + ' ₪')))),
        h('tfoot', null, h('tr', null, h('th', null, 'סה"כ לחודש'), h('th', null, U.num(Math.round(c.total * 100) / 100) + ' ₪'), h('th', null, U.num(Math.round(o.total * 100) / 100) + ' ₪')))),
      h('p', { class: 'fine' }, 'רצועות הגיל שונות בין הקופות. לאמת מול התעריף העדכני של כללית לפני הצגה למבוטח. ',
        U.srcLink(c.src, 'תעריף כללית'), ' · ', U.srcLink(o.src, `תעריף ${PRICING.funds[local.vs].name}`)),
      DOM.copyBtn(`למשפחה שלכם, ${c.plan} עולה ${U.num(Math.round(c.total))} ₪ בחודש, מול ${U.num(Math.round(o.total))} ₪ ב${o.plan}. ${good ? `חיסכון של כ-${U.num(Math.round(diff * 12))} ₪ בשנה.` : ''}`, 'העתקת המשפט'));
  }

  /** גרף עמודות: משפחה של 4 בכל הקופות */
  function family4Chart() {
    const F = PRICING.family4;
    const block = (title, rows) => {
      const max = Math.max(...rows.map((r) => r[1]));
      return h('div', { class: 'bars' }, h('h3', null, title),
        rows.map(([n, v, us]) => h('div', { class: `bar-row ${us ? 'bar-us' : ''}` },
          h('span', { class: 'bar-label' }, n), h('span', { class: 'bar' }, h('i', { style: { width: (v / max) * 100 + '%' } })), h('b', { class: 'bar-val' }, U.num(v) + ' ₪'))));
    };
    return UI.card('משפחה של 4 (זוג בני 40 ושני ילדים) – לחודש',
      block('רובד עליון', F.top), block('רובד בסיסי', F.basic), U.srcLink(F.src, 'ביזפורטל'));
  }

  Router.register({
    id: 'calc', title: 'מחשבון שב"ן', icon: '🧮', color: 'mint',
    render(el) {
      const rerender = () => { DOM.clear(el); this.render(el); };
      el.append(
        UI.viewHead('🧮 מחשבון שב"ן', 'כמה המשפחה תחסוך בביטוח המשלים (שב"ן)', 'מזינים גילים ומקבלים את ההפרש בחודש ובשנה. במעבר תוך 90 יום ברובד מקביל, הוותק נשמר.'),
        h('div', { class: 'split' },
          h('section', { class: 'card' },
            h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'משווים מול'), UI.chips({ label: 'קופה', items: VS, value: local.vs, onChange: (id) => { local.vs = id; rerender(); } })),
            local.vs === 'maccabi'
              ? h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'רובד'), UI.chips({ label: 'רובד', items: TIERS, value: local.tier, onChange: (id) => { local.tier = id; rerender(); } }))
              : h('p', { class: 'fine' }, 'במאוחדת ההשוואה ברובד הבסיסי (עדיף מול מושלם זהב). לרובד העליון ראו את הגרף.'),
            h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'בני המשפחה'), familyEditor(rerender))),
          result()),
        family4Chart());
    }
  });
})();

/* fundDetails.js – תוכן החלון הקופץ "מה יש לכל קופה במחוז": טבלת יישובים עם מרפאות ורשימת יישובים בלי */
(function () {
  const { h } = DOM;
  const ADMINS = ['חפר', 'שרון', 'שומרון', 'ללא מנהלת'];

  /** שבבי שמות יישובים, מקובצים לפי מנהלת. לחיצה פותחת את הסקירה לפי יישוב */
  function townChips(towns) {
    return ADMINS.map((a) => {
      const list = towns.filter((t) => t.a === a);
      if (!list.length) return null;
      return h('div', { class: 'fd-group' },
        h('h4', null, `${a === 'ללא מנהלת' ? a : 'מנהלת ' + a} · ${list.length}`),
        h('div', { class: 'fd-chips' }, list.map((t) => {
          const b = h('button', { type: 'button', class: 'fd-chip' }, t.n);
          b.addEventListener('click', () => { Store.set({ town: t.n }); Modal.close(); Router.go('town'); });
          return b;
        })));
    });
  }

  /** טבלה של יישובים שבהם יש לקופה נוכחות */
  function table(cols, rows) {
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null, cols.map((c) => h('th', null, c)))),
      h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, c)))))));
  }

  /** מספרי סיכום בראש החלון */
  const summary = (items) => h('div', { class: 'fd-sum' }, items.map(([n, t]) => h('div', null, h('b', null, n), h('span', null, t))));

  function maccabi() {
    const T = TOWNS;
    const withC = T.filter((t) => t.mac.c > 0).sort((a, b) => b.mac.d - a.mac.d);
    const none = T.filter((t) => t.mac.pts === 0);
    return [
      summary([[withC.length, 'יישובים עם מרכז מכבי'], [T.length - none.length, 'יישובים עם נקודת שירות כלשהי'], [none.length, 'יישובים בלי שירות']]),
      h('h3', null, 'איפה יש למכבי מרכז רפואי'),
      table(['יישוב', 'מרכזים', 'רופאים', 'מעבדה', 'מוקד'], withC.map((t) => [t.n, t.mac.c, t.mac.d, t.mac.l ? '✓' : '—', t.mac.u ? '✓' : '—'])),
      h('h3', null, 'יישובים בלי אף נקודת שירות של מכבי'),
      townChips(none),
      U.srcLink('mapMac', 'ספר השירות של מכבי, 15.11.2026')
    ];
  }

  function meuhedet() {
    const withC = TOWNS.filter((t) => t.meu.c > 0).sort((a, b) => b.meu.c - a.meu.c || b.meu.d - a.meu.d);
    const none = TOWNS.filter((t) => t.meu.c === 0);
    return [
      summary([[withC.length, 'יישובים עם מרפאת מאוחדת'], [withC.reduce((s, t) => s + t.meu.c, 0), 'מרפאות בסך הכול'], [none.length, 'יישובים בלי מרפאה']]),
      h('h3', null, 'איפה יש למאוחדת מרפאה'),
      table(['יישוב', 'מרפאות', 'רופאים', 'מעבדות', 'מוקד'], withC.map((t) => [t.n, t.meu.c, t.meu.d, t.meu.l || '—', t.meu.u ? '✓' : '—'])),
      h('h3', null, 'יישובים בלי מרפאת מאוחדת'),
      townChips(none),
      U.srcLink('mapMeu', 'אתר מאוחדת, 29.10–15.11.2026')
    ];
  }

  function leumit() {
    const groups = LEUMIT_GAPS.map((g, i) => ({ ...g, towns: TOWNS.filter((t) => t.leu === i) }));
    const nocenter = TOWNS.filter((t) => t.leu != null && LEUMIT_GAPS[t.leu].t === 'nocenter');
    const label = { nocenter: 'אין מרכז רפואי', nourgent: 'יש מרכז, אין מוקד', thin: 'נוכחות דלילה' };
    const withC = TOWNS.filter((t) => t.leuC && t.leuC.c > 0).sort((a, b) => b.leuC.c - a.leuC.c || b.leuC.d - a.leuC.d);
    const none = TOWNS.filter((t) => !t.leuC || t.leuC.c === 0);
    return [
      summary([[withC.length, 'יישובים עם מרכז לאומית'], [withC.reduce((s, t) => s + t.leuC.c, 0), 'מרכזים בסך הכול'], [none.length, 'יישובים בלי מרכז']]),
      h('h3', null, 'איפה יש ללאומית מרכז רפואי'),
      table(['יישוב', 'מרכזים', 'רופאים', 'מעבדה', 'בתי מרקחת', 'מוקד'], withC.map((t) => [t.n, t.leuC.c, t.leuC.d || '—', t.leuC.l || '—', t.leuC.ph || '—', t.leuC.u ? '✓' : '—'])),
      h('h3', null, 'יישובים בלי מרכז לאומית'),
      townChips(none),
      h('h3', null, 'פערים בערי יעד'),
      groups.map((g) => h('div', { class: 'fd-leu' },
        h('div', { class: 'card-row' }, h('strong', null, g.towns.map((t) => t.n).join(', ') || '—'), h('span', { class: `pill ${g.t === 'nocenter' ? 'pill-hot' : 'pill-warm'}` }, label[g.t])),
        h('ul', { class: 'facts' }, g.g.map((x) => h('li', null, x))))),
      U.srcLink('mapLeu', 'אתר לאומית, 29.10–15.11.2026')
    ];
  }

  const BUILD = { mac: ['מכבי במחוז שרון-שומרון', maccabi], meu: ['מאוחדת במחוז שרון-שומרון', meuhedet], leu: ['לאומית במחוז שרון-שומרון', leumit] };

  /** פותח את החלון לקופה */
  function show(fund) { const [t, fn] = BUILD[fund]; Modal.open(t, fn()); }

  window.FundDetails = { show };
})();

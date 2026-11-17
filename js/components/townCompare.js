/* townCompare.js – השוואת כללית מול שלוש הקופות ביישוב, ורשימת יחידות כללית ביישוב */
(function () {
  const { h } = DOM;

  /** נתוני השוואה: שורה לכל סוג שירות, עמודה לכל קופה. null = אין נתון */
  function matrix(t) {
    const cnt = ClalitData.countByGroup(ClalitData.unitsInTown(t.n));
    const L = t.leuC || {};   // ספירות לאומית מהמיפוי (0 = אין ביישוב)
    return [
      ['מרפאה / מרכז רפואי', cnt.primary + cnt.expert, t.mac.c, t.meu.c, L.c],
      ['מעבדה', cnt.lab, t.mac.l, t.meu.l, L.l],
      ['בית מרקחת', cnt.pharm, t.mac.ph, t.meu.ph, L.ph],
      ['מוקד רפואה דחופה', cnt.urgent, t.mac.u, t.meu.u, L.u],
      ['טיפת חלב', cnt.tipat, null, null, null],
      ['מכונים ומרכזי בריאות', cnt.inst + cnt.centers, null, null, null]
    ];
  }

  /** תא בטבלה: מספר, אפס מודגש או "?" */
  const cell = (v, us) => h('td', { class: v == null ? 'c-na' : v === 0 ? 'c-zero' : us ? 'c-us' : '' }, v == null ? '?' : v === 0 ? '✕' : v);

  /** טבלת ההשוואה */
  function table(t) {
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl tbl-compare' },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, h('span', { class: 'sr-only' }, 'שירות')), h('th', { class: 'th-us' }, 'כללית'), h('th', null, 'מכבי'), h('th', null, 'מאוחדת'), h('th', null, 'לאומית'))),
      h('tbody', null, matrix(t).map(([n, c, m, e, l]) => h('tr', null, h('th', null, n), cell(c, true), cell(m), cell(e), cell(l))))));
  }

  /* סדר הקבוצות ברשימת היחידות. כל יחידה מוצגת פעם אחת, בקבוצה הראשונה שמתאימה לה.
     מעבדה – רק מעבדות עצמאיות (במרפאות הבדיקות נלקחות בתוך המרפאה) */
  const LIST_GROUPS = ['primary', 'expert', 'urgent', 'pharm', 'tipat', 'centers', 'inst', 'labOnly'];
  const inListGroup = (u, g) => (g === 'labOnly' ? u[ClalitData.F.cat] === 9 : ClalitData.inGroup(u, g));
  const groupMeta = (g) => (g === 'labOnly' ? { name: 'מעבדה', icon: '🧪' } : ClalitData.GROUPS[g]);

  /** שורת יחידה: שם לחיץ (שעות פתיחה), כתובת וטלפון */
  function unitRow(u) {
    const F = ClalitData.F;
    const name = h('button', { type: 'button', class: 'unit-name', title: 'שעות פתיחה' }, u[F.name].trim());
    name.addEventListener('click', () => ClinicFinder.showHours(u));
    return h('li', { class: 'u-row' },
      name,
      h('span', { class: 'fine' }, u[F.addr] || '', u[F.phone] ? [' · ☎ ', h('bdi', { dir: 'ltr' }, ClinicFinder.phone(u[F.phone]))] : null));
  }

  /** כרטיס של קבוצה אחת (למשל: בתי מרקחת). קבוצה גדולה נפתחת בלחיצה */
  function groupCard(g, units) {
    const m = groupMeta(g);
    return h('details', { class: 'u-group', open: units.length <= 6 || null },
      h('summary', null, h('span', { 'aria-hidden': 'true' }, m.icon), ` ${m.name} `, h('b', { class: 'u-count' }, units.length)),
      h('ul', null, units.map(unitRow)));
  }

  /** בלוק "כללית ביישוב": כל יחידות כללית ביישוב, מקובצות לפי סוג */
  function clalitBlock(t) {
    const units = ClalitData.unitsInTown(t.n).filter((u) => !ClalitData.inGroup(u, 'indep'));
    const byGroup = {};
    units.forEach((u) => {
      const g = LIST_GROUPS.find((x) => inListGroup(u, x));
      if (g) (byGroup[g] = byGroup[g] || []).push(u);
    });
    const total = Object.values(byGroup).reduce((n, l) => n + l.length, 0);
    if (!total) {
      const c = GEO.center[t.n];
      const near = c ? GeoCalc.nearest(c, 'primary', 1)[0] : null;
      return h('div', { class: 'opener' },
        h('span', { class: 'kicker' }, 'כללית ביישוב'),
        h('p', null, `אין יחידת כללית רשומה ב${t.n}.`),
        near ? h('p', null, `המרפאה הקרובה: ${near.u[ClalitData.F.name]} (${near.u[ClalitData.F.city]}), כ-${U.num(Math.round(near.km * 10) / 10)} ק"מ באוויר ממרכז היישוב.`) : null);
    }
    return h('section', { class: 'u-block' },
      h('h3', { class: 'sec-sub' }, `🏥 יחידות כללית ב${t.n} (${total})`),
      h('div', { class: 'u-groups' }, LIST_GROUPS.filter((g) => byGroup[g]).map((g) => groupCard(g, byGroup[g]))),
      h('p', { class: 'fine' }, 'לחיצה על שם יחידה מציגה את שעות הפתיחה. מקור: ', U.srcLink('clalitNear', 'כללית קרובה אליי')));
  }

  window.TownCompare = { table, clalitBlock, matrix };
})();

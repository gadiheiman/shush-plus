/* searchIndex.js – אינדקס החיפוש הכללי: יישובים, יחידות כללית, התנגדויות (גיוס ושימור),
   יתרונות, שאלות אימון ומסכים. מחזיר תוצאות מקובצות לפי סוג, מדורגות לפי איכות ההתאמה. */
(function () {
  const PER_GROUP = 5;   // מקסימום תוצאות לכל סוג

  /* סוגי התוצאות, בסדר ההצגה */
  const GROUPS = [
    { id: 'view', name: 'מסכים', icon: '🧭' },
    { id: 'town', name: 'יישובים', icon: '🏘️' },
    { id: 'unit', name: 'יחידות כללית', icon: '🏥' },
    { id: 'obj', name: 'התנגדויות גיוס', icon: '🛡️' },
    { id: 'ret', name: 'התנגדויות שימור', icon: '🤝' },
    { id: 'adv', name: 'למה כללית', icon: '⭐' },
    { id: 'quiz', name: 'שאלות אימון', icon: '🎯' }
  ];

  /** מנרמל טקסט עברי להשוואה: בלי ניקוד, גרשיים, מקפים ורווחים כפולים */
  const norm = (s) => String(s || '').replace(/[֑-ׇ]/g, '').replace(/["'״׳`]/g, '').replace(/[-–־,.()]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

  let items = null;   // נבנה פעם אחת, בחיפוש הראשון

  /** בונה את כל פריטי החיפוש. כל פריט: {g, title, sub, text, ...נתונים לפעולה} */
  function build() {
    const out = [];
    const add = (g, title, sub, extra, more = '') => out.push({ g, title, sub, key: norm(title), text: norm(title + ' ' + more), ...extra });
    Router.list().forEach((v) => add('view', `${v.icon} ${v.title}`, '', { viewId: v.id }, v.kicker || ''));
    TOWNS.forEach((t) => add('town', t.n, t.a ? `מנהלת ${t.a}` : '', { town: t.n }));
    ClalitData.all().forEach((u) => add('unit', u[ClalitData.F.name].trim(), `${ClalitData.catName(u)} · ${u[ClalitData.F.city]}`, { unit: u }, u[ClalitData.F.city]));
    OBJECTIONS.forEach((o) => add('obj', `"${o.says}"`, o.tag, { says: o.says }, o.tag + ' ' + o.ans));
    RETENTION.items.forEach((o) => add('ret', `"${o.says}"`, o.tag, { says: o.says }, o.tag + ' ' + o.ans));
    FACTS.advantages.forEach((a) => add('adv', a.h, `${a.big} ${a.unit}`, {}, a.p));
    QUIZ.forEach((q) => add('quiz', q.q, `תשובה: ${q.o[q.a]}`, {}, q.why));
    return out;
  }

  /** ציון התאמה: תחילת הכותרת > תחילת מילה בכותרת > בכותרת > בתוכן. 0 = לא מתאים */
  function score(it, q) {
    if (it.key.startsWith(q)) return 4;
    if (it.key.includes(' ' + q)) return 3;
    if (it.key.includes(q)) return 2;
    // כמה מילים: כולן חייבות להופיע בטקסט
    const words = q.split(' ');
    return words.every((w) => it.text.includes(w)) ? 1 : 0;
  }

  /**
   * חיפוש
   * @param {string} query
   * @returns {Array<{group, items:Array, total:number}>} קבוצות עם תוצאות בלבד
   */
  function search(query) {
    const q = norm(query);
    if (q.length < 2) return [];
    if (!items) items = build();
    const hits = items.map((it) => ({ it, s: score(it, q) })).filter((x) => x.s > 0);
    return GROUPS.map((group) => {
      const list = hits.filter((x) => x.it.g === group.id).sort((a, b) => b.s - a.s || a.it.title.length - b.it.title.length);
      return { group, total: list.length, best: list.length ? list[0].s : 0, items: list.slice(0, PER_GROUP).map((x) => x.it) };
    }).filter((g) => g.total)
      // הקבוצה עם ההתאמה הטובה ביותר ראשונה; בשוויון – לפי הסדר הקבוע
      .sort((a, b) => b.best - a.best);
  }

  window.SearchIndex = { search, norm };
})();

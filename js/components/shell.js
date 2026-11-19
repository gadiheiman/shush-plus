/* shell.js – מסגרת האפליקציה: כותרת עליונה עם ספירה לאחור, ניווט ומקורות */
(function () {
  const { h } = DOM;

  /** שבב הספירה לאחור עד סוף חלון ההגשה */
  function countdownChip() {
    const w = U.currentWindow();
    const d = U.daysUntil(w.deadline);
    return h('a', { class: 'count-chip', href: '#switch', title: 'מועדי המעבר' },
      h('b', null, d), h('span', null, ` ימים להגשה · מעבר ב-${U.shortDate(w.effective)}`));
  }

  /* ראשי הפרקים בתפריט. מסך יכול להופיע ביותר מפרק אחד (מחשבון שב"ן) */
  const SECTIONS = [
    { title: 'שימור ושירות', icon: '🤝', cls: 'sec-retain', items: ['clinic', 'retain', 'calc'] },
    { title: 'גיוס', icon: '🚀', cls: 'sec-recruit', items: ['home', 'town', 'objections', 'calc', 'why', 'switch', 'train', 'call'] }
  ];

  /** קישור למסך */
  function navLink(v) {
    return h('a', { href: '#' + v.id, 'data-nav': v.id, class: 'nav-link', style: { '--c': `var(--${v.color})` } },
      h('span', { class: 'nav-ic', 'aria-hidden': 'true' }, v.icon), h('span', { class: 'nav-txt' }, v.title));
  }

  /* פרקים פתוחים – ברירת המחדל: כולם מצומצמים. הבחירה נשמרת בדפדפן */
  const isOpen = (cls) => (Store.get('navOpen') || []).includes(cls);
  function toggleSec(cls) {
    const cur = Store.get('navOpen') || [];
    Store.set({ navOpen: cur.includes(cls) ? cur.filter((c) => c !== cls) : [...cur, cls] });
  }

  /** פרק אחד בתפריט: כותרת לחיצה + רשימת קישורים מתקפלת */
  function navSection(s, byId) {
    const listId = 'nav-' + s.cls;
    const open = isOpen(s.cls);
    const head = h('button', { type: 'button', class: 'nav-sec-head', 'aria-expanded': String(open), 'aria-controls': listId },
      h('span', { 'aria-hidden': 'true' }, s.icon), h('span', { class: 'nav-sec-title' }, s.title),
      h('span', { class: 'nav-count' }, s.items.length), h('span', { class: 'nav-chev', 'aria-hidden': 'true' }, '▾'));
    const list = h('div', { id: listId, class: 'nav-list', hidden: !open }, s.items.map((id) => byId[id]).filter(Boolean).map(navLink));
    const sec = h('div', { class: `nav-sec ${s.cls}`, role: 'group', 'aria-label': s.title }, head, list);
    head.addEventListener('click', () => {
      toggleSec(s.cls);
      const o = isOpen(s.cls);
      head.setAttribute('aria-expanded', String(o));
      list.hidden = !o;
    });
    return sec;
  }

  /** ניווט בין המסכים, מחולק לפרקים. בנייד הוא נפתח כגיליון מלמטה */
  function nav() {
    const byId = Object.fromEntries(Router.list().map((v) => [v.id, v]));
    const close = h('button', { type: 'button', class: 'sheet-close', 'aria-label': 'סגירת התפריט' }, '✕');
    close.addEventListener('click', () => Drawer.close());
    return h('nav', { id: 'side-nav', class: 'nav', 'aria-label': 'מסכי האפליקציה' },
      h('div', { class: 'sheet-head' }, h('span', { class: 'sheet-grip', 'aria-hidden': 'true' }), h('strong', null, '🧭 כל המסכים'), close),
      SECTIONS.map((s) => navSection(s, byId)));
  }

  /* בנייד: סרגל תחתון עם ארבעת המסכים הנפוצים + כפתור "תפריט" */
  const TABS = [
    { id: 'clinic', label: 'שיוך' },
    { id: 'retain', label: 'שימור' },
    { id: 'home', label: 'פתיחה' },
    { id: 'objections', label: 'התנגדויות' }
  ];

  /** פתיחה וסגירה של גיליון התפריט בנייד */
  const Drawer = {
    open() { document.body.classList.add('nav-open'); document.querySelector('.tab-more')?.setAttribute('aria-expanded', 'true'); },
    close() { document.body.classList.remove('nav-open'); document.querySelector('.tab-more')?.setAttribute('aria-expanded', 'false'); },
    toggle() { document.body.classList.contains('nav-open') ? Drawer.close() : Drawer.open(); }
  };

  /** הסרגל התחתון בנייד */
  function tabbar() {
    const byId = Object.fromEntries(Router.list().map((v) => [v.id, v]));
    const more = h('button', { type: 'button', class: 'tab tab-more', 'aria-controls': 'side-nav', 'aria-expanded': 'false' },
      h('span', { class: 'tab-ic', 'aria-hidden': 'true' }, '☰'), h('span', null, 'תפריט'));
    more.addEventListener('click', Drawer.toggle);
    return h('nav', { class: 'tabbar', 'aria-label': 'מסכים נפוצים' },
      TABS.filter((t) => byId[t.id]).map((t) => h('a', { href: '#' + t.id, 'data-nav': t.id, class: 'tab', style: { '--c': `var(--${byId[t.id].color})` } },
        h('span', { class: 'tab-ic', 'aria-hidden': 'true' }, byId[t.id].icon), h('span', null, t.label))),
      more);
  }

  /** רשימת מקורות מתקפלת */
  function sources() {
    return h('details', { class: 'sources' },
      h('summary', null, 'מקורות הנתונים'),
      h('ol', null, Object.values(SOURCES).map((s) => h('li', null, h('a', { href: s.u, target: '_blank', rel: 'noopener' }, s.t)))),
      h('p', { class: 'fine' }, 'נתוני המתחרות נאספו מאתרי הקופות במיפויים של אוקטובר–נובמבר 2026. לפני הצגה למבוטח – לאמת תורים, שעות ומחירים במערכות כללית. לשימוש פנימי של צוותי כללית מחוז שרון-שומרון.'));
  }

  /** בונה את המסגרת ומחזיר את אזור התוכן */
  function mount(root) {
    const main = h('main', { id: 'view', class: 'view', tabindex: '-1' });
    Logo.setFavicon();
    root.append(
      h('header', { class: 'topbar' },
        h('a', { class: 'brand', href: '#clinic', 'aria-label': 'שו״ש פלוס – למסך הראשי' },
          Logo.mark(40),
          h('div', null, h('strong', null, 'שו״ש פלוס'), h('small', null, 'כללית · שירות · שימור · גיוס'))),
        GlobalSearch.render(),
        countdownChip()),
      h('div', { class: 'layout' }, nav(), h('div', { class: 'content' }, main, sources())),
      h('div', { class: 'sheet-backdrop', 'aria-hidden': 'true', onclick: Drawer.close }),
      tabbar());
    // מעבר מסך או Esc סוגרים את הגיליון
    window.addEventListener('hashchange', Drawer.close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') Drawer.close(); });
    return main;
  }

  window.Shell = { mount };
})();

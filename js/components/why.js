/* why.js – "למה כללית": כרטיסי יתרונות עם מספר בולט, משפט לשיחה ומקור */
(function () {
  const { h } = DOM;

  /** כרטיס יתרון */
  function advCard(a) {
    return h('article', { class: 'adv', style: { '--c': `var(--${a.color})` } },
      h('div', { class: 'adv-top' }, h('span', { class: 'adv-ic', 'aria-hidden': 'true' }, a.icon),
        h('div', { class: 'adv-big' }, h('b', null, a.big), h('span', null, a.unit))),
      h('h3', null, a.h),
      h('p', null, a.p),
      h('p', { class: 'adv-say' }, `"${a.say}"`),
      h('div', { class: 'row-gap' }, DOM.copyBtn(a.say, 'העתקה'), U.srcLink(a.src), a.src2 ? U.srcLink(a.src2, 'מקור נוסף') : null),
      a.only ? h('span', { class: 'pill pill-warm' }, 'רק מול מבוטחי מכבי') : null);
  }

  /** שורת המחוז – מה חסר לכל מתחרה */
  function districtStrip() {
    const D = FACTS.district;
    return h('div', { class: 'strip' },
      [['mac', 'מכבי', D.mac.line, D.mac.src], ['meu', 'מאוחדת', D.meu.line, D.meu.src], ['leu', 'לאומית', D.leu.line, D.leu.src]]
        .map(([f, n, l, s]) => {
          // לחיצה על שם הקופה פותחת את אותו חלון כמו בריבועים של "תחילת שיחה"
          const name = h('button', { type: 'button', class: 'fund-link', title: `פירוט לפי יישוב – ${n}` }, n, h('span', { 'aria-hidden': 'true' }, ' ←'));
          name.addEventListener('click', () => FundDetails.show(f));
          return h('div', { class: 'strip-item' }, name, h('p', null, l), U.srcLink(s));
        }));
  }

  Router.register({
    id: 'why', title: 'למה כללית', icon: '⭐', color: 'sun',
    render(el) {
      const fund = Store.get('fund');
      const list = FACTS.advantages.filter((a) => !a.only || a.only === fund || fund === 'unk');
      el.append(
        UI.viewHead('⭐ גיוס · למה כללית', `${list.length} יתרונות, כל אחד עם מקור`, 'בוחרים יתרון אחד שמתאים למה שהמבוטח סיפר. עדיף אחד חד על עשרה.'),
        districtStrip(),
        h('div', { class: 'adv-grid' }, list.map(advCard)));
    }
  });
})();

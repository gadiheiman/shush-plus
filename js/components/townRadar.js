/* townRadar.js – "סקירה לפי יישוב": תובנות על המתחרות ביישוב שנבחר */
(function () {
  const { h } = DOM;

  /** פסי המתנה במכבי ביישוב */
  function waitBars(t) {
    if (!t.macW || !t.macW.length) return null;
    const max = Math.max(...t.macW.map((w) => w[1]), 60);
    return h('div', { class: 'bars' },
      h('h3', null, `חציון המתנה במכבי ב${t.n} (ימים)`),
      t.macW.map(([s, d]) => h('div', { class: 'bar-row' },
        h('span', { class: 'bar-label' }, s),
        h('span', { class: 'bar' }, h('i', { style: { width: (d / max) * 100 + '%' } })),
        h('b', { class: 'bar-val' }, d))),
      U.srcLink('mapMac', 'ספר השירות של מכבי'));
  }

  /** כרטיס התובנות ליישוב */
  function insightCard(fund) {
    const r = TownInsights.analyze(Store.get('town'), fund);
    if (!r) return UI.card('בחרו יישוב', h('p', null, 'הקלידו שם יישוב מתוך 183 יישובי המחוז.'));
    const t = r.town;
    return h('section', { class: 'card card-insight' },
      h('div', { class: 'card-row' },
        h('div', null, h('span', { class: 'kicker' }, `מנהלת ${t.a}`), h('h2', { class: 'town-name' }, t.n)),
        UI.levelPill(r.level)),
      h('h3', null, '⚖️ כללית מול הקופות ביישוב'),
      TownCompare.table(t),
      h('p', { class: 'fine' }, '✕ = אין ביישוב · ? = אין נתון במיפוי. ', U.srcLink('clalitNear', 'כללית'), ' · ', U.srcLink('mapMac', 'מכבי'), ' · ', U.srcLink('mapMeu', 'מאוחדת'), ' · ', U.srcLink('mapLeu', 'לאומית')),
      TownCompare.clalitBlock(t),
      h('h3', null, `🗣️ מה להגיד למבוטח ${U.FUND_NAMES[fund]}`),
      h('ul', { class: 'facts' }, r.bullets.map((b) => h('li', null, b))),
      U.srcLink(r.src, 'מקור: המיפוי'),
      fund === 'mac' || fund === 'unk' ? waitBars(t) : null,
      h('div', { class: 'opener' },
        h('span', { class: 'kicker' }, '✨ משפט פתיחה'),
        h('p', null, r.opener),
        h('div', { class: 'row-gap' },
          DOM.copyBtn(r.opener, 'העתקת המשפט'),
          DOM.copyBtn(() => `${r.opener}\n${r.bullets.slice(0, 2).map((b) => '• ' + b).join('\n')}`, 'העתקה לוואטסאפ'),
          h('a', { class: 'btn btn-primary btn-sm', href: '#call' }, 'לתסריט מלא ←'))));
  }

  Router.register({
    id: 'town', title: 'סקירה לפי יישוב', icon: '📡', color: 'teal',
    render(el) {
      const body = h('div', { class: 'radar-body' });
      const draw = () => { DOM.clear(body).append(insightCard(Store.get('fund'))); };
      el.append(
        UI.viewHead('📡 גיוס · סקירה לפי יישוב', 'כללית מול המתחרות ביישוב של המבוטח', 'בוחרים יישוב וקופה, ומקבלים השוואה, את יחידות כללית ביישוב, ומשפט פתיחה מוכן.'),
        h('div', { class: 'controls' }, UI.townPicker(draw), UI.fundPicker(() => { DOM.clear(el); this.render(el); })),
        body);
      draw();
    }
  });
})();

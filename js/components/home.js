/* home.js – מסך "תחילת שיחה": ספירה לאחור, חיפוש מרפאה, שלושה מספרים, המשפט של היום וקיצורי דרך */
(function () {
  const { h } = DOM;

  /** פס התקדמות של חלון ההגשה הנוכחי */
  function windowMeter() {
    const w = U.currentWindow();
    const total = (U.parseISO(w.deadline) - U.parseISO(w.from)) / 86400000;
    const left = Math.max(0, U.daysUntil(w.deadline));
    const pct = Math.min(100, Math.max(0, 100 - (left / total) * 100));
    const work = U.workDaysUntil(w.deadline);
    return h('div', { class: 'hero-count' },
      h('div', { class: 'hero-nums' },
        h('div', { class: 'hero-count-num' }, h('b', null, left), h('span', null, 'ימים')),
        h('div', { class: 'hero-count-num hero-count-work' }, h('b', null, work), h('span', null, 'ימי עבודה'))),
      h('div', { class: 'hero-count-txt' },
        h('p', null, 'נשארו להגשת בקשת מעבר למועד הקרוב. ימי עבודה: א׳–ה׳, בלי חגים.'),
        h('p', { class: 'strong' }, `הגשה עד ${U.longDate(w.deadline)} ← מעבר ב-${U.longDate(w.effective)}`),
        h('div', { class: 'meter', role: 'progressbar', 'aria-valuenow': Math.round(pct), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'חלק החלון שעבר' },
          h('i', { style: { width: pct + '%' } }))));
  }

  /** שלושה מספרי מחוז לזכור */
  function bigThree() {
    const D = FACTS.district;
    const tiles = [
      { f: 'mac', n: D.mac.noPoint, of: D.towns, t: 'יישובים בלי אף נקודת שירות של מכבי', c: 'blue' },
      { f: 'meu', n: D.meu.clinics, of: D.towns, t: 'יישובים בלבד שבהם יש למאוחדת מרפאה', c: 'coral' },
      { f: 'leu', n: D.leu.noCenter, of: D.towns, t: 'יישובים בלי מרכז רפואי של לאומית', c: 'violet' }
    ];
    return h('div', { class: 'tiles' }, tiles.map((x) => {
      const b = h('button', { type: 'button', class: 'tile', style: { '--c': `var(--${x.c})` } },
        h('div', { class: 'tile-num' }, h('b', null, x.n), h('span', null, ` / ${x.of}`)),
        h('p', null, x.t), h('span', { class: 'tile-more' }, 'לפירוט לפי יישוב ←'));
      b.addEventListener('click', () => FundDetails.show(x.f));
      return b;
    }));
  }

  /** "המשפט של היום" – מתחלף לפי תאריך, אפשר לדפדף */
  function lineOfDay() {
    const list = FACTS.advantages;
    let i = Math.floor(Date.now() / 86400000) % list.length;
    const quote = h('blockquote', { class: 'quote' });
    const meta = h('div', { class: 'quote-meta' });
    const draw = () => {
      DOM.clear(quote).append(`"${list[i].say}"`);
      DOM.clear(meta).append(h('span', null, list[i].h), U.srcLink(list[i].src));
    };
    draw();
    const next = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, 'משפט אחר ↻');
    next.addEventListener('click', () => { i = (i + 1) % list.length; draw(); });
    return h('section', { class: 'card card-quote' },
      h('div', { class: 'card-row' }, h('h2', { class: 'card-title' }, '💡 המשפט של היום'), h('div', { class: 'row-gap' }, DOM.copyBtn(() => list[i].say), next)),
      quote, meta);
  }

  /** קיצורי דרך לשאר המסכים */
  function launchers() {
    const hints = {
      clinic: 'המרפאה הקרובה לכתובת', retain: 'מבוטח כללית שרוצה לעזוב', town: 'יישוב + קופה = משפט פתיחה', call: 'תסריט שנבנה לפי המבוטח', objections: 'מה עונים כשאומרים "לא"',
      calc: 'כמה המשפחה תחסוך בשב"ן', why: '10 יתרונות עם מקור', switch: 'מועדים ושלבים', train: 'בוחן קצר לפני משמרת'
    };
    return h('div', { class: 'launch' }, Router.list().filter((v) => v.id !== 'home').map((v) =>
      h('a', { class: 'launch-card', href: '#' + v.id, style: { '--c': `var(--${v.color})` } },
        h('span', { class: 'launch-ic', 'aria-hidden': 'true' }, v.icon),
        h('strong', null, v.title), h('small', null, hints[v.id] || ''))));
  }

  Router.register({
    id: 'home', title: 'תחילת שיחה', icon: '☀️', color: 'blue',
    render(el) {
      // אותו חיפוש כמו במסך "שיוך למרפאה" (המצב משותף בין שני המסכים)
      const finder = h('section', { class: 'card card-finder' });
      ClinicFinder.mount(finder);
      el.append(
        h('section', { class: 'hero' },
          h('div', null,
            h('span', { class: 'kicker' }, '☀️ גיוס · לרכזי גיוס ולנציגי מוקד'),
            h('h1', null, 'כל שיחה מתחילה בשאלה אחת: ', h('mark', null, 'איפה אתם מקבלים שירות היום?')),
            h('p', { class: 'lead' }, 'נתונים מהמיפוי של מכבי, מאוחדת ולאומית ב-183 יישובי המחוז, תסריטים מוכנים, מחשבון חיסכון ותשובות להתנגדויות.'),
            h('div', { class: 'row-gap' },
              h('a', { class: 'btn btn-primary', href: '#clinic' }, 'שיוך למרפאה'),
              h('a', { class: 'btn btn-ghost', href: '#town' }, 'בדיקת יישוב'),
              h('a', { class: 'btn btn-ghost', href: '#call' }, 'פתיחת שיחה'))),
          windowMeter()),
        finder,
        bigThree(),
        lineOfDay(),
        h('h2', { class: 'sec-title' }, '🧭 לאן ממשיכים'),
        launchers());
    }
  });
})();

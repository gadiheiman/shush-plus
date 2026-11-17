/* clinicFinder.js – "המרפאה הקרובה": יישוב → רחוב → מספר בית, כפתורי חיפוש ואיפוס,
   ריבועי סוגי יחידות, ורשימת היחידות הקרובות. לחיצה על שם יחידה פותחת את שעות הפתיחה בחלון קופץ. */
(function () {
  const { h } = DOM;

  /* הגדרת הריבועים: קבוצה, כותרת, כמה תוצאות */
  const TILES = [
    { g: 'primary', name: 'מרפאה ראשונית', icon: '🩺', k: 5 },
    { g: 'expert', name: 'מרפאה יועצת', icon: '👩‍⚕️', k: 3 },
    { g: 'pharm', name: 'בית מרקחת', icon: '💊', k: 5 },
    { g: 'urgent', name: 'מוקד רפואה דחופה', icon: '🚑', k: 3 },
    { g: 'tipat', name: 'טיפת חלב', icon: '🍼', k: 5 }
  ];

  // מצב: מה מוקלד בשדות (form), מה נחפש בפועל (query), והריבוע הנבחר
  const st = { form: { town: '', street: '', num: '' }, query: null, tile: 'primary' };

  /** מספר טלפון בפורמט ישראלי (המאגר שומר בלי 0 מוביל) */
  function phone(p) {
    const d = String(p || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 9 && /^[57]/.test(d)) return `0${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length === 8) return `0${d[0]}-${d.slice(1)}`;
    return d.startsWith('0') || d.startsWith('1') ? d : '0' + d;
  }

  /** תוצאות לריבוע */
  function resultsFor(tile, p) {
    return GeoCalc.nearest(p, tile.g, tile.k);
  }

  /** חלון קופץ: שעות פתיחה ופרטי היחידה */
  function showHours(u) {
    const F = ClalitData.F, today = new Date().getDay();
    const rows = ClalitData.DAYS.map((d, i) => h('tr', { class: i === today ? 'row-now' : '' },
      h('th', null, `יום ${d}`), h('td', null, h('bdi', { dir: 'ltr' }, ClalitData.dayText(u, i)))));
    const svcs = ClalitData.services(u);
    Modal.open(u[F.name],
      h('p', null, `${ClalitData.catName(u)} · ${u[F.addr]}, ${u[F.city]}`, u[F.phone] ? [' · ☎ ', h('bdi', { dir: 'ltr' }, phone(u[F.phone]))] : null),
      (u[F.hours] || []).length
        ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, 'יום'), h('th', null, 'שעות פתיחה'))), h('tbody', null, rows)))
        : h('p', { class: 'fine' }, 'אין שעות פתיחה במאגר של כללית ליחידה הזו. כדאי להתקשר לבדוק.'),
      svcs.length ? h('p', { class: 'fine' }, 'שירותים: ', svcs.join(' · ')) : null,
      h('p', { class: 'fine' }, 'מקור: ', U.srcLink('clalitNear', 'כללית קרובה אליי'), '. שעות עשויות להשתנות בחגים.'));
  }

  /** שורת תוצאה: שם לחיץ, כתובת, מרחק, נתוני זמינות וכפתורי ניווט.
      בנויה קומפקטית כדי שתיראה טוב גם בנייד */
  function resultRow({ u, km, docs, hrs }, origin, rec) {
    const F = ClalitData.F;
    const est = GeoCalc.roadEstimate(km);
    const nav = GeoCalc.navLinks(origin, [u[F.lat], u[F.lon]]);
    const name = h('button', { type: 'button', class: 'unit-name', title: 'שעות פתיחה' }, u[F.name].trim());
    name.addEventListener('click', () => showHours(u));
    const r1 = (x) => U.num(Math.round(x * 10) / 10);
    // נתונים קצרים: נסיעה, רופאים, שעות פתיחה
    const facts = [
      `🚗 ${est.min} דק׳ נסיעה`,
      docs ? `👩‍⚕️ ${docs} רופאים` : null,
      hrs ? `🕘 ${U.num(Math.round(hrs))} ש׳ בשבוע` : null
    ].filter(Boolean);
    const navBtn = (href, ic, label, primary) => h('a', { class: `nav-btn ${primary ? 'nav-btn-main' : ''}`, href, target: '_blank', rel: 'noopener', 'aria-label': label },
      h('span', { 'aria-hidden': 'true' }, ic), h('span', null, label));
    return h('article', { class: `unit ${rec ? 'unit-rec' : ''}` },
      h('div', { class: 'unit-top' },
        h('div', { class: 'unit-id' }, rec ? h('span', { class: 'rec-badge', title: rec }, '⭐ מומלצת') : null, name,
          h('p', { class: 'fine' }, `${u[F.addr]}, ${u[F.city]}`),
          u[F.phone] ? h('a', { class: 'unit-phone', href: 'tel:' + phone(u[F.phone]).replace(/\D/g, '') }, '☎ ', h('bdi', { dir: 'ltr' }, phone(u[F.phone]))) : null),
        h('div', { class: 'unit-dist', title: 'מרחק אווירי' }, h('b', null, r1(km)), h('span', null, 'ק"מ'))),
      h('div', { class: 'unit-facts' }, facts.map((f) => h('span', null, f))),
      h('div', { class: 'unit-nav' },
        navBtn(nav.drive, '🚗', 'נסיעה', true), navBtn(nav.transit, '🚌', 'תח״צ'), navBtn(nav.walk, '🚶', 'הליכה'), navBtn(nav.waze, '🧭', 'Waze')));
  }

  /** רשימה מדורגת: המומלצת ראשונה, ואחריה השאר לפי מרחק */
  function rankedList(cur, origin) {
    if (!cur.res.length) return h('p', { class: 'empty' }, 'לא נמצאו יחידות מהסוג הזה באזור.');
    const { list, best } = Recommender.rank(cur.res, cur.t.g);
    const ordered = best ? [best, ...list.filter((x) => x.u !== best.u)] : list;
    return ordered.map((x) => resultRow(x, origin, best && x.u === best.u ? Recommender.why(x, cur.t.g) : null));
  }

  /** אזור התוצאות: ריבועים + רשימת הריבוע הנבחר */
  function results(redraw) {
    const q = st.query;
    if (!q) return h('p', { class: 'fine' }, 'בחרו יישוב (ורצוי גם רחוב ומספר בית) ולחצו "חיפוש".');
    const loc = GeoCalc.locate(q.town, q.street, q.num);
    if (!loc) return h('p', { class: 'empty' }, 'לא נמצא מיקום ליישוב הזה. בחרו יישוב מהרשימה.');
    const origin = [q.street, q.num, q.town].filter(Boolean).join(' ');
    const all = TILES.map((t) => ({ t, res: resultsFor(t, loc.p) }));
    const cur = all.find((x) => x.t.g === st.tile);

    const tiles = h('div', { class: 'f-tiles', role: 'tablist' }, all.map(({ t, res }) => {
      const b = h('button', { type: 'button', class: 'f-tile', role: 'tab', 'aria-selected': String(t.g === st.tile) },
        h('span', { class: 'f-ic', 'aria-hidden': 'true' }, t.icon),
        h('strong', null, t.name),
        h('small', null, res[0] ? `${U.num(Math.round(res[0].km * 10) / 10)} ק"מ` : 'אין באזור'));
      b.addEventListener('click', () => { st.tile = t.g; redraw(); });
      return b;
    }));

    return h('div', { class: 'finder-res' },
      tiles,
      h('h3', { class: 'sec-sub' }, `${cur.t.icon} ${cur.t.name} · ${cur.res.length} הקרובים`),
      rankedList(cur, origin),
      h('details', { class: 'f-note' }, h('summary', null, 'ℹ️ איך נבחרת המומלצת ומאיפה הנתונים'), h('p', { class: 'fine' }, '⭐ ההמלצה מבוססת על מרחק, מספר הרופאים ביחידה ושעות הפתיחה בשבוע. אין מקור ציבורי לאורך תור או לעומס בכל מרפאה, ולכן זו המלצה לפי זמינות. לחיצה על שם היחידה מציגה את שעות הפתיחה. מרחק בכביש וזמן נסיעה הם הערכה; למסלול מדויק ולתחבורה ציבורית – כפתורי הניווט. מקורות: ',
        U.srcLink('clalitNear', 'כללית קרובה אליי'), ' · ', U.srcLink('osm', 'OpenStreetMap'))));
  }

  /** פס הכתובת אחרי חיפוש: הכתובת, רמת הדיוק, העתקה ו"שינוי" (פותח את הטופס שוב) */
  function addressBar(onEdit) {
    const q = st.query;
    const loc = GeoCalc.locate(q.town, q.street, q.num);
    const origin = [q.street, q.num].filter(Boolean).join(' ');
    const where = origin ? `${origin}, ${q.town}` : q.town;
    const first = loc ? GeoCalc.nearest(loc.p, 'primary', 1)[0] : null;
    const F = ClalitData.F;
    const summary = first ? `המרפאה הקרובה של כללית ל${where}: ${first.u[F.name]}, ${U.num(Math.round(first.km * 10) / 10)} ק"מ באוויר. ${first.u[F.addr]}, ${first.u[F.city]}.` : '';
    const edit = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, '✎ שינוי');
    edit.addEventListener('click', onEdit);
    const precClass = loc ? { house: 'ok', 'near-house': 'ok', street: 'mid', town: 'low' }[loc.precision] : 'low';
    return h('div', { class: 'addr-bar' },
      h('span', { class: 'addr-ic', 'aria-hidden': 'true' }, '📍'),
      h('div', { class: 'addr-txt' }, h('strong', null, where), loc ? h('small', { class: 'prec-' + precClass }, loc.note) : null),
      h('div', { class: 'addr-act' }, summary ? DOM.copyBtn(summary, 'העתקה') : null, edit));
  }

  /** טופס החיפוש: שדות, חיפוש ואיפוס */
  function form(onSearch, onReset) {
    const f = st.form;
    const mk = (id, label, ph) => {
      const inp = h('input', { id, class: 'input', value: f[id.slice(3)], autocomplete: 'off', placeholder: ph });
      return [inp, h('div', { class: 'field' }, h('label', { class: 'field-label', for: id }, label), inp)];
    };
    const [town, townF] = mk('cf-town', '1. יישוב', 'למשל: נתניה');
    const [street, streetF] = mk('cf-street', '2. רחוב', 'בחרו רחוב');
    const [num, numF] = mk('cf-num', '3. מספר בית', 'למשל: 12');
    num.inputMode = 'numeric';

    /* היישוב והרחוב שנבחרו בפועל (רק ערכים שקיימים ברשימות) */
    const curTown = () => (GEO.center[town.value.trim()] ? town.value.trim() : '');
    const curStreet = () => { const t = curTown(); return t && (GEO.streets[t] || {})[street.value.trim()] !== undefined ? street.value.trim() : ''; };
    /** מאפשר רחוב רק אחרי יישוב, ומספר רק אחרי רחוב */
    const refresh = () => { street.disabled = !curTown(); num.disabled = !curStreet(); };

    // השלמה אוטומטית (עובדת גם בנייד). אחרי בחירה עוברים לשדה הבא
    Autocomplete.attach(town, () => GeoCalc.towns(), () => street.focus());
    Autocomplete.attach(street, () => (curTown() ? GeoCalc.streets(curTown()) : []), () => num.focus(), { openEmpty: true });
    Autocomplete.attach(num, () => (curStreet() ? GeoCalc.houseNums(curTown(), curStreet()).map(String) : []), null, { prefixOnly: true, openEmpty: true });
    town.addEventListener('input', () => { street.value = ''; num.value = ''; refresh(); });
    street.addEventListener('input', () => { num.value = ''; refresh(); });
    refresh();

    const go = h('button', { type: 'submit', class: 'btn btn-primary' }, '🔍 חיפוש');
    const reset = h('button', { type: 'button', class: 'btn btn-ghost' }, '↺ איפוס');
    const err = h('p', { class: 'field-err', 'aria-live': 'polite' });
    reset.addEventListener('click', onReset);
    const el = h('form', { class: 'finder-form' }, townF, streetF, numF, h('div', { class: 'f-btns' }, go, reset), err);
    el.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = town.value.trim();
      if (!GEO.center[t]) { err.textContent = 'בחרו יישוב מהרשימה.'; town.focus(); return; }
      const s = (GEO.streets[t] || {})[street.value.trim()] !== undefined ? street.value.trim() : '';
      if (street.value.trim() && !s) { err.textContent = 'הרחוב לא נמצא ברשימה. בחרו רחוב מהרשימה או השאירו ריק.'; street.focus(); return; }
      err.textContent = '';
      onSearch({ town: t, street: s, num: s ? num.value.replace(/\D/g, '') : '' });
    });
    return el;
  }

  /** בונה את רכיב החיפוש בתוך מיכל */
  function mount(host) {
    const out = h('div');
    let editing = false;   // אחרי חיפוש הטופס מוסתר, עד שלוחצים "שינוי"
    const redraw = () => {
      DOM.clear(out).append(results(redraw));
      // בנייד הריבועים בפס נגלל – מביאים את הנבחר לתצוגה
      const sel = out.querySelector('.f-tile[aria-selected="true"]');
      if (sel && sel.parentElement.scrollWidth > sel.parentElement.clientWidth) sel.parentElement.scrollLeft += sel.getBoundingClientRect().left - sel.parentElement.getBoundingClientRect().left - 4;
    };
    const draw = () => {
      const showForm = !st.query || editing;
      DOM.clear(host).append(
        h('div', { class: 'card-row' }, h('h2', { class: 'card-title' }, '🔍 חיפוש לפי כתובת'), h('span', { class: 'fine f-count-all' }, `${U.num(ClalitData.all().length)} יחידות כללית באזור`)),
        showForm
          ? form((q) => { st.form = { ...q }; st.query = q; editing = false; draw(); },
              () => { st.form = { town: '', street: '', num: '' }; st.query = null; st.tile = 'primary'; editing = false; draw(); })
          : addressBar(() => { editing = true; draw(); host.querySelector('#cf-town')?.focus(); }),
        out);
      redraw();
    };
    draw();
  }

  window.ClinicFinder = { mount, showHours, phone };
})();
